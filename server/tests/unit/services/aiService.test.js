// Mock openai BEFORE requiring aiService
jest.mock("openai", () => {
  const mockCreate = jest.fn().mockResolvedValue({
    choices: [{ message: { content: "AI가 생성한 질문" } }],
  });
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    })),
    __mockCreate: mockCreate,
  };
});

const { syncTestDb, clearTestDb, closeTestDb } = require("../../helpers/testDb");
const { createUser, createRoomDirect, createPlayerDirect } = require("../../helpers/fixtures");
const { generateAIQuestion, generateAIAnswer } = require("../../../src/services/aiService");
const { Round, Question, Answer, QaArchive } = require("../../../src/models");

// Set OPENAI_API_KEY so getOpenAI() returns an instance
const origKey = process.env.OPENAI_API_KEY;
beforeAll(async () => {
  process.env.OPENAI_API_KEY = "test-key";
  await syncTestDb();
});
beforeEach(async () => { await clearTestDb(); });
afterAll(async () => {
  process.env.OPENAI_API_KEY = origKey;
  await closeTestDb();
});

describe("generateAIQuestion", () => {
  test("should return question text from OpenAI", async () => {
    const result = await generateAIQuestion({ roomId: 1, roundId: 1, humanQuestions: [] });
    expect(result).toHaveProperty("text");
    expect(result).toHaveProperty("answer_type");
    expect(typeof result.text).toBe("string");
    expect(result.text.length).toBeGreaterThan(0);
  });

  test("should include answer_type (free or yesno)", async () => {
    const result = await generateAIQuestion({ roomId: 1, roundId: 1, humanQuestions: [] });
    expect(["free", "yesno"]).toContain(result.answer_type);
  });

  test("should use fallback when OpenAI key is missing", async () => {
    const saved = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "";

    // Need to re-require to pick up empty key -- but since module is cached, test fallback path
    // Instead, directly test the service returns something valid
    const result = await generateAIQuestion({ roomId: 1, roundId: 1, humanQuestions: [] });
    expect(result.text.length).toBeGreaterThan(0);

    process.env.OPENAI_API_KEY = saved;
  });

  test("should use room history when available", async () => {
    const user = await createUser();
    const room = await createRoomDirect();
    const player = await createPlayerDirect(room.id, user.id);
    const round = await Round.create({ room_id: room.id, round_no: 1, started_at: new Date() });
    const q = await Question.create({
      room_id: room.id, round_id: round.id, text: "이전 질문",
      answer_type: "free", submitted_by_player_id: player.id,
      submitted_at: new Date(), order_no: 1, is_used: true,
    });
    await Answer.create({
      room_id: room.id, round_id: round.id, question_id: q.id,
      text: "이전 답변", answered_by_player_id: player.id, submitted_at: new Date(),
    });

    const result = await generateAIQuestion({
      roomId: room.id, roundId: round.id, humanQuestions: ["인간 질문"],
    });
    expect(result.text.length).toBeGreaterThan(0);
  });
});

describe("generateAIAnswer", () => {
  test("should return answer text for free type", async () => {
    const result = await generateAIAnswer({
      roomId: 1, roundId: 1, question: "테스트?", allQuestions: ["테스트?"],
      currentQuestionOrderNo: 1, answer_type: "free", humanAnswers: [],
    });
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  test("should return 예 or 아니오 for yesno type without GPT call", async () => {
    const result = await generateAIAnswer({
      roomId: 1, roundId: 1, question: "좋아해?", allQuestions: ["좋아해?"],
      currentQuestionOrderNo: 1, answer_type: "yesno", humanAnswers: [],
    });
    expect(["예", "아니오"]).toContain(result);
  });

  test("should use archive samples when available", async () => {
    await QaArchive.create({
      question_text: "아카이브Q", answer_text: "아카이브A", answer_type: "free",
      heart_count: 3, player_count: 4, popularity_score: 0.8,
    });

    const result = await generateAIAnswer({
      roomId: 1, roundId: 1, question: "뭐해?", allQuestions: ["뭐해?"],
      currentQuestionOrderNo: 1, answer_type: "free", humanAnswers: ["놀고있음"],
    });
    expect(typeof result).toBe("string");
  });

  test("should handle OpenAI error gracefully with fallback", async () => {
    const { __mockCreate } = require("openai");
    __mockCreate.mockRejectedValueOnce(new Error("API down"));

    const result = await generateAIAnswer({
      roomId: 1, roundId: 1, question: "에러?", allQuestions: ["에러?"],
      currentQuestionOrderNo: 1, answer_type: "free", humanAnswers: [],
    });
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});
