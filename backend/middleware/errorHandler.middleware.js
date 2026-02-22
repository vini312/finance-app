/**
 * errorHandler.middleware.js
 * Central Express error handler — catches anything passed to next(err).
 */

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  console.error("[Error]", err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
}

module.exports = errorHandler;
