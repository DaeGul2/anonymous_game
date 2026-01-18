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

/** ===== localStorage helpers ===== */
function lsGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
function lsDel(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

function keyQuestion({ code, roundNo }) {
  return `ag:${code}:r${roundNo}:question`;
}
function keyAnswer({ code, roundNo, qid, guestId }) {
  return `ag:${code}:r${roundNo}:q${qid}:a:${guestId}`;
}

function phaseLabel(p) {
  if (p === "question_submit") return "질문 작성";
  if (p === "ask") return "답변 작성";
  if (p === "reveal") return "공개";
  if (p === "round_end") return "라운드 종료";
  if (p === "lobby") return "로비";
  return p || "-";
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

  const roundNo = state?.room?.current_round_no || game.round_no || 0;

  /** ====== 질문/답변 local persistence ====== */

  // 질문: 서버 저장본이 있으면 그걸 사용, 없으면 로컬 저장본 표시
  const qKey = useMemo(
    () => keyQuestion({ code: code?.toUpperCase(), roundNo }),
    [code, roundNo]
  );
  const qLocal = useMemo(() => lsGet(qKey), [qKey]);

  const questionSavedTextDisplay = useMemo(() => {
    const serverText = game.question_saved_text || "";
    if (serverText.trim()) return serverText;
    return (qLocal?.text || "").trim();
  }, [game.question_saved_text, qLocal]);

  const questionSubmittedDisplay = useMemo(() => {
    if (game.question_submitted) return true;
    return !!(qLocal?.text && String(qLocal.text).trim());
  }, [game.question_submitted, qLocal]);

  // 서버 제출이 확인되면 해당 로컬 백업 삭제(중복/혼동 방지)
  useEffect(() => {
    if (game.question_submitted && qLocal?.text) {
      lsDel(qKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.question_submitted]);

  // 답변: 현재 질문(qid) 기준으로 로컬 저장/복원
  const currentQid = game.current_question?.id || "";
  const aKey = useMemo(
    () =>
      currentQid
        ? keyAnswer({
            code: code?.toUpperCase(),
            roundNo,
            qid: currentQid,
            guestId: guest_id,
          })
        : "",
    [code, roundNo, currentQid, guest_id]
  );
  const aLocal = useMemo(() => (aKey ? lsGet(aKey) : null), [aKey]);

  const myAnswerSubmitted = !!(
    currentQid && game.answer_submitted_by_qid[currentQid]
  );
  const myAnswerSavedText =
    (currentQid && game.answer_saved_text_by_qid[currentQid]) || "";

  const answerSavedTextDisplay = useMemo(() => {
    if (String(myAnswerSavedText || "").trim()) return myAnswerSavedText;
    return (aLocal?.text || "").trim();
  }, [myAnswerSavedText, aLocal]);

  const answerSubmittedDisplay = useMemo(() => {
    if (myAnswerSubmitted) return true;
    return !!(aLocal?.text && String(aLocal.text).trim());
  }, [myAnswerSubmitted, aLocal]);

  // 서버 제출 확인되면 로컬 백업 삭제
  useEffect(() => {
    if (myAnswerSubmitted && aKey) lsDel(aKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myAnswerSubmitted, aKey]);

  // 저장 버튼 누를 때: 서버 전송 + 로컬에도 백업 저장
  const handleSaveQuestion = (text) => {
    if (!code) return;
    lsSet(qKey, { text: String(text ?? ""), ts: Date.now() });
    gameSubmitQuestion(text);
  };

  const handleSaveAnswer = (text) => {
    if (!code || !currentQid) return;
    lsSet(aKey, { text: String(text ?? ""), ts: Date.now() });
    gameSubmitAnswer(text);
  };

  return (
    <Box className="appShell">
      {/* Header */}
      <Box className="pageHeader">
        <Box style={{ minWidth: 0 }}>
          <Typography className="pageTitle">
            게임 진행{" "}
            <Typography component="span" className="subtle" sx={{ fontSize: 14 }}>
              {code ? `(${code.toUpperCase()})` : ""}
            </Typography>
          </Typography>
          <Typography className="subtle" sx={{ mt: 0.25 }}>
            라운드 {roundNo} · 진행 단계: {phaseLabel(phase)}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            size="small"
            label={isHost ? "방장" : "참여자"}
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
            label={`라운드 ${roundNo}`}
            sx={{ fontWeight: 900, borderRadius: 999 }}
          />
          <Chip
            size="small"
            label={phaseLabel(phase)}
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
              질문 작성
            </Typography>
            <Typography className="subtle" sx={{ fontSize: 12, mt: 0.5 }}>
              저장 시 임시 저장되며, 새로고침 후에도 이어서 작성할 수 있습니다.
            </Typography>
          </Paper>

          <QuestionInput
            canEdit={canEditNow}
            savedText={questionSavedTextDisplay}
            submitted={questionSubmittedDisplay}
            onSave={handleSaveQuestion}
            deadlineExpiredSignal={deadlineExpiredSignal}
          />
        </>
      )}

      {/* ===== ask: 답변 ===== */}
      {phase === "ask" && (
        <>
          <Paper className="glassCard section" sx={{ p: 2 }}>
            <Typography className="subtle" sx={{ fontSize: 12 }}>
              현재 질문
            </Typography>

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
                {game.current_question?.text || "질문을 불러오는 중입니다."}
              </Typography>
            </Box>

            <Typography className="subtle" sx={{ fontSize: 12, mt: 1 }}>
              저장 시 임시 저장되며, 새로고침 후에도 이어서 작성할 수 있습니다.
            </Typography>
          </Paper>

          <AnswerInput
            canEdit={canEditNow}
            savedText={answerSavedTextDisplay}
            submitted={answerSubmittedDisplay}
            onSave={handleSaveAnswer}
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
                진행을 기다리는 중입니다.
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
            다음 라운드를 시작하거나 게임을 종료할 수 있습니다.
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
              게임 종료
            </Button>
          </Stack>

          {!isHost && (
            <Typography className="subtle" sx={{ fontSize: 12, mt: 1 }}>
              방장만 진행할 수 있습니다.
            </Typography>
          )}
        </Paper>
      )}

      {!phase && (
        <Paper className="glassCard section" sx={{ p: 2 }}>
          <Typography className="subtle">
            진행 상태를 불러오지 못했습니다.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
