// src/middlewares/errorHandler.js
function errorHandler(err, req, res, next) {
  console.error(err);
  const isProd = process.env.NODE_ENV === "production";
  res.status(500).json({
    ok: false,
    message: isProd ? "서버 오류가 발생했습니다" : (err?.message || "Server error"),
  });
}

module.exports = { errorHandler };
