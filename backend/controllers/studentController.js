const prisma = require('../lib/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

// Helper function to grab the student's profile along with their program and department info.
// We use this often to ensure we have context about what they're studying.
async function getStudent(userId) {
    return prisma.student.findUnique({
        where: { userId },
        include: { program: { include: { department: true } } }
    });
}

// Fetches all the data needed for the student's homepage dashboard.
// This includes recent grades, announcements, and their upcoming classes.
const getDashboard = asyncHandler(async (req, res) => {
    const student = await getStudent(req.user.userId);
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found', code: 'NOT_FOUND' });

    // Grab the 5 most recent grades so they can see how they're doing at a glance.
    const grades = await prisma.grade.findMany({
        where: { studentId: student.id },
        include: { course: true, certification: true },
        orderBy: { submittedAt: 'desc' },
        take: 5,
    });

    // We pull announcements relevant to their department or marked for 'all'.
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

    // Get the next 6 scheduled classes that have been officially published.
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
const getTimetableHandler = asyncHandler(async (req, res) => {
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
const getCertTimetableHandler = asyncHandler(async (req, res) => {
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
const getCertEnrollmentsHandler = asyncHandler(async (req, res) => {
    const student = await getStudent(req.user.userId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found', code: 'NOT_FOUND' });

    const enrollments = await prisma.enrollment.findMany({
        where: { studentId: student.id, certificationId: { not: null }, status: 'active' },
        include: { certification: true },
    });
    return res.json({ success: true, data: enrollments });
});

const getPublishedWeeksForCertHandler = asyncHandler(async (req, res) => {
    const student = await getStudent(req.user.userId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found', code: 'NOT_FOUND' });

    const { certificationId } = req.query;

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

const submitCertAvailabilityHandler = asyncHandler(async (req, res) => {
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

    // To keep things clean, we wipe any existing availability for this specific week/cert 
    // before saving the new list. This ensures they don't have stale data lingering.
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

const getCertAvailabilityHandler = asyncHandler(async (req, res) => {
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
const getGradesHandler = asyncHandler(async (req, res) => {
    const student = await getStudent(req.user.userId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found', code: 'NOT_FOUND' });

    // 1. Get all courses for the student's program
    const programCourses = await prisma.course.findMany({
        where: { session: { programId: student.programId } },
        include: { session: { include: { program: true, academicLevel: true, semester: true } } }
    });

    // 2. Get existing grades
    const grades = await prisma.grade.findMany({
        where: { studentId: student.id },
        include: {
            course: true,
            certification: true,
            academicYear: true,
        },
    });

    // 3. Merge
    const gradeMap = {};
    const certGrades = [];
    
    grades.forEach(g => {
        if (g.courseId) gradeMap[g.courseId] = g;
        else if (g.certificationId) certGrades.push(g);
    });

    const result = programCourses.map(course => {
        const grade = gradeMap[course.id];
        if (grade) return grade;
        
        // If a course hasn't been graded yet, we return a "placeholder" object.
        // This helps the frontend display the course row even without a mark.
        return {
            id: `p-${course.id}`,
            grade: null,
            gradeLetter: null,
            courseId: course.id,
            course: course,
            studentId: student.id,
            submittedAt: null
        };
    });

    // Add certification grades (they stay as is since they are specific to the student's enrollments)
    const finalResult = [...result, ...certGrades];

    return res.json({ success: true, data: finalResult });
});

// MARK COMPLAINTS 
const createComplaintHandler = asyncHandler(async (req, res) => {
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

const getComplaintsHandler = asyncHandler(async (req, res) => {
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
const getAnnouncementsHandler = asyncHandler(async (req, res) => {
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