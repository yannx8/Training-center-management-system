const roleCheck = (allowedRole) => {
    return (req, res, next) => {
        if (!req.user || !req.user.roleName) {
            return res.status(403).json({ success: false, message: 'Forbidden: No role assigned', code: 'NO_ROLE' });
        }

        // allowedRole can be a string or array
        const allowed = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
        const hasPermission = allowed.some(r => r.toLowerCase() === req.user.roleName.toLowerCase());

        if (!hasPermission) {
            return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' });
        }
        next();
    };
};

module.exports = { roleCheck };