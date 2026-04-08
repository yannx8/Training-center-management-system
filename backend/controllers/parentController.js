const prisma = require('../lib/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

// Helper to fetch the parent's profile along with all the students (their children)
// linked to their account. We need this to show them info for multiple kids at once.
async function getParent(userId) {
    return prisma.parent.findUnique({
        where: { userId },
        include: {
            studentLinks: {
                include: {
                    student: {
                        include: {
                            user: { select: { fullName: true, email: true } },
                            program: { include: { department: true } },
                        },
                    },
                },
            },
        },
    });
}

// Builds the main dashboard for parents.
// It shows an overview for each of their children, relevant announcements, and complaint status.
const getDashboard = asyncHandler(async (req, res) => {
    const parent = await getParent(req.user.userId);
    if (!parent) return res.status(404).json({ success: false, message: 'Parent profile not found', code: 'NOT_FOUND' });

    const children = parent.studentLinks.map(l => l.student);

    // We collect the department IDs for all children so we can pull relevant announcements for the parent.
    const deptIds = [...new Set(children.map(c => c.program && c.program.departmentId).filter(Boolean))];

    // Grab the latest 5 announcements that are either for parents specifically or for everyone.
    const announcements = await prisma.announcement.findMany({
        where: {
            departmentId: { in: deptIds },
            targetRole: { in: ['parent', 'all'] },
        },
        include: {
            creator: { select: { fullName: true } },
            department: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
    });

    // Count how many issues are still being looked at.
    const pendingComplaints = await prisma.complaint.count({
        where: { parentId: parent.id, status: 'pending' },
    });

    return res.json({
        success: true,
        data: { children, latestAnnouncements: announcements, pendingComplaints },
    });
});

// CHILDREN 
const getChildrenHandler = asyncHandler(async (req, res) => {
    const parent = await getParent(req.user.userId);
    if (!parent) return res.status(404).json({ success: false, message: 'Parent not found', code: 'NOT_FOUND' });
    return res.json({ success: true, data: parent.studentLinks.map(l => l.student) });
});

//  CHILD TIMETABLE 

const getChildTimetableHandler = asyncHandler(async (req, res) => {
    const parent = await getParent(req.user.userId);
    if (!parent) return res.status(404).json({ success: false, message: 'Parent not found', code: 'NOT_FOUND' });

    const { childId } = req.params;
    const { weekId } = req.query;

    const link = parent.studentLinks.find(l => l.studentId === Number(childId));
    if (!link) return res.status(403).json({ success: false, message: 'Access denied', code: 'FORBIDDEN' });

    const child = link.student;

    // Fixed: Replaced nullish coalescing with ternary operator
    const progId = child.programId ? child.programId : undefined;

    // Academic timetable slots
    const academicSlots = await prisma.timetableSlot.findMany({
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

    // Cert timetable slots (for certs this student is enrolled in)
    const certEnrollments = await prisma.enrollment.findMany({
        where: { studentId: child.id, certificationId: { not: null }, status: 'active' },
        select: { certificationId: true },
    });
    const certIds = certEnrollments.map(e => e.certificationId);

    const certSlots = certIds.length > 0 ?
        await prisma.certTimetableSlot.findMany({
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
        }) : [];

    return res.json({ success: true, data: { child, slots: academicSlots, certSlots } });
});

//  CHILD GRADES 
const getChildGradesHandler = asyncHandler(async (req, res) => {
    const parent = await getParent(req.user.userId);
    if (!parent) return res.status(404).json({ success: false, message: 'Parent not found', code: 'NOT_FOUND' });

    const { childId } = req.params;
    const link = parent.studentLinks.find(l => l.studentId === Number(childId));
    if (!link) return res.status(403).json({ success: false, message: 'Access denied', code: 'FORBIDDEN' });

    const grades = await prisma.grade.findMany({
        where: { studentId: Number(childId) },
        include: { course: true, certification: true, academicYear: true },
        orderBy: { submittedAt: 'desc' },
    });
    return res.json({ success: true, data: { child: link.student, grades } });
});

// COMPLAINTS 
const getComplaintsHandler = asyncHandler(async (req, res) => {
    const parent = await getParent(req.user.userId);
    if (!parent) return res.status(404).json({ success: false, message: 'Parent not found', code: 'NOT_FOUND' });

    const complaints = await prisma.complaint.findMany({
        where: { parentId: parent.id },
        orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: complaints });
});

const createComplaintHandler = asyncHandler(async (req, res) => {
    const parent = await getParent(req.user.userId);
    if (!parent) return res.status(404).json({ success: false, message: 'Parent not found', code: 'NOT_FOUND' });

    const { studentId, subject, description, priority } = req.body;
    if (!subject) return res.status(400).json({ success: false, message: 'subject required', code: 'MISSING_FIELDS' });

    const complaint = await prisma.complaint.create({
        data: {
            parentId: parent.id,
            studentId: studentId ? Number(studentId) : null,
            subject,
            description,
            priority: priority || 'medium',
        },
    });
    return res.status(201).json({ success: true, data: complaint });
});

// ANNOUNCEMENTS 
const getAnnouncementsHandler = asyncHandler(async (req, res) => {
    const parent = await getParent(req.user.userId);
    if (!parent) return res.status(404).json({ success: false, message: 'Parent not found', code: 'NOT_FOUND' });

    // Fixed: Replaced optional chaining with logical AND
    const deptIds = [...new Set(
        parent.studentLinks.map(l => l.student.program && l.student.program.departmentId).filter(Boolean)
    )];

    const announcements = await prisma.announcement.findMany({
        where: {
            departmentId: { in: deptIds },
            targetRole: { in: ['parent', 'all'] },
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
    getChildrenHandler,
    getChildTimetableHandler,
    getChildGradesHandler,
    getComplaintsHandler,
    createComplaintHandler,
    getAnnouncementsHandler,
};