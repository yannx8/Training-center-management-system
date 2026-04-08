// FILE: backend/middleware/errorHandler.js
// Centralised async error handler — wrap all route handlers with asyncHandler()

// This small wrapper lets us write async route handlers without having to 
// put a try/catch block in every single one. If something goes wrong, 
// it automatically passes the error to our main error handler below.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// This is our central "safety net". Every error in the backend eventually flows through here.
// We catch database errors, validation errors, and anything else that might crash the app.
function errorHandler(err, _req, res, _next) {
  console.error('[SERVER LOG] Something went wrong:', err);

  // P2002 is the Prisma "unique constraint" error (e.g., trying to use an email that's already taken).
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
