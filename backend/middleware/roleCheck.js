// FILE: /backend/middleware/roleCheck.js
// Why no try/catch: role mismatch is a business rule, not an exception.
// We read roleName from the JWT payload (set in auth.js) and compare directly.
const { USER_ROLES } = require('../constants/roles');

function roleCheck(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !req.user.roleName) {
            return res.status(403).json({ success: false, message: 'Access denied', code: 'FORBIDDEN' });
        }
        if (!allowedRoles.includes(req.user.roleName)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user.roleName}' is not permitted to access this resource`,
                code: 'ROLE_NOT_PERMITTED',
            });
        }
        next();
    };
}

module.exports = { roleCheck };