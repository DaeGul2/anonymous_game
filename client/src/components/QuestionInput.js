// src/components/QuestionInput.js
import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { QUESTION_TEMPLATES } from "../constants/questionTemplates";

export default function QuestionInput({ canEdit, savedText, submitted, onSave, deadlineExpiredSignal }) {
  const [draft, setDraft] = useState(savedText || "");
  const [answerType, setAnswerType] = useState("free");
  const [editing, setEditing] = useState(!submitted);
  const [pending, setPending] = useState(false);
  const timerRef = useRef(null);
  const textareaRef = useRef(null);

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
    onSave(draft.trim(), answerType);
    timerRef.current = setTimeout(() => setPending(false), 800);
  };

  const maxChar = 300;

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
            onClick={() => { setEditing(true); setDraft(savedText || draft); }}
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

      {/* 템플릿 칩 */}
      {canEdit && (
        <Box sx={{ mb: 1.5 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", mb: 0.8 }}>
            💡 템플릿으로 시작하기
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 0.8,
              overflowX: "auto",
              pb: 0.5,
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
          >
            {QUESTION_TEMPLATES.map((t, i) => (
              <Box
                key={i}
                onClick={() => {
                  setDraft(t);
                  setTimeout(() => textareaRef.current?.focus(), 50);
                }}
                sx={{
                  flex: "0 0 auto",
                  px: 1.4,
                  py: 0.7,
                  borderRadius: 999,
                  background: "rgba(124,58,237,0.07)",
                  border: "1px solid rgba(124,58,237,0.18)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  color: "var(--c-primary)",
                  userSelect: "none",
                  transition: "all 0.15s ease",
                  "&:active": {
                    background: "rgba(124,58,237,0.18)",
                    transform: "scale(0.95)",
                  },
                }}
              >
                {t}
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* 답변 타입 토글 */}
      {canEdit && (
        <Box sx={{ mb: 1.5 }}>
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
        onChange={(e) => setDraft(e.target.value.slice(0, maxChar))}
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
