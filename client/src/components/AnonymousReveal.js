// src/components/AnonymousReveal.js
import React from "react";
import { Box, Paper, Typography, List, ListItem, ListItemText } from "@mui/material";

export default function AnonymousReveal({ question, answers }) {
  return (
    <Box sx={{ mt: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">질문</Typography>
        <Typography variant="h6" sx={{ mb: 2 }}>{question?.text || "-"}</Typography>

        <Typography variant="subtitle2" color="text.secondary">익명 답변</Typography>
        <List dense>
          {(answers || []).map((a, idx) => (
            <ListItem key={idx}>
              <ListItemText primary={a || "(빈 답변)"} />
            </ListItem>
          ))}
          {(answers || []).length === 0 && (
            <ListItem><ListItemText primary="답변 없음." /></ListItem>
          )}
        </List>
      </Paper>
    </Box>
  );
}
