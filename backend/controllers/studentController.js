const prisma = require('../lib/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

async function getStudent(userId) {
    return prisma.student.findUnique({
        where: { userId },
        include: { program: { include: { department: true } } }
    });
}

// DASHBOARD 
const getDashboard = asyncHandler(async(req, res) => {
    const student = await getStudent(req.user.userId);
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found', code: 'NOT_FOUND' });

    // Recent grades
    const grades = await prisma.grade.findMany({
        where: { studentId: student.id },
        include: { course: true, certification: true },
        orderBy: { submittedAt: 'desc' },
        take: 5,
    });

    // Latest announcements for this dept
    // Fixed: Safe check for departmentId
    const deptId = (student.program && student.program.departmentId) ? student.program.departmentId : undefined;

    const announcements = await prisma.announcement.findMany({
        where: {
            departmentId: deptId,
            targetRole: { in: ['student', 'all'] },
        },
        include: { creator: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
    });

    // Academic timetable (published)
    const progId = student.programId ? student.programId : undefined;

    const timetableSlots = await prisma.timetableSlot.findMany({
        where: {
            course: { session: { programId: progId } },
            timetable: { status: 'published' },
        },
        include: { room: true, trainer: { include: { user: true } }, course: true },
        orderBy: [{ dayOfWeek: 'asc' }, { timeStart: 'asc' }],
        take: 6,
    });

    return res.json({
        success: true,
        data: { student, recentGrades: grades, latestAnnouncements: announcements, upcomingSlots: timetableSlots },
    });
});

// TIMETABLE (academic)
const getTimetableHandler = asyncHandler(async(req, res) => {
    const student = await getStudent(req.user.userId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found', code: 'NOT_FOUND' });

    const { weekId } = req.query;
    const progId = student.programId ? student.programId : undefined;

    const slots = await prisma.timetableSlot.findMany({
        where: {
            course: { session: { programId: progId } },
            timetable: { status: 'published' },
            ...(weekId ? { academicWeekId: Number(weekId) } : {}),
        },
        include: {
            room: true,
            trainer: { include: { user: { select: { fullName: true } } } },
            course: true,
            timetable: { include: { academicWeek: true } },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { timeStart: 'asc' }],
    });

    return res.json({ success: true, data: slots });
});

// CERTIFICATION TIMETABLE 
const getCertTimetableHandler = asyncHandler(async(req, res) => {
    const student = await getStudent(req.user.userId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found', code: 'NOT_FOUND' });

    // Find certs this student is enrolled in
    const certEnrollments = await prisma.enrollment.findMany({
        where: { studentId: student.id, certificationId: { not: null } },
        select: { certificationId: true },
    });
    const certIds = certEnrollments.map(e => e.certificationId);

    const { weekId } = req.query;

    const slots = await prisma.certTimetableSlot.findMany({
        where: {
            certificationId: { in: certIds },
            ...(weekId ? { academicWeekId: Number(weekId) } : {}),
        },
        include: {
            room: true,
            trainer: { include: { user: { select: { fullName: true } } } },
            certification: true,
            academicWeek: true,
        },
        orderBy: [{ dayOfWeek: 'asc' }, { timeStart: 'asc' }],
    });

    return res.json({ success: true, data: slots });
});

//  CERT AVAILABILITY SUBMISSION 
const getCertEnrollmentsHandler = asyncHandler(async(req, res) => {
    const student = await getStudent(req.user.userId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found', code: 'NOT_FOUND' });

    const enrollments = await prisma.enrollment.findMany({
        where: { studentId: student.id, certificationId: { not: null }, status: 'active' },
        include: { certification: true },
    });
    return res.json({ success: true, data: enrollments });
});

const getPublishedWeeksForCertHandler = asyncHandler(async(req, res) => {
    const student = await getStudent(req.user.userId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found', code: 'NOT_FOUND' });

    const { certificationId, type } = req.query;

    // type=academic -> return HOD-published academic weeks for student's department
    if (type === 'academic') {
        const deptId = (student.program && student.program.departmentId) ? student.program.departmentId : undefined;
        const weeks = await prisma.academicWeek.findMany({
            where: {
                departmentId: deptId,
                status: 'published',
                certificationId: null,
            },
            orderBy: { weekNumber: 'desc' },
        });
        return res.json({ success: true, data: weeks });
    }

    // certificationId provided -> return cert-specific published weeks for that cert
    if (certificationId) {
        const weeks = await prisma.academicWeek.findMany({
            where: { certificationId: Number(certificationId), status: 'published' },
            orderBy: { weekNumber: 'desc' },
        });
        return res.json({ success: true, data: weeks });
    }

    // No params -> return all cert weeks for all certs this student is enrolled in
    const certEnrollments = await prisma.enrollment.findMany({
        where: { studentId: student.id, certificationId: { not: null }, status: 'active' },
        select: { certificationId: true },
    });
    const certIds = certEnrollments.map(e => e.certificationId);

    if (!certIds.length) return res.json({ success: true, data: [] });

    const weeks = await prisma.academicWeek.findMany({
        where: { certificationId: { in: certIds }, status: 'published' },
        include: { certification: { select: { name: true, code: true } } },
        orderBy: { weekNumber: 'desc' },
    });
    return res.json({ success: true, data: weeks });
});

const submitCertAvailabilityHandler = asyncHandler(async(req, res) => {
    const student = await getStudent(req.user.userId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found', code: 'NOT_FOUND' });

    const { weekId, certificationId, slots } = req.body;
    if (!weekId || !certificationId || !Array.isArray(slots))
        return res.status(400).json({ success: false, message: 'weekId, certificationId, slots[] required', code: 'MISSING_FIELDS' });

    // Verify student is enrolled in this cert
    const enrolled = await prisma.enrollment.findFirst({
        where: { studentId: student.id, certificationId: Number(certificationId), status: 'active' },
    });
    if (!enrolled) return res.status(403).json({ success: false, message: 'Not enrolled in this certification', code: 'NOT_ENROLLED' });

    // Delete existing, then insert new
    await prisma.studentAvailability.deleteMany({
        where: { studentId: student.id, academicWeekId: Number(weekId), certificationId: Number(certificationId) },
    });

    const created = await prisma.studentAvailability.createMany({
        data: slots.map(s => ({
            studentId: student.id,
            academicWeekId: Number(weekId),
            certificationId: Number(certificationId),
            dayOfWeek: s.dayOfWeek,
            timeStart: s.timeStart,
            timeEnd: s.timeEnd,
        })),
        skipDuplicates: true,
    });

    return res.status(201).json({ success: true, data: { created: created.count } });
});

const getCertAvailabilityHandler = asyncHandler(async(req, res) => {
    const student = await getStudent(req.user.userId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found', code: 'NOT_FOUND' });

    const { weekId, certificationId } = req.query;
    const avail = await prisma.studentAvailability.findMany({
        where: {
            studentId: student.id,
            ...(weekId ? { academicWeekId: Number(weekId) } : {}),
            ...(certificationId ? { certificationId: Number(certificationId) } : {}),
        },
    });
    return res.json({ success: true, data: avail });
});

// GRADES 
const getGradesHandler = asyncHandler(async(req, res) => {
    const student = await getStudent(req.user.userId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found', code: 'NOT_FOUND' });

    const grades = await prisma.grade.findMany({
        where: { studentId: student.id },
        include: {
            course: { include: { session: { include: { program: true, academicLevel: true, semester: true } } } },
            certification: true,
            academicYear: true,
        },
        orderBy: { submittedAt: 'desc' },
    });
    return res.json({ success: true, data: grades });
});

// MARK COMPLAINTS 
const createComplaintHandler = asyncHandler(async(req, res) => {
    const student = await getStudent(req.user.userId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found', code: 'NOT_FOUND' });

    const { courseId, certificationId, subject, description, trainerId } = req.body;
    if (!subject) return res.status(400).json({ success: false, message: 'subject required', code: 'MISSING_FIELDS' });

    const complaint = await prisma.markComplaint.create({
        data: {
            studentId: student.id,
            trainerId: trainerId ? Number(trainerId) : null,
            courseId: courseId ? Number(courseId) : null,
            certificationId: certificationId ? Number(certificationId) : null,
            subject,
            description,
        },
    });
    return res.status(201).json({ success: true, data: complaint });
});

const getComplaintsHandler = asyncHandler(async(req, res) => {
    const student = await getStudent(req.user.userId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found', code: 'NOT_FOUND' });

    const complaints = await prisma.markComplaint.findMany({
        where: { studentId: student.id },
        include: { course: true, certification: true, trainer: { include: { user: true } } },
        orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: complaints });
});

//ANNOUNCEMENTS 
const getAnnouncementsHandler = asyncHandler(async(req, res) => {
    const student = await getStudent(req.user.userId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found', code: 'NOT_FOUND' });

    const deptId = (student.program && student.program.departmentId) ? student.program.departmentId : undefined;

    const announcements = await prisma.announcement.findMany({
        where: {
            departmentId: deptId,
            targetRole: { in: ['student', 'all'] },
        },
        include: {
            creator: { select: { fullName: true } },
            department: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: announcements });
});

module.exports = {
    getDashboard,
    getTimetableHandler,
    getCertTimetableHandler,
    getCertEnrollmentsHandler,
    getPublishedWeeksForCertHandler,
    submitCertAvailabilityHandler,
    getCertAvailabilityHandler,
    getGradesHandler,
    createComplaintHandler,
    getComplaintsHandler,
    getAnnouncementsHandler,
};