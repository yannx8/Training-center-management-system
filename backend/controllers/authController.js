// FILE: /backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { findUserByEmail, getUserRoles, markPasswordChanged, findUserById } = require('../queries/users');

// Step 1: Validate credentials, return user's roles for selection screen
async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ success: false, message: 'Email and password required', code: 'MISSING_FIELDS' });

    const [sql, params] = findUserByEmail(email);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(401).json({ success: false, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });

    const user = result.rows[0];
    if (user.status === 'inactive')
        return res.status(403).json({ success: false, message: 'Account is inactive', code: 'ACCOUNT_INACTIVE' });

    // try/catch: bcrypt.compare can throw on malformed hash — allowed case
    let match;
    try {
        match = await bcrypt.compare(password, user.password_hash);
    } catch {
        return res.status(500).json({ success: false, message: 'Authentication error', code: 'AUTH_ERROR' });
    }

    if (!match)
        return res.status(401).json({ success: false, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });

    const [rolesSql, rolesParams] = getUserRoles(user.id);
    const rolesResult = await pool.query(rolesSql, rolesParams);

    return res.json({
        success: true,
        data: {
            userId: user.id,
            fullName: user.full_name,
            email: user.email,
            requiresPasswordChange: !user.password_changed,
            roles: rolesResult.rows,
        },
    });
}

// Step 2: User picks a role, we issue a scoped JWT
async function selectRole(req, res) {
    const { userId, roleId } = req.body;
    if (!userId || !roleId)
        return res.status(400).json({ success: false, message: 'userId and roleId required', code: 'MISSING_FIELDS' });

    // Verify this user actually has this role
    const [rolesSql, rolesParams] = getUserRoles(userId);
    const rolesResult = await pool.query(rolesSql, rolesParams);
    const role = rolesResult.rows.find(r => r.role_id == roleId);

    if (!role)
        return res.status(403).json({ success: false, message: 'User does not have this role', code: 'ROLE_NOT_ASSIGNED' });

    const [userSql, userParams] = findUserById(userId);
    const userResult = await pool.query(userSql, userParams);
    const user = userResult.rows[0];

    // try/catch: jwt.sign can throw on invalid secret configuration
    let token;
    try {
        token = jwt.sign({ userId: user.id, roleId: role.role_id, roleName: role.role_name, email: user.email },
            process.env.JWT_SECRET, { expiresIn: '24h' }
        );
    } catch {
        return res.status(500).json({ success: false, message: 'Token generation failed', code: 'TOKEN_ERROR' });
    }

    return res.json({
        success: true,
        data: {
            token,
            user: { id: user.id, fullName: user.full_name, email: user.email, roleName: role.role_name },
            requiresPasswordChange: !user.password_changed,
        },
    });
}

async function changePassword(req, res) {
    const { newPassword } = req.body;
    const userId = req.user.userId;

    if (!newPassword || newPassword.length < 6)
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters', code: 'WEAK_PASSWORD' });

    let hash;
    try {
        hash = await bcrypt.hash(newPassword, parseInt(process.env.SALT_ROUNDS) || 12);
    } catch {
        return res.status(500).json({ success: false, message: 'Password hashing failed', code: 'HASH_ERROR' });
    }

    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, userId]);
    const [sql, params] = markPasswordChanged(userId);
    await pool.query(sql, params);

    return res.json({ success: true, data: { message: 'Password changed successfully' } });
}

module.exports = { login, selectRole, changePassword };