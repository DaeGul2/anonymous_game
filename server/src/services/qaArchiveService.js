// src/services/qaArchiveService.js
const { Question, Answer, Player, QaArchive } = require("../models");

/**
 * 방 삭제 전 인간 유저의 질문-답변 쌍을 qa_archives에 보존.
 * - 질문자, 답변자 모두 인간(is_ai=false)인 쌍만 저장
 * - 익명 — 유저/플레이어 정보 저장 안 함
 * - 빈 답변은 제외
 */
async function archiveHumanQa(roomId) {
  try {
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
      .map((a) => ({
        question_text: a.question.text.trim(),
        answer_text: a.text.trim(),
      }));

    if (rows.length > 0) {
      await QaArchive.bulkCreate(rows);
    }
  } catch (e) {
    // 아카이브 실패가 방 삭제를 막으면 안 됨
    console.error("[qa-archive] failed for room", roomId, e?.message || e);
  }
}

module.exports = { archiveHumanQa };
