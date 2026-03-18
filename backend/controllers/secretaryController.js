// FILE: backend/controllers/secretaryController.js
const bcrypt  = require('bcryptjs');
const prisma  = require('../lib/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

// Matricule generation helper
function generateMatricule(programCode, year, seq) {
  return `${programCode}-${year}-${String(seq).padStart(4, '0')}`;
}

// ─── DASHBOARD ────────────────────────────────────────────────
const getDashboard = asyncHandler(async (req, res) => {
  const [studentCount, recentStudents, pendingCount] = await Promise.all([
    prisma.student.count(),
    prisma.student.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        program: { select: { name: true, code: true } },
      },
    }),
    prisma.complaint.count({ where: { status: 'pending' } }),
  ]);

  return res.json({ success: true, data: { studentCount, recentStudents, pendingCount } });
});

// ─── GET ALL STUDENTS ─────────────────────────────────────────
const getAllStudentsHandler = asyncHandler(async (req, res) => {
  const students = await prisma.student.findMany({
    include: {
      user: { select: { fullName: true, email: true, phone: true, status: true, createdAt: true } },
      program: { include: { department: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ success: true, data: students });
});

// ─── REGISTER STUDENT (atomic transaction) ───────────────────
const registerStudentHandler = asyncHandler(async (req, res) => {
  const {
    fullName, email, phone, dateOfBirth, programId,
    parentFullName, parentEmail, parentPhone, parentRelationship,
    certificationIds,
  } = req.body;

  if (!fullName || !email || !phone || !programId)
    return res.status(400).json({ success: false, message: 'fullName, email, phone, programId required', code: 'MISSING_FIELDS' });

  const program = await prisma.program.findUnique({
    where: { id: Number(programId) },
    include: { academicYears: { where: { isActive: true }, take: 1 } },
  });
  if (!program) return res.status(404).json({ success: false, message: 'Program not found', code: 'NOT_FOUND' });

  // Generate sequential matricule
  const year = new Date().getFullYear();
  const count = await prisma.student.count();
  const matricule = generateMatricule(program.code, year, count + 1);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create student user
    const studentRole = await tx.role.findUnique({ where: { name: 'student' } });
    const studentHash = await bcrypt.hash(phone, Number(process.env.BCRYPT_SALT_ROUNDS) || 12);

    const studentUser = await tx.user.create({
      data: {
        fullName, email: email.toLowerCase().trim(), passwordHash: studentHash, phone,
        department: program.name, status: 'active', passwordChanged: false,
        userRoles: { create: { roleId: studentRole.id } },
      },
    });

    // 2. Create student record
    const student = await tx.student.create({
      data: {
        userId: studentUser.id,
        matricule,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        programId: Number(programId),
      },
    });

    // 3. Enroll in program (active academic year)
    const activeYear = program.academicYears[0];
    if (activeYear) {
      await tx.enrollment.create({
        data: {
          studentId: student.id,
          academicYearId: activeYear.id,
          programId: Number(programId),
          status: 'active',
        },
      });
    }

    // 4. Enroll in certifications if provided
    if (certificationIds?.length) {
      for (const certId of certificationIds) {
        await tx.enrollment.create({
          data: { studentId: student.id, certificationId: Number(certId), status: 'active' },
        });
      }
    }

    // 5. Create / find parent and link
    let parentRecord = null;
    if (parentEmail) {
      const parentRole = await tx.role.findUnique({ where: { name: 'parent' } });
      const parentHash = await bcrypt.hash(parentPhone || phone, Number(process.env.BCRYPT_SALT_ROUNDS) || 12);

      // Check if parent user already exists
      let parentUser = await tx.user.findUnique({ where: { email: parentEmail.toLowerCase().trim() } });
      if (!parentUser) {
        parentUser = await tx.user.create({
          data: {
            fullName: parentFullName || 'Parent', email: parentEmail.toLowerCase().trim(),
            passwordHash: parentHash, phone: parentPhone || phone,
            status: 'active', passwordChanged: false,
            userRoles: { create: { roleId: parentRole.id } },
          },
        });
      }

      let parent = await tx.parent.findUnique({ where: { userId: parentUser.id } });
      if (!parent) {
        parent = await tx.parent.create({
          data: { userId: parentUser.id, relationship: parentRelationship || 'Father' },
        });
      }

      await tx.parentStudentLink.upsert({
        where: { parentId_studentId: { parentId: parent.id, studentId: student.id } },
        update: {},
        create: { parentId: parent.id, studentId: student.id },
      });

      parentRecord = parent;
    }

    return { student, parentRecord };
  });

  return res.status(201).json({ success: true, data: result });
});

// ─── UPDATE STUDENT ───────────────────────────────────────────
const updateStudentHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullName, phone, dateOfBirth, programId, status } = req.body;

  const student = await prisma.student.findUnique({ where: { id: Number(id) } });
  if (!student) return res.status(404).json({ success: false, message: 'Student not found', code: 'NOT_FOUND' });

  await prisma.user.update({
    where: { id: student.userId ?? undefined },
    data: { fullName, phone, status },
  });

  const updated = await prisma.student.update({
    where: { id: Number(id) },
    data: {
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      programId: programId ? Number(programId) : undefined,
    },
  });

  return res.json({ success: true, data: updated });
});

// ─── PROGRAMS & CERTIFICATIONS (for registration form) ────────
const getProgramsHandler = asyncHandler(async (req, res) => {
  const programs = await prisma.program.findMany({
    where: { status: 'active' },
    include: { department: { select: { name: true } } },
    orderBy: { name: 'asc' },
  });
  return res.json({ success: true, data: programs });
});

const getCertificationsHandler = asyncHandler(async (req, res) => {
  const certs = await prisma.certification.findMany({
    where: { status: 'active' },
    orderBy: { name: 'asc' },
  });
  return res.json({ success: true, data: certs });
});

module.exports = {
  getDashboard,
  getAllStudentsHandler,
  registerStudentHandler,
  updateStudentHandler,
  getProgramsHandler,
  getCertificationsHandler,
};
