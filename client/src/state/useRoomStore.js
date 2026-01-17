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
  state: null, // { room, players }
  game: {
    phase: null,
    deadline_at: null,
    round_no: 0,
    current_question: null, // {id,text}
    reveal: null, // {question, answers[]}
    round_end: null, // info
    question_submitted: false, // ✅ 1페이즈 질문 제출 여부
  },

  error: "",

  initSocket: () => {
    const s = connectSocket();
    const guest_id = getOrCreateGuestId();
    const guest_token = getGuestToken();

    // listeners 1번만
    if (get().socketReady) return;

    s.on("connect", () => {
      s.emit(EVENTS.GUEST_ENSURE, { guest_id, guest_token });
    });

    s.on(EVENTS.GUEST_ENSURE_RES, (res) => {
      if (!res?.ok) {
        set({ error: res?.message || "guest ensure 실패" });
        return;
      }
      setGuestToken(res.guest_token);
      set({
        socketReady: true,
        guest_id: res.guest_id,
        guest_token: res.guest_token,
        error: "",
      });
    });

    // room
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

    s.on(EVENTS.ROOM_DESTROYED, () => {
      set({ state: null });
    });

    // ✅ 질문 제출 응답: 제출 완료 플래그 세팅
    s.on(EVENTS.GAME_SUBMIT_Q_RES, (res) => {
      if (!res?.ok) return set({ error: res?.message || "질문 제출 실패" });
      set((st) => ({
        game: { ...st.game, question_submitted: true },
        error: "",
      }));
    });

    // game events (서버가 방송)
    s.on(EVENTS.GAME_PHASE, (p) => {
      if (!p?.ok) return;
      set((st) => ({
        game: {
          ...st.game,
          phase: p.phase,
          deadline_at: p.deadline_at || null,
          round_no: p.round_no || st.game.round_no,
          // ✅ 질문 입력 페이즈 시작 시 제출여부 초기화
          question_submitted: p.phase === "question_submit" ? false : st.game.question_submitted,
        },
      }));
    });

    s.on(EVENTS.GAME_ASK, (p) => {
      if (!p?.ok) return;
      set((st) => ({
        game: {
          ...st.game,
          phase: "ask",
          deadline_at: p.deadline_at || null,
          round_no: p.round_no || st.game.round_no,
          current_question: p.question || null,
          reveal: null,
          round_end: null,
          // ✅ 질문 페이즈 끝났으니 정리
          question_submitted: false,
        },
      }));
    });

    s.on(EVENTS.GAME_REVEAL, (p) => {
      if (!p?.ok) return;
      set((st) => ({
        game: {
          ...st.game,
          phase: "reveal",
          deadline_at: null,
          round_no: p.round_no || st.game.round_no,
          reveal: { question: p.question, answers: p.answers || [] },
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
          question_submitted: false,
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
          question_submitted: false,
        },
      }));
    });

    s.on("disconnect", () => {
      set({ socketReady: false });
    });

    // 초기 상태 저장
    set({ guest_id, guest_token });
  },

  // actions
  roomList: () => {
    const s = connectSocket();
    s.emit(EVENTS.ROOM_LIST);
  },

  roomCreate: ({ title, max_players, nickname }) => {
    const { guest_id, guest_token } = get();
    const s = connectSocket();
    s.emit(EVENTS.ROOM_CREATE, { guest_id, guest_token, title, max_players, nickname });
  },

  roomJoin: ({ code, nickname }) => {
    const { guest_id, guest_token } = get();
    const s = connectSocket();
    s.emit(EVENTS.ROOM_JOIN, { guest_id, guest_token, code, nickname });
  },

  roomRejoin: ({ code }) => {
    const { guest_id, guest_token } = get();
    const s = connectSocket();
    s.emit(EVENTS.ROOM_REJOIN, { guest_id, guest_token, code });
  },

  roomReady: (is_ready) => {
    const s = connectSocket();
    s.emit(EVENTS.ROOM_READY, { is_ready });
  },

  roomLeave: () => {
    const s = connectSocket();
    s.emit(EVENTS.ROOM_LEAVE);
    set({ state: null });
  },

  gameSubmitQuestion: (text) => {
    const s = connectSocket();
    // ✅ 제출 전에는 제출완료 false로 한번 초기화(연타 방지 UX)
    set((st) => ({ game: { ...st.game, question_submitted: false } }));
    s.emit(EVENTS.GAME_SUBMIT_Q, { text });
  },

  gameSubmitAnswer: (text) => {
    const s = connectSocket();
    s.emit(EVENTS.GAME_SUBMIT_A, { text });
  },

  hostNextRound: () => {
    const s = connectSocket();
    s.emit(EVENTS.GAME_HOST_NEXT);
  },

  hostEndGame: () => {
    const s = connectSocket();
    s.emit(EVENTS.GAME_HOST_END);
  },
}));
