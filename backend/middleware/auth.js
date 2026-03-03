// FILE: /backend/middleware/auth.js
// Why try/catch: JWT verification throws on invalid/expired tokens —
// this is one of the four allowed try/catch cases.
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided', code: 'NO_TOKEN' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { userId, roleId, roleName, email }
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token', code: 'INVALID_TOKEN' });
    }
}

module.exports = { authenticate };