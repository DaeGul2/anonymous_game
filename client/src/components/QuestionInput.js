// src/components/QuestionInput.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Collapse, Paper, Stack, TextField, Typography } from "@mui/material";

export default function QuestionInput({ canEdit, savedText, submitted, onSave, onEdit, deadlineExpiredSignal, templates = [] }) {
  const [draft, setDraft] = useState(savedText || "");
  const [answerType, setAnswerType] = useState("free");
  const [editing, setEditing] = useState(!submitted);
  const [pending, setPending] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const timerRef = useRef(null);
  const textareaRef = useRef(null);

  // 카테고리별 그룹핑
  const grouped = useMemo(() => {
    const map = new Map();
    for (const t of templates) {
      const catId = t.category?.id || "__none__";
      const catName = t.category?.name || "기타";
      if (!map.has(catId)) map.set(catId, { id: catId, name: catName, items: [] });
      map.get(catId).items.push(t);
    }
    return [...map.values()];
  }, [templates]);

  useEffect(() => {
    if (!editing) setDraft(savedText || "");
  }, [savedText, editing]);

  useEffect(() => {
    if (!canEdit) setEditing(false);
  }, [deadlineExpiredSignal, canEdit]);

  useEffect(() => {
    if (submitted) setEditing(false);
  }, [submitted]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleSubmit = () => {
    if (!canEdit || pending || !draft.trim()) return;
    setPending(true);
    onSave(draft.trim(), answerType, selectedTemplateId);
    timerRef.current = setTimeout(() => setPending(false), 800);
  };

  const handleSelectTemplate = (t) => {
    if (selectedTemplateId === t.id) {
      // 같은 질문 다시 탭 → 선택 해제
      setDraft("");
      setSelectedTemplateId(null);
      setAnswerType("free");
    } else {
      setDraft(t.text);
      setSelectedTemplateId(t.id);
      setAnswerType(t.answer_type || "free");
    }
  };

  const maxChar = 100;

  if (!editing && (submitted || savedText)) {
    return (
      <Paper
        className="glassCard section"
        sx={{
          p: 2.4,
          background: "linear-gradient(135deg, rgba(16,185,129,0.16), rgba(52,211,153,0.08)) !important",
          border: "1px solid rgba(16,185,129,0.30) !important",
          animation: "popIn 0.5s var(--spring) both",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box
            sx={{
              width: 38, height: 38, borderRadius: "50%",
              background: "linear-gradient(135deg, #10B981, #34D399)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flex: "0 0 auto",
              boxShadow: "0 4px 14px rgba(16,185,129,0.35)",
              animation: "checkPop 0.6s var(--spring) both 0.1s",
              opacity: 0, fontSize: 20, color: "#fff", fontWeight: 900,
            }}
          >
            ✓
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#059669", mb: 0.4 }}>
              질문 제출 완료!
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em", lineHeight: 1.4, wordBreak: "break-word" }}>
              {savedText || draft}
            </Typography>
          </Box>
        </Stack>
        {canEdit && (
          <Button
            size="small" variant="text"
            onClick={() => {
              setEditing(true);
              setDraft(savedText || draft);
              setSelectedTemplateId(null);
              if (onEdit) onEdit();
            }}
            sx={{ mt: 1.2, color: "var(--text-2)", fontWeight: 700, fontSize: 12 }}
          >
            다시 쓰기
          </Button>
        )}
      </Paper>
    );
  }

  return (
    <Paper className="glassCard section" sx={{ p: 2.2, animation: "slideUp 0.4s var(--spring) both" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 15, letterSpacing: "-0.02em" }}>
          ✏️ 내 질문 작성
        </Typography>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: draft.length > maxChar ? "var(--c-red)" : "var(--text-3)" }}>
          {draft.length}/{maxChar}
        </Typography>
      </Stack>

      {/* 카테고리별 템플릿 선택 */}
      {canEdit && grouped.length > 0 && (
        <Box id="qi-template" sx={{ mb: 1.5 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", mb: 0.8 }}>
            💡 템플릿으로 시작하기
          </Typography>

          {/* 카테고리 칩 */}
          <Box
            sx={{
              display: "flex",
              gap: 0.6,
              overflowX: "auto",
              pb: 0.5,
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
          >
            {grouped.map((g) => {
              const isOpen = selectedCategoryId === g.id;
              return (
                <Box
                  key={g.id}
                  onClick={() => setSelectedCategoryId(isOpen ? null : g.id)}
                  sx={{
                    flex: "0 0 auto",
                    px: 1.4,
                    py: 0.6,
                    borderRadius: 999,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                    userSelect: "none",
                    transition: "all 0.15s ease",
                    background: isOpen
                      ? "linear-gradient(135deg, rgba(124,58,237,0.20), rgba(236,72,153,0.12))"
                      : "rgba(124,58,237,0.06)",
                    border: isOpen
                      ? "1.5px solid rgba(124,58,237,0.45)"
                      : "1.5px solid rgba(124,58,237,0.15)",
                    color: isOpen ? "var(--c-primary)" : "var(--text-2)",
                    "&:active": { transform: "scale(0.95)" },
                  }}
                >
                  {g.name}
                  <Typography
                    component="span"
                    sx={{ fontSize: 10, fontWeight: 700, ml: 0.5, opacity: 0.6 }}
                  >
                    {g.items.length}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* 선택된 카테고리의 질문 목록 */}
          {grouped.map((g) => (
            <Collapse key={g.id} in={selectedCategoryId === g.id} timeout={200} unmountOnExit>
              <Box
                sx={{
                  mt: 1,
                  maxHeight: 220,
                  overflowY: "auto",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid rgba(124,58,237,0.15)",
                  background: "rgba(255,255,255,0.45)",
                  "&::-webkit-scrollbar": { width: 4 },
                  "&::-webkit-scrollbar-thumb": {
                    background: "rgba(124,58,237,0.20)",
                    borderRadius: 999,
                  },
                }}
              >
                {g.items.map((t, i) => {
                  const isSelected = selectedTemplateId === t.id;
                  return (
                    <Box
                      key={t.id}
                      onClick={() => handleSelectTemplate(t)}
                      sx={{
                        px: 1.6,
                        py: 1.2,
                        cursor: "pointer",
                        userSelect: "none",
                        transition: "all 0.12s ease",
                        borderBottom: i < g.items.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                        background: isSelected
                          ? "linear-gradient(135deg, rgba(124,58,237,0.14), rgba(236,72,153,0.07))"
                          : "transparent",
                        "&:active": { background: "rgba(124,58,237,0.10)" },
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      {/* 선택 표시 */}
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          flex: "0 0 auto",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 900,
                          transition: "all 0.15s ease",
                          background: isSelected
                            ? "linear-gradient(135deg, #7C3AED, #EC4899)"
                            : "rgba(0,0,0,0.06)",
                          color: isSelected ? "#fff" : "transparent",
                          border: isSelected ? "none" : "1.5px solid rgba(0,0,0,0.10)",
                        }}
                      >
                        ✓
                      </Box>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: isSelected ? 800 : 600,
                          lineHeight: 1.4,
                          letterSpacing: "-0.01em",
                          color: isSelected ? "var(--c-primary)" : "var(--text-1)",
                          flex: 1,
                        }}
                      >
                        {t.text}
                      </Typography>
                      {t.answer_type === "yesno" && (
                        <Box
                          sx={{
                            flex: "0 0 auto",
                            px: 0.8,
                            py: 0.2,
                            borderRadius: 999,
                            background: "rgba(59,130,246,0.10)",
                            border: "1px solid rgba(59,130,246,0.20)",
                            fontSize: 10,
                            fontWeight: 800,
                            color: "#3B82F6",
                          }}
                        >
                          Y/N
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Collapse>
          ))}
        </Box>
      )}

      {/* 답변 타입 토글 */}
      {canEdit && (
        <Box id="qi-answer-type" sx={{ mb: 1.5 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", mb: 0.8 }}>
            🎯 답변 형식 선택
          </Typography>
          <Stack direction="row" spacing={1}>
            {[
              { value: "free", label: "자유 답변" },
              { value: "yesno", label: "예 · 아니오" },
            ].map((opt) => (
              <Box
                key={opt.value}
                onClick={() => setAnswerType(opt.value)}
                sx={{
                  flex: 1,
                  py: 1,
                  borderRadius: 999,
                  textAlign: "center",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 800,
                  userSelect: "none",
                  transition: "all 0.15s ease",
                  background: answerType === opt.value
                    ? "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(236,72,153,0.12))"
                    : "rgba(0,0,0,0.04)",
                  border: answerType === opt.value
                    ? "1.5px solid rgba(124,58,237,0.40)"
                    : "1.5px solid rgba(0,0,0,0.08)",
                  color: answerType === opt.value ? "var(--c-primary)" : "var(--text-2)",
                  "&:active": { transform: "scale(0.96)" },
                }}
              >
                {opt.label}
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      <TextField
        fullWidth multiline minRows={3} maxRows={8}
        placeholder="여기에 질문을 적어보세요 🤔"
        value={draft}
        onChange={(e) => { setDraft(e.target.value.slice(0, maxChar)); setSelectedTemplateId(null); }}
        disabled={!canEdit}
        inputRef={textareaRef}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "var(--radius-lg)",
            background: "rgba(255,255,255,0.55)",
            fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em",
            "& fieldset": { border: "1px solid rgba(124,58,237,0.25)" },
            "&:hover fieldset": { border: "1px solid rgba(124,58,237,0.45)" },
            "&.Mui-focused fieldset": { border: "1.5px solid rgba(124,58,237,0.7)" },
          },
        }}
      />

      <Box className="inputActions">
        <Button
          fullWidth variant="contained"
          disabled={!canEdit || pending || !draft.trim() || draft.length > maxChar}
          onClick={handleSubmit}
          sx={{
            fontWeight: 900, fontSize: 16, borderRadius: 999, py: 1.5,
            background: "linear-gradient(135deg, #7C3AED, #EC4899)",
            boxShadow: "0 4px 20px rgba(124,58,237,0.32)",
            "&:active": { transform: "scale(0.97)" },
            "&:disabled": { opacity: 0.45 },
            transition: "transform 0.12s ease",
          }}
        >
          {pending ? "저장 중..." : "제출하기 →"}
        </Button>
      </Box>
    </Paper>
  );
}
