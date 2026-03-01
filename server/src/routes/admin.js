// src/routes/admin.js
const express = require("express");
const { Op } = require("sequelize");
const { TemplateQuestion, TemplateCategory, Question, QuestionHeart, QaArchive, sequelize } = require("../models");

const router = express.Router();

// ============================================================
// 카테고리 CRUD
// ============================================================

// GET /api/admin/categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await TemplateCategory.findAll({
      order: [["order_no", "ASC"], ["created_at", "ASC"]],
    });
    res.json({ ok: true, categories });
  } catch (e) {
    console.error("[GET /admin/categories]", e?.message || e);
    res.status(500).json({ ok: false, message: "카테고리 조회 실패" });
  }
});

// POST /api/admin/categories
router.post("/categories", async (req, res) => {
  try {
    const { name, description, order_no } = req.body;
    if (!name?.trim()) return res.status(400).json({ ok: false, message: "name 필수" });

    const c = await TemplateCategory.create({
      name: name.trim(),
      description: description?.trim() || null,
      order_no: order_no ?? 0,
    });
    res.json({ ok: true, category: c });
  } catch (e) {
    console.error("[POST /admin/categories]", e?.message || e);
    res.status(500).json({ ok: false, message: "카테고리 생성 실패" });
  }
});

// PUT /api/admin/categories/:id
router.put("/categories/:id", async (req, res) => {
  try {
    const c = await TemplateCategory.findByPk(req.params.id);
    if (!c) return res.status(404).json({ ok: false, message: "카테고리 없음" });

    const { name, description, order_no, is_active } = req.body;
    if (name !== undefined) c.name = String(name).trim();
    if (description !== undefined) c.description = description?.trim() || null;
    if (order_no !== undefined) c.order_no = Number(order_no) || 0;
    if (is_active !== undefined) c.is_active = !!is_active;
    await c.save();

    res.json({ ok: true, category: c });
  } catch (e) {
    console.error("[PUT /admin/categories]", e?.message || e);
    res.status(500).json({ ok: false, message: "카테고리 수정 실패" });
  }
});

// DELETE /api/admin/categories/:id
router.delete("/categories/:id", async (req, res) => {
  try {
    const c = await TemplateCategory.findByPk(req.params.id);
    if (!c) return res.status(404).json({ ok: false, message: "카테고리 없음" });

    // 해당 카테고리의 템플릿들 category_id를 null로
    await TemplateQuestion.update({ category_id: null }, { where: { category_id: c.id } });
    await c.destroy();

    res.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /admin/categories]", e?.message || e);
    res.status(500).json({ ok: false, message: "카테고리 삭제 실패" });
  }
});

// ============================================================
// 템플릿 CRUD
// ============================================================

// GET /api/admin/templates — 전체 목록 (+ usage_count, heart_count + category include)
router.get("/templates", async (req, res) => {
  try {
    const templates = await TemplateQuestion.findAll({
      include: [{ model: TemplateCategory, as: "category", attributes: ["id", "name"] }],
      order: [["created_at", "DESC"]],
    });

    // 누적 통계 (template_questions에 저장) + 현재 활성 게임의 live 데이터 합산
    const ids = templates.map((t) => t.id);
    let liveMap = new Map();

    if (ids.length > 0) {
      const rows = await sequelize.query(
        `SELECT q.template_id,
                COUNT(DISTINCT q.id) AS usage_count,
                COUNT(DISTINCT qh.id) AS heart_count
         FROM questions q
         LEFT JOIN question_hearts qh ON qh.question_id = q.id
         WHERE q.template_id IN (:ids)
         GROUP BY q.template_id`,
        { replacements: { ids }, type: sequelize.QueryTypes.SELECT }
      );
      for (const r of rows) {
        liveMap.set(r.template_id, {
          usage_count: Number(r.usage_count) || 0,
          heart_count: Number(r.heart_count) || 0,
        });
      }
    }

    const result = templates.map((t) => {
      const live = liveMap.get(t.id) || { usage_count: 0, heart_count: 0 };
      const j = t.toJSON();
      return {
        ...j,
        usage_count: (j.usage_count || 0) + live.usage_count,
        heart_count: (j.heart_count || 0) + live.heart_count,
      };
    });

    res.json({ ok: true, templates: result });
  } catch (e) {
    console.error("[GET /admin/templates]", e?.message || e);
    res.status(500).json({ ok: false, message: "목록 조회 실패" });
  }
});

// GET /api/admin/templates/:id
router.get("/templates/:id", async (req, res) => {
  try {
    const t = await TemplateQuestion.findByPk(req.params.id);
    if (!t) return res.status(404).json({ ok: false, message: "템플릿 없음" });
    res.json({ ok: true, template: t });
  } catch (e) {
    res.status(500).json({ ok: false, message: "조회 실패" });
  }
});

