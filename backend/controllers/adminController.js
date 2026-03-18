// FILE: backend/controllers/adminController.js
const bcrypt  = require('bcryptjs');
const prisma  = require('../lib/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

// ─── DASHBOARD ────────────────────────────────────────────────
const getDashboard = asyncHandler(async (req, res) => {
  const [userCount, deptCount, programCount, trainerCount, studentCount, pendingComplaints] =
    await Promise.all([
      prisma.user.count(),
      prisma.department.count(),
      prisma.program.count(),
      prisma.trainer.count(),
      prisma.student.count(),
      prisma.complaint.count({ where: { status: 'pending' } }),
    ]);

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { userRoles: { include: { role: true } } },
  });

  const deptOverview = await prisma.department.findMany({
    include: {
      programs: { select: { id: true } },
      _count: { select: { programs: true } },
    },
  });

  return res.json({
    success: true,
    data: {
      stats: { userCount, deptCount, programCount, trainerCount, studentCount, pendingComplaints },
      recentUsers: recentUsers.map(u => ({
        id: u.id, fullName: u.fullName, email: u.email, createdAt: u.createdAt,
        roles: u.userRoles.map(ur => ur.role.name),
      })),
      deptOverview,
    },
  });
});

// ─── USERS ────────────────────────────────────────────────────
const getUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    include: { userRoles: { include: { role: true } } },
    orderBy: { fullName: 'asc' },
  });
  return res.json({
    success: true,
    data: users.map(u => ({
      ...u,
      passwordHash: undefined,
      roles: u.userRoles.map(ur => ur.role.name),
    })),
  });
});

const createUserHandler = asyncHandler(async (req, res) => {
  const { fullName, email, roleName, department, phone, status } = req.body;
  if (!fullName || !email || !roleName || !phone)
    return res.status(400).json({ success: false, message: 'fullName, email, roleName, phone required', code: 'MISSING_FIELDS' });

  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) return res.status(400).json({ success: false, message: 'Invalid role name', code: 'INVALID_ROLE' });

  // Default password = phone number
  const hash = await bcrypt.hash(phone, Number(process.env.BCRYPT_SALT_ROUNDS) || 12);

  const user = await prisma.user.create({
    data: {
      fullName, email: email.toLowerCase().trim(), passwordHash: hash, phone,
      department: department || null, status: status || 'active', passwordChanged: false,
      userRoles: { create: { roleId: role.id } },
    },
    include: { userRoles: { include: { role: true } } },
  });

  // Create trainer profile if role is trainer
  if (roleName === 'trainer') {
    await prisma.trainer.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
  }

  // Assign HOD to department
  if (roleName === 'hod' && department) {
    await prisma.department.updateMany({
      where: { name: department },
      data: { hodUserId: user.id, hodName: fullName },
    });
  }

  return res.status(201).json({
    success: true,
    data: { ...user, passwordHash: undefined, roles: user.userRoles.map(ur => ur.role.name) },
  });
});

const updateUserHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullName, email, phone, department, status, roles } = req.body;

  const user = await prisma.user.update({
    where: { id: Number(id) },
    data: {
      fullName, email: email?.toLowerCase().trim(), phone, department, status,
    },
  });

  // Update roles if provided
  if (roles !== undefined) {
    // Clear current roles
    await prisma.userRole.deleteMany({ where: { userId: Number(id) } });

    // Clear HOD assignments from old role
    await prisma.department.updateMany({ where: { hodUserId: Number(id) }, data: { hodUserId: null, hodName: null } });

    for (const roleName of roles) {
      const role = await prisma.role.findUnique({ where: { name: roleName } });
      if (role) await prisma.userRole.create({ data: { userId: Number(id), roleId: role.id } });

      if (roleName === 'trainer') {
        await prisma.trainer.upsert({ where: { userId: Number(id) }, update: {}, create: { userId: Number(id) } });
      }
      if (roleName === 'hod' && department) {
        await prisma.department.updateMany({ where: { name: department }, data: { hodUserId: Number(id), hodName: fullName } });
      }
    }
  }

  return res.json({ success: true, data: user });
});

const deleteUserHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.department.updateMany({ where: { hodUserId: Number(id) }, data: { hodUserId: null, hodName: null } });
  await prisma.user.delete({ where: { id: Number(id) } });
  return res.json({ success: true, data: { deleted: true } });
});

