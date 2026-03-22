const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const prisma  = require('../lib/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
}

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password are required' });

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { userRoles: { include: { role: true } } },
  });

  if (!user)
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  if (user.status === 'inactive')
    return res.status(403).json({ success: false, message: 'Account is inactive' });

  const match = await bcrypt.compare(password, user.passwordHash).catch(() => false);
  if (!match)
    return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const roles = user.userRoles.map(ur => ur.role.name);

  if (roles.length === 1) {
    const token = signToken({ userId: user.id, role: roles[0], email: user.email });
    return res.json({
      success: true,
      data: {
        token, role: roles[0],
        user: { id: user.id, fullName: user.fullName, email: user.email, passwordChanged: user.passwordChanged },
        requiresPasswordChange: !user.passwordChanged,
      },
    });
  }

  return res.json({
    success: true,
    data: { multipleRoles: true, roles, userId: user.id, fullName: user.fullName, requiresPasswordChange: !user.passwordChanged },
  });
});

const selectRole = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;
  if (!userId || !role)
    return res.status(400).json({ success: false, message: 'userId and role required' });

  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    include: { userRoles: { include: { role: true } } },
  });

  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const hasRole = user.userRoles.some(ur => ur.role.name === role);
  if (!hasRole)
    return res.status(403).json({ success: false, message: 'Role not assigned to user' });

  const token = signToken({ userId: user.id, role, email: user.email });
  return res.json({
    success: true,
    data: {
      token, role,
      user: { id: user.id, fullName: user.fullName, email: user.email, passwordChanged: user.passwordChanged },
      requiresPasswordChange: !user.passwordChanged,
    },
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword)
    return res.status(400).json({ success: false, message: 'oldPassword and newPassword required' });
  if (newPassword.length < 6)
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  const match = await bcrypt.compare(oldPassword, user.passwordHash).catch(() => false);
  if (!match)
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });

  const hash = await bcrypt.hash(newPassword, Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
  await prisma.user.update({ where: { id: req.user.userId }, data: { passwordHash: hash, passwordChanged: true } });

  return res.json({ success: true, data: { message: 'Password updated successfully' } });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: {
      id: true, fullName: true, email: true, phone: true,
      department: true, status: true, passwordChanged: true, createdAt: true,
      userRoles: { include: { role: true } },
    },
  });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  // Grab student info if applicable
  let studentInfo = null;
  if (req.user.role === 'student') {
    studentInfo = await prisma.student.findUnique({
      where: { userId: req.user.userId },
      select: { matricule: true, dateOfBirth: true, programId: true },
    });
  }

  return res.json({
    success: true,
    data: { ...user, roles: user.userRoles.map(ur => ur.role.name), studentInfo },
  });
});

// PUT /auth/profile  — update own profile info
const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone } = req.body;
  if (!fullName) return res.status(400).json({ success: false, message: 'fullName required' });

  const updated = await prisma.user.update({
    where: { id: req.user.userId },
    data: { fullName, phone: phone || undefined },
    select: { id: true, fullName: true, email: true, phone: true },
  });

  // If student, update dateOfBirth (students can't change matricule)
  if (req.user.role === 'student' && req.body.dateOfBirth !== undefined) {
    await prisma.student.update({
      where: { userId: req.user.userId },
      data: { dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null },
    });
  }

  // Sync localStorage name via response
  return res.json({ success: true, data: updated });
});

module.exports = { login, selectRole, changePassword, getMe, updateProfile };
