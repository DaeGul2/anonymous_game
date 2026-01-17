// src/components/AnswerInput.js
import React, { useState } from "react";
import { Box, Button, TextField } from "@mui/material";

export default function AnswerInput({ onSubmit }) {
  const [text, setText] = useState("");

  return (
    <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
      <TextField
        fullWidth
        label="답변 입력"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button variant="contained" onClick={() => onSubmit(text)}>
        제출
      </Button>
    </Box>
  );
}
