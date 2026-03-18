// FILE: backend/controllers/secretaryController.js
const bcrypt  = require("bcryptjs");
const prisma  = require("../lib/prisma");
const { asyncHandler } = require("../middleware/errorHandler");

function generateMatricule(programCode, year, seq) {
  return `${programCode}-${year}-${String(seq).padStart(4, "0")}`;
}

// ── DASHBOARD — school overview (no complaints) ──────────────────
const getDashboard = asyncHandler(async (req, res) => {
  const [studentCount, programCount, certCount, deptCount, recentStudents] = await Promise.all([
    prisma.student.count(),
    prisma.program.count({ where: { status: "active" } }),
    prisma.certification.count({ where: { status: "active" } }),
    prisma.department.count(),
    prisma.student.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        program: { select: { name: true, code: true } },
      },
    }),
  ]);
  return res.json({ success: true, data: { studentCount, programCount, certCount, deptCount, recentStudents } });
});

// ── ALL STUDENTS ─────────────────────────────────────────────────
const getAllStudentsHandler = asyncHandler(async (req, res) => {
  const students = await prisma.student.findMany({
    include: {
      user: { select: { fullName: true, email: true, phone: true, status: true, createdAt: true } },
      program: { include: { department: { select: { name: true } } } },
      enrollments: { include: { certification: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ success: true, data: students });
});

// ── REGISTER STUDENT ─────────────────────────────────────────────
// FIX: Hash passwords BEFORE transaction to avoid 5s timeout.
// FIX: Parent is optional. Enroll in program OR certification, not both.
// FIX: Check capacity before enrolling.
const registerStudentHandler = asyncHandler(async (req, res) => {
  const {
    fullName, email, phone, dateOfBirth, programId, certificationId,
    parentFullName, parentEmail, parentPhone, parentRelationship,
  } = req.body;

  if (!fullName || !email || !phone)
    return res.status(400).json({ success: false, message: "fullName, email, phone required", code: "MISSING_FIELDS" });
  if (!programId && !certificationId)
    return res.status(400).json({ success: false, message: "Must enroll in a program or a certification", code: "MISSING_ENROLLMENT" });
  if (programId && certificationId)
    return res.status(400).json({ success: false, message: "Cannot enroll in both a program and a certification at once", code: "DUAL_ENROLLMENT" });

  // ── Capacity check ──────────────────────────────────────────
  if (programId) {
    const prog = await prisma.program.findUnique({
      where: { id: Number(programId) },
      include: { _count: { select: { enrollments: true } } },
    });
    if (!prog) return res.status(404).json({ success: false, message: "Program not found", code: "NOT_FOUND" });
    if (prog.capacity && prog._count.enrollments >= prog.capacity)
      return res.status(409).json({ success: false, message: `Program "${prog.name}" is full (capacity: ${prog.capacity})`, code: "PROGRAM_FULL" });
  }

  if (certificationId) {
    const cert = await prisma.certification.findUnique({
      where: { id: Number(certificationId) },
      include: { _count: { select: { enrollments: true } } },
    });
    if (!cert) return res.status(404).json({ success: false, message: "Certification not found", code: "NOT_FOUND" });
    if (cert.capacity && cert._count.enrollments >= cert.capacity)
      return res.status(409).json({ success: false, message: `Certification "${cert.name}" is full (capacity: ${cert.capacity})`, code: "CERT_FULL" });
  }

  // ── Hash passwords BEFORE transaction (fixes 5s timeout) ───
  const SALT = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
  const studentHash = await bcrypt.hash(phone, SALT);
  const parentHash  = parentEmail ? await bcrypt.hash(parentPhone || phone, SALT) : null;

  // Determine department name for student user record
  let deptName = "";
  if (programId) {
    const p = await prisma.program.findUnique({ where: { id: Number(programId) }, include: { department: true } });
    deptName = p?.department?.name || "";
  }

  // Generate matricule
  const year  = new Date().getFullYear();
  const count = await prisma.student.count();
  const code  = programId
    ? (await prisma.program.findUnique({ where: { id: Number(programId) } }))?.code || "STU"
    : (await prisma.certification.findUnique({ where: { id: Number(certificationId) } }))?.code || "CERT";
  const matricule = generateMatricule(code, year, count + 1);

  // Active academic year for program enrollment
  const activeYear = programId
    ? await prisma.academicYear.findFirst({ where: { programId: Number(programId), isActive: true } })
    : null;

  // ── Transaction (fast — no hashing inside) ──────────────────
  const result = await prisma.$transaction(async (tx) => {
    const studentRole = await tx.role.findUnique({ where: { name: "student" } });

    const studentUser = await tx.user.create({
      data: {
        fullName, email: email.toLowerCase().trim(),
        passwordHash: studentHash, phone,
        department: deptName, status: "active", passwordChanged: false,
        userRoles: { create: { roleId: studentRole.id } },
      },
    });

    const student = await tx.student.create({
      data: {
        userId: studentUser.id,
        matricule,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        programId: programId ? Number(programId) : null,
      },
    });

    // Enrollment — program OR certification
    if (programId) {
      await tx.enrollment.create({
        data: {
          studentId: student.id,
          programId: Number(programId),
          academicYearId: activeYear?.id || null,
          status: "active",
        },
      });
    } else {
      await tx.enrollment.create({
        data: { studentId: student.id, certificationId: Number(certificationId), status: "active" },
      });
    }

    // Parent — fully optional
    let parentRecord = null;
    if (parentEmail && parentHash) {
      const parentRole = await tx.role.findUnique({ where: { name: "parent" } });
      let parentUser = await tx.user.findUnique({ where: { email: parentEmail.toLowerCase().trim() } });
      if (!parentUser) {
        parentUser = await tx.user.create({
          data: {
            fullName: parentFullName || "Parent",
            email: parentEmail.toLowerCase().trim(),
            passwordHash: parentHash,
            phone: parentPhone || phone,
            status: "active", passwordChanged: false,
            userRoles: { create: { roleId: parentRole.id } },
          },
        });
      }
      let parent = await tx.parent.findUnique({ where: { userId: parentUser.id } });
      if (!parent) {
        parent = await tx.parent.create({
          data: { userId: parentUser.id, relationship: parentRelationship || "Father" },
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
  }, { timeout: 30000 }); // 30s timeout — safe since hashing is outside

  return res.status(201).json({ success: true, data: result });
});

// ── UPDATE STUDENT ────────────────────────────────────────────────
const updateStudentHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullName, phone, dateOfBirth, programId, status } = req.body;
  const student = await prisma.student.findUnique({ where: { id: Number(id) } });
  if (!student) return res.status(404).json({ success: false, message: "Student not found", code: "NOT_FOUND" });
  if (student.userId) {
    await prisma.user.update({ where: { id: student.userId }, data: { fullName, phone, status } });
  }
  const updated = await prisma.student.update({
    where: { id: Number(id) },
    data: {
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      programId: programId ? Number(programId) : undefined,
    },
  });
  return res.json({ success: true, data: updated });
});

// ── LOOKUP DATA ───────────────────────────────────────────────────
const getProgramsHandler = asyncHandler(async (req, res) => {
  const { departmentId } = req.query;
  const programs = await prisma.program.findMany({
    where: { status: "active", ...(departmentId ? { departmentId: Number(departmentId) } : {}) },
    include: {
      department: { select: { name: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { name: "asc" },
  });
  return res.json({ success: true, data: programs });
});

const getCertificationsHandler = asyncHandler(async (req, res) => {
  const certs = await prisma.certification.findMany({
    where: { status: "active" },
    include: { _count: { select: { enrollments: true } } },
    orderBy: { name: "asc" },
  });
  return res.json({ success: true, data: certs });
});

const getDepartmentsHandler = asyncHandler(async (req, res) => {
  const depts = await prisma.department.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
  });
  return res.json({ success: true, data: depts });
});

module.exports = {
  getDashboard,
  getAllStudentsHandler,
  registerStudentHandler,
  updateStudentHandler,
  getProgramsHandler,
  getCertificationsHandler,
  getDepartmentsHandler,
};
