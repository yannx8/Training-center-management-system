const roleCheck = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ success: false, message: 'Forbidden: No role assigned' });
        }

        const hasPermission = allowedRoles.some(role => role.toLowerCase() === req.user.role.toLowerCase());

        if (!hasPermission) {
            return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};

module.exports = { roleCheck };