// src/pages/GamePage.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
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

  const isHost =
    state?.room?.host_player_id && myPlayer?.id === state.room.host_player_id;

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
  const myAnswerSubmitted = !!(
    currentQid && game.answer_submitted_by_qid[currentQid]
  );
  const myAnswerSavedText =
    (currentQid && game.answer_saved_text_by_qid[currentQid]) || "";

  const roundNo = state?.room?.current_round_no || game.round_no || 0;

  return (
    <Box className="appShell">
      {/* Header */}
      <Box className="pageHeader">
        <Box style={{ minWidth: 0 }}>
          <Typography className="pageTitle">
            게임{" "}
            <Typography component="span" className="subtle" sx={{ fontSize: 14 }}>
              {code ? `(${code.toUpperCase()})` : ""}
            </Typography>
          </Typography>
          <Typography className="subtle" sx={{ mt: 0.25 }}>
            라운드 {roundNo} · phase: {phase || "-"}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            size="small"
            label={isHost ? "HOST" : "GUEST"}
            sx={{ fontWeight: 900, borderRadius: 999, opacity: 0.9 }}
          />
          <IconButton
            onClick={() => {
              roomLeave();
              nav("/");
            }}
            className="tap"
            sx={{
              border: "1px solid rgba(255,255,255,0.65)",
              background: "rgba(255,255,255,0.45)",
              backdropFilter: "blur(12px)",
            }}
          >
            ✕
          </IconButton>
        </Stack>
      </Box>

      {error && (
        <Paper className="glassCard section" sx={{ p: 2 }}>
          <Typography color="error" fontWeight={900}>
            {error}
          </Typography>
        </Paper>
      )}

      {/* Top status card */}
      <Paper className="glassCard section" sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip
            size="small"
            label={`Round ${roundNo}`}
            sx={{ fontWeight: 900, borderRadius: 999 }}
          />
          <Chip
            size="small"
            label={phase || "UNKNOWN"}
            sx={{ fontWeight: 900, borderRadius: 999, opacity: 0.9 }}
          />
          {state?.players?.length != null && state?.room?.max_players != null && (
            <Chip
              size="small"
              label={`${state.players.length}/${state.room.max_players}`}
              sx={{ fontWeight: 900, borderRadius: 999, opacity: 0.85 }}
            />
          )}
        </Stack>

        {(phase === "question_submit" || phase === "ask") && (
          <TimerBar deadlineAt={deadlineAt} totalSeconds={totalSeconds} />
        )}
      </Paper>

      {/* ===== phase 1: 질문 입력 ===== */}
      {phase === "question_submit" && (
        <>
          <Paper className="glassCard section" sx={{ p: 2 }}>
            <Typography fontWeight={950} sx={{ letterSpacing: "-0.02em" }}>
              질문 입력 (익명)
            </Typography>
            <Typography className="subtle" sx={{ fontSize: 12, mt: 0.5 }}>
              마감 전까지 수정 가능. 저장 버튼 누른 것만 서버에 반영됨.
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
          <Paper className="glassCard section" sx={{ p: 2 }}>
            <Typography className="subtle" sx={{ fontSize: 12 }}>
              익명 질문
            </Typography>

            {/* Question bubble */}
            <Box
              sx={{
                mt: 1,
                p: 1.4,
                borderRadius: 4,
                background:
                  "linear-gradient(135deg, rgba(236,72,153,0.20), rgba(139,92,246,0.20))",
                border: "1px solid rgba(255,255,255,0.65)",
              }}
            >
              <Typography fontWeight={950} sx={{ letterSpacing: "-0.02em" }}>
                {game.current_question?.text || "(질문 로딩 중)"}
              </Typography>
            </Box>

            <Typography className="subtle" sx={{ fontSize: 12, mt: 1 }}>
              마감 전까지 수정 가능. 마감되면 마지막 저장본이 사용됨.
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
          <AnonymousReveal
            question={game.reveal?.question}
            answers={game.reveal?.answers}
          />

          <Paper className="glassCard section" sx={{ p: 2 }}>
            {isHost ? (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  className="tap grow"
                  onClick={hostRevealNext}
                >
                  {game.reveal?.is_last ? "라운드 종료" : "다음 질문"}
                </Button>
              </Stack>
            ) : (
              <Typography className="subtle" sx={{ fontSize: 12 }}>
                방장이 다음 진행을 누를 때까지 대기.
              </Typography>
            )}
          </Paper>
        </>
      )}

      {/* ===== round_end ===== */}
      {phase === "round_end" && (
        <Paper className="glassCard section" sx={{ p: 2 }}>
          <Typography fontWeight={950} sx={{ letterSpacing: "-0.02em" }}>
            라운드 종료
          </Typography>
          <Typography className="subtle" sx={{ fontSize: 12, mt: 0.5, mb: 1.5 }}>
            방장에게 다음 라운드/종료 선택권.
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="contained"
              className="tap grow"
              disabled={!isHost}
              onClick={hostNextRound}
            >
              다음 라운드
            </Button>
            <Button
              variant="outlined"
              color="error"
              className="tap grow"
              disabled={!isHost}
              onClick={hostEndGame}
            >
              게임 종료(로비)
            </Button>
          </Stack>

          {!isHost && (
            <Typography className="subtle" sx={{ fontSize: 12, mt: 1 }}>
              방장만 누를 수 있음.
            </Typography>
          )}
        </Paper>
      )}

      {/* fallback */}
      {!phase && (
        <Paper className="glassCard section" sx={{ p: 2 }}>
          <Typography className="subtle">phase 없음. 서버가 뭔가 삐끗함.</Typography>
        </Paper>
      )}
    </Box>
  );
}