// ─── DEPARTMENTS ──────────────────────────────────────────────
const getDepartmentsHandler = asyncHandler(async (req, res) => {
  const depts = await prisma.department.findMany({
    include: {
      hod: { select: { fullName: true, email: true } },
      _count: { select: { programs: true } },
    },
    orderBy: { name: 'asc' },
  });
  return res.json({ success: true, data: depts });
});

const createDepartmentHandler = asyncHandler(async (req, res) => {
  const { name, code, hodUserId, status } = req.body;
  if (!name || !code) return res.status(400).json({ success: false, message: 'name and code required', code: 'MISSING_FIELDS' });

  let hodName = null;
  if (hodUserId) {
    const hod = await prisma.user.findUnique({ where: { id: Number(hodUserId) } });
    if (hod) hodName = hod.fullName;
  }

  const dept = await prisma.department.create({
    data: { name, code, hodUserId: hodUserId ? Number(hodUserId) : null, hodName, status: status || 'active' },
  });
  return res.status(201).json({ success: true, data: dept });
});

const updateDepartmentHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, hodUserId, status } = req.body;

  let hodName = null;
  if (hodUserId) {
    const hod = await prisma.user.findUnique({ where: { id: Number(hodUserId) } });
    if (hod) hodName = hod.fullName;
  }

  const dept = await prisma.department.update({
    where: { id: Number(id) },
    data: { name, code, hodUserId: hodUserId ? Number(hodUserId) : null, hodName, status },
  });
  return res.json({ success: true, data: dept });
});

const deleteDepartmentHandler = asyncHandler(async (req, res) => {
  await prisma.department.delete({ where: { id: Number(req.params.id) } });
  return res.json({ success: true, data: { deleted: true } });
});

// ─── PROGRAMS ─────────────────────────────────────────────────
const getProgramsHandler = asyncHandler(async (req, res) => {
  const programs = await prisma.program.findMany({
    include: {
      department: { select: { name: true, code: true } },
      _count: { select: { sessions: true, students: true, enrollments: true } },
    },
    orderBy: { name: 'asc' },
  });
  return res.json({ success: true, data: programs });
});

const createProgramHandler = asyncHandler(async (req, res) => {
  const { name, code, departmentId, durationYears, status } = req.body;
  if (!name || !code) return res.status(400).json({ success: false, message: 'name and code required', code: 'MISSING_FIELDS' });

  const program = await prisma.program.create({
    data: {
      name, code,
      departmentId: departmentId ? Number(departmentId) : null,
      durationYears: Number(durationYears) || 3,
      status: status || 'active',
    },
  });
  return res.status(201).json({ success: true, data: program });
});

const updateProgramHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, departmentId, durationYears, status } = req.body;
  const program = await prisma.program.update({
    where: { id: Number(id) },
    data: { name, code, departmentId: departmentId ? Number(departmentId) : null, durationYears: Number(durationYears), status },
  });
  return res.json({ success: true, data: program });
});

const deleteProgramHandler = asyncHandler(async (req, res) => {
  await prisma.program.delete({ where: { id: Number(req.params.id) } });
  return res.json({ success: true, data: { deleted: true } });
});

// ─── PROGRAM COURSES (NEW: Full page with CRUD per semester) ──
const getProgramCoursesHandler = asyncHandler(async (req, res) => {
  const { id } = req.params; // programId

  const program = await prisma.program.findUnique({
    where: { id: Number(id) },
    include: { department: true },
  });
  if (!program) return res.status(404).json({ success: false, message: 'Program not found', code: 'NOT_FOUND' });

  // Get all sessions (grouped by level+semester) with their courses
  const sessions = await prisma.session.findMany({
    where: { programId: Number(id) },
    include: {
      academicLevel: true,
      semester: true,
      academicYear: true,
      courses: {
        include: {
          trainerCourses: {
            include: { trainer: { include: { user: true } } },
          },
        },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: [
      { academicLevel: { levelOrder: 'asc' } },
      { semester: { semesterOrder: 'asc' } },
    ],
  });

  return res.json({ success: true, data: { program, sessions } });
});

// ─── COURSES CRUD ─────────────────────────────────────────────
const createCourseHandler = asyncHandler(async (req, res) => {
  const { name, code, credits, hoursPerWeek, sessionId } = req.body;
  if (!name || !code || !sessionId)
    return res.status(400).json({ success: false, message: 'name, code, sessionId required', code: 'MISSING_FIELDS' });

  const course = await prisma.course.create({
    data: {
      name, code,
      credits: Number(credits) || 3,
      hoursPerWeek: Number(hoursPerWeek) || 2,
      sessionId: Number(sessionId),
    },
  });
  return res.status(201).json({ success: true, data: course });
});

const updateCourseHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, credits, hoursPerWeek } = req.body;
  const course = await prisma.course.update({
    where: { id: Number(id) },
    data: { name, code, credits: Number(credits), hoursPerWeek: Number(hoursPerWeek) },
  });
  return res.json({ success: true, data: course });
});

