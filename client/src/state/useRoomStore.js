// src/state/useRoomStore.js
import { create } from "zustand";
import { connectSocket } from "../sockets/socket";
import { EVENTS } from "../sockets/events";
import { getOrCreateGuestId, getGuestToken, setGuestToken } from "../storage/guest";

export const useRoomStore = create((set, get) => ({
  socketReady: false,
  guest_id: "",
  guest_token: "",

  rooms: [],
  state: null,

  game: {
    phase: null,
    deadline_at: null,
    round_no: 0,

    current_question: null, // {id,text}
    reveal: null, // {question, answers, is_last}
    round_end: null,

    // ====== 질문(phase1) 내 제출 상태 ======
    question_submitted: false,
    question_saved_text: "",
    question_saved_at: null,
    question_pending_text: "",

    // ====== 답변(ask) 내 제출 상태: question_id 기준 ======
    answer_submitted_by_qid: {}, // { [qid]: boolean }
    answer_saved_text_by_qid: {}, // { [qid]: string }
    answer_saved_at_by_qid: {}, // { [qid]: isoString }
    answer_pending_text_by_qid: {}, // { [qid]: string }
  },

  error: "",

  initSocket: () => {
    const s = connectSocket();
    const guest_id = getOrCreateGuestId();
    const guest_token = getGuestToken();

    if (get().socketReady) return;

    s.on("connect", () => {
      s.emit(EVENTS.GUEST_ENSURE, { guest_id, guest_token });
    });

    s.on(EVENTS.GUEST_ENSURE_RES, (res) => {
      if (!res?.ok) return set({ error: res?.message || "guest ensure 실패" });

      setGuestToken(res.guest_token);
      set({
        socketReady: true,
        guest_id: res.guest_id,
        guest_token: res.guest_token,
        error: "",
      });
    });

    // room list
    s.on(EVENTS.ROOM_LIST_RES, (res) => {
      if (!res?.ok) return set({ error: res?.message || "room list 실패" });
      set({ rooms: res.rooms || [], error: "" });
    });

    const applyState = (res) => {
      if (!res?.ok) return set({ error: res?.message || "room op 실패" });
      if (res.state) set({ state: res.state, error: "" });
    };

    s.on(EVENTS.ROOM_CREATE_RES, applyState);
    s.on(EVENTS.ROOM_JOIN_RES, applyState);
    s.on(EVENTS.ROOM_REJOIN_RES, applyState);
    s.on(EVENTS.ROOM_UPDATE, applyState);

    s.on(EVENTS.ROOM_DESTROYED, () => set({ state: null }));

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
      set((st) => ({
        game: {
          ...st.game,
          phase: p.phase,
          deadline_at: p.deadline_at || null,
          round_no: p.round_no || st.game.round_no,

          // question_submit 들어가면, 제출 플래그는 유지하되 "pending"만 비움
          question_pending_text: p.phase === "question_submit" ? "" : st.game.question_pending_text,
        },
      }));
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
            // 질문 페이즈 관련 pending 정리
            question_pending_text: "",
            // 답변 pending은 현재 qid만 비움 (연타/중복 방지)
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
        },
      }));
    });

    s.on(EVENTS.GAME_HOST_REVEAL_NEXT_RES, (res) => {
      if (!res?.ok) set({ error: res?.message || "다음 진행 실패" });
    });

    s.on("disconnect", () => set({ socketReady: false }));

    set({ guest_id, guest_token });
  },

  // ===== actions =====
  roomList: () => connectSocket().emit(EVENTS.ROOM_LIST),

  roomCreate: ({ title, max_players, nickname }) => {
    const { guest_id, guest_token } = get();
    connectSocket().emit(EVENTS.ROOM_CREATE, { guest_id, guest_token, title, max_players, nickname });
  },

  roomJoin: ({ code, nickname }) => {
    const { guest_id, guest_token } = get();
    connectSocket().emit(EVENTS.ROOM_JOIN, { guest_id, guest_token, code, nickname });
  },

  roomRejoin: ({ code }) => {
    const { guest_id, guest_token } = get();
    connectSocket().emit(EVENTS.ROOM_REJOIN, { guest_id, guest_token, code });
  },

  roomReady: (is_ready) => connectSocket().emit(EVENTS.ROOM_READY, { is_ready }),

  roomLeave: () => {
    connectSocket().emit(EVENTS.ROOM_LEAVE);
    set({ state: null });
  },

  gameSubmitQuestion: (text) => {
    const t = String(text || "").trim();
    set((st) => ({
      game: {
        ...st.game,
        question_pending_text: t,
      },
    }));
    connectSocket().emit(EVENTS.GAME_SUBMIT_Q, { text: t });
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

  hostRevealNext: () => connectSocket().emit(EVENTS.GAME_HOST_REVEAL_NEXT),
  hostNextRound: () => connectSocket().emit(EVENTS.GAME_HOST_NEXT),
  hostEndGame: () => connectSocket().emit(EVENTS.GAME_HOST_END),
}));
