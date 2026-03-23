// FILE: backend/controllers/adminController.js
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { asyncHandler } = require("../middleware/errorHandler");

const getDashboard = asyncHandler(async(req, res) => {
    const [totalUsers, departments, programs, certifications, trainers, students, pendingComplaints] = await Promise.all([
        prisma.user.count(),
        prisma.department.count(),
        prisma.program.count(),
        prisma.certification.count(),
        prisma.trainer.count(),
        prisma.student.count(),
        prisma.complaint.count({ where: { status: "pending" } }),
    ]);
    const recentUsers = await prisma.user.findMany({
        orderBy: { createdAt: "desc" }, take: 5,
        include: { userRoles: { include: { role: true } } }
    });
    const deptOverview = await prisma.department.findMany({
        include: { _count: { select: { programs: true } } }
    });
    return res.json({
        success: true,
        data: {
            stats: { totalUsers, departments, programs, certifications, trainers, students, pendingComplaints },
            recentUsers: recentUsers.map(u => ({...u, passwordHash: undefined, roles: u.userRoles.map(ur => ur.role.name) })),
            deptOverview,
        }
    });
});

// ── USERS ─────────────────────────────────────────────────────────
const getUsers = asyncHandler(async(req, res) => {
    const { role, status } = req.query;
    const users = await prisma.user.findMany({
        where: {...(status ? { status } : {}), ...(role ? { userRoles: { some: { role: { name: role } } } } : {}) },
        include: { userRoles: { include: { role: true } } },
        orderBy: { fullName: "asc" },
    });
    return res.json({ success: true, data: users.map(u => ({...u, passwordHash: undefined, roles: u.userRoles.map(ur => ur.role.name) })) });
});

const createUserHandler = asyncHandler(async(req, res) => {
    const { fullName, email, roleName, department, phone, status } = req.body;
    if (!fullName || !email || !roleName || !phone)
        return res.status(400).json({ success: false, message: "fullName, email, roleName, phone required", code: "MISSING_FIELDS" });
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) return res.status(400).json({ success: false, message: "Invalid role name", code: "INVALID_ROLE" });
    const hash = await bcrypt.hash(phone, Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
    const user = await prisma.user.create({
        data: { fullName, email: email.toLowerCase().trim(), passwordHash: hash, phone, department: department || null, status: status || "active", passwordChanged: false, userRoles: { create: { roleId: role.id } } },
        include: { userRoles: { include: { role: true } } },
    });
    if (roleName === "trainer") await prisma.trainer.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
    if (roleName === "hod" && department) await prisma.department.updateMany({ where: { name: department }, data: { hodUserId: user.id, hodName: fullName } });
    return res.status(201).json({ success: true, data: {...user, passwordHash: undefined, roles: user.userRoles.map(ur => ur.role.name) } });
});

const updateUserHandler = asyncHandler(async(req, res) => {
    const { id } = req.params;
    const { fullName, email, phone, department, status, roles } = req.body;

    // Fixed: Replaced optional chaining with ternary operator
    const emailValue = email ? email.toLowerCase().trim() : undefined;

    const user = await prisma.user.update({
        where: { id: Number(id) },
        data: { fullName, email: emailValue, phone, department, status }
    });

    if (roles !== undefined) {
        await prisma.userRole.deleteMany({ where: { userId: Number(id) } });
        await prisma.department.updateMany({ where: { hodUserId: Number(id) }, data: { hodUserId: null, hodName: null } });
        for (const roleName of roles) {
            const role = await prisma.role.findUnique({ where: { name: roleName } });
            if (role) await prisma.userRole.create({ data: { userId: Number(id), roleId: role.id } });
            if (roleName === "trainer") await prisma.trainer.upsert({ where: { userId: Number(id) }, update: {}, create: { userId: Number(id) } });
            if (roleName === "hod" && department) await prisma.department.updateMany({ where: { name: department }, data: { hodUserId: Number(id), hodName: fullName } });
        }
    }
    return res.json({ success: true, data: user });
});

const deleteUserHandler = asyncHandler(async(req, res) => {
    await prisma.department.updateMany({ where: { hodUserId: Number(req.params.id) }, data: { hodUserId: null, hodName: null } });
    await prisma.user.delete({ where: { id: Number(req.params.id) } });
    return res.json({ success: true, data: { deleted: true } });
});

