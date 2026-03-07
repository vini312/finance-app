/**
 * errorHandler.middleware.js — Central Express Error Handler
 * ─────────────────────────────────────────────────────────────────────────────
 * Express identifies an error-handling middleware by its FOUR arguments.
 * Must be registered AFTER all routes in server.js.
 *
 * Express 5 automatically forwards any thrown error (or rejected Promise) from
 * an async route handler here — no manual try/catch needed in controllers.
 *
 * Attach err.status before throwing in a controller to control the HTTP code:
 *   const err = new Error("Not found");
 *   err.status = 404;
 *   throw err;
 */

// eslint-disable-next-line no-unused-vars — four-arg signature required by Express
function errorHandler(err, _req, res, _next) {
  console.error("[Error]", err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
}

export default errorHandler;