// POST /api/admin/templates
router.post("/templates", async (req, res) => {
  try {
    const { text, category_id, answer_type } = req.body;
    if (!text?.trim()) return res.status(400).json({ ok: false, message: "text 필수" });

    const t = await TemplateQuestion.create({
      text: text.trim(),
      category_id: category_id || null,
      answer_type: answer_type === "yesno" ? "yesno" : "free",
    });
    res.json({ ok: true, template: t });
  } catch (e) {
    console.error("[POST /admin/templates]", e?.message || e);
    res.status(500).json({ ok: false, message: "생성 실패" });
  }
});

// PUT /api/admin/templates/:id
router.put("/templates/:id", async (req, res) => {
  try {
    const t = await TemplateQuestion.findByPk(req.params.id);
    if (!t) return res.status(404).json({ ok: false, message: "템플릿 없음" });

    const { text, category_id, answer_type, is_active } = req.body;
    if (text !== undefined) t.text = String(text).trim();
    if (category_id !== undefined) t.category_id = category_id || null;
    if (answer_type !== undefined) t.answer_type = answer_type === "yesno" ? "yesno" : "free";
    if (is_active !== undefined) t.is_active = !!is_active;
    await t.save();

    res.json({ ok: true, template: t });
  } catch (e) {
    console.error("[PUT /admin/templates]", e?.message || e);
    res.status(500).json({ ok: false, message: "수정 실패" });
  }
});

// DELETE /api/admin/templates/:id
router.delete("/templates/:id", async (req, res) => {
  try {
    const t = await TemplateQuestion.findByPk(req.params.id);
    if (!t) return res.status(404).json({ ok: false, message: "템플릿 없음" });
    await t.destroy();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: "삭제 실패" });
  }
});

// GET /api/admin/templates/:id/stats — 상세 통계
router.get("/templates/:id/stats", async (req, res) => {
  try {
    const t = await TemplateQuestion.findByPk(req.params.id);
    if (!t) return res.status(404).json({ ok: false, message: "템플릿 없음" });

    const { period = "daily", days = 7, weeks = 4, months = 3 } = req.query;

    let dateFormat, groupExpr, limit;
    if (period === "weekly") {
      dateFormat = "%x-W%v"; // ISO week
      groupExpr = "DATE_FORMAT(q.submitted_at, '%x-W%v')";
      limit = Number(weeks) || 4;
    } else if (period === "monthly") {
      dateFormat = "%Y-%m";
      groupExpr = "DATE_FORMAT(q.submitted_at, '%Y-%m')";
      limit = Number(months) || 3;
    } else {
      dateFormat = "%Y-%m-%d";
      groupExpr = "DATE(q.submitted_at)";
      limit = Number(days) || 7;
    }

    // 기간별 usage + hearts
    const timeRows = await sequelize.query(
      `SELECT ${groupExpr} AS period_label,
              COUNT(DISTINCT q.id) AS usage_count,
              COUNT(DISTINCT qh.id) AS heart_count
       FROM questions q
       LEFT JOIN question_hearts qh ON qh.question_id = q.id
       WHERE q.template_id = :tid
       GROUP BY period_label
       ORDER BY period_label DESC
       LIMIT :limit`,
      { replacements: { tid: req.params.id, limit }, type: sequelize.QueryTypes.SELECT }
    );

    // 시간대 분포
    const hourRows = await sequelize.query(
      `SELECT HOUR(q.submitted_at) AS hour, COUNT(*) AS cnt
       FROM questions q
       WHERE q.template_id = :tid
       GROUP BY hour
       ORDER BY hour`,
      { replacements: { tid: req.params.id }, type: sequelize.QueryTypes.SELECT }
    );

    // live 데이터 (현재 활성 게임)
    const [liveRow] = await sequelize.query(
      `SELECT COUNT(DISTINCT q.id) AS usage_count,
              COUNT(DISTINCT qh.id) AS heart_count
       FROM questions q
       LEFT JOIN question_hearts qh ON qh.question_id = q.id
       WHERE q.template_id = :tid`,
      { replacements: { tid: req.params.id }, type: sequelize.QueryTypes.SELECT }
    );

    res.json({
      ok: true,
      template: t,
      stats: {
        period,
        timeline: timeRows.reverse(),
        hourly: hourRows,
        total_usage: (t.usage_count || 0) + (Number(liveRow?.usage_count) || 0),
        total_hearts: (t.heart_count || 0) + (Number(liveRow?.heart_count) || 0),
      },
    });
  } catch (e) {
    console.error("[GET /admin/templates/:id/stats]", e?.message || e);
    res.status(500).json({ ok: false, message: "통계 조회 실패" });
  }
});

// ============================================================
// QA 아카이브 (R + D) — question별 그룹핑
// ============================================================