// ── DEPARTMENTS ───────────────────────────────────────────────────
const getDepartmentsHandler = asyncHandler(async(req, res) => {
    const depts = await prisma.department.findMany({ include: { hod: { select: { fullName: true, email: true } }, _count: { select: { programs: true } } }, orderBy: { name: "asc" } });
    return res.json({ success: true, data: depts });
});
const createDepartmentHandler = asyncHandler(async(req, res) => {
    const { name, code, hodUserId, status } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, message: "name and code required", code: "MISSING_FIELDS" });
    let hodName = null;
    if (hodUserId) { const h = await prisma.user.findUnique({ where: { id: Number(hodUserId) } }); if (h) hodName = h.fullName; }
    const dept = await prisma.department.create({ data: { name, code, hodUserId: hodUserId ? Number(hodUserId) : null, hodName, status: status || "active" } });
    return res.status(201).json({ success: true, data: dept });
});
const updateDepartmentHandler = asyncHandler(async(req, res) => {
    const { id } = req.params;
    const { name, code, hodUserId, status } = req.body;
    let hodName = null;
    if (hodUserId) { const h = await prisma.user.findUnique({ where: { id: Number(hodUserId) } }); if (h) hodName = h.fullName; }
    const dept = await prisma.department.update({ where: { id: Number(id) }, data: { name, code, hodUserId: hodUserId ? Number(hodUserId) : null, hodName, status } });
    return res.json({ success: true, data: dept });
});
const deleteDepartmentHandler = asyncHandler(async(req, res) => {
    await prisma.department.delete({ where: { id: Number(req.params.id) } });
    return res.json({ success: true, data: { deleted: true } });
});

// ── PROGRAMS ──────────────────────────────────────────────────────
const getProgramsHandler = asyncHandler(async(req, res) => {
    const programs = await prisma.program.findMany({
        include: { department: { select: { name: true, code: true } }, _count: { select: { enrollments: true } } },
        orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
    });
    const grouped = {};
    for (const p of programs) {
        // Fixed: Replaced optional chaining with ternary operator
        const key = p.department ? p.department.name : "No Department";
        if (!grouped[key]) grouped[key] = { department: p.department, programs: [] };
        grouped[key].programs.push({...p, enrollmentCount: p._count.enrollments });
    }
    return res.json({ success: true, data: programs, grouped: Object.values(grouped) });
});
const createProgramHandler = asyncHandler(async(req, res) => {
    const { name, code, departmentId, durationYears, status, capacity } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, message: "name and code required", code: "MISSING_FIELDS" });
    const program = await prisma.program.create({ data: { name, code, departmentId: departmentId ? Number(departmentId) : null, durationYears: Number(durationYears) || 3, status: status || "active", capacity: capacity ? Number(capacity) : null } });
    return res.status(201).json({ success: true, data: program });
});
const updateProgramHandler = asyncHandler(async(req, res) => {
    const { name, code, departmentId, durationYears, status, capacity } = req.body;
    const program = await prisma.program.update({ where: { id: Number(req.params.id) }, data: { name, code, departmentId: departmentId ? Number(departmentId) : null, durationYears: Number(durationYears), status, capacity: capacity ? Number(capacity) : null } });
    return res.json({ success: true, data: program });
});
const deleteProgramHandler = asyncHandler(async(req, res) => {
    await prisma.program.delete({ where: { id: Number(req.params.id) } });
    return res.json({ success: true, data: { deleted: true } });
});

// ── ACADEMIC LEVELS CRUD ──────────────────────────────────────────
const getAcademicLevelsHandler = asyncHandler(async(req, res) => {
    const { programId } = req.query;
    const levels = await prisma.academicLevel.findMany({
        where: programId ? { programId: Number(programId) } : {},
        include: { program: { select: { name: true, code: true } } },
        orderBy: [{ programId: "asc" }, { levelOrder: "asc" }],
    });
    return res.json({ success: true, data: levels });
});

const createAcademicLevelHandler = asyncHandler(async(req, res) => {
    const { name, programId, levelOrder } = req.body;
    if (!name || !programId) return res.status(400).json({ success: false, message: "name and programId required", code: "MISSING_FIELDS" });
    const level = await prisma.academicLevel.create({ data: { name, programId: Number(programId), levelOrder: Number(levelOrder) || 1 } });
    return res.status(201).json({ success: true, data: level });
});

