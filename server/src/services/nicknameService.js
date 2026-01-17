// src/services/nicknameService.js
function normalizeNickname(nickname) {
  const n = (nickname || "").trim();
  if (!n) throw new Error("닉네임을 입력해줘");
  if (n.length > 30) throw new Error("닉네임이 너무 김(최대 30자)");
  return n;
}

module.exports = { normalizeNickname };
