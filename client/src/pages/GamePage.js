// src/pages/GamePage.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import TimerBar from "../components/TimerBar";
import AnonymousReveal from "../components/AnonymousReveal";
import QuestionInput from "../components/QuestionInput";
import AnswerInput from "../components/AnswerInput";
import { useRoomStore } from "../state/useRoomStore";

function isExpired(deadlineIso) {
  if (!deadlineIso) return false;
  return Date.now() > new Date(deadlineIso).getTime();
}

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
    hostRevealNext,
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
  const deadlineAt = state?.room?.phase_deadline_at || game.deadline_at;

  const totalSeconds = useMemo(() => {
    if (phase === "question_submit") return 120;
    if (phase === "ask") return 60;
    return 0;
  }, [phase]);

  // ===== 마감 감지용 신호(마감 순간 1회 증가) =====
  const [deadlineExpiredSignal, setDeadlineExpiredSignal] = useState(0);
  const wasExpiredRef = useRef(false);

  useEffect(() => {
    if (!deadlineAt) {
      wasExpiredRef.current = false;
      return;
    }

    const tick = () => {
      const exp = isExpired(deadlineAt);
      if (exp && !wasExpiredRef.current) {
        wasExpiredRef.current = true;
        setDeadlineExpiredSignal((x) => x + 1);
      }
      if (!exp) wasExpiredRef.current = false;
    };

    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [deadlineAt]);

  const canEditNow = useMemo(() => {
    if (phase !== "question_submit" && phase !== "ask") return false;
    return !isExpired(deadlineAt);
  }, [phase, deadlineAt]);

  // 내 답변 상태(현재 질문 기준)
  const currentQid = game.current_question?.id || "";
  const myAnswerSubmitted = !!(currentQid && game.answer_submitted_by_qid[currentQid]);
  const myAnswerSavedText = (currentQid && game.answer_saved_text_by_qid[currentQid]) || "";

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
          <TimerBar deadlineAt={deadlineAt} totalSeconds={totalSeconds} />
        )}
      </Paper>

      {/* ===== phase 1: 질문 입력 ===== */}
      {phase === "question_submit" && (
        <>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={700}>질문 입력 (익명)</Typography>
            <Typography variant="body2" color="text.secondary">
              마감 전까지는 수정 가능. 저장 버튼 누른 것만 서버에 반영됨.
            </Typography>
          </Paper>

          <QuestionInput
            canEdit={canEditNow}
            savedText={game.question_saved_text}
            submitted={game.question_submitted}
            onSave={(t) => gameSubmitQuestion(t)}
            deadlineExpiredSignal={deadlineExpiredSignal}
          />
        </>
      )}

      {/* ===== ask: 답변 ===== */}
      {phase === "ask" && (
        <>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">질문</Typography>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {game.current_question?.text || "(질문 로딩 중)"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              마감 전까지 수정 가능. 수정 중 마감되면 마지막 저장본이 사용됨.
            </Typography>
          </Paper>

          <AnswerInput
            canEdit={canEditNow}
            savedText={myAnswerSavedText}
            submitted={myAnswerSubmitted}
            onSave={(t) => gameSubmitAnswer(t)}
            deadlineExpiredSignal={deadlineExpiredSignal}
          />
        </>
      )}

      {/* ===== reveal ===== */}
      {phase === "reveal" && (
        <>
          <AnonymousReveal question={game.reveal?.question} answers={game.reveal?.answers} />
          <Paper sx={{ p: 2, mt: 2 }}>
            {isHost ? (
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={hostRevealNext}>
                  {game.reveal?.is_last ? "라운드 종료" : "다음 질문"}
                </Button>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                방장이 다음 진행을 누를 때까지 대기.
              </Typography>
            )}
          </Paper>
        </>
      )}

      {/* ===== round_end ===== */}
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
