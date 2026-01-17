// src/services/authService.js
const crypto = require("crypto");
const { env } = require("../config/env");

function base64url(input) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function sign(payloadStr) {
  return base64url(
    crypto.createHmac("sha256", env.GUEST_TOKEN_SECRET).update(payloadStr).digest()
  );
}

/**
 * guest_token 포맷:
 *   token = base64url(payloadJson) + "." + signature
 * payloadJson: { guest_id, iat }
 */
function issueGuestToken(guestId) {
  const payload = { guest_id: guestId, iat: Date.now() };
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = base64url(payloadStr);
  const sig = sign(payloadB64);
  return `${payloadB64}.${sig}`;
}

function verifyGuestToken(guestId, token) {
  try {
    if (!guestId || !token) return { ok: false, reason: "missing" };
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return { ok: false, reason: "bad_format" };
    const expected = sign(payloadB64);
    if (sig !== expected) return { ok: false, reason: "bad_sig" };

    const payloadJson = Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
    const payload = JSON.parse(payloadJson);
    if (payload.guest_id !== guestId) return { ok: false, reason: "guest_mismatch" };

    return { ok: true, payload };
  } catch (e) {
    return { ok: false, reason: "exception" };
  }
}

module.exports = {
  issueGuestToken,
  verifyGuestToken,
};
