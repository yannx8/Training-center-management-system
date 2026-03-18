// FILE: backend/middleware/auth.js
const jwt = require('jsonwebtoken');

/**
 * Verifies the Bearer JWT in the Authorization header.
 * Attaches decoded payload to req.user.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing or malformed token', code: 'NO_TOKEN' });
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token invalid or expired', code: 'INVALID_TOKEN' });
  }
}

/**
 * Role-check factory.
 * Usage: authorize('admin', 'secretary')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated', code: 'NOT_AUTHENTICATED' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions', code: 'FORBIDDEN' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
