// FILE: backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

// ─── HELPERS ──────────────────────────────────────────────────

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
}

// ─── STEP 1: Validate credentials, return list of roles ───────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password are required', code: 'MISSING_FIELDS' });

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { userRoles: { include: { role: true } } },
  });

  if (!user)
    return res.status(401).json({ success: false, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });

  if (user.status === 'inactive')
    return res.status(403).json({ success: false, message: 'Account is inactive', code: 'ACCOUNT_INACTIVE' });

  const match = await bcrypt.compare(password, user.passwordHash).catch(() => false);
  if (!match)
    return res.status(401).json({ success: false, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });

  const roles = user.userRoles.map(ur => ur.role.name);

  // If only one role, issue token immediately
  if (roles.length === 1) {
    const token = signToken({ userId: user.id, role: roles[0], email: user.email });
    return res.json({
      success: true,
      data: {
        token,
        role: roles[0],
        user: { id: user.id, fullName: user.fullName, email: user.email, passwordChanged: user.passwordChanged },
        requiresPasswordChange: !user.passwordChanged,
      },
    });
  }

  // Multiple roles — client must call /select-role next
  return res.json({
    success: true,
    data: {
      multipleRoles: true,
      roles,
      userId: user.id,
      fullName: user.fullName,
      requiresPasswordChange: !user.passwordChanged,
    },
  });
});

// ─── STEP 2: Select role from multi-role account ──────────────
const selectRole = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;
  if (!userId || !role)
    return res.status(400).json({ success: false, message: 'userId and role required', code: 'MISSING_FIELDS' });

  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    include: { userRoles: { include: { role: true } } },
  });

  if (!user)
    return res.status(404).json({ success: false, message: 'User not found', code: 'NOT_FOUND' });

  const hasRole = user.userRoles.some(ur => ur.role.name === role);
  if (!hasRole)
    return res.status(403).json({ success: false, message: 'Role not assigned to user', code: 'ROLE_NOT_ASSIGNED' });

  const token = signToken({ userId: user.id, role, email: user.email });
  return res.json({
    success: true,
    data: {
      token,
      role,
      user: { id: user.id, fullName: user.fullName, email: user.email, passwordChanged: user.passwordChanged },
      requiresPasswordChange: !user.passwordChanged,
    },
  });
});

// ─── CHANGE PASSWORD ──────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.userId;

  if (!oldPassword || !newPassword)
    return res.status(400).json({ success: false, message: 'oldPassword and newPassword required', code: 'MISSING_FIELDS' });
  if (newPassword.length < 6)
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters', code: 'PASSWORD_TOO_SHORT' });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const match = await bcrypt.compare(oldPassword, user.passwordHash).catch(() => false);
  if (!match)
    return res.status(401).json({ success: false, message: 'Current password is incorrect', code: 'WRONG_PASSWORD' });

  const hash = await bcrypt.hash(newPassword, Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash, passwordChanged: true } });

  return res.json({ success: true, data: { message: 'Password updated successfully' } });
});

// ─── GET CURRENT USER ─────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: {
      id: true, fullName: true, email: true, phone: true,
      department: true, status: true, passwordChanged: true, createdAt: true,
      userRoles: { include: { role: true } },
    },
  });
  if (!user) return res.status(404).json({ success: false, message: 'User not found', code: 'NOT_FOUND' });

  return res.json({
    success: true,
    data: { ...user, roles: user.userRoles.map(ur => ur.role.name) },
  });
});

module.exports = { login, selectRole, changePassword, getMe };
