/**
 * errorHandler.middleware.js
 * Central Express 5 error handler.
 *
 * Express 5 automatically forwards rejected async promises to next(err),
 * so controllers no longer need manual try/catch for async errors.
 */

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  console.error("[Error]", err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
}

module.exports = errorHandler;
