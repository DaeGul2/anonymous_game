// src/services/qaArchiveService.js
const { Question, Answer, Player, QaArchive, QuestionHeart, sequelize } = require("../models");

/**
 * 방 삭제 전 인간 유저의 질문-답변 쌍을 qa_archives에 보존.
 * - 질문자, 답변자 모두 인간(is_ai=false)인 쌍만 저장
 * - 익명 — 유저/플레이어 정보 저장 안 함
 * - 빈 답변은 제외
 * - 질문별 하트 수 + 방 인원수 → popularity_score 저장
 */
async function archiveHumanQa(roomId) {
  try {
    // 방 전체 플레이어 수
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

    const answers = await Answer.findAll({
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

    const rows = answers
      .filter((a) => a.text && a.text.trim() && a.question?.text?.trim())
      .map((a) => {
        const hearts = heartMap.get(a.question.id) || 0;
        const rawRate = (hearts + 1) / (playerCount + 2);
        const confidence = Math.min(1, playerCount / 4);
        return {
          question_text: a.question.text.trim(),
          answer_text: a.text.trim(),
          answer_type: a.question.answer_type || "free",
          heart_count: hearts,
          player_count: playerCount,
          popularity_score: Math.round(rawRate * confidence * 1000) / 1000,
        };
      });

    if (rows.length > 0) {
      await QaArchive.bulkCreate(rows);
    }
  } catch (e) {
    // 아카이브 실패가 방 삭제를 막으면 안 됨
    console.error("[qa-archive] failed for room", roomId, e?.message || e);
  }
}

module.exports = { archiveHumanQa };
