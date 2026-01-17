// src/pages/GamePage.js
import React, { useEffect, useMemo } from "react";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import TimerBar from "../components/TimerBar";
import QuestionInput from "../components/QuestionInput";
import AnswerInput from "../components/AnswerInput";
import AnonymousReveal from "../components/AnonymousReveal";
import { useRoomStore } from "../state/useRoomStore";

export default function GamePage() {
  const { code } = useParams();
  const nav = useNavigate();

  const {
    initSocket,
    roomRejoin,
    roomLeave,
    state,
    game,
    guest_id,
    gameSubmitQuestion,
    gameSubmitAnswer,
    hostNextRound,
    hostEndGame,
    error,
  } = useRoomStore();

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  useEffect(() => {
    if (!code) return;
    roomRejoin({ code: code.toUpperCase() });
  }, [code, roomRejoin]);

  useEffect(() => {
    if (state?.room?.phase === "lobby") {
      nav(`/room/${state.room.code}`);
    }
  }, [state, nav]);

  const myPlayer = useMemo(() => {
    const players = state?.players || [];
    return players.find((p) => p.guest_id === guest_id) || null;
  }, [state, guest_id]);

  const isHost = state?.room?.host_player_id && myPlayer?.id === state.room.host_player_id;

  const phase = state?.room?.phase || game.phase;

  const totalSeconds = useMemo(() => {
    if (phase === "question_submit") return 120;
    if (phase === "ask") return 60;
    return 0;
  }, [phase]);

  return (
    <Container sx={{ py: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={800}>
          게임 {code ? `(${code.toUpperCase()})` : ""}
        </Typography>
        <Button color="error" variant="outlined" onClick={() => { roomLeave(); nav("/"); }}>
          나가기
        </Button>
      </Stack>

      {error && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          라운드 {state?.room?.current_round_no || game.round_no || 0} · phase: {phase || "-"}
        </Typography>

        {(phase === "question_submit" || phase === "ask") && (
          <TimerBar
            deadlineAt={state?.room?.phase_deadline_at || game.deadline_at}
            totalSeconds={totalSeconds}
          />
        )}
      </Paper>

      {phase === "question_submit" && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>질문 입력 (익명)</Typography>
          <Typography variant="body2" color="text.secondary">
            시간 내에 질문 못 쓰면 질문은 제외되지만 게임 참여는 유지.
          </Typography>

          {game.question_submitted ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" fontWeight={800}>제출 완료</Typography>
              <Typography variant="body2" color="text.secondary">
                다른 사람들 기다리는 중. 서버가 다음 단계로 넘어가면 자동 진행됨.
              </Typography>
            </Box>
          ) : (
            <QuestionInput
              disabled={false}
              onSubmit={(t) => gameSubmitQuestion(t)}
            />
          )}
        </Paper>
      )}

      {phase === "ask" && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">질문</Typography>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {game.current_question?.text || "(질문 로딩 중)"}
          </Typography>
          <AnswerInput onSubmit={(t) => gameSubmitAnswer(t)} />
        </Paper>
      )}

      {phase === "reveal" && (
        <AnonymousReveal question={game.reveal?.question} answers={game.reveal?.answers} />
      )}

      {phase === "round_end" && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={800}>라운드 종료</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            방장에게 다음 라운드/종료 선택권.
          </Typography>

          <Stack direction="row" spacing={1}>
            <Button variant="contained" disabled={!isHost} onClick={hostNextRound}>
              다음 라운드
            </Button>
            <Button variant="outlined" color="error" disabled={!isHost} onClick={hostEndGame}>
              게임 종료(로비)
            </Button>
          </Stack>

          {!isHost && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              방장만 누를 수 있음.
            </Typography>
          )}
        </Paper>
      )}
    </Container>
  );
}
