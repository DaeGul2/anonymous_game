// src/pages/GamePage.js
import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Paper, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import TimerBar from "../components/TimerBar";
import AnonymousReveal from "../components/AnonymousReveal";
import QuestionInput from "../components/QuestionInput";
import AnswerInput from "../components/AnswerInput";
import ShareButton from "../components/ShareButton";
import ReactionFAB from "../components/ReactionFAB";
import ChatFAB from "../components/ChatFAB";
import ChatWindow from "../components/ChatWindow";
import html2canvas from "html2canvas";
import AdBanner from "../components/AdBanner";
import { useRoomStore } from "../state/useRoomStore";

const SERVER = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

function isExpired(deadlineIso) {
  if (!deadlineIso) return false;
  return Date.now() > new Date(deadlineIso).getTime();
}

function msLeft(deadlineIso) {
  if (!deadlineIso) return Infinity;
  return Math.max(0, new Date(deadlineIso).getTime() - Date.now());
}

function lsGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function lsDel(key) {
  try { localStorage.removeItem(key); } catch {}
}

function keyQuestion({ code, roundNo }) {
  return `ag:${code}:r${roundNo}:question`;
}
function keyAnswer({ code, roundNo, qid, userId }) {
  const h = btoa(String(userId)).slice(0, 8);
  return `ag:${code}:r${roundNo}:q${qid}:a:${h}`;
}

const ROUND_END_TIMEOUT_SECONDS = 180;
const REVEAL_CARD_SECONDS = 30;

function phaseLabel(p) {
  if (p === "question_submit") return "질문 작성";
  if (p === "ask")             return "답변 작성";
  if (p === "reveal")          return "공개 중";
  if (p === "round_end")       return "라운드 종료";
  if (p === "lobby")           return "로비";
  return p || "-";
}

function phaseEmoji(p) {
  if (p === "question_submit") return "✏️";
  if (p === "ask")             return "💬";
  if (p === "reveal")          return "🎭";
  if (p === "round_end")       return "🎉";
  return "🎮";
}

