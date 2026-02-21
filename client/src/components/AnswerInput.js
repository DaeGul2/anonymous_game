// src/components/AnswerInput.js
import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";

export default function AnswerInput({ canEdit, savedText, submitted, onSave, deadlineExpiredSignal }) {
  const [draft, setDraft] = useState(savedText || "");
  const [editing, setEditing] = useState(!submitted);
  const [pending, setPending] = useState(false);
  const timerRef = useRef(null);

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
    onSave(draft.trim());
    timerRef.current = setTimeout(() => setPending(false), 800);
  };

  const maxChar = 500;

  if (!editing && (submitted || savedText)) {
    return (
      <Paper
        className="glassCard section"
        sx={{
          p: 2.4,
          background: "linear-gradient(135deg, rgba(59,130,246,0.16), rgba(139,92,246,0.08)) !important",
          border: "1px solid rgba(59,130,246,0.28) !important",
          animation: "popIn 0.5s var(--spring) both",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box
            sx={{
              width: 38, height: 38, borderRadius: "50%",
              background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flex: "0 0 auto",
              boxShadow: "0 4px 14px rgba(59,130,246,0.32)",
              animation: "checkPop 0.6s var(--spring) both 0.1s",
              opacity: 0, fontSize: 20, color: "#fff", fontWeight: 900,
            }}
          >
            ✓
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#2563EB", mb: 0.4 }}>
              답변 제출 완료!
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
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 15, letterSpacing: "-0.02em" }}>
          💬 내 답변 작성
        </Typography>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: draft.length > maxChar ? "var(--c-red)" : "var(--text-3)" }}>
          {draft.length}/{maxChar}
        </Typography>
      </Stack>

      <TextField
        fullWidth multiline minRows={3} maxRows={8}
        placeholder="솔직하게 써봐요... 어차피 익명이에요 😈"
        value={draft}
        onChange={(e) => setDraft(e.target.value.slice(0, maxChar))}
        disabled={!canEdit}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "var(--radius-lg)",
            background: "rgba(255,255,255,0.55)",
            fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em",
            "& fieldset": { border: "1px solid rgba(59,130,246,0.25)" },
            "&:hover fieldset": { border: "1px solid rgba(59,130,246,0.45)" },
            "&.Mui-focused fieldset": { border: "1.5px solid rgba(59,130,246,0.7)" },
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
            background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
            boxShadow: "0 4px 20px rgba(59,130,246,0.32)",
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
