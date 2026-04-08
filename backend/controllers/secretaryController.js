const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

// Generates a unique matricule for a student (e.g., COMP-2024-0001).
// This is used as their official ID within the system.
function genMatricule(code, year, seq) {
  return `${code}-${year}-${String(seq).padStart(4, '0')}`;
}

// Builds the landing page for the secretary, showing current enrolment stats
// for programs and certifications for the active year.
const getDashboard = asyncHandler(async (req, res) => {
  const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
  
  // We list all active programs, optionally filtered by the current academic year if one is set.
  const programs = await prisma.program.findMany({
    where: { status: 'active', ...(activeYear ? { academicYears: { some: { id: activeYear.id } } } : {}) },
    include: { department: { select: { name: true } }, _count: { select: { enrollments: true } } },
    orderBy: { name: 'asc' },
  });

  const certifications = await prisma.certification.findMany({
    where: { status: 'active' },
    include: { _count: { select: { enrollments: true } }, trainerCourses: { include: { trainer: { include: { user: { select: { fullName: true } } } } } } },
    orderBy: { name: 'asc' },
  });

  const studentCount = await prisma.student.count();
  return res.json({ success: true, data: { activeYear, programs, certifications, studentCount } });
});

const getAllStudentsHandler = asyncHandler(async (req, res) => {
  const { programId, certificationId, status } = req.query;
  const where = {};
  if (status && status !== 'all') where.user = { status };
  if (programId) where.programId = Number(programId);
  if (certificationId) where.enrollments = { some: { certificationId: Number(certificationId) } };

  const students = await prisma.student.findMany({
    where,
    include: {
      user: { select: { fullName: true, email: true, phone: true, status: true, createdAt: true } },
      program: { include: { department: { select: { name: true } } } },
      enrollments: { include: { certification: { select: { name: true } }, program: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ success: true, data: students });
});

const { generateUniqueEmail } = require('../lib/userUtils');

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.toLowerCase());
}

const registerStudentHandler = asyncHandler(async (req, res) => {
  const {
    firstName, lastName, phone, dateOfBirth,
    programId, levelId, certificationId,
    parents = [],   // array of { firstName, lastName, email, phone, relationship }
  } = req.body;

  if (!firstName || !lastName || !phone)
    return res.status(400).json({ success: false, message: 'firstName, lastName, phone required' });
  if (!programId && !certificationId)
    return res.status(400).json({ success: false, message: 'Must enroll in a program or certification' });

  // Safety check: Make sure all provided parent emails are actually valid emails.
  for (const p of parents) {
    if (p.email && !validateEmail(p.email)) {
      return res.status(400).json({ success: false, message: `Invalid email format for parent: ${p.email}` });
    }
  }

  // Capacity check
  if (programId) {
    const prog = await prisma.program.findUnique({ where: { id: Number(programId) }, include: { _count: { select: { enrollments: true } } } });
    if (!prog) return res.status(404).json({ success: false, message: 'Program not found' });
    if (prog.capacity && prog._count.enrollments >= prog.capacity)
      return res.status(409).json({ success: false, message: `Program is full (${prog.capacity} max)` });
  }
  if (certificationId) {
    const cert = await prisma.certification.findUnique({ where: { id: Number(certificationId) }, include: { _count: { select: { enrollments: true } } } });
    if (!cert) return res.status(404).json({ success: false, message: 'Certification not found' });
    if (cert.capacity && cert._count.enrollments >= cert.capacity)
      return res.status(409).json({ success: false, message: `Certification is full (${cert.capacity} max)` });
  }

  const SALT = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
  const studentHash = await bcrypt.hash(phone, SALT);

  const fullName = `${firstName.trim()} ${lastName.trim()}`;
  const studentEmail = await generateUniqueEmail(firstName, lastName);

  // Hash parent passwords before transaction
  const parentsWithHash = await Promise.all(
    (parents || []).filter(p => p.email).map(async p => ({
      ...p,
      hash: await bcrypt.hash(p.phone || phone, SALT),
    }))
  );

  let deptName = '';
  if (programId) {
    const p = await prisma.program.findUnique({ where: { id: Number(programId) }, include: { department: true } });
    deptName = p?.department?.name || '';
  }

  const count = await prisma.student.count();
  const code = programId
    ? (await prisma.program.findUnique({ where: { id: Number(programId) } }))?.code || 'STU'
    : (await prisma.certification.findUnique({ where: { id: Number(certificationId) } }))?.code || 'CERT';
  const matricule = genMatricule(code, new Date().getFullYear(), count + 1);

  // We use a transaction here to ensure that if anything fails (creating user, enrolling, or linking parents),
  // none of the records are saved. It's an "all or nothing" deal for data integrity.
  const result = await prisma.$transaction(async tx => {
    const studentRole = await tx.role.findUnique({ where: { name: 'student' } });
    const studentUser = await tx.user.create({
      data: {
        fullName, email: studentEmail,
        passwordHash: studentHash, phone,
        department: deptName, status: 'active', passwordChanged: false,
        userRoles: { create: { roleId: studentRole.id } },
      },
    });

    const student = await tx.student.create({
      data: {
        userId: studentUser.id, matricule,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        programId: programId ? Number(programId) : null,
      },
    });

    if (programId) {
      await tx.enrollment.create({
        data: { studentId: student.id, programId: Number(programId), academicYearId: activeYear?.id || null, status: 'active' },
      });
    } else {
      await tx.enrollment.create({
        data: { studentId: student.id, certificationId: Number(certificationId), status: 'active' },
      });
    }

    // Link multiple parents
    const parentRole = await tx.role.findUnique({ where: { name: 'parent' } });
    for (const p of parentsWithHash) {
      let parentUser = await tx.user.findUnique({ where: { email: p.email.toLowerCase().trim() } });
      if (!parentUser) {
        parentUser = await tx.user.create({
          data: {
            fullName: `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Parent',
            email: p.email.toLowerCase().trim(),
            passwordHash: p.hash,
            phone: p.phone || phone,
            status: 'active', passwordChanged: false,
            userRoles: { create: { roleId: parentRole.id } },
          },
        });
      }
      let parent = await tx.parent.findUnique({ where: { userId: parentUser.id } });
      if (!parent) {
        parent = await tx.parent.create({ data: { userId: parentUser.id, relationship: p.relationship || 'Father' } });
      }
      await tx.parentStudentLink.upsert({
        where: { parentId_studentId: { parentId: parent.id, studentId: student.id } },
        update: {},
        create: { parentId: parent.id, studentId: student.id },
      });
    }

    return { student, matricule };
  }, { timeout: 30000 });

  return res.status(201).json({ success: true, data: result });
});

const updateStudentHandler = asyncHandler(async (req, res) => {
  const { fullName, phone, dateOfBirth, status } = req.body;
  const student = await prisma.student.findUnique({ where: { id: Number(req.params.id) } });
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  if (student.userId) {
    await prisma.user.update({ where: { id: student.userId }, data: { fullName, phone, status } });
  }
  const updated = await prisma.student.update({
    where: { id: Number(req.params.id) },
    data: { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined },
  });
  return res.json({ success: true, data: updated });
});

const getProgramsHandler = asyncHandler(async (req, res) => {
  const { departmentId } = req.query;
  const programs = await prisma.program.findMany({
    where: { status: 'active', ...(departmentId ? { departmentId: Number(departmentId) } : {}) },
    include: {
      department: { select: { name: true } },
      _count: { select: { enrollments: true } },
      levels: { orderBy: { levelOrder: 'asc' } }, // include levels for registration dropdown
    },
    orderBy: { name: 'asc' },
  });
  return res.json({ success: true, data: programs });
});

const getCertificationsHandler = asyncHandler(async (req, res) => {
  const certs = await prisma.certification.findMany({
    where: { status: 'active' },
    include: { _count: { select: { enrollments: true } } },
    orderBy: { name: 'asc' },
  });
  return res.json({ success: true, data: certs });
});

const getDepartmentsHandler = asyncHandler(async (req, res) => {
  const depts = await prisma.department.findMany({ where: { status: 'active' }, orderBy: { name: 'asc' } });
  return res.json({ success: true, data: depts });
});

module.exports = {
  getDashboard, getAllStudentsHandler, registerStudentHandler, updateStudentHandler,
  getProgramsHandler, getCertificationsHandler, getDepartmentsHandler,
};
