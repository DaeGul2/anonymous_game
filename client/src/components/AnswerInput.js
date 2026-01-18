// src/components/AnswerInput.js
import React, { useEffect, useState } from "react";
import { Box, Button, Chip, Paper, Stack, TextField, Typography } from "@mui/material";

export default function AnswerInput({
  canEdit,
  savedText,
  submitted,
  onSave,
  deadlineExpiredSignal,
}) {
  const [editing, setEditing] = useState(!submitted);
  const [draft, setDraft] = useState(savedText || "");

  useEffect(() => {
    if (!editing) setDraft(savedText || "");
  }, [savedText, editing]);

  useEffect(() => {
    if (!canEdit && editing) {
      setEditing(false);
      setDraft(savedText || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlineExpiredSignal]);

  const statusText = submitted ? "저장됨" : "미제출";

  return (
    <Paper className="glassCard section" sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography fontWeight={950} sx={{ letterSpacing: "-0.02em" }}>
          내 답변
        </Typography>
        <Chip size="small" label={statusText} sx={{ fontWeight: 900, borderRadius: 999, opacity: 0.9 }} />
      </Stack>

      {!editing ? (
        <>
          <Box
            sx={{
              mt: 1.25,
              p: 1.4,
              borderRadius: 4,
              background:
                "linear-gradient(135deg, rgba(236,72,153,0.16), rgba(139,92,246,0.16))",
              border: "1px solid rgba(255,255,255,0.65)",
              whiteSpace: "pre-wrap",
            }}
          >
            <Typography fontWeight={800}>{savedText || "(아직 없음)"}</Typography>
          </Box>

          <Box className="inputActions">
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                className="tap"
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
              <Typography className="subtle" sx={{ fontSize: 12, mt: 1 }}>
                마감. 이제 수정 못 함.
              </Typography>
            )}
          </Box>
        </>
      ) : (
        <>
          <TextField
            fullWidth
            label="답변"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!canEdit}
            multiline
            minRows={4}
            maxRows={10}
            sx={{ mt: 1.5 }}
          />

          <Box className="inputActions">
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                className="tap grow"
                disabled={!canEdit}
                onClick={() => onSave(draft)}
              >
                저장
              </Button>
              <Button
                variant="outlined"
                className="tap"
                onClick={() => {
                  setEditing(false);
                  setDraft(savedText || "");
                }}
              >
                취소
              </Button>
            </Stack>

            {!canEdit && (
              <Typography className="subtle" sx={{ fontSize: 12, mt: 1 }}>
                마감돼서 저장 불가. 기존 저장본이 사용됨.
              </Typography>
            )}
          </Box>
        </>
      )}
    </Paper>
  );
}