/** ===== 극적인 카운트다운 오버레이 ===== */
function StageOverlay({ open, titleTop, count, bottomText, announceText }) {
  if (!open) return null;

  const isAnnounce = count == null;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 2200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
        background:
          "radial-gradient(ellipse 160% 100% at 50% 70%, rgba(76,0,153,0.72), rgba(0,0,0,0.94))",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        animation: "fadeIn 0.25s ease both",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 360,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
        }}
      >
        {/* 타이틀 배지 */}
        <Box
          sx={{
            px: 3,
            py: 0.9,
            borderRadius: 999,
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.20)",
            backdropFilter: "blur(12px)",
            animation: "slideUp 0.4s var(--spring) both",
          }}
        >
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: 14,
              color: "rgba(255,255,255,0.90)",
              letterSpacing: "-0.01em",
            }}
          >
            {titleTop}
          </Typography>
        </Box>

        {/* 카운트 또는 공개 텍스트 */}
        {isAnnounce ? (
          <Box sx={{ animation: "popIn 0.55s var(--spring) both" }}>
            <Typography
              sx={{
                fontWeight: 950,
                fontSize: { xs: 38, sm: 46 },
                letterSpacing: "-0.04em",
                lineHeight: 1.15,
                background: "linear-gradient(135deg, #F9A8D4 0%, #C4B5FD 50%, #93C5FD 100%)",
                backgroundSize: "200% 200%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 28px rgba(196,181,253,0.65))",
                animation: "bgShift 3s ease infinite",
              }}
            >
              {announceText}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 240,
              height: 200,
            }}
          >
            {/* 글로우 링 */}
            <Box
              sx={{
                position: "absolute",
                width: 220,
                height: 220,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(167,139,250,0.30) 0%, transparent 68%)",
                animation: "glowPulse 1.1s ease-in-out infinite",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                width: 140,
                height: 140,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(244,114,182,0.22) 0%, transparent 65%)",
                animation: "glowPulse 1.1s ease-in-out infinite 0.55s",
              }}
            />
            {/* 숫자 */}
            <Typography
              key={count}
              sx={{
                fontWeight: 1000,
                fontSize: { xs: 136, sm: 160 },
                letterSpacing: "-0.08em",
                lineHeight: 1,
                background:
                  "linear-gradient(180deg, #fff 0%, #C4B5FD 35%, #F472B6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "numberPop 0.95s ease both",
                filter: "drop-shadow(0 0 48px rgba(196,181,253,0.75))",
              }}
            >
              {count}
            </Typography>
          </Box>
        )}

        {!isAnnounce && (
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: 16,
              color: "rgba(255,255,255,0.52)",
              letterSpacing: "0.01em",
              animation: "fadeIn 0.5s ease 0.3s both",
            }}
          >
            {bottomText}
          </Typography>
        )}

        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            color: "rgba(255,255,255,0.22)",
            letterSpacing: "0.01em",
          }}
        >
          집중 안 하면 인생도 똑같이 흘러갑니다
        </Typography>
      </Box>
    </Box>
  );
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
    user,
    gameSubmitQuestion,
    gameSubmitAnswer,
    gameEditQuestion,
    gameEditAnswer,
    gameHeartQuestion,
    hostNextRound,
    hostEndGame,
    gameRevealCard,
    gameRevealAllCards,
    chatStart,
    error,
    roomDestroyed,
    clearRoomDestroyed,
  } = useRoomStore();

  const [loadFailed, setLoadFailed] = useState(false);
  const [templates, setTemplates] = useState([]);

  useEffect(() => { initSocket(); }, [initSocket]);

  // 템플릿 목록 로드 (1회)
  useEffect(() => {
    fetch(`${SERVER}/api/templates`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setTemplates(d.templates || []); })
      .catch(() => {});
  }, []);

  // 방 폭파 시 alert + 홈으로 이동
  useEffect(() => {
    if (roomDestroyed) {
      alert("방이 폭파되었습니다.\n장시간 활동이 없어 방이 자동으로 종료되었어요.");
      clearRoomDestroyed();
      nav("/", { replace: true });
    }
  }, [roomDestroyed, clearRoomDestroyed, nav]);

  useEffect(() => {
    if (!code) return;
    roomRejoin({ code: code.toUpperCase() });
  }, [code, roomRejoin]);

  useEffect(() => {
    if (state?.room?.phase === "lobby") nav(`/room/${state.room.code}`);
  }, [state, nav]);

  // 5초 후에도 state가 없으면 접속 실패로 판단
  useEffect(() => {
    if (state) { setLoadFailed(false); return; }
    const t = setTimeout(() => setLoadFailed(true), 5000);
    return () => clearTimeout(t);
  }, [state]);

  const myPlayer = useMemo(() => {
    const players = state?.players || [];
    return players.find((p) => p.user_id === user?.id) || null;
  }, [state, user]);

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
  const [timeLeftMs, setTimeLeftMs] = useState(Infinity);
  const wasExpiredRef = useRef(false);
  const [hostChangedNotice, setHostChangedNotice] = useState(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const revealRef = useRef(null);

  const handleSaveImage = async () => {
    if (!revealRef.current) return;
    try {
      const canvas = await html2canvas(revealRef.current, {
        backgroundColor: "#F8F7FF",
        scale: 2,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL("image/png");

      if (navigator.share && navigator.canShare) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "anonymous-game.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file] });
          return;
        }
      }

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `익명게임_${Date.now()}.png`;
      a.click();
    } catch (e) {
      console.error("Screenshot save failed:", e);
    }
  };

  useEffect(() => {
    if (!deadlineAt) {
      wasExpiredRef.current = false;
      setTimeLeftMs(Infinity);
      return;
    }
    const tick = () => {
      const exp = isExpired(deadlineAt);
      setTimeLeftMs(msLeft(deadlineAt));
      if (exp && !wasExpiredRef.current) {
        wasExpiredRef.current = true;
        setDeadlineExpiredSignal((x) => x + 1);
      }
      if (!exp) wasExpiredRef.current = false;
    };
    tick();
    const id = setInterval(tick, 300);
    return () => clearInterval(id);
  }, [deadlineAt]);

  const isUrgent = timeLeftMs > 0 && timeLeftMs <= 15_000 &&
    (phase === "question_submit" || phase === "ask");

  const canEditNow = useMemo(() => {
    if (phase !== "question_submit" && phase !== "ask") return false;
    return !isExpired(deadlineAt);
  }, [phase, deadlineAt]);

  const roundNo = state?.room?.current_round_no || game.round_no || 0;

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

  useEffect(() => {
    if (game.question_submitted && qLocal?.text) lsDel(qKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.question_submitted]);

  // ← currentQid는 aKey useMemo보다 먼저 선언해야 함
  const currentQid = game.current_question?.id || "";

  const aKey = useMemo(
    () =>
      currentQid
        ? keyAnswer({ code: code?.toUpperCase(), roundNo, qid: currentQid, userId: user?.id })
        : "",
    [code, roundNo, currentQid, user?.id]
  );
  const aLocal = useMemo(() => (aKey ? lsGet(aKey) : null), [aKey]);

  const myAnswerSubmitted = !!(currentQid && game.answer_submitted_by_qid[currentQid]);
  const myAnswerSavedText = (currentQid && game.answer_saved_text_by_qid[currentQid]) || "";

  const answerSavedTextDisplay = useMemo(() => {
    if (String(myAnswerSavedText || "").trim()) return myAnswerSavedText;
    return (aLocal?.text || "").trim();
  }, [myAnswerSavedText, aLocal]);

  const answerSubmittedDisplay = useMemo(() => {
    if (myAnswerSubmitted) return true;
    return !!(aLocal?.text && String(aLocal.text).trim());
  }, [myAnswerSubmitted, aLocal]);

  useEffect(() => {
    if (myAnswerSubmitted && aKey) lsDel(aKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myAnswerSubmitted, aKey]);

  // 방장 변경 알림 (5초 후 자동 숨김)
  useEffect(() => {
    if (!game.hostChanged?.at) return;
    if (Date.now() - game.hostChanged.at > 5000) return;
    setHostChangedNotice(game.hostChanged);
    const t = setTimeout(() => setHostChangedNotice(null), 5000);
    return () => clearTimeout(t);
  }, [game.hostChanged?.at]);

  const handleSaveQuestion = (text, answer_type, template_id) => {
    if (!code) return;
    lsSet(qKey, { text: String(text ?? ""), ts: Date.now() });
    gameSubmitQuestion(text, answer_type, template_id);
  };

  const handleSaveAnswer = (text) => {
    if (!code || !currentQid) return;
    lsSet(aKey, { text: String(text ?? ""), ts: Date.now() });
    gameSubmitAnswer(text);
  };

  /** ===== overlay control ===== */
  const timeoutsRef = useRef([]);
  // 마운트 시점의 qid로 초기화 → 재접속/새로고침 시 이미 진행 중인 단계의 오버레이를 스킵
  const lastSeenAskQidRef = useRef(
    phase === "ask" ? (game.current_question?.id || "") : ""
  );
  const lastSeenRevealQidRef = useRef(
    phase === "reveal" ? (game.reveal?.question?.id || "") : ""
  );

  const [overlay, setOverlay] = useState({
    open: false, titleTop: "", bottomText: "", count: null, announceText: "",
  });

  const clearAllTimers = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  };

  const runOverlaySequence = ({ titleTop, announceText }) => {
    clearAllTimers();
    setOverlay({ open: true, titleTop, bottomText: "초 후 공개!", count: 3, announceText });
    const t1 = setTimeout(() => setOverlay((o) => ({ ...o, count: 2 })), 1000);
    const t2 = setTimeout(() => setOverlay((o) => ({ ...o, count: 1 })), 2000);
    const t3 = setTimeout(() => setOverlay((o) => ({ ...o, count: null })), 3000);
    const t4 = setTimeout(() => setOverlay((o) => ({ ...o, open: false })), 3900);
    timeoutsRef.current = [t1, t2, t3, t4];
  };

  // ask 진입: 질문 공개 오버레이 (마운트 시 이미 이 qid를 보고 있었으면 스킵)
  useEffect(() => {
    const qid = game.current_question?.id || "";
    if (phase !== "ask" || !qid) return;
    if (lastSeenAskQidRef.current === qid) return;
    lastSeenAskQidRef.current = qid;
    runOverlaySequence({ titleTop: "질문이 모두 등록됐습니다!", announceText: "질문을 공개합니다!" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, game.current_question?.id]);

  // reveal 진입: 답변 공개 오버레이 (마운트 시 이미 이 qid를 보고 있었으면 스킵)
  useEffect(() => {
    const rqid = game.reveal?.question?.id || "";
    if (phase !== "reveal" || !rqid) return;
    if (lastSeenRevealQidRef.current === rqid) return;
    lastSeenRevealQidRef.current = rqid;
    runOverlaySequence({ titleTop: "응답이 모두 등록됐습니다!!", announceText: "응답을 공개합니다!" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, game.reveal?.question?.id]);

  useEffect(() => () => clearAllTimers(), []); // eslint-disable-line

  const stickyTop = "calc(var(--header-h) + env(safe-area-inset-top) + 10px)";

  // 현재 질문 하트 정보 (ask 페이즈)
  const heartInfo = game.hearts_by_qid?.[currentQid] || { count: 0, hearted: false };

  // reveal 질문 하트 정보
  const revealQid = game.reveal?.question?.id || "";
  const revealHeartInfo = game.hearts_by_qid?.[revealQid] || { count: 0, hearted: false };

  return (
    <Box
      className="appShell"
      sx={isUrgent ? { animation: "urgentScale 0.75s ease-in-out infinite" } : {}}
    >
      <StageOverlay
        open={overlay.open}
        titleTop={overlay.titleTop}
        count={overlay.count}
        bottomText={overlay.bottomText}
        announceText={overlay.announceText}
      />

      {/* 페이지 헤더 */}
      <Box className="pageHeader">
        <Box sx={{ minWidth: 0 }}>
          <Typography className="pageTitle">
            {phaseEmoji(phase)}{" "}
            {phaseLabel(phase)}{" "}
            <Typography component="span" className="subtle" sx={{ fontSize: 13 }}>
              {code?.toUpperCase()}
            </Typography>
          </Typography>
          <Typography className="subtle" sx={{ mt: 0.3, fontSize: 13 }}>
            라운드 {roundNo} · {state?.players?.length || 0}명 참여 중
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            size="small"
            label={isHost ? "👑 방장" : "참여자"}
            sx={{
              fontWeight: 900,
              borderRadius: 999,
              fontSize: 12,
              background: isHost
                ? "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.10))"
                : undefined,
              border: isHost ? "1px solid rgba(124,58,237,0.25)" : undefined,
            }}
          />
          <IconButton
            onClick={() => setLeaveDialogOpen(true)}
            sx={{
              width: 40,
              height: 40,
              border: "1.5px solid rgba(255,255,255,0.65)",
              background: "rgba(255,255,255,0.52)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              fontSize: 15,
              color: "var(--text-2)",
              fontWeight: 900,
              "&:active": { transform: "scale(0.92)" },
            }}
          >
            ✕
          </IconButton>
        </Stack>
      </Box>

      {error && (
        <Paper
          className="glassCard section"
          sx={{ p: 1.8, border: "1px solid rgba(239,68,68,0.35) !important" }}
        >
          <Typography sx={{ color: "var(--c-red)", fontWeight: 900, fontSize: 14 }}>
            ⚠️ {error}
          </Typography>
        </Paper>
      )}

      {hostChangedNotice && (
        <Paper
          className="glassCard section"
          sx={{
            p: 1.8,
            background:
              "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(251,191,36,0.08)) !important",
            border: "1px solid rgba(245,158,11,0.30) !important",
            animation: "slideUp 0.4s var(--spring) both",
          }}
        >
          <Typography sx={{ fontWeight: 900, fontSize: 14, color: "#D97706" }}>
            👑 방장이 {hostChangedNotice.new_host_nickname}님으로 변경되었습니다
          </Typography>
        </Paper>
      )}

      {/* 상태 바 */}
      <Paper className="glassCard section" sx={{ p: 1.8 }}>
        <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap">
          <Chip
            size="small"
            label={`R${roundNo}`}
            sx={{
              fontWeight: 900,
              borderRadius: 999,
              background: "linear-gradient(135deg, #7C3AED, #EC4899)",
              color: "#fff",
              fontSize: 12,
            }}
          />
          <Chip
            size="small"
            label={phaseLabel(phase)}
            sx={{ fontWeight: 900, borderRadius: 999, fontSize: 12 }}
          />
          {state?.players?.length != null && state?.room?.max_players != null && (
            <Chip
              size="small"
              label={`${state.players.length}/${state.room.max_players}명`}
              sx={{ fontWeight: 900, borderRadius: 999, opacity: 0.8, fontSize: 12 }}
            />
          )}
          {(phase === "question_submit" || phase === "ask") && (() => {
            const submitted = game.submission_progress?.submitted ?? 0;
            const total = game.submission_progress?.total ?? (state?.players?.length || 0);
            const allDone = total > 0 && submitted >= total;
            return (
              <Chip
                size="small"
                label={`${submitted}/${total}명 제출`}
                sx={{
                  fontWeight: 900,
                  borderRadius: 999,
                  fontSize: 12,
                  background: allDone
                    ? "linear-gradient(135deg, #10B981, #34D399)"
                    : "rgba(124,58,237,0.12)",
                  color: allDone ? "#fff" : "var(--c-primary)",
                  border: "1px solid rgba(124,58,237,0.20)",
                  transition: "all 0.3s ease",
                }}
              />
            );
          })()}
        </Stack>

        {(phase === "question_submit" || phase === "ask") && (
          <TimerBar deadlineAt={deadlineAt} totalSeconds={totalSeconds} />
        )}
      </Paper>

      {/* ===== 질문 작성 페이즈 ===== */}
      {phase === "question_submit" && (
        <>
          <Paper
            id="game-question-guide"
            className="glassCard section"
            sx={{
              p: 2,
              background:
                "linear-gradient(135deg, rgba(124,58,237,0.14), rgba(236,72,153,0.07)) !important",
              border: "1px solid rgba(124,58,237,0.22) !important",
              animation: "slideUp 0.45s var(--spring) both",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, #7C3AED, #EC4899)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  boxShadow: "0 6px 20px rgba(124,58,237,0.38)",
                  flex: "0 0 auto",
                }}
              >
                ✏️
              </Box>
              <Box>
                <Typography
                  sx={{ fontWeight: 950, fontSize: 16, letterSpacing: "-0.025em" }}
                >
                  질문을 써봐요!
                </Typography>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-2)",
                    mt: 0.3,
                    lineHeight: 1.4,
                  }}
                >
                  어차피 익명이니까, 솔직하게 써봐요 ✨
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <QuestionInput
            canEdit={canEditNow}
            savedText={questionSavedTextDisplay}
            submitted={questionSubmittedDisplay}
            onSave={handleSaveQuestion}
            onEdit={gameEditQuestion}
            deadlineExpiredSignal={deadlineExpiredSignal}
            templates={templates}
          />
        </>
      )}

      {/* ===== 답변 페이즈 ===== */}
      {phase === "ask" && (
        <>
          {/* 스티키 질문 배너 */}
          <Paper
            id="game-question-banner"
            className="glassCard section"
            sx={{
              p: 2,
              position: "sticky",
              top: stickyTop,
              zIndex: 60,
              background:
                "linear-gradient(135deg, rgba(236,72,153,0.22), rgba(139,92,246,0.20)) !important",
              border: "1px solid rgba(255,255,255,0.80) !important",
              boxShadow:
                "0 12px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(124,58,237,0.10) !important",
              animation: "slideUp 0.4s var(--spring) both",
            }}
          >
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    px: 1.4,
                    py: 0.3,
                    borderRadius: 999,
                    background: "rgba(17,24,39,0.85)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 950,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Q
                </Box>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "rgba(17,24,39,0.60)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  지금 질문
                </Typography>
                {game.current_question?.is_template && (
                  <Box
                    sx={{
                      px: 1,
                      py: 0.2,
                      borderRadius: 999,
                      background: "rgba(124,58,237,0.12)",
                      border: "1px solid rgba(124,58,237,0.25)",
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#7C3AED",
                    }}
                  >
                    템플릿
                  </Box>
                )}
                {game.current_question?.answer_type === "yesno" && (
                  <Box
                    sx={{
                      px: 1,
                      py: 0.2,
                      borderRadius: 999,
                      background: "rgba(59,130,246,0.12)",
                      border: "1px solid rgba(59,130,246,0.25)",
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#3B82F6",
                    }}
                  >
                    예/아니오
                  </Box>
                )}
              </Stack>

              <Typography
                sx={{
                  fontWeight: 1000,
                  letterSpacing: "-0.03em",
                  fontSize: { xs: 19, sm: 22 },
                  lineHeight: 1.28,
                  color: "rgba(17,24,39,0.92)",
                  wordBreak: "keep-all",
                }}
              >
                {game.current_question?.text || "질문을 불러오는 중..."}
              </Typography>

              {/* 하트 버튼 */}
              {currentQid && (
                <Box
                  id="game-heart-btn"
                  onClick={() => gameHeartQuestion(currentQid)}
                  sx={{
                    mt: 1.5,
                    p: 1.2,
                    borderRadius: "var(--radius-lg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1.2,
                    cursor: "pointer",
                    background: heartInfo.hearted
                      ? "linear-gradient(135deg, rgba(239,68,68,0.14), rgba(244,114,182,0.10))"
                      : "rgba(255,255,255,0.50)",
                    border: heartInfo.hearted
                      ? "1.5px solid rgba(239,68,68,0.30)"
                      : "1.5px dashed rgba(239,68,68,0.25)",
                    transition: "all 0.18s ease",
                    userSelect: "none",
                    animation: !heartInfo.hearted ? "subtlePulse 2.5s ease-in-out infinite" : "none",
                    "&:active": { transform: "scale(0.95)" },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 20,
                      lineHeight: 1,
                      filter: heartInfo.hearted ? "none" : "grayscale(0.4)",
                      transition: "filter 0.2s ease",
                    }}
                  >
                    {heartInfo.hearted ? "❤️" : "🤍"}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: heartInfo.hearted ? "#EF4444" : "rgba(17,24,39,0.50)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {heartInfo.hearted
                      ? `좋은 질문 ${heartInfo.count}`
                      : "이 질문 좋으면 탭!"}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Paper>

          <AnswerInput
            canEdit={canEditNow}
            savedText={answerSavedTextDisplay}
            submitted={answerSubmittedDisplay}
            onSave={handleSaveAnswer}
            onEdit={gameEditAnswer}
            deadlineExpiredSignal={deadlineExpiredSignal}
            answerType={game.current_question?.answer_type || "free"}
          />
        </>
      )}

      {/* ===== 공개 페이즈 ===== */}
      {phase === "reveal" && (
        <>
          <Box id="game-reveal-area" ref={revealRef}>
            <AnonymousReveal
              key={game.reveal?.question?.id}
              question={game.reveal?.question}
              answers={game.reveal?.answers}
              revealedCards={game.revealedCards}
              isHost={isHost}
              onRevealCard={game.revealSubPhase === "cards" ? gameRevealCard : undefined}
              onStartChat={game.revealSubPhase === "viewing" ? chatStart : undefined}
            />
          </Box>

          {/* ── 카드 까기 서브페이즈 ── */}
          {game.revealSubPhase === "cards" && (
            <Paper className="glassCard section" sx={{ p: 2 }}>
              {deadlineAt && (
                <TimerBar deadlineAt={deadlineAt} totalSeconds={game.revealTotalSeconds || REVEAL_CARD_SECONDS} />
              )}
              {isHost ? (
                <>
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#D97706",
                      textAlign: "center",
                      mt: deadlineAt ? 1.5 : 0,
                      mb: 1.5,
                    }}
                  >
                    카드를 터치해서 응답을 공개하세요!
                  </Typography>
                  {game.revealedCards.length < (game.reveal?.answers?.length || 0) && (
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={gameRevealAllCards}
                      sx={{
                        fontWeight: 800,
                        fontSize: 14,
                        borderRadius: 999,
                        py: 1.2,
                        letterSpacing: "-0.01em",
                        borderColor: "rgba(124,58,237,0.3)",
                        color: "var(--c-primary)",
                        "&:hover": { borderColor: "rgba(124,58,237,0.5)", background: "rgba(124,58,237,0.04)" },
                        "&:active": { transform: "scale(0.97)" },
                        transition: "transform 0.12s ease",
                      }}
                    >
                      한꺼번에 보기
                    </Button>
                  )}
                </>
              ) : (
                <Stack spacing={0.8} alignItems="center" sx={{ py: 1 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
                    <Box
                      sx={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: "var(--c-amber)",
                        animation: "pulseBeat 1.4s ease-in-out infinite",
                      }}
                    />
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>
                      방장이 카드를 까는 중...
                    </Typography>
                  </Stack>
                </Stack>
              )}
            </Paper>
          )}

          {/* ── 감상 서브페이즈 ── */}
          {game.revealSubPhase === "viewing" && (
            <>
              {/* 하트 버튼 */}
              {revealQid && (
                <Paper
                  className="glassCard section"
                  sx={{
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    animation: "slideUp 0.45s var(--spring) both 0.3s",
                    background: revealHeartInfo.hearted
                      ? "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(244,114,182,0.06)) !important"
                      : undefined,
                    border: revealHeartInfo.hearted
                      ? "1px solid rgba(239,68,68,0.20) !important"
                      : undefined,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "rgba(17,24,39,0.55)",
                      lineHeight: 1.35,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    이 질문 괜찮았으면 하트 눌러줘요
                  </Typography>
                  <Box
                    onClick={() => gameHeartQuestion(revealQid)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.8,
                      px: 2,
                      py: 1,
                      borderRadius: 999,
                      cursor: "pointer",
                      background: revealHeartInfo.hearted
                        ? "rgba(239,68,68,0.12)"
                        : "rgba(255,255,255,0.55)",
                      border: revealHeartInfo.hearted
                        ? "1.5px solid rgba(239,68,68,0.35)"
                        : "1.5px solid rgba(0,0,0,0.10)",
                      transition: "all 0.18s ease",
                      userSelect: "none",
                      "&:active": { transform: "scale(0.90)" },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 20,
                        lineHeight: 1,
                        filter: revealHeartInfo.hearted ? "none" : "grayscale(1)",
                        transition: "filter 0.2s ease",
                      }}
                    >
                      ❤️
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 14,
                        fontWeight: 900,
                        color: revealHeartInfo.hearted ? "#EF4444" : "rgba(17,24,39,0.35)",
                        lineHeight: 1,
                      }}
                    >
                      {revealHeartInfo.count || 0}
                    </Typography>
                  </Box>
                </Paper>
              )}

              <Paper className="glassCard section" sx={{ p: 2 }}>
                {deadlineAt && (
                  <TimerBar deadlineAt={deadlineAt} totalSeconds={game.revealTotalSeconds || 60} />
                )}
                <Stack spacing={1} alignItems="center" sx={{ mt: deadlineAt ? 1.5 : 0 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>
                    잠시 후 자동으로 넘어갑니다
                  </Typography>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)" }}>
                    하트와 리액션을 보내보세요!
                  </Typography>
                  <Button
                    onClick={handleSaveImage}
                    variant="outlined"
                    sx={{
                      mt: 0.5,
                      fontWeight: 800,
                      fontSize: 13,
                      borderRadius: 999,
                      px: 3,
                      py: 0.8,
                      letterSpacing: "-0.01em",
                      borderColor: "rgba(124,58,237,0.25)",
                      color: "var(--c-primary)",
                      "&:hover": { borderColor: "rgba(124,58,237,0.5)", background: "rgba(124,58,237,0.04)" },
                      "&:active": { transform: "scale(0.95)" },
                      transition: "transform 0.12s ease",
                    }}
                  >
                    📷 이미지 저장
                  </Button>
                </Stack>
              </Paper>
            </>
          )}
        </>
      )}

      {/* ===== 라운드 종료 페이즈 ===== */}
      {phase === "round_end" && (
        <Paper
          className="glassCard section"
          sx={{
            p: 2.8,
            background:
              "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(236,72,153,0.07)) !important",
            border: "1px solid rgba(124,58,237,0.20) !important",
            textAlign: "center",
            animation: "slideUp 0.5s var(--spring) both",
          }}
        >
          <Typography
            sx={{ fontSize: 52, mb: 1, animation: "popIn 0.6s var(--spring) both" }}
          >
            🎉
          </Typography>
          <Typography
            sx={{
              fontWeight: 950,
              fontSize: 22,
              letterSpacing: "-0.03em",
              mb: 0.6,
              animation: "slideUp 0.5s var(--spring) both 0.1s",
            }}
          >
            라운드 {roundNo} 완료!
          </Typography>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-2)",
              mb: 1.5,
              animation: "fadeIn 0.5s ease both 0.2s",
            }}
          >
            {isHost
              ? "계속 즐기거나 방을 정리해요."
              : "방장이 결정하는 중... 시간 초과 시 자동 종료"}
          </Typography>

          {deadlineAt && (
            <Box sx={{ width: "100%", mb: 1.8, animation: "fadeIn 0.4s ease both 0.25s" }}>
              <TimerBar deadlineAt={deadlineAt} totalSeconds={ROUND_END_TIMEOUT_SECONDS} />
              {isHost && (
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#D97706",
                    textAlign: "center",
                    mt: 1,
                  }}
                >
                  ⏳ 시간 초과 시 게임이 자동 종료됩니다!
                </Typography>
              )}
            </Box>
          )}

          {/* 하트 집계 */}
          {game.round_end?.heart_summary?.length > 0 && (
            <Box
              sx={{
                width: "100%",
                mb: 2.5,
                animation: "slideUp 0.5s var(--spring) both 0.25s",
              }}
            >
              <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 1.2 }}>
                <Typography sx={{ fontSize: 16 }}>❤️</Typography>
                <Typography sx={{ fontWeight: 950, fontSize: 14, letterSpacing: "-0.02em" }}>
                  이번 라운드 인기 질문
                </Typography>
              </Stack>
              <Stack spacing={0.9}>
                {game.round_end.heart_summary.map((q, i) => (
                  <Box
                    key={i}
                    sx={{
                      p: 1.4,
                      borderRadius: "var(--radius-lg)",
                      background: i === 0
                        ? "linear-gradient(135deg, rgba(239,68,68,0.13), rgba(244,114,182,0.07))"
                        : "rgba(255,255,255,0.38)",
                      border: i === 0
                        ? "1px solid rgba(239,68,68,0.25)"
                        : "1px solid rgba(0,0,0,0.07)",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.2,
                      textAlign: "left",
                    }}
                  >
                    {i === 0 && (
                      <Typography sx={{ fontSize: 18, flex: "0 0 auto" }}>🏆</Typography>
                    )}
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: 13,
                        flex: 1,
                        lineHeight: 1.35,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {q.text}
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 900,
                        fontSize: 13,
                        color: "#EF4444",
                        flex: "0 0 auto",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ❤️ {q.hearts}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* 광고 배너 */}
          <AdBanner style={{ my: 1 }} />

          <Stack spacing={1.2}>
            <Button
              variant="contained"
              fullWidth
              disabled={!isHost}
              onClick={hostNextRound}
              sx={{
                fontWeight: 900,
                fontSize: 16,
                borderRadius: 999,
                py: 1.7,
                background: "linear-gradient(135deg, #7C3AED, #EC4899)",
                boxShadow: "0 8px 28px rgba(124,58,237,0.38)",
                "&:active": { transform: "scale(0.97)" },
                "&:disabled": { opacity: 0.45 },
                transition: "transform 0.12s ease",
                letterSpacing: "-0.02em",
              }}
            >
              🔥 다음 라운드
            </Button>
            <Button
              variant="outlined"
              fullWidth
              disabled={!isHost}
              onClick={hostEndGame}
              sx={{
                fontWeight: 900,
                fontSize: 16,
                borderRadius: 999,
                py: 1.5,
                borderColor: "rgba(239,68,68,0.40)",
                color: "var(--c-red)",
                "&:hover": {
                  borderColor: "rgba(239,68,68,0.60)",
                  background: "rgba(239,68,68,0.06)",
                },
                "&:disabled": { opacity: 0.45 },
                letterSpacing: "-0.02em",
              }}
            >
              게임 종료
            </Button>
          </Stack>

          {!isHost && (
            <Stack spacing={0.3} alignItems="center" sx={{ mt: 1.8 }}>
              <Typography
                sx={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}
              >
                방장만 진행할 수 있습니다
              </Typography>
              <Typography
                sx={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)" }}
              >
                진행하지 않으면 자동으로 방장이 넘어갑니다
              </Typography>
            </Stack>
          )}

          <Box sx={{ mt: 1.5 }}>
            <ShareButton
              url={window.location.origin}
              title="익명게임 - 친구들과 솔직한 익명 Q&A"
              text="익명게임 재밌다 ㅋㅋ 같이 하자!"
              label="친구한테 공유하기"
              icon="🎮"
            />
          </Box>
        </Paper>
      )}

      {!phase && !loadFailed && (
        <Paper className="glassCard section" sx={{ p: 2.5, textAlign: "center" }}>
          <Typography sx={{ color: "var(--text-2)", fontWeight: 700, fontSize: 14 }}>
            게임 상태를 불러오는 중...
          </Typography>
        </Paper>
      )}

      {!phase && loadFailed && (
        <Paper
          className="glassCard section"
          sx={{
            p: 3,
            textAlign: "center",
            border: "1px solid rgba(239,68,68,0.25) !important",
            animation: "slideUp 0.4s var(--spring) both",
          }}
        >
          <Typography sx={{ fontSize: 40, mb: 1.5 }}>😵</Typography>
          <Typography sx={{ fontWeight: 950, fontSize: 17, letterSpacing: "-0.02em", mb: 0.8 }}>
            게임에 접속할 수 없어요
          </Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", mb: 2.5, lineHeight: 1.5 }}>
            방이 종료됐거나 연결이 끊겼어요.{"\n"}홈으로 돌아가서 다시 시도해보세요.
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={() => {
              sessionStorage.removeItem("ag:home_redirect_done");
              nav("/", { replace: true });
            }}
            sx={{
              fontWeight: 900,
              fontSize: 16,
              borderRadius: 999,
              py: 1.6,
              background: "linear-gradient(135deg, #7C3AED, #EC4899)",
              boxShadow: "0 6px 22px rgba(124,58,237,0.32)",
              "&:active": { transform: "scale(0.97)" },
            }}
          >
            홈으로 돌아가기
          </Button>
        </Paper>
      )}

      <ReactionFAB />
      <ChatFAB />
      <ChatWindow />

      <Dialog
        open={leaveDialogOpen}
        onClose={() => setLeaveDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: "var(--radius-xl)",
            p: 1,
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(20px)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 950, fontSize: 18, letterSpacing: "-0.02em" }}>
          정말 나가시겠습니까?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)" }}>
            게임에서 나가면 다시 들어올 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setLeaveDialogOpen(false)}
            sx={{ fontWeight: 800, fontSize: 14, borderRadius: 999, color: "var(--text-2)" }}
          >
            취소
          </Button>
          <Button
            variant="contained"
            onClick={() => { setLeaveDialogOpen(false); roomLeave(); nav("/"); }}
            sx={{
              fontWeight: 900, fontSize: 14, borderRadius: 999,
              background: "linear-gradient(135deg, #EF4444, #F87171)",
              boxShadow: "0 4px 14px rgba(239,68,68,0.30)",
            }}
          >
            나가기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
