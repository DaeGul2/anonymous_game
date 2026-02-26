// src/services/qaArchiveService.js
const { Op } = require("sequelize");
const { Question, Answer, Player, QaArchive, QuestionHeart, sequelize } = require("../models");

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
    const playerCount = await Player.count({ where: { room_id: roomId } });

    // 질문별 하트 수 집계
    const heartRows = await QuestionHeart.findAll({
      attributes: [
        "question_id",
        [sequelize.fn("COUNT", sequelize.col("id")), "cnt"],
      ],
      include: [{
        model: Question,
        as: "question",
        required: true,
        where: { room_id: roomId },
        attributes: [],
      }],
      group: ["question_id"],
      raw: true,
    });
    const heartMap = new Map(heartRows.map((h) => [h.question_id, Number(h.cnt)]));

    // --- 1) 인간 질문 + 인간 답변 (기존) ---
    const humanAnswers = await Answer.findAll({
      where: { room_id: roomId },
      include: [
        {
          model: Question,
          as: "question",
          required: true,
          include: [{
            model: Player,
            as: "submitted_by",
            required: true,
            where: { is_ai: false },
            attributes: [],
          }],
        },
        {
          model: Player,
          as: "answered_by",
          required: true,
          where: { is_ai: false },
          attributes: [],
        },
      ],
    });

    const rows = humanAnswers
      .filter((a) => a.text && a.text.trim() && a.question?.text?.trim())
      .map((a) => {
        const hearts = heartMap.get(a.question.id) || 0;
        return {
          question_text: a.question.text.trim(),
          answer_text: a.text.trim(),
          answer_type: a.question.answer_type || "free",
          heart_count: hearts,
          player_count: playerCount,
          popularity_score: calcScore(hearts, playerCount),
        };
      });

    // --- 2) AI 질문(하트 있는 것만) + 인간 답변 ---
    const hearted_qids = [...heartMap.entries()]
      .filter(([, cnt]) => cnt > 0)
      .map(([qid]) => qid);

    if (hearted_qids.length > 0) {
      const aiAnswers = await Answer.findAll({
        where: { room_id: roomId },
        include: [
          {
            model: Question,
            as: "question",
            required: true,
            where: {
              id: { [Op.in]: hearted_qids },
            },
            include: [{
              model: Player,
              as: "submitted_by",
              required: true,
              where: { is_ai: true },
              attributes: [],
            }],
          },
          {
            model: Player,
            as: "answered_by",
            required: true,
            where: { is_ai: false },
            attributes: [],
          },
        ],
      });

      for (const a of aiAnswers) {
        if (!a.text?.trim() || !a.question?.text?.trim()) continue;
        const hearts = heartMap.get(a.question.id) || 0;
        rows.push({
          question_text: a.question.text.trim(),
          answer_text: a.text.trim(),
          answer_type: a.question.answer_type || "free",
          heart_count: hearts,
          player_count: playerCount,
          popularity_score: calcScore(hearts, playerCount),
        });
      }
    }

    if (rows.length > 0) {
      await QaArchive.bulkCreate(rows);
    }
  } catch (e) {
    // 아카이브 실패가 방 삭제를 막으면 안 됨
    console.error("[qa-archive] failed for room", roomId, e?.message || e);
  }
}

module.exports = { archiveHumanQa };
