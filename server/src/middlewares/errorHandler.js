// src/middlewares/errorHandler.js
function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(500).json({
    ok: false,
    message: err?.message || "Server error",
  });
}

module.exports = { errorHandler };
