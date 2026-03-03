// FILE: /backend/middleware/errorHandler.js
// Global catch-all for unhandled errors — last middleware in the chain.
function errorHandler(err, req, res, next) {
    console.error('Unhandled error:', err);
    return res.status(500).json({
        success: false,
        message: 'An unexpected server error occurred',
        code: 'INTERNAL_ERROR',
    });
}

module.exports = { errorHandler };