// src/services/aiService.js
const { env } = require("../config/env");
const { Question, Answer, Round } = require("../models");

// 서버 사이드 템플릿 (명제형/if형만)
const QUESTION_TEMPLATES = [
  "우리 중 ___ 할 것 같은 사람은",
  "이 방에서 제일 ___ 할 것 같은 사람은",
  "솔직히 ___ 은 좀 무서운 편",
  "내가 가장 후회하는 건 ___",
  "___가 없으면 못 살 것 같음",
  "죽기 전에 꼭 ___ 해보고 싶음",
  "요즘 가장 고민되는 건 ___",
  "비밀인데 사실 나는 ___",
  "나는 ___ 할 때 가장 행복한 편",
  "___ vs ___ 나는 이게 더 좋음",
  "살면서 가장 창피했던 순간은 ___",
  "만약 내가 ___ 라면 ___ 했을 것 같음",
  "우리 중 ___ 를 가장 잘 할 것 같은 사람은",
  "지금 당장 ___ 하고 싶음",
  "나는 만약 싱글이라면 이 자리에 꼬시고 싶은 사람이 있음",
  "나는 ___ 하는 사람이 좋은 편",
  "사실 ___ 은 아직도 이해 못 하겠음",
  "나는 친구보다 연애가 더 중요한 편",
  "만약 오늘이 마지막 날이라면 ___ 할 것 같음",
  "요즘 들어 ___ 이 생각보다 소중하다는 걸 느낌",
];

// 방의 Q&A 이력을 { question, answers[] } 배열로 반환
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

  const prompt = `당신은 20대 후반~30대 한국인으로 친구들과 익명 게임 중이야.
지금 게임에 쓸 질문 하나를 만들어야 해.

이번 라운드에 다른 사람들이 낸 질문:
${humanQText}

이전 대화 분위기 참고:
${historyText}

참고할 질문 형식 예시:
${template}

규칙:
- 반드시 명제형이나 if형으로 써라 (예: "나는 ~한 편" "만약 ~라면 ~임" "~가 없으면 못 삼" "나는 ~하는 사람이 좋음")
- "너는 ~해?" "~야?" "~어?" 같은 직접 질문 절대 금지
- 특수기호(! , ? 등) 절대 금지
- AI처럼 격식체나 영어 쓰지 마
- 30자 이내
- 질문 텍스트만 출력

질문:`;

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 80,
      temperature: 0.92,
    });
    const text = (res.choices[0]?.message?.content || "")
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/[!,?]/g, "");
    return text || _fallbackQuestion();
  } catch (e) {
    console.error("[AI generateQuestion]", e?.message);
    return _fallbackQuestion();
  }
}

// AI 답변 1개 생성
async function generateAIAnswer({ roomId, roundId, question, allQuestions, currentQuestionOrderNo }) {
  const openai = getOpenAI();
  if (!openai) return _fallbackAnswer();

  const prevHistory = await getRoomHistory(roomId, roundId);
  const currentRoundHistory = await getRoomHistory(roomId, roundId, {
    includeCurrentRound: true,
    beforeOrderNo: currentQuestionOrderNo ?? 999,
  });

  const combined = [...prevHistory, ...currentRoundHistory].slice(-8);

  const historyText =
    combined.length > 0
      ? combined
          .map((h) => `Q: ${h.question}\nA: ${h.answers.slice(0, 4).join(" / ")}`)
          .join("\n\n")
      : "없음";

  const prompt = `당신은 20대 후반~30대 한국인으로 친구들과 익명 게임 중이야.
아래 질문에 솔직하게 짧게 답해야 해.

질문: ${question}

이전 대화 분위기 (말투 참고용):
${historyText}

규칙:
- "~함" "~인듯" "~임" "~인 것 같음" 같은 짧은 구어체로 써라
- 특수기호(! , ? 등) 절대 금지
- 영어나 격식체 절대 금지
- 질문이 내부 정보가 필요하거나 모르는 내용이면 "글쎄" "모르겠음" "뭐" 처럼 두루뭉술하게
- 카톡 단답처럼 짧게 (15자 이내)
- 답변 텍스트만 출력

답변:`;

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 60,
      temperature: 0.92,
    });
    const text = (res.choices[0]?.message?.content || "")
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/[!,]/g, "");
    return text || _fallbackAnswer();
  } catch (e) {
    console.error("[AI generateAnswer]", e?.message);
    return _fallbackAnswer();
  }
}

function _fallbackQuestion() {
  const fallbacks = [
    "나는 요즘 이상하게 감성적인 편",
    "솔직히 지금 제일 고민되는 건 돈",
    "죽기 전에 꼭 세계여행은 해봐야 함",
    "나는 혼자 있는 게 좋을 때가 더 많음",
    "만약 로또 당첨되면 아무한테도 말 안 할 것 같음",
    "나는 만약 싱글이라면 이 자리에 꼬시고 싶은 사람이 있음",
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

function _fallbackAnswer() {
  const fallbacks = ["글쎄", "모르겠음", "있긴 함", "비밀", "그건 좀", "뭐"];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

module.exports = { generateAIQuestion, generateAIAnswer };
