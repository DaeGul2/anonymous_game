// src/services/aiService.js
const { env } = require("../config/env");
const { Question, Answer, Round } = require("../models");

// 서버 사이드 템플릿 (클라이언트 constants/questionTemplates.js와 동일)
const QUESTION_TEMPLATES = [
  "우리 중 ___ 할 것 같은 사람은?",
  "이 방에서 제일 ___ 할 것 같은 사람은?",
  "솔직히 ___ 은(는) 좀 무섭다",
  "내가 가장 후회하는 건 ___",
  "___가 없으면 못 살 것 같다",
  "죽기 전에 꼭 ___ 해보고 싶다",
  "요즘 가장 고민되는 건 ___",
  "비밀인데, 사실 나는 ___",
  "나는 ___ 할 때 가장 행복하다",
  "___ vs ___, 너는 어떤 게 더 좋아?",
  "살면서 가장 창피했던 순간은 ___",
  "만약 내가 ___ 라면 어떨 것 같아?",
  "우리 중 ___ 를 가장 잘 할 것 같은 사람은?",
  "지금 당장 ___ 하고 싶다",
];

// 방의 Q&A 이력을 { question, answers[] } 배열로 반환
// currentRoundId 이전 라운드만 or 포함 여부는 옵션으로 제어
async function getRoomHistory(roomId, currentRoundId, { includeCurrentRound = false, beforeOrderNo = null } = {}) {
  const rounds = await Round.findAll({
    where: { room_id: roomId },
    order: [["round_no", "ASC"]],
  });

  const history = [];
  for (const round of rounds) {
    const isCurrent = round.id === currentRoundId;

    if (isCurrent && !includeCurrentRound) continue;

    const qWhere = { round_id: round.id };
    // 현재 라운드는 이미 reveal된 것만 (order_no < 현재 질문 순서)
    if (isCurrent && beforeOrderNo != null) {
      const { Op } = require("sequelize");
      qWhere.order_no = { [Op.gt]: 0, [Op.lt]: beforeOrderNo };
    }

    const questions = await Question.findAll({
      where: qWhere,
      order: [["order_no", "ASC"]],
    });

    for (const q of questions) {
      const answers = await Answer.findAll({ where: { question_id: q.id } });
      const answerTexts = answers.map((a) => (a.text || "").trim()).filter((t) => t);
      if (answerTexts.length > 0) {
        history.push({ question: q.text, answers: answerTexts });
      }
    }
  }
  return history;
}

function getOpenAI() {
  if (!env.OPENAI_API_KEY) return null;
  const { default: OpenAI } = require("openai");
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

// AI 질문 1개 생성
async function generateAIQuestion({ roomId, roundId, humanQuestions }) {
  const openai = getOpenAI();
  if (!openai) return _fallbackQuestion();

  const history = await getRoomHistory(roomId, roundId);
  const template = QUESTION_TEMPLATES[Math.floor(Math.random() * QUESTION_TEMPLATES.length)];

  const historyText =
    history.length > 0
      ? history
          .slice(-5)
          .map((h) => `Q: ${h.question}\nA: ${h.answers.slice(0, 3).join(" / ")}`)
          .join("\n\n")
      : "없음";

  const humanQText =
    humanQuestions.length > 0
      ? humanQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")
      : "없음";

  const prompt = `당신은 친구들과 익명 게임을 즐기는 한국인 참가자야.
지금 각자 질문을 하나씩 내야 해.

이번 라운드에 다른 참가자들이 낸 질문:
${humanQText}

이전 라운드 대화 분위기 참고:
${historyText}

질문 형식 예시 (꼭 이 형식 아니어도 됨):
${template}

규칙:
- 절대 AI같은 질문 금지 (영어, 격식체, 나열식 금지)
- 친구들끼리 카톡할 때 쓰는 짧은 구어체로
- 솔직하고 약간 뻔뻔하거나 공감가는 내용
- 30자 이내
- 질문 텍스트만 출력, 다른 말 쓰지 마

질문:`;

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 80,
      temperature: 0.92,
    });
    const text = (res.choices[0]?.message?.content || "").trim().replace(/^["']|["']$/g, "");
    return text || _fallbackQuestion();
  } catch (e) {
    console.error("[AI generateQuestion]", e?.message);
    return _fallbackQuestion();
  }
}

// AI 답변 1개 생성
// currentQuestionOrderNo: 현재 질문의 order_no (이보다 작은 현재 라운드 Q&A를 context로 포함)
async function generateAIAnswer({ roomId, roundId, question, allQuestions, currentQuestionOrderNo }) {
  const openai = getOpenAI();
  if (!openai) return _fallbackAnswer();

  // 이전 라운드 전체 이력 + 현재 라운드에서 이미 공개된 Q&A
  const prevHistory = await getRoomHistory(roomId, roundId);
  const currentRoundHistory = await getRoomHistory(roomId, roundId, {
    includeCurrentRound: true,
    beforeOrderNo: currentQuestionOrderNo ?? 999,
  });

  // 합쳐서 최근 8개만 사용 (토큰 절약)
  const combined = [...prevHistory, ...currentRoundHistory].slice(-8);

  const historyText =
    combined.length > 0
      ? combined
          .map((h) => `Q: ${h.question}\nA: ${h.answers.slice(0, 4).join(" / ")}`)
          .join("\n\n")
      : "없음";

  const otherQText =
    allQuestions.filter((q) => q !== question).length > 0
      ? allQuestions
          .filter((q) => q !== question)
          .map((q, i) => `${i + 1}. ${q}`)
          .join("\n")
      : "없음";

  const prompt = `당신은 친구들과 익명 게임을 즐기는 한국인 참가자야.
지금 아래 질문에 익명으로 솔직하게 답해야 해.

질문: "${question}"

이전 라운드 대화 분위기:
${historyText}

이번 라운드 다른 질문들:
${otherQText}

규칙:
- 절대 AI같은 답변 금지 (격식체, 영어, 분석적 문장 금지)
- 친구들이 카톡에서 쓸 법한 짧고 솔직한 구어체
- 질문이 특정인·내부 정보가 필요한 경우 (예: "우리 팀에서...", "우리 학교...") → "모르지", "너", "글쎄" 같은 두루뭉술한 답변 가능
- 15자 이내로 짧게
- 답변 텍스트만 출력, 다른 말 쓰지 마

답변:`;

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 60,
      temperature: 0.92,
    });
    const text = (res.choices[0]?.message?.content || "").trim().replace(/^["']|["']$/g, "");
    return text || _fallbackAnswer();
  } catch (e) {
    console.error("[AI generateAnswer]", e?.message);
    return _fallbackAnswer();
  }
}

function _fallbackQuestion() {
  const fallbacks = [
    "요즘 뭐에 빠져있어?",
    "솔직히 지금 제일 고민되는 거 뭐야?",
    "최근에 웃긴 일 있었어?",
    "요즘 가장 하고 싶은 거 뭐야?",
    "지금 당장 떠나고 싶은 곳 있어?",
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

function _fallbackAnswer() {
  const fallbacks = ["모르지ㅋㅋ", "글쎄...", "생각해볼게", "비밀ㅋ", "그건 좀..."];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

module.exports = { generateAIQuestion, generateAIAnswer };
