// client/src/sockets/events.js
export const EVENTS = {
  GUEST_ENSURE: "guest:ensure",
  GUEST_ENSURE_RES: "guest:ensure:res",

  ROOM_LIST: "room:list",
  ROOM_LIST_RES: "room:list:res",
  ROOM_CREATE: "room:create",
  ROOM_CREATE_RES: "room:create:res",
  ROOM_JOIN: "room:join",
  ROOM_JOIN_RES: "room:join:res",
  ROOM_REJOIN: "room:rejoin",
  ROOM_REJOIN_RES: "room:rejoin:res",
  ROOM_READY: "room:ready",
  ROOM_READY_RES: "room:ready:res",
  ROOM_LEAVE: "room:leave",
  ROOM_LEAVE_RES: "room:leave:res",
  ROOM_UPDATE: "room:update",
  ROOM_UPDATE_PASSWORD: "room:updatePassword",
  ROOM_UPDATE_PASSWORD_RES: "room:updatePassword:res",
  ROOM_DESTROYED: "room:destroyed",
  ROOM_KICKED: "room:kicked",

  GAME_START: "game:start",
  GAME_START_RES: "game:start:res",
  GAME_PHASE: "game:phase",
  GAME_SUBMIT_Q: "game:submitQuestion",
  GAME_SUBMIT_Q_RES: "game:submitQuestion:res",
  GAME_SUBMIT_A: "game:submitAnswer",
  GAME_SUBMIT_A_RES: "game:submitAnswer:res",
  GAME_ASK: "game:ask",
  GAME_REVEAL: "game:reveal",
  GAME_ROUND_END: "game:roundEnd",

  // ✅ reveal에서 방장이 눌러서 다음 질문/라운드 종료로
  GAME_HOST_REVEAL_NEXT: "game:hostRevealNext",
  GAME_HOST_REVEAL_NEXT_RES: "game:hostRevealNext:res",

  GAME_HOST_NEXT: "game:hostNextRound",
  GAME_HOST_NEXT_RES: "game:hostNextRound:res",
  GAME_HOST_END: "game:hostEndGame",
  GAME_HOST_END_RES: "game:hostEndGame:res",
  GAME_ENDED: "game:ended",

  GAME_EDIT_Q: "game:editQuestion",
  GAME_EDIT_A: "game:editAnswer",

  GAME_HEART_Q: "game:heartQuestion",
  GAME_HEART_Q_UPDATE: "game:heartQuestion:update",

  GAME_HOST_CHANGED: "game:hostChanged",

  GAME_Q_SUBMITTED: "game:questionSubmitted",
  GAME_A_SUBMITTED: "game:answerSubmitted",

  GAME_REVEAL_CARD: "game:revealCard",
  GAME_REVEAL_CARD_BROADCAST: "game:revealCard:broadcast",
  GAME_REVEAL_ALL: "game:revealAllCards",
  GAME_REVEAL_ALL_BROADCAST: "game:revealAllCards:broadcast",

  GAME_REVEAL_VIEWING: "game:revealViewing",

  GAME_REACTION: "game:reaction",
  GAME_REACTION_BROADCAST: "game:reaction:broadcast",

  CHAT_START: "chat:start",
  CHAT_STARTED: "chat:started",
  CHAT_RECEIVE: "chat:receive",
  CHAT_SEND: "chat:send",
  CHAT_CLEARED: "chat:cleared",
};
