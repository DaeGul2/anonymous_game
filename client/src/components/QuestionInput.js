// src/components/QuestionInput.js
import React, { useEffect, useState } from "react";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";

export default function QuestionInput({
  canEdit,
  savedText,
  submitted,
  onSave,
  deadlineExpiredSignal, // number 증가하면 "마감됐다"로 간주해서 편집 취소
}) {
  const [editing, setEditing] = useState(!submitted);
  const [draft, setDraft] = useState(savedText || "");

  // savedText 바뀌면 draft도 따라감(단, 편집 중이면 유지)
  useEffect(() => {
    if (!editing) setDraft(savedText || "");
  }, [savedText, editing]);

  // 마감되면 편집 취소 + draft 원복
  useEffect(() => {
    if (!canEdit && editing) {
      setEditing(false);
      setDraft(savedText || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlineExpiredSignal]);

  const statusText = submitted ? "저장됨" : "미제출";
  const statusColor = submitted ? "success.main" : "text.secondary";

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1" fontWeight={800}>
          내 질문
        </Typography>
        <Typography variant="body2" sx={{ color: statusColor }}>
          {statusText}
        </Typography>
      </Stack>

      {!editing ? (
        <>
          <Box sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
            <Typography variant="body1">{savedText || "(아직 없음)"}</Typography>
          </Box>

          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
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
            label="질문 수정"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!canEdit}
            sx={{ mt: 2 }}
          />

          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              disabled={!canEdit}
              onClick={() => onSave(draft)}
            >
              저장
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
