// src/state/useRoomStore.js
import { create } from "zustand";
import { connectSocket } from "../sockets/socket";
import { EVENTS } from "../sockets/events";

const SERVER = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

export const useRoomStore = create((set, get) => ({
  socketReady: false,
  user: null,       // { id, email, display_name, avatar_url }
  authLoading: true,

  rooms: [],
  state: null,

  game: {
    phase: null,
    deadline_at: null,
    round_no: 0,

    current_question: null,
    reveal: null,
    round_end: null,

    question_submitted: false,
    question_saved_text: "",
    question_saved_at: null,
    question_pending_text: "",

    answer_submitted_by_qid: {},
    answer_saved_text_by_qid: {},
    answer_saved_at_by_qid: {},
    answer_pending_text_by_qid: {},

    hearts_by_qid: {},  // { [qid]: { count: number, hearted: boolean } }
    submission_progress: null,  // { submitted: number, total: number }
    reactions: [],  // [{ id, emoji, text }]
  },

  error: "",

  // ===== 로그인 상태 확인 (/auth/me) =====
  fetchUser: async () => {
    try {
      const res = await fetch(`${SERVER}/auth/me`, { credentials: "include" });
      const data = await res.json();
      if (data.ok && data.user) {
        set({ user: data.user, authLoading: false });
      } else {
        set({ user: null, authLoading: false });
      }
    } catch {
      set({ user: null, authLoading: false });
    }
  },

  // ===== 로그아웃 =====
  logout: async () => {
    await fetch(`${SERVER}/auth/logout`, { method: "POST", credentials: "include" });
    set({ user: null, state: null, socketReady: false });
  },

  // ===== 소켓 초기화 =====
  initSocket: () => {
    const s = connectSocket();

    if (get().socketReady) return;

    s.on("connect", () => {
      set({ socketReady: true });

      // 소켓 재연결 시 방에 있었으면 자동 rejoin
      const roomCode = get().state?.room?.code;
      if (roomCode) {
        s.emit(EVENTS.ROOM_REJOIN, { code: roomCode });
      }
    });

    // room list
    s.on(EVENTS.ROOM_LIST_RES, (res) => {
      if (!res?.ok) return set({ error: res?.message || "room list 실패" });
      set({ rooms: res.rooms || [], error: "" });
    });

    const applyState = (res) => {
      if (!res?.ok) return set({ error: res?.message || "room op 실패" });
      if (res.state) {
        // 활성 방 코드를 localStorage에 저장 → 홈 자동 복귀 감지용
        if (res.state.room?.code) {
          try { localStorage.setItem("ag:last_room", res.state.room.code); } catch {}
        }
        set({ state: res.state, error: "" });
      }
    };

    s.on(EVENTS.ROOM_CREATE_RES, applyState);
    s.on(EVENTS.ROOM_JOIN_RES, applyState);
    s.on(EVENTS.ROOM_UPDATE, applyState);

    // rejoin 실패는 신규 유저에겐 정상 — "방을 찾을 수 없음"만 에러 처리
    s.on(EVENTS.ROOM_REJOIN_RES, (res) => {
      if (!res?.ok) {
        if (res?.message?.includes("방을 찾을 수 없음")) {
          set({ error: res.message });
        }
        return;
      }
      if (res.state) {
        if (res.state.room?.code) {
          try { localStorage.setItem("ag:last_room", res.state.room.code); } catch {}
        }

        // 게임 상태 복원 (rejoin full sync)
        const g = res.game;
        if (g) {
          const gameRestore = {
            phase: g.phase || null,
            deadline_at: g.deadline_at || null,
            round_no: g.round_no || 0,
            submission_progress: null,
          };

          // question_submit phase 복원
          if (g.question_submitted !== undefined) {
            gameRestore.question_submitted = !!g.question_submitted;
            gameRestore.question_saved_text = g.question_saved_text || "";
            gameRestore.question_saved_at = g.question_submitted ? new Date().toISOString() : null;
            gameRestore.question_pending_text = "";
          }

          // ask phase 복원
          if (g.current_question) {
            gameRestore.current_question = g.current_question;
            const qid = g.current_question.id;
            if (qid) {
              gameRestore.answer_submitted_by_qid = g.answer_submitted ? { [qid]: true } : {};
              gameRestore.answer_saved_text_by_qid = g.answer_saved_text ? { [qid]: g.answer_saved_text } : {};
              gameRestore.answer_saved_at_by_qid = g.answer_submitted ? { [qid]: new Date().toISOString() } : {};
              gameRestore.answer_pending_text_by_qid = { [qid]: "" };
            }
            if (g.heart_count !== undefined) {
              const myPlayer = res.state?.players?.find((pl) => pl.user_id === get().user?.id);
              const myPlayerId = myPlayer?.id;
              gameRestore.hearts_by_qid = {
                [qid]: {
                  count: g.heart_count,
                  hearted: myPlayerId ? (g.hearted_by || []).includes(myPlayerId) : false,
                },
              };
            }
          }

          // reveal phase 복원
          if (g.reveal) {
            gameRestore.reveal = g.reveal;
            gameRestore.current_question = null;
            const rqid = g.reveal?.question?.id;
            if (rqid && g.heart_count !== undefined) {
              const myPlayer = res.state?.players?.find((pl) => pl.user_id === get().user?.id);
              const myPlayerId = myPlayer?.id;
              gameRestore.hearts_by_qid = {
                [rqid]: {
                  count: g.heart_count,
                  hearted: myPlayerId ? (g.hearted_by || []).includes(myPlayerId) : false,
                },
              };
            }
          }

          // round_end phase 복원
          if (g.round_end) {
            gameRestore.round_end = g.round_end;
            gameRestore.current_question = null;
            gameRestore.reveal = null;
          }

          set((st) => ({
            state: res.state,
            error: "",
            game: { ...st.game, ...gameRestore },
          }));
          return;
        }

        set({ state: res.state, error: "" });
      }
    });

    s.on(EVENTS.ROOM_UPDATE_PASSWORD_RES, (res) => {
      if (!res?.ok) set({ error: res?.message || "비밀번호 변경 실패" });
    });

    s.on(EVENTS.ROOM_DESTROYED, () => set({ state: null }));

    // 다른 기기에서 같은 계정으로 접속 시 킥
    s.on(EVENTS.ROOM_KICKED, (data) => {
      set({ state: null, error: data?.message || "다른 기기에서 접속됨" });
    });

    // ====== 질문 제출 응답 ======
    s.on(EVENTS.GAME_SUBMIT_Q_RES, (res) => {
      if (!res?.ok) return set({ error: res?.message || "질문 저장 실패" });

      set((st) => {
        const pending = st.game.question_pending_text || "";
        return {
          game: {
            ...st.game,
            question_submitted: true,
            question_saved_text: pending || st.game.question_saved_text,
            question_saved_at: new Date().toISOString(),
            question_pending_text: "",
          },
          error: "",
        };
      });
    });

    // ====== 답변 제출 응답 ======
    s.on(EVENTS.GAME_SUBMIT_A_RES, (res) => {
      if (!res?.ok) return set({ error: res?.message || "답변 저장 실패" });

      set((st) => {
        const qid = st.game.current_question?.id;
        if (!qid) return st;

        const pending = st.game.answer_pending_text_by_qid[qid] || "";
        return {
          game: {
            ...st.game,
            answer_submitted_by_qid: { ...st.game.answer_submitted_by_qid, [qid]: true },
            answer_saved_text_by_qid: {
              ...st.game.answer_saved_text_by_qid,
              [qid]: pending || st.game.answer_saved_text_by_qid[qid] || "",
            },
            answer_saved_at_by_qid: {
              ...st.game.answer_saved_at_by_qid,
              [qid]: new Date().toISOString(),
            },
            answer_pending_text_by_qid: {
              ...st.game.answer_pending_text_by_qid,
              [qid]: "",
            },
          },
          error: "",
        };
      });
    });

    // ====== phase broadcast ======
    s.on(EVENTS.GAME_PHASE, (p) => {
      if (!p?.ok) return;
      set((st) => {
        // 새 라운드 시작(question_submit) 시 이전 라운드 질문/답변 상태 전부 리셋
        const isNewRound = p.phase === "question_submit";
        return {
          game: {
            ...st.game,
            phase: p.phase,
            deadline_at: p.deadline_at || null,
            round_no: p.round_no || st.game.round_no,
            submission_progress: null,
            ...(isNewRound ? {
              question_submitted: false,
              question_saved_text: "",
              question_saved_at: null,
              question_pending_text: "",
              answer_submitted_by_qid: {},
              answer_saved_text_by_qid: {},
              answer_saved_at_by_qid: {},
              answer_pending_text_by_qid: {},
              hearts_by_qid: {},
              reactions: [],
              current_question: null,
              reveal: null,
              round_end: null,
            } : {
              question_pending_text: "",
            }),
          },
        };
      });
    });

    s.on(EVENTS.GAME_ASK, (p) => {
      if (!p?.ok) return;
      set((st) => {
        const q = p.question || null;
        const qid = q?.id;

        return {
          game: {
            ...st.game,
            phase: "ask",
            deadline_at: p.deadline_at || null,
            round_no: p.round_no || st.game.round_no,
            current_question: q,
            reveal: null,
            round_end: null,
            question_pending_text: "",
            answer_pending_text_by_qid: qid
              ? { ...st.game.answer_pending_text_by_qid, [qid]: "" }
              : st.game.answer_pending_text_by_qid,
          },
        };
      });
    });

    s.on(EVENTS.GAME_REVEAL, (p) => {
      if (!p?.ok) return;
      set((st) => ({
        game: {
          ...st.game,
          phase: "reveal",
          deadline_at: null,
          round_no: p.round_no || st.game.round_no,
          current_question: null,
          reveal: {
            question: p.question,
            answers: p.answers || [],
            is_last: !!p.is_last,
          },
        },
      }));
    });

    s.on(EVENTS.GAME_ROUND_END, (p) => {
      if (!p?.ok) return;
      set((st) => ({
        game: {
          ...st.game,
          phase: "round_end",
          deadline_at: null,
          round_no: p.round_no || st.game.round_no,
          round_end: p,
          current_question: null,
          reveal: null,
        },
      }));
    });

    s.on(EVENTS.GAME_ENDED, () => {
      set((st) => ({
        game: {
          ...st.game,
          phase: "lobby",
          deadline_at: null,
          current_question: null,
          reveal: null,
          round_end: null,
          reactions: [],
        },
      }));
    });

    s.on(EVENTS.GAME_HOST_REVEAL_NEXT_RES, (res) => {
      if (!res?.ok) set({ error: res?.message || "다음 진행 실패" });
    });

    // ====== 질문 하트 실시간 업데이트 ======
    s.on(EVENTS.GAME_HEART_Q_UPDATE, (p) => {
      if (!p?.ok) return;
      const myPlayer = get().state?.players?.find((pl) => pl.user_id === get().user?.id);
      const myPlayerId = myPlayer?.id;
      set((st) => ({
        game: {
          ...st.game,
          hearts_by_qid: {
            ...st.game.hearts_by_qid,
            [p.question_id]: {
              count: p.count,
              hearted: myPlayerId ? (p.hearted_by || []).includes(myPlayerId) : false,
            },
          },
        },
      }));
    });

    // ====== 방장 잠수 → 자동 위임 ======
    s.on(EVENTS.GAME_HOST_CHANGED, (p) => {
      if (!p?.ok) return;
      set((st) => ({
        game: {
          ...st.game,
          hostChanged: {
            new_host_player_id: p.new_host_player_id,
            new_host_nickname: p.new_host_nickname,
            at: Date.now(),
          },
        },
      }));
    });

    // ====== 제출 진행 표시 ======
    s.on(EVENTS.GAME_Q_SUBMITTED, (p) => {
      if (!p?.ok) return;
      set((st) => ({
        game: { ...st.game, submission_progress: { submitted: p.submitted, total: p.total } },
      }));
    });
    s.on(EVENTS.GAME_A_SUBMITTED, (p) => {
      if (!p?.ok) return;
      set((st) => ({
        game: { ...st.game, submission_progress: { submitted: p.submitted, total: p.total } },
      }));
    });

    // ====== 익명 감정표현 ======
    s.on(EVENTS.GAME_REACTION_BROADCAST, (p) => {
      if (!p?.ok) return;
      set((st) => ({
        game: {
          ...st.game,
          reactions: [...st.game.reactions, { id: p.id, emoji: p.emoji, text: p.text }].slice(-20),
        },
      }));
    });

    s.on("disconnect", () => set({ socketReady: false }));

    set({ socketReady: true });
  },

  // ===== actions =====
  roomList: () => connectSocket().emit(EVENTS.ROOM_LIST),

  roomCreate: ({ title, max_players, nickname, avatar, ai_secret_key, ai_player_count, password }) => {
    connectSocket().emit(EVENTS.ROOM_CREATE, { title, max_players, nickname, avatar, ai_secret_key, ai_player_count, password });
  },

  roomJoin: ({ code, nickname, avatar, password }) => {
    connectSocket().emit(EVENTS.ROOM_JOIN, { code, nickname, avatar, password });
  },

  roomRejoin: ({ code }) => {
    connectSocket().emit(EVENTS.ROOM_REJOIN, { code });
  },

  roomReady: (is_ready) => connectSocket().emit(EVENTS.ROOM_READY, { is_ready }),

  roomLeave: () => {
    connectSocket().emit(EVENTS.ROOM_LEAVE);
    // 의도적 나가기 → 마지막 방 기록 삭제 (홈에서 "종료됨" 메시지 표시 안 함)
    try { localStorage.removeItem("ag:last_room"); } catch {}
    set({ state: null });
  },

  // 현재 유저의 활성 방 서버 조회 (홈 화면 자동 복귀용)
  checkActiveRoom: async () => {
    try {
      const res = await fetch(`${SERVER}/room/my-active`, { credentials: "include" });
      return await res.json();
    } catch {
      return { ok: false, room: null };
    }
  },

  gameSubmitQuestion: (text, answer_type) => {
    const t = String(text || "").trim();
    const at = answer_type === "yesno" ? "yesno" : "free";
    set((st) => ({
      game: { ...st.game, question_pending_text: t },
    }));
    connectSocket().emit(EVENTS.GAME_SUBMIT_Q, { text: t, answer_type: at });
  },

  gameSubmitAnswer: (text) => {
    const qid = get().game.current_question?.id;
    const t = String(text || "").trim();

    if (qid) {
      set((st) => ({
        game: {
          ...st.game,
          answer_pending_text_by_qid: {
            ...st.game.answer_pending_text_by_qid,
            [qid]: t,
          },
        },
      }));
    }

    connectSocket().emit(EVENTS.GAME_SUBMIT_A, { text: t });
  },

  gameEditQuestion: () => {
    connectSocket().emit(EVENTS.GAME_EDIT_Q);
  },

  gameEditAnswer: () => {
    connectSocket().emit(EVENTS.GAME_EDIT_A);
  },

  gameHeartQuestion: (question_id) => {
    connectSocket().emit(EVENTS.GAME_HEART_Q, { question_id });
  },

  gameReaction: (emoji, text) => {
    connectSocket().emit(EVENTS.GAME_REACTION, { emoji: emoji || null, text: text || null });
  },

  removeReaction: (id) => {
    set((st) => ({
      game: { ...st.game, reactions: st.game.reactions.filter((r) => r.id !== id) },
    }));
  },

  roomUpdatePassword: (password) => {
    connectSocket().emit(EVENTS.ROOM_UPDATE_PASSWORD, { password: password || null });
  },

  gameStart: () => connectSocket().emit(EVENTS.GAME_START),
  hostRevealNext: () => connectSocket().emit(EVENTS.GAME_HOST_REVEAL_NEXT),
  hostNextRound: () => connectSocket().emit(EVENTS.GAME_HOST_NEXT),
  hostEndGame: () => connectSocket().emit(EVENTS.GAME_HOST_END),
}));