const updateAcademicLevelHandler = asyncHandler(async(req, res) => {
    const { name, levelOrder } = req.body;
    const level = await prisma.academicLevel.update({ where: { id: Number(req.params.id) }, data: { name, levelOrder: Number(levelOrder) } });
    return res.json({ success: true, data: level });
});

const deleteAcademicLevelHandler = asyncHandler(async(req, res) => {
    await prisma.academicLevel.delete({ where: { id: Number(req.params.id) } });
    return res.json({ success: true, data: { deleted: true } });
});

// ── PROGRAM COURSES (hierarchical) ───────────────────────────────
// Returns the full program → levels → semesters → courses tree
const getProgramTreeHandler = asyncHandler(async(req, res) => {
    const program = await prisma.program.findUnique({ where: { id: Number(req.params.id) }, include: { department: true } });
    if (!program) return res.status(404).json({ success: false, message: "Program not found", code: "NOT_FOUND" });

    const levels = await prisma.academicLevel.findMany({
        where: { programId: Number(req.params.id) },
        orderBy: { levelOrder: "asc" },
    });

    const semesters = await prisma.semester.findMany({ orderBy: { semesterOrder: "asc" } });

    // For each level, get sessions by semester
    const levelTree = await Promise.all(levels.map(async level => {
        const semTree = await Promise.all(semesters.map(async sem => {
            const session = await prisma.session.findFirst({
                where: { programId: Number(req.params.id), academicLevelId: level.id, semesterId: sem.id },
            });
            const courses = session ? await prisma.course.findMany({
                where: { sessionId: session.id },
                include: {
                    trainerCourses: {
                        include: { trainer: { include: { user: { select: { fullName: true } } } } },
                    },
                },
                orderBy: { name: "asc" },
            }) : [];
            return { semester: sem, session, courses };
        }));
        return { level, semesters: semTree };
    }));

    return res.json({ success: true, data: { program, levels: levelTree } });
});

const getProgramCoursesHandler = asyncHandler(async(req, res) => {
    const program = await prisma.program.findUnique({ where: { id: Number(req.params.id) }, include: { department: true } });
    if (!program) return res.status(404).json({ success: false, message: "Program not found", code: "NOT_FOUND" });
    const sessions = await prisma.session.findMany({
        where: { programId: Number(req.params.id) },
        include: { academicLevel: true, semester: true, academicYear: true, courses: { include: { trainerCourses: { include: { trainer: { include: { user: true } } } } }, orderBy: { name: "asc" } } },
        orderBy: [{ academicLevel: { levelOrder: "asc" } }, { semester: { semesterOrder: "asc" } }],
    });
    return res.json({ success: true, data: { program, sessions } });
});

// ── COURSES ───────────────────────────────────────────────────────
const createCourseHandler = asyncHandler(async(req, res) => {
    const { name, code, credits, hoursPerWeek, sessionId } = req.body;
    if (!name || !code || !sessionId) return res.status(400).json({ success: false, message: "name, code, sessionId required", code: "MISSING_FIELDS" });
    const course = await prisma.course.create({ data: { name, code, credits: Number(credits) || 3, hoursPerWeek: Number(hoursPerWeek) || 2, sessionId: Number(sessionId) } });
    return res.status(201).json({ success: true, data: course });
});
const updateCourseHandler = asyncHandler(async(req, res) => {
    const { name, code, credits, hoursPerWeek } = req.body;
    const course = await prisma.course.update({ where: { id: Number(req.params.id) }, data: { name, code, credits: Number(credits), hoursPerWeek: Number(hoursPerWeek) } });
    return res.json({ success: true, data: course });
});
const deleteCourseHandler = asyncHandler(async(req, res) => {
    await prisma.course.delete({ where: { id: Number(req.params.id) } });
    return res.json({ success: true, data: { deleted: true } });
});

// FIX: Trainer assignment — find trainer by userId, not by user-table id
const assignTrainerHandler = asyncHandler(async(req, res) => {
    const courseId = Number(req.params.id);
    const { trainerId } = req.body; // this is trainers.id (trainer profile id)
    await prisma.trainerCourse.deleteMany({ where: { courseId } });
    if (trainerId) {
        await prisma.trainerCourse.create({ data: { trainerId: Number(trainerId), courseId } });
    }
    return res.json({ success: true, data: { assigned: !!trainerId } });
});

