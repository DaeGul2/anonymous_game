// src/services/aiService.js
const { env } = require("../config/env");
const { Question, Answer, Round, QaArchive } = require("../models");

// 참고용 질문 형식 (강제 아님)
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

// qa_archives에서 랜덤 샘플 가져오기
async function getArchiveSamples(count = 5) {
  try {
    const rows = await QaArchive.findAll({
      order: QaArchive.sequelize.random(),
      limit: count,
    });
    return rows.map((r) => ({ question: r.question_text, answer: r.answer_text }));
  } catch {
    return [];
  }
}

// 아카이브 샘플을 텍스트로 포맷
function formatArchiveSamples(samples) {
  if (samples.length === 0) return "";
  return samples.map((s) => `Q: ${s.question}\nA: ${s.answer}`).join("\n\n");
}

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

// 랜덤으로 템플릿 몇 개 뽑기
function pickTemplates(count = 4) {
  const shuffled = [...QUESTION_TEMPLATES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// AI 질문 1개 생성 — { text, answer_type } 반환
async function generateAIQuestion({ roomId, roundId, humanQuestions }) {
  // answer_type 랜덤 배정 (free 70% / yesno 30%)
  const answer_type = Math.random() < 0.3 ? "yesno" : "free";

  const openai = getOpenAI();
  if (!openai) return { text: _fallbackQuestion(answer_type), answer_type };

  const [history, archiveSamples] = await Promise.all([
    getRoomHistory(roomId, roundId),
    getArchiveSamples(5),
  ]);

  const historyBlock = history.length > 0
    ? history.slice(-5).map((h) => `Q: ${h.question}\nA: ${h.answers.slice(0, 3).join(" / ")}`).join("\n\n")
    : "";

  const archiveBlock = formatArchiveSamples(archiveSamples);

  const humanQBlock = humanQuestions.length > 0
    ? humanQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")
    : "";

  const templateBlock = pickTemplates(4).join("\n");

  const yesnoRule = answer_type === "yesno"
    ? "\nIMPORTANT: The question MUST be answerable with only 예(yes) or 아니오(no). Do not ask open-ended questions."
    : "";

  const system = `You are a Korean person in your late 20s playing an anonymous Q&A game with friends.
You must generate ONE question in Korean for the game.

Your job is to sound exactly like a real Korean person texting friends — natural, casual, sometimes funny.
Study the real examples below carefully and match their tone, length, and vibe.
Do NOT copy them. Create something new but in the same style.${yesnoRule}
Output ONLY the question text, nothing else.`;

  let user = "";

  if (archiveBlock) {
    user += `[Real examples from past games]\n${archiveBlock}\n\n`;
  }

  if (historyBlock) {
    user += `[Current game history]\n${historyBlock}\n\n`;
  }

  if (humanQBlock) {
    user += `[Other players' questions this round — avoid overlap]\n${humanQBlock}\n\n`;
  }

  user += `[Template styles for reference — you don't have to follow these]\n${templateBlock}\n\n`;
  user += `Now write one question:`;

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 80,
      temperature: 0.95,
    });
    const text = (res.choices[0]?.message?.content || "")
      .trim()
      .replace(/^["']|["']$/g, "");
    return { text: text || _fallbackQuestion(answer_type), answer_type };
  } catch (e) {
    console.error("[AI generateQuestion]", e?.message);
    return { text: _fallbackQuestion(answer_type), answer_type };
  }
}

// AI 답변 1개 생성
async function generateAIAnswer({ roomId, roundId, question, allQuestions, currentQuestionOrderNo, answer_type }) {
  // yesno 질문은 GPT 호출 없이 랜덤 선택
  if (answer_type === "yesno") {
    return Math.random() < 0.5 ? "예" : "아니오";
  }

  const openai = getOpenAI();
  if (!openai) return _fallbackAnswer();

  const [prevHistory, currentRoundHistory, archiveSamples] = await Promise.all([
    getRoomHistory(roomId, roundId),
    getRoomHistory(roomId, roundId, {
      includeCurrentRound: true,
      beforeOrderNo: currentQuestionOrderNo ?? 999,
    }),
    getArchiveSamples(5),
  ]);

  const combined = [...prevHistory, ...currentRoundHistory].slice(-8);

  const historyBlock = combined.length > 0
    ? combined.map((h) => `Q: ${h.question}\nA: ${h.answers.slice(0, 4).join(" / ")}`).join("\n\n")
    : "";

  const archiveBlock = formatArchiveSamples(archiveSamples);

  const system = `You are a Korean person in your late 20s playing an anonymous Q&A game with friends.
You must answer the given question in Korean.

Study the real examples below and match their tone, length, and style exactly.
Real people write short, casual answers like texting on KakaoTalk.
If the question asks about something you can't know, just wing it naturally.
Output ONLY the answer text, nothing else.`;

  let user = "";

  if (archiveBlock) {
    user += `[Real examples from past games]\n${archiveBlock}\n\n`;
  }

  if (historyBlock) {
    user += `[Current game history]\n${historyBlock}\n\n`;
  }

  user += `[Question to answer]\n${question}\n\nYour answer:`;

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 60,
      temperature: 0.95,
    });
    const text = (res.choices[0]?.message?.content || "")
      .trim()
      .replace(/^["']|["']$/g, "");
    return text || _fallbackAnswer();
  } catch (e) {
    console.error("[AI generateAnswer]", e?.message);
    return _fallbackAnswer();
  }
}

function _fallbackQuestion(answer_type) {
  if (answer_type === "yesno") {
    const yesnoFallbacks = [
      "나는 지금 행복한 편이야?",
      "첫사랑 아직도 생각나?",
      "지금 짝사랑하는 사람 있어?",
      "내일 지구 멸망하면 후회되는 거 있어?",
      "요즘 잠을 잘 자고 있어?",
      "지금 이 자리에 있는 사람 중에 연락처 교환하고 싶은 사람 있어?",
    ];
    return yesnoFallbacks[Math.floor(Math.random() * yesnoFallbacks.length)];
  }
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
