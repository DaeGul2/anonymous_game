// src/services/qaArchiveService.js
const { Op } = require("sequelize");
const { Question, Answer, Player, QaArchive, QuestionHeart, TemplateQuestion, sequelize } = require("../models");

function calcScore(hearts, playerCount) {
  const rawRate = (hearts + 1) / (playerCount + 2);
  const confidence = Math.min(1, playerCount / 4);
  return Math.round(rawRate * confidence * 1000) / 1000;
}

/**
 * 방 삭제 전 질문-답변 쌍을 qa_archives에 보존.
 * 1) 인간 질문 + 인간 답변 → 전부 저장
 * 2) AI 질문 + 인간 답변 → 하트 1개 이상인 것만 저장
 * - 익명 — 유저/플레이어 정보 저장 안 함
 * - 빈 답변은 제외
 */
async function archiveHumanQa(roomId) {
  try {
    // AI 플레이어 ID 목록 (이탈한 인간 플레이어는 이미 삭제됐으므로, 남아있는 AI ID로 구분)
    const aiPlayerIds = (await Player.findAll({
      where: { room_id: roomId, is_ai: true },
      attributes: ["id"],
    })).map((p) => p.id);

    // 전체 답변 + 질문 조회 (Player JOIN 없이, 삭제된 플레이어 데이터도 살림)
    const allAnswers = await Answer.findAll({
      where: { room_id: roomId },
      include: [{ model: Question, as: "question", required: true }],
    });

    // playerCount: 현재 남은 플레이어 + AI (정확하진 않지만 근사치)
    const playerCount = await Player.count({ where: { room_id: roomId } });
    // 실제 참여했던 플레이어 수 (답변에서 유니크 player_id)
    const uniquePlayerIds = new Set(allAnswers.map((a) => a.answered_by_player_id));
    const actualPlayerCount = Math.max(playerCount, uniquePlayerIds.size);

    // 질문별 하트 수 집계
    const questionIds = [...new Set(allAnswers.map((a) => a.question_id))];
    let heartMap = new Map();
    if (questionIds.length > 0) {
      const heartRows = await QuestionHeart.findAll({
        attributes: [
          "question_id",
          [sequelize.fn("COUNT", sequelize.col("QuestionHeart.id")), "cnt"],
        ],
        where: { question_id: { [Op.in]: questionIds } },
        group: ["question_id"],
        raw: true,
      });
      heartMap = new Map(heartRows.map((h) => [h.question_id, Number(h.cnt)]));
    }

    const rows = [];

    for (const a of allAnswers) {
      if (!a.text?.trim() || !a.question?.text?.trim()) continue;

      const isAiAnswer = aiPlayerIds.includes(a.answered_by_player_id);
      const isAiQuestion = aiPlayerIds.includes(a.question.submitted_by_player_id);

      // AI 답변은 제외 (인간 답변만 아카이브)
      if (isAiAnswer) continue;

      // 템플릿 질문은 제외 (자유 질문만 아카이브)
      if (a.question.template_id) continue;

      const hearts = heartMap.get(a.question.id) || 0;

      // AI 질문은 하트 1개 이상만
      if (isAiQuestion && hearts === 0) continue;

      rows.push({
        question_text: a.question.text.trim(),
        answer_text: a.text.trim(),
        answer_type: a.question.answer_type || "free",
        heart_count: hearts,
        player_count: actualPlayerCount,
        popularity_score: calcScore(hearts, actualPlayerCount),
      });
    }

    if (rows.length > 0) {
      await QaArchive.bulkCreate(rows);
    }

    // 임계값(5000행) 초과 시 popularity_score 낮은 것부터 삭제
    await trimArchive();
  } catch (e) {
    // 아카이브 실패가 방 삭제를 막으면 안 됨
    console.error("[qa-archive] failed for room", roomId, e?.message || e);
  }
}

const MAX_ARCHIVE_ROWS = 5000;

async function trimArchive() {
  try {
    const total = await QaArchive.count();
    if (total <= MAX_ARCHIVE_ROWS) return;

    const excess = total - MAX_ARCHIVE_ROWS;
    // popularity_score 낮은 것부터 삭제
    const toDelete = await QaArchive.findAll({
      attributes: ["id"],
      order: [["popularity_score", "ASC"], ["created_at", "ASC"]],
      limit: excess,
    });

    if (toDelete.length > 0) {
      await QaArchive.destroy({
        where: { id: { [Op.in]: toDelete.map((r) => r.id) } },
      });
    }
  } catch (e) {
    console.error("[qa-archive] trimArchive failed:", e?.message || e);
  }
}

/**
 * 방 삭제 전 템플릿별 사용횟수/하트를 template_questions에 누적.
 * Room.destroy CASCADE로 Question/QuestionHeart가 날아가기 전에 호출해야 함.
 */
async function accumulateTemplateStats(roomId) {
  try {
    // 이 방에서 template_id가 있는 질문들의 통계 집계
    const rows = await sequelize.query(
      `SELECT q.template_id,
              COUNT(DISTINCT q.id) AS usage_count,
              COUNT(DISTINCT qh.id) AS heart_count
       FROM questions q
       LEFT JOIN question_hearts qh ON qh.question_id = q.id
       WHERE q.room_id = :roomId AND q.template_id IS NOT NULL
       GROUP BY q.template_id`,
      { replacements: { roomId }, type: sequelize.QueryTypes.SELECT }
    );

    for (const r of rows) {
      const usage = Number(r.usage_count) || 0;
      const hearts = Number(r.heart_count) || 0;
      if (usage === 0 && hearts === 0) continue;

      await TemplateQuestion.increment(
        { usage_count: usage, heart_count: hearts },
        { where: { id: r.template_id } }
      );
    }
  } catch (e) {
    console.error("[accumulateTemplateStats] failed for room", roomId, e?.message || e);
  }
}

module.exports = { archiveHumanQa, trimArchive, accumulateTemplateStats };