// ── CERTIFICATIONS ────────────────────────────────────────────────
const getCertificationsHandler = asyncHandler(async(req, res) => {
    const certs = await prisma.certification.findMany({
        include: { trainerCourses: { include: { trainer: { include: { user: true } } } }, _count: { select: { enrollments: true } } },
        orderBy: { name: "asc" },
    });
    return res.json({ success: true, data: certs });
});
const createCertificationHandler = asyncHandler(async(req, res) => {
    const { name, code, description, durationHours, status, capacity } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, message: "name and code required", code: "MISSING_FIELDS" });
    const cert = await prisma.certification.create({ data: { name, code, description, durationHours: Number(durationHours) || 40, status: status || "active", capacity: capacity ? Number(capacity) : null } });
    return res.status(201).json({ success: true, data: cert });
});
const updateCertificationHandler = asyncHandler(async(req, res) => {
    const { name, code, description, durationHours, status, capacity } = req.body;
    const cert = await prisma.certification.update({ where: { id: Number(req.params.id) }, data: { name, code, description, durationHours: Number(durationHours), status, capacity: capacity ? Number(capacity) : null } });
    return res.json({ success: true, data: cert });
});
const deleteCertificationHandler = asyncHandler(async(req, res) => {
    await prisma.certification.delete({ where: { id: Number(req.params.id) } });
    return res.json({ success: true, data: { deleted: true } });
});
const assignTrainerToCertHandler = asyncHandler(async(req, res) => {
    const certId = Number(req.params.id);
    const { trainerId } = req.body;
    await prisma.trainerCourse.deleteMany({ where: { certificationId: certId } });
    if (trainerId) await prisma.trainerCourse.create({ data: { trainerId: Number(trainerId), certificationId: certId } });
    return res.json({ success: true, data: { assigned: !!trainerId } });
});

// ── ROOMS ─────────────────────────────────────────────────────────
const getRoomsHandler = asyncHandler(async(req, res) => { const rooms = await prisma.room.findMany({ orderBy: { name: "asc" } }); return res.json({ success: true, data: rooms }); });
const createRoomHandler = asyncHandler(async(req, res) => {
    const { name, code, building, capacity, roomType, status } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "name required", code: "MISSING_FIELDS" });
    const finalCode = code || name.replace(/\s+/g, "-").toUpperCase();
    const room = await prisma.room.create({ data: { name, code: finalCode, building, capacity: Number(capacity) || 30, roomType: roomType || "Classroom", status: status || "available" } });
    return res.status(201).json({ success: true, data: room });
});
const updateRoomHandler = asyncHandler(async(req, res) => {
    const room = await prisma.room.update({ where: { id: Number(req.params.id) }, data: req.body });
    return res.json({ success: true, data: room });
});
const deleteRoomHandler = asyncHandler(async(req, res) => { await prisma.room.delete({ where: { id: Number(req.params.id) } }); return res.json({ success: true, data: { deleted: true } }); });

// ── ACADEMIC YEARS ────────────────────────────────────────────────
const getAcademicYearsHandler = asyncHandler(async(req, res) => {
    const years = await prisma.academicYear.findMany({ include: { program: { select: { name: true } }, certification: { select: { name: true } } }, orderBy: { startDate: "desc" } });
    return res.json({ success: true, data: years });
});
const createAcademicYearHandler = asyncHandler(async(req, res) => {
    const { name, startDate, endDate, isActive, programId, certificationId } = req.body;
    if (!name || !startDate || !endDate) return res.status(400).json({ success: false, message: "name, startDate, endDate required", code: "MISSING_FIELDS" });
    const year = await prisma.academicYear.create({ data: { name, startDate: new Date(startDate), endDate: new Date(endDate), isActive: !!isActive, programId: programId ? Number(programId) : null, certificationId: certificationId ? Number(certificationId) : null } });
    return res.status(201).json({ success: true, data: year });
});

