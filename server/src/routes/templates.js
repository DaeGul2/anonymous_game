// src/routes/templates.js
const express = require("express");
const { TemplateQuestion, TemplateCategory } = require("../models");

const router = express.Router();

// GET /api/templates — 활성 템플릿 목록 (게임 클라이언트용)
router.get("/", async (req, res) => {
  try {
    const templates = await TemplateQuestion.findAll({
      where: { is_active: true },
      attributes: ["id", "text", "category_id", "answer_type"],
      include: [{ model: TemplateCategory, as: "category", attributes: ["id", "name"] }],
      order: [["created_at", "DESC"]],
    });
    res.json({ ok: true, templates });
  } catch (e) {
    console.error("[GET /api/templates]", e?.message || e);
    res.status(500).json({ ok: false, message: "템플릿 조회 실패" });
  }
});

module.exports = router;