const deleteCourseHandler = asyncHandler(async (req, res) => {
  await prisma.course.delete({ where: { id: Number(req.params.id) } });
  return res.json({ success: true, data: { deleted: true } });
});

const assignTrainerHandler = asyncHandler(async (req, res) => {
  const { id: courseId } = req.params;
  const { trainerId } = req.body;

  // Remove existing assignment
  await prisma.trainerCourse.deleteMany({ where: { courseId: Number(courseId) } });

  if (trainerId) {
    await prisma.trainerCourse.create({
      data: { trainerId: Number(trainerId), courseId: Number(courseId) },
    });
  }
  return res.json({ success: true, data: { assigned: !!trainerId } });
});

// ─── CERTIFICATIONS CRUD ──────────────────────────────────────
const getCertificationsHandler = asyncHandler(async (req, res) => {
  const certs = await prisma.certification.findMany({
    include: {
      trainerCourses: {
        include: { trainer: { include: { user: true } } },
      },
      _count: { select: { enrollments: true } },
    },
    orderBy: { name: 'asc' },
  });
  return res.json({ success: true, data: certs });
});

const createCertificationHandler = asyncHandler(async (req, res) => {
  const { name, code, description, durationHours, status } = req.body;
  if (!name || !code) return res.status(400).json({ success: false, message: 'name and code required', code: 'MISSING_FIELDS' });

  const cert = await prisma.certification.create({
    data: { name, code, description, durationHours: Number(durationHours) || 40, status: status || 'active' },
  });
  return res.status(201).json({ success: true, data: cert });
});

const updateCertificationHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, description, durationHours, status } = req.body;
  const cert = await prisma.certification.update({
    where: { id: Number(id) },
    data: { name, code, description, durationHours: Number(durationHours), status },
  });
  return res.json({ success: true, data: cert });
});

const deleteCertificationHandler = asyncHandler(async (req, res) => {
  await prisma.certification.delete({ where: { id: Number(req.params.id) } });
  return res.json({ success: true, data: { deleted: true } });
});

const assignTrainerToCertHandler = asyncHandler(async (req, res) => {
  const { id: certId } = req.params;
  const { trainerId } = req.body;

  await prisma.trainerCourse.deleteMany({ where: { certificationId: Number(certId) } });
  if (trainerId) {
    await prisma.trainerCourse.create({
      data: { trainerId: Number(trainerId), certificationId: Number(certId) },
    });
  }
  return res.json({ success: true, data: { assigned: !!trainerId } });
});

// ─── ROOMS ────────────────────────────────────────────────────
const getRoomsHandler = asyncHandler(async (req, res) => {
  const rooms = await prisma.room.findMany({ orderBy: { name: 'asc' } });
  return res.json({ success: true, data: rooms });
});

const createRoomHandler = asyncHandler(async (req, res) => {
  const { name, code, building, capacity, roomType, status } = req.body;
  if (!name || !code) return res.status(400).json({ success: false, message: 'name and code required', code: 'MISSING_FIELDS' });

  const room = await prisma.room.create({
    data: { name, code, building, capacity: Number(capacity) || 30, roomType: roomType || 'Classroom', status: status || 'available' },
  });
  return res.status(201).json({ success: true, data: room });
});

const updateRoomHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, building, capacity, roomType, status } = req.body;
  const room = await prisma.room.update({
    where: { id: Number(id) },
    data: { name, code, building, capacity: Number(capacity), roomType, status },
  });
  return res.json({ success: true, data: room });
});

const deleteRoomHandler = asyncHandler(async (req, res) => {
  await prisma.room.delete({ where: { id: Number(req.params.id) } });
  return res.json({ success: true, data: { deleted: true } });
});