// GET /api/admin/archives — question별 그룹 목록 (검색 + 필터 + 페이지네이션 + 정렬)
router.get("/archives", async (req, res) => {
  try {
    const { q, page = 1, limit = 20, sort = "total_hearts", order = "desc", answer_type } = req.query;

    const whereClauses = [];
    const replacements = {};

    if (q?.trim()) {
      whereClauses.push("(a.question_text LIKE :search OR a.answer_text LIKE :search)");
      replacements.search = `%${q.trim()}%`;
    }
    if (answer_type && ["free", "yesno"].includes(answer_type)) {
      whereClauses.push("a.answer_type = :answer_type");
      replacements.answer_type = answer_type;
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // 검색 조건에 맞는 question_text 집합 (answer_text 검색 시 해당 question도 포함)
    const matchFilter = whereClauses.length > 0
      ? `WHERE question_text IN (SELECT DISTINCT a.question_text FROM qa_archives a ${whereStr})`
      : "";

    // 총 question 그룹 수
    const [countResult] = await sequelize.query(
      `SELECT COUNT(*) AS total FROM (
         SELECT DISTINCT question_text FROM qa_archives ${matchFilter}
       ) AS sub`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );
    const total = Number(countResult.total) || 0;

    // 정렬 컬럼 매핑
    const validSorts = { total_hearts: "total_hearts", answer_count: "answer_count", latest_at: "latest_at", max_popularity: "max_popularity" };
    const sortCol = validSorts[sort] || "total_hearts";
    const sortOrder = order === "asc" ? "ASC" : "DESC";

    const offset = (Math.max(1, Number(page)) - 1) * Number(limit);

    // question별 그룹 통계
    const groups = await sequelize.query(
      `SELECT question_text, answer_type,
              SUM(heart_count) AS total_hearts,
              COUNT(*) AS answer_count,
              MAX(popularity_score) AS max_popularity,
              MAX(created_at) AS latest_at
       FROM qa_archives
       ${matchFilter}
       GROUP BY question_text, answer_type
       ORDER BY ${sortCol} ${sortOrder}
       LIMIT :lim OFFSET :off`,
      { replacements: { ...replacements, lim: Number(limit), off: offset }, type: sequelize.QueryTypes.SELECT }
    );

    // 해당 question들의 전체 answer 조회 (검색 필터 무관하게 전부)
    const questionTexts = groups.map((g) => g.question_text);
    const answersMap = {};

    if (questionTexts.length > 0) {
      const answers = await sequelize.query(
        `SELECT id, question_text, answer_text, answer_type,
                heart_count, player_count, popularity_score, created_at
         FROM qa_archives
         WHERE question_text IN (:texts)
         ORDER BY popularity_score DESC`,
        { replacements: { texts: questionTexts }, type: sequelize.QueryTypes.SELECT }
      );
      for (const a of answers) {
        if (!answersMap[a.question_text]) answersMap[a.question_text] = [];
        answersMap[a.question_text].push(a);
      }
    }

    const result = groups.map((g) => ({
      question_text: g.question_text,
      answer_type: g.answer_type,
      total_hearts: Number(g.total_hearts) || 0,
      answer_count: Number(g.answer_count) || 0,
      max_popularity: Number(g.max_popularity) || 0,
      latest_at: g.latest_at,
      answers: answersMap[g.question_text] || [],
    }));

    res.json({
      ok: true,
      groups: result,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (e) {
    console.error("[GET /admin/archives]", e?.message || e);
    res.status(500).json({ ok: false, message: "아카이브 조회 실패" });
  }
});

// POST /api/admin/archives/bulk-delete — 선택 삭제 (ids 또는 question_texts)
router.post("/archives/bulk-delete", async (req, res) => {
  try {
    const { ids, question_texts } = req.body;

    if (question_texts?.length) {
      await QaArchive.destroy({ where: { question_text: { [Op.in]: question_texts } } });
      return res.json({ ok: true });
    }
    if (ids?.length) {
      await QaArchive.destroy({ where: { id: { [Op.in]: ids } } });
      return res.json({ ok: true });
    }

    res.status(400).json({ ok: false, message: "ids 또는 question_texts 필요" });
  } catch (e) {
    console.error("[POST /admin/archives/bulk-delete]", e?.message || e);
    res.status(500).json({ ok: false, message: "삭제 실패" });
  }
});

// DELETE /api/admin/archives/:id
router.delete("/archives/:id", async (req, res) => {
  try {
    const a = await QaArchive.findByPk(req.params.id);
    if (!a) return res.status(404).json({ ok: false, message: "아카이브 없음" });
    await a.destroy();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: "삭제 실패" });
  }
});

// POST /api/admin/archives/:id/to-template — 아카이브 → 템플릿 복사
router.post("/archives/:id/to-template", async (req, res) => {
  try {
    const a = await QaArchive.findByPk(req.params.id);
    if (!a) return res.status(404).json({ ok: false, message: "아카이브 없음" });

    const t = await TemplateQuestion.create({
      text: a.question_text,
      answer_type: a.answer_type || "free",
      category: null,
    });

    res.json({ ok: true, template: t });
  } catch (e) {
    console.error("[POST /admin/archives/:id/to-template]", e?.message || e);
    res.status(500).json({ ok: false, message: "템플릿 생성 실패" });
  }
});

module.exports = router;
