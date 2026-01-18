// src/components/AnswerInput.js
import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";

function nowLabel() {
  try {
    return new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function AnswerInput({
  canEdit,
  savedText,
  submitted,
  onSave,
  deadlineExpiredSignal,
}) {
  const [editing, setEditing] = useState(!submitted);
  const [draft, setDraft] = useState(savedText || "");

  const [saving, setSaving] = useState(false);
  const [flashSaved, setFlashSaved] = useState(false);
  const [lastSavedLabel, setLastSavedLabel] = useState("");
  const flashTimerRef = useRef(null);
  const savingTimerRef = useRef(null);

  const triggerSavedFeedback = () => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlashSaved(true);
    setLastSavedLabel(nowLabel());
    flashTimerRef.current = setTimeout(() => setFlashSaved(false), 1400);
  };

  useEffect(() => {
    if (!editing) setDraft(savedText || "");
  }, [savedText, editing]);

  useEffect(() => {
    if (submitted || (savedText ?? "") !== "") {
      triggerSavedFeedback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, savedText]);

  useEffect(() => {
    if (!canEdit && editing) {
      setEditing(false);
      setDraft(savedText || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlineExpiredSignal]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
    };
  }, []);

  const statusText = saving
    ? "저장 중..."
    : flashSaved
    ? "저장 완료 ✅"
    : submitted
    ? "저장됨"
    : "미제출";

  const statusColor = saving
    ? "primary.main"
    : flashSaved || submitted
    ? "success.main"
    : "text.secondary";

  const handleSave = () => {
    if (!canEdit || saving) return;

    setSaving(true);
    try {
      onSave(draft);
    } finally {
      triggerSavedFeedback();
      if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
      savingTimerRef.current = setTimeout(() => setSaving(false), 280);
    }
  };

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1" fontWeight={800}>
          내 답변
        </Typography>
        <Typography variant="body2" sx={{ color: statusColor, fontWeight: 800 }}>
          {statusText}
        </Typography>
      </Stack>

      {!editing ? (
        <>
          <Box sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
            <Typography variant="body1">{savedText || "(아직 없음)"}</Typography>
          </Box>

          <Stack direction="row" spacing={1} sx={{ mt: 2 }} alignItems="center">
            <Button
              variant="outlined"
              disabled={!canEdit}
              onClick={() => {
                setDraft(savedText || "");
                setEditing(true);
              }}
            >
              수정
            </Button>

            {(submitted || lastSavedLabel) && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                {lastSavedLabel ? `마지막 저장 ${lastSavedLabel}` : "저장됨"}
              </Typography>
            )}
          </Stack>

          {!canEdit && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              마감. 이제 수정 못 함.
            </Typography>
          )}
        </>
      ) : (
        <>
          <TextField
            fullWidth
            label="답변 수정"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!canEdit}
            sx={{ mt: 2 }}
            multiline
            minRows={3}
            maxRows={10}
          />

          <Stack direction="row" spacing={1} sx={{ mt: 2 }} alignItems="center">
            <Button
              variant="contained"
              disabled={!canEdit || saving}
              onClick={handleSave}
            >
              {saving ? "저장 중..." : "저장"}
            </Button>

            <Button
              variant="outlined"
              onClick={() => {
                setEditing(false);
                setDraft(savedText || "");
              }}
            >
              취소
            </Button>

            {(submitted || lastSavedLabel) && (
              <Typography variant="caption" sx={{ color: statusColor, fontWeight: 800 }}>
                {lastSavedLabel ? `마지막 저장 ${lastSavedLabel}` : statusText}
              </Typography>
            )}
          </Stack>

          {!canEdit && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              마감돼서 저장 불가. 기존 저장본이 사용됨.
            </Typography>
          )}
        </>
      )}
    </Paper>
  );
}