// ─── ACADEMIC YEARS ───────────────────────────────────────────
const getAcademicYearsHandler = asyncHandler(async (req, res) => {
  const years = await prisma.academicYear.findMany({
    include: { program: { select: { name: true } }, certification: { select: { name: true } } },
    orderBy: { startDate: 'desc' },
  });
  return res.json({ success: true, data: years });
});

const createAcademicYearHandler = asyncHandler(async (req, res) => {
  const { name, startDate, endDate, isActive, programId, certificationId } = req.body;
  if (!name || !startDate || !endDate)
    return res.status(400).json({ success: false, message: 'name, startDate, endDate required', code: 'MISSING_FIELDS' });

  const year = await prisma.academicYear.create({
    data: {
      name, startDate: new Date(startDate), endDate: new Date(endDate),
      isActive: !!isActive,
      programId: programId ? Number(programId) : null,
      certificationId: certificationId ? Number(certificationId) : null,
    },
  });
  return res.status(201).json({ success: true, data: year });
});

// ─── COMPLAINTS ───────────────────────────────────────────────
const getComplaintsHandler = asyncHandler(async (req, res) => {
  const complaints = await prisma.complaint.findMany({
    include: {
      parent: { include: { user: { select: { fullName: true, email: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ success: true, data: complaints });
});

const updateComplaintHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, adminResponse } = req.body;
  const complaint = await prisma.complaint.update({
    where: { id: Number(id) },
    data: { status, adminResponse },
  });
  return res.json({ success: true, data: complaint });
});

// ─── SESSIONS CRUD ────────────────────────────────────────────
const getSessionsForProgramHandler = asyncHandler(async (req, res) => {
  const sessions = await prisma.session.findMany({
    where: { programId: Number(req.params.id) },
    include: { academicLevel: true, semester: true, academicYear: true },
    orderBy: [{ academicLevel: { levelOrder: 'asc' } }, { semester: { semesterOrder: 'asc' } }],
  });
  return res.json({ success: true, data: sessions });
});

const createSessionHandler = asyncHandler(async (req, res) => {
  const { programId, academicYearId, academicLevelId, semesterId } = req.body;
  const session = await prisma.session.create({
    data: {
      programId: Number(programId),
      academicYearId: academicYearId ? Number(academicYearId) : null,
      academicLevelId: academicLevelId ? Number(academicLevelId) : null,
      semesterId: semesterId ? Number(semesterId) : null,
    },
  });
  return res.status(201).json({ success: true, data: session });
});

// ─── ACADEMIC LEVELS & SEMESTERS ──────────────────────────────
const getAcademicLevelsHandler = asyncHandler(async (req, res) => {
  const levels = await prisma.academicLevel.findMany({ orderBy: [{ programId: 'asc' }, { levelOrder: 'asc' }] });
  return res.json({ success: true, data: levels });
});

const getSemestersHandler = asyncHandler(async (req, res) => {
  const semesters = await prisma.semester.findMany({ orderBy: { semesterOrder: 'asc' } });
  return res.json({ success: true, data: semesters });
});

const getTrainersByDeptHandler = asyncHandler(async (req, res) => {
  const { id } = req.params; // department id
  const dept = await prisma.department.findUnique({ where: { id: Number(id) } });
  if (!dept) return res.status(404).json({ success: false, message: 'Department not found', code: 'NOT_FOUND' });

  const trainers = await prisma.trainer.findMany({
    where: { user: { department: dept.name } },
    include: { user: { select: { id: true, fullName: true, email: true } } },
  });
  return res.json({ success: true, data: trainers });
});

module.exports = {
  getDashboard,
  getUsers,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
  getDepartmentsHandler,
  createDepartmentHandler,
  updateDepartmentHandler,
  deleteDepartmentHandler,
  getProgramsHandler,
  createProgramHandler,
  updateProgramHandler,
  deleteProgramHandler,
  getProgramCoursesHandler,
  createCourseHandler,
  updateCourseHandler,
  deleteCourseHandler,
  assignTrainerHandler,
  getCertificationsHandler,
  createCertificationHandler,
  updateCertificationHandler,
  deleteCertificationHandler,
  assignTrainerToCertHandler,
  getRoomsHandler,
  createRoomHandler,
  updateRoomHandler,
  deleteRoomHandler,
  getAcademicYearsHandler,
  createAcademicYearHandler,
  getComplaintsHandler,
  updateComplaintHandler,
  getSessionsForProgramHandler,
  createSessionHandler,
  getAcademicLevelsHandler,
  getSemestersHandler,
  getTrainersByDeptHandler,
};
