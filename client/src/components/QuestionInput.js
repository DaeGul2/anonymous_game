// src/components/QuestionInput.js
import React, { useState } from "react";
import { Box, Button, TextField } from "@mui/material";

export default function QuestionInput({ onSubmit, disabled }) {
  const [text, setText] = useState("");

  return (
    <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
      <TextField
        fullWidth
        label="질문 입력"
        value={text}
        disabled={!!disabled}
        onChange={(e) => setText(e.target.value)}
      />
      <Button
        variant="contained"
        disabled={!!disabled}
        onClick={() => onSubmit(text)}
      >
        제출
      </Button>
    </Box>
  );
}
