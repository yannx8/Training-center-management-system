// FILE: backend/middleware/errorHandler.js
// Centralised async error handler — wrap all route handlers with asyncHandler()

/**
 * Wraps an async route handler so that uncaught rejections are forwarded to Express.
 * Usage: router.get('/path', asyncHandler(myHandler))
 */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/**
 * Express error-handling middleware — must be registered LAST.
 * Catches Prisma errors, validation errors and unhandled exceptions.
 */
function errorHandler(err, _req, res, _next) {
  console.error('[ERROR]', err);

  // ── Prisma unique constraint ──────────────────────────────────
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`,
      code: 'DUPLICATE',
    });
  }

  // ── Prisma record not found ───────────────────────────────────
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found.',
      code: 'NOT_FOUND',
    });
  }

  // ── Generic fallback ─────────────────────────────────────────
  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  return res.status(status).json({ success: false, message, code: err.code || 'SERVER_ERROR' });
}

module.exports = errorHandler;
module.exports.asyncHandler = asyncHandler;
