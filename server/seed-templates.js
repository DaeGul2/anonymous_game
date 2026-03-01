// 카테고리 + 템플릿 질문 시드 스크립트
// 실행: node seed-templates.js
require("dotenv").config();
const { sequelize, TemplateCategory, TemplateQuestion } = require("./src/models");

const SEED = [
  {
    name: "취미",
    order_no: 1,
    questions: [
      "요즘 빠져있는 취미가 뭐야?",
      "주말에 보통 뭐 하면서 시간 보내?",
      "돈 걱정 없으면 꼭 해보고 싶은 취미는?",
      "우리 중 ___ 취미 가지고 있을 것 같은 사람은?",
      "최근에 새로 시작한 취미 있어?",
      "남들은 이해 못하는 나만의 취미는?",
      "하루 종일 해도 안 질리는 거 하나만 말해봐",
      "여행 vs 집콕, 너는 어느 쪽이야?",
    ],
  },
  {
    name: "19금",
    order_no: 2,
    questions: [
      "첫 키스 언제 했어? 솔직하게!",
      "이상형 외모 조건 3가지는?",
      "술 먹고 가장 대담했던 순간은?",
      "지금까지 사귄 사람 중 가장 설렜던 순간은?",
      "비밀인데, 사실 나는 ___ 한 적 있다",
      "우리 중 술버릇 가장 심할 것 같은 사람은?",
      "연애하면서 가장 창피했던 에피소드는?",
      "이 방에서 제일 야한 생각 많이 할 것 같은 사람은?",
    ],
  },
  {
    name: "회사",
    order_no: 3,
    questions: [
      "회사에서 가장 힘든 순간은?",
      "직장 상사한테 진짜 하고 싶은 말은?",
      "로또 당첨되면 바로 퇴사할 거야?",
      "회사에서 몰래 하는 거 하나만 고백해봐",
      "우리 중 제일 먼저 이직할 것 같은 사람은?",
      "직장 동료랑 연애 가능? 불가능?",
      "야근 중 가장 빡쳤던 순간은?",
      "만약 사장이 되면 제일 먼저 바꿀 것은?",
    ],
  },
  {
    name: "이성",
    order_no: 4,
    questions: [
      "첫인상으로 호감 가는 포인트는?",
      "이상형 성격 TOP 3는?",
      "이성한테 가장 실망했던 순간은?",
      "우리 중 이성한테 제일 인기 많을 것 같은 사람은?",
      "절대 용납 못하는 이성의 행동은?",
      "소개팅에서 상대가 ___ 하면 바로 아웃",
      "이성 앞에서 제일 쿨한 척 할 것 같은 사람은?",
      "고백은 직접 vs 문자, 어느 쪽이야?",
    ],
  },
  {
    name: "연애",
    order_no: 5,
    questions: [
      "연애할 때 나의 가장 큰 장점은?",
      "전 애인한테 마지막으로 하고 싶은 말은?",
      "연애에서 절대 양보 못하는 것은?",
      "우리 중 연애하면 제일 집착할 것 같은 사람은?",
      "가장 오래 사귄 기간은 얼마야?",
      "연인과 매일 연락 필수? 자유?",
      "이별 후 가장 힘들었던 순간은?",
      "사랑 vs 돈, 솔직하게 골라봐",
    ],
  },
  {
    name: "취향",
    order_no: 6,
    questions: [
      "인생 영화 하나만 고른다면?",
      "___ 없으면 진짜 못 살 것 같다",
      "아침형 vs 저녁형, 너는?",
      "우리 중 패션 센스 제일 좋을 것 같은 사람은?",
      "평생 한 가지 음식만 먹는다면?",
      "여름 vs 겨울, 어느 쪽이 더 좋아?",
      "가장 최근에 울었던 이유는?",
      "혼자만의 시간 vs 사람들과 어울리기, 뭐가 더 좋아?",
    ],
  },
];

async function run() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  for (const cat of SEED) {
    const [category] = await TemplateCategory.findOrCreate({
      where: { name: cat.name },
      defaults: { order_no: cat.order_no },
    });

    for (const text of cat.questions) {
      const exists = await TemplateQuestion.findOne({
        where: { text, category_id: category.id },
      });
      if (!exists) {
        await TemplateQuestion.create({
          text,
          category_id: category.id,
          answer_type: "free",
        });
      }
    }

    console.log(`[seed] ${cat.name}: ${cat.questions.length}개 질문`);
  }

  console.log("[seed] 완료!");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