// ── SESSIONS ──────────────────────────────────────────────────────
const getSessionsForProgramHandler = asyncHandler(async(req, res) => {
    const sessions = await prisma.session.findMany({ where: { programId: Number(req.params.id) }, include: { academicLevel: true, semester: true, academicYear: true }, orderBy: [{ academicLevel: { levelOrder: "asc" } }, { semester: { semesterOrder: "asc" } }] });
    return res.json({ success: true, data: sessions });
});

const createSessionHandler = asyncHandler(async(req, res) => {
    const { programId, academicYearId, academicLevelId, semesterId } = req.body;
    // Upsert: if session already exists for this combination, return it
    const existing = await prisma.session.findFirst({ where: { programId: Number(programId), academicLevelId: academicLevelId ? Number(academicLevelId) : null, semesterId: semesterId ? Number(semesterId) : null } });
    if (existing) return res.json({ success: true, data: existing });
    const session = await prisma.session.create({ data: { programId: Number(programId), academicYearId: academicYearId ? Number(academicYearId) : null, academicLevelId: academicLevelId ? Number(academicLevelId) : null, semesterId: semesterId ? Number(semesterId) : null } });
    return res.status(201).json({ success: true, data: session });
});

// ── SEMESTERS ─────────────────────────────────────────────────────
const getSemestersHandler = asyncHandler(async(req, res) => {
    const semesters = await prisma.semester.findMany({ orderBy: { semesterOrder: "asc" } });
    return res.json({ success: true, data: semesters });
});

const createSemesterHandler = asyncHandler(async(req, res) => {
    const { name, semesterOrder } = req.body;
    if (!name)
        return res.status(400).json({ success: false, message: 'name required' });
    const semester = await prisma.semester.create({
        data: { name, semesterOrder: Number(semesterOrder) || 1 },
    });
    return res.status(201).json({ success: true, data: semester });
});

const updateSemesterHandler = asyncHandler(async(req, res) => {
    const { name, semesterOrder } = req.body;
    const semester = await prisma.semester.update({
        where: { id: Number(req.params.id) },
        data: { name, semesterOrder: Number(semesterOrder) },
    });
    return res.json({ success: true, data: semester });
});

const deleteSemesterHandler = asyncHandler(async(req, res) => {
    // Deleting a semester cascades to sessions → courses
    await prisma.semester.delete({ where: { id: Number(req.params.id) } });
    return res.json({ success: true, data: { deleted: true } });
});

// ── COMPLAINTS ────────────────────────────────────────────────────
const getComplaintsHandler = asyncHandler(async(req, res) => {
    const complaints = await prisma.complaint.findMany({ include: { parent: { include: { user: { select: { fullName: true, email: true } } } } }, orderBy: { createdAt: "desc" } });
    return res.json({ success: true, data: complaints });
});
const updateComplaintHandler = asyncHandler(async(req, res) => {
    const complaint = await prisma.complaint.update({ where: { id: Number(req.params.id) }, data: { status: req.body.status, adminResponse: req.body.adminResponse } });
    return res.json({ success: true, data: complaint });
});

// ── HELPERS ───────────────────────────────────────────────────────
const getTrainersByDeptHandler = asyncHandler(async(req, res) => {
    const dept = await prisma.department.findUnique({ where: { id: Number(req.params.id) } });
    if (!dept) return res.status(404).json({ success: false, message: "Department not found", code: "NOT_FOUND" });
    const trainers = await prisma.trainer.findMany({ where: { user: { department: dept.name } }, include: { user: { select: { id: true, fullName: true, email: true } } } });
    return res.json({ success: true, data: trainers });
});

// Return ALL trainers (for dropdown in course assignment)
const getAllTrainersHandler = asyncHandler(async(req, res) => {
    const trainers = await prisma.trainer.findMany({
        include: { user: { select: { id: true, fullName: true, email: true, department: true } } },
        orderBy: { user: { fullName: "asc" } },
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
    getProgramTreeHandler,
    getProgramCoursesHandler,
    getAcademicLevelsHandler,
    createAcademicLevelHandler,
    updateAcademicLevelHandler,
    deleteAcademicLevelHandler,
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
    getSessionsForProgramHandler,
    createSessionHandler,
    getSemestersHandler,
    getComplaintsHandler,
    updateComplaintHandler,
    getTrainersByDeptHandler,
    getAllTrainersHandler,
    createSemesterHandler,
    updateSemesterHandler,
    deleteSemesterHandler,
};