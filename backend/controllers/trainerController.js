// FILE: backend/controllers/trainerController.js
const prisma = require('../lib/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

async function getTrainer(userId) {
    return prisma.trainer.findUnique({ where: { userId } });
}

// ── DASHBOARD ─────────────────────────────────────────────────────
const getDashboard = asyncHandler(async(req, res) => {
    const trainer = await getTrainer(req.user.userId);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

    const [courseCount, certCount, pendingComplaints, availabilitySlots] = await Promise.all([
        prisma.trainerCourse.count({ where: { trainerId: trainer.id, courseId: { not: null } } }),
        prisma.trainerCourse.count({ where: { trainerId: trainer.id, certificationId: { not: null } } }),
        prisma.markComplaint.count({ where: { trainerId: trainer.id, status: 'pending' } }),
        prisma.availability.count({ where: { trainerId: trainer.id } }),
    ]);

    const recentCourses = await prisma.trainerCourse.findMany({
        where: { trainerId: trainer.id, courseId: { not: null } },
        include: { course: { include: { session: { include: { program: true, academicLevel: true } } } } },
        take: 5,
    });

    return res.json({
        success: true,
        data: {
            trainerId: trainer.id,
            stats: { courseCount, certCount, pendingComplaints, availabilitySlots },
            recentCourses: recentCourses.map(tc => tc.course),
        }
    });
});

// ── COURSES ───────────────────────────────────────────────────────
const getCoursesHandler = asyncHandler(async(req, res) => {
    const trainer = await getTrainer(req.user.userId);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });
    const tcs = await prisma.trainerCourse.findMany({
        where: { trainerId: trainer.id, courseId: { not: null } },
        include: { course: { include: { session: { include: { program: { include: { department: true } }, academicLevel: true, semester: true } } } } },
    });
    return res.json({ success: true, data: tcs.map(tc => tc.course) });
});

// ── CERTIFICATIONS ────────────────────────────────────────────────
const getCertificationsHandler = asyncHandler(async(req, res) => {
    const trainer = await getTrainer(req.user.userId);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });
    const tcs = await prisma.trainerCourse.findMany({
        where: { trainerId: trainer.id, certificationId: { not: null } },
        include: { certification: true },
    });
    return res.json({ success: true, data: tcs.map(tc => tc.certification) });
});

// ── CERT WEEKS (trainer creates cert-specific weeks) ──────────────
const getCertWeeksHandler = asyncHandler(async(req, res) => {
    const trainer = await getTrainer(req.user.userId);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

    const { certificationId } = req.query;
    if (!certificationId) return res.status(400).json({ success: false, message: 'certificationId required' });

    // Verify trainer is assigned to this cert
    const assignment = await prisma.trainerCourse.findFirst({
        where: { trainerId: trainer.id, certificationId: Number(certificationId) },
    });
    if (!assignment) return res.status(403).json({ success: false, message: 'Not assigned to this certification' });

    const weeks = await prisma.academicWeek.findMany({
        where: { certificationId: Number(certificationId), createdBy: req.user.userId },
        orderBy: { weekNumber: 'desc' },
    });
    return res.json({ success: true, data: weeks });
});

const createCertWeekHandler = asyncHandler(async(req, res) => {
    const trainer = await getTrainer(req.user.userId);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

    const { certificationId, weekNumber, label, startDate, endDate } = req.body;
    if (!certificationId || !weekNumber || !label || !startDate || !endDate)
        return res.status(400).json({ success: false, message: 'certificationId, weekNumber, label, startDate, endDate required' });

    const assignment = await prisma.trainerCourse.findFirst({
        where: { trainerId: trainer.id, certificationId: Number(certificationId) },
    });
    if (!assignment) return res.status(403).json({ success: false, message: 'Not assigned to this certification' });

    const week = await prisma.academicWeek.create({
        data: {
            certificationId: Number(certificationId),
            weekNumber: Number(weekNumber),
            label,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: 'draft',
            createdBy: req.user.userId,
        },
    });
    return res.status(201).json({ success: true, data: week });
});

const publishCertWeekHandler = asyncHandler(async(req, res) => {
    const trainer = await getTrainer(req.user.userId);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

    const week = await prisma.academicWeek.findUnique({ where: { id: Number(req.params.id) } });
    if (!week || week.createdBy !== req.user.userId)
        return res.status(403).json({ success: false, message: 'Not authorized for this week' });

    const updated = await prisma.academicWeek.update({
        where: { id: Number(req.params.id) },
        data: { status: 'published' },
    });
    return res.json({ success: true, data: updated });
});

const unpublishCertWeekHandler = asyncHandler(async(req, res) => {
    const week = await prisma.academicWeek.update({
        where: { id: Number(req.params.id) },
        data: { status: 'draft' },
    });
    return res.json({ success: true, data: week });
});

const deleteCertWeekHandler = asyncHandler(async(req, res) => {
    await prisma.academicWeek.delete({ where: { id: Number(req.params.id) } });
    return res.json({ success: true, data: { deleted: true } });
});

// ── PUBLISHED WEEKS (for availability submission — HOD academic weeks) ──
const getPublishedWeeksHandler = asyncHandler(async(req, res) => {
    const trainer = await getTrainer(req.user.userId);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

    const trainerUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const deptNames = new Set();
    // Fixed: Replaced optional chaining
    if (trainerUser && trainerUser.department) deptNames.add(trainerUser.department);

    const tcs = await prisma.trainerCourse.findMany({
        where: { trainerId: trainer.id, courseId: { not: null } },
        include: { course: { include: { session: { include: { program: { include: { department: true } } } } } } },
    });

    // Fixed: Replaced optional chaining
    tcs.forEach(tc => {
        const d = tc.course && tc.course.session && tc.course.session.program && tc.course.session.program.department ? tc.course.session.program.department.name : null;
        if (d) deptNames.add(d);
    });

    if (!deptNames.size) return res.json({ success: true, data: [] });

    const depts = await prisma.department.findMany({ where: { name: { in: [...deptNames] } } });
    const weeks = [];
    for (const dept of depts) {
        const latest = await prisma.academicWeek.findFirst({
            where: { departmentId: dept.id, status: 'published', certificationId: null },
            include: { department: { select: { name: true, code: true } } },
            orderBy: { weekNumber: 'desc' },
        });
        if (latest) weeks.push(latest);
    }
    return res.json({ success: true, data: weeks });
});

// ── AVAILABILITY ──────────────────────────────────────────────────
const getAvailabilityHandler = asyncHandler(async(req, res) => {
    const trainer = await getTrainer(req.user.userId);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });
    const { weekId } = req.query;
    const avail = await prisma.availability.findMany({
        where: { trainerId: trainer.id, ...(weekId ? { academicWeekId: Number(weekId) } : {}) },
        include: { academicWeek: true },
        orderBy: [{ dayOfWeek: 'asc' }, { timeStart: 'asc' }],
    });
    return res.json({ success: true, data: avail });
});

const submitAvailabilityHandler = asyncHandler(async(req, res) => {
    const trainer = await getTrainer(req.user.userId);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });
    const { weekId, slots } = req.body;
    if (!weekId || !Array.isArray(slots))
        return res.status(400).json({ success: false, message: 'weekId and slots[] required' });
    const week = await prisma.academicWeek.findUnique({ where: { id: Number(weekId) } });
    if (!week || week.status !== 'published')
        return res.status(400).json({ success: false, message: 'Week is not published' });
    // Only check lock for academic weeks (not cert weeks)
    if (!week.certificationId) {
        const lock = await prisma.availabilityLock.findFirst({ where: { academicWeekId: Number(weekId), isLocked: true } });
        if (lock) return res.status(403).json({ success: false, message: 'Availability locked by HOD' });
    }
    await prisma.availability.deleteMany({ where: { trainerId: trainer.id, academicWeekId: Number(weekId) } });
    const created = await prisma.availability.createMany({
        data: slots.map(s => ({ trainerId: trainer.id, academicWeekId: Number(weekId), dayOfWeek: s.dayOfWeek, timeStart: s.timeStart, timeEnd: s.timeEnd })),
        skipDuplicates: true,
    });
    return res.status(201).json({ success: true, data: { created: created.count } });
});

const clearAvailabilityHandler = asyncHandler(async(req, res) => {
    const trainer = await getTrainer(req.user.userId);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });
    const week = await prisma.academicWeek.findUnique({ where: { id: Number(req.params.weekId) } });
    // Fixed: Replaced optional chaining
    if (!week || !week.certificationId) {
        const lock = await prisma.availabilityLock.findFirst({ where: { academicWeekId: Number(req.params.weekId), isLocked: true } });
        if (lock) return res.status(403).json({ success: false, message: 'Availability locked' });
    }
    await prisma.availability.deleteMany({ where: { trainerId: trainer.id, academicWeekId: Number(req.params.weekId) } });
    return res.json({ success: true, data: { cleared: true } });
});

// ── GRADING ───────────────────────────────────────────────────────
const getStudentsForGradingHandler = asyncHandler(async(req, res) => {
    const trainer = await getTrainer(req.user.userId);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

    const trainerCourses = await prisma.trainerCourse.findMany({
        where: { trainerId: trainer.id, courseId: { not: null } },
        include: { course: { include: { session: { include: { program: true, academicLevel: true, semester: true } } } } },
    });
    const trainerCerts = await prisma.trainerCourse.findMany({
        where: { trainerId: trainer.id, certificationId: { not: null } },
        include: { certification: true },
    });

    const result = [];
    for (const tc of trainerCourses) {
        const course = tc.course;
        // Fixed: Replaced optional chaining
        if (!course || !course.session || !course.session.programId) continue;
        const enrollments = await prisma.enrollment.findMany({
            where: { programId: course.session.programId, status: 'active' },
            include: { student: { include: { user: { select: { fullName: true } } } } },
        });
        const existingGrades = await prisma.grade.findMany({ where: { courseId: course.id } });
        const gradeMap = Object.fromEntries(existingGrades.map(g => [g.studentId, g]));
        result.push({
            type: 'course',
            subjectId: course.id,
            subjectName: course.name,
            subjectCode: course.code,
            // Fixed: Replaced optional chaining
            programName: course.session && course.session.program ? course.session.program.name : null,
            levelName: course.session && course.session.academicLevel ? course.session.academicLevel.name : null,
            semesterName: course.session && course.session.semester ? course.session.semester.name : null,
            students: enrollments.map(e => ({
                studentId: e.studentId,
                // Fixed: Replaced optional chaining
                fullName: (e.student && e.student.user && e.student.user.fullName) || 'Unknown',
                matricule: (e.student && e.student.matricule) || '',
                // Fixed: Replaced optional chaining and nullish coalescing
                existingGrade: gradeMap[e.studentId] ? gradeMap[e.studentId].grade : null,
                existingLetter: gradeMap[e.studentId] ? gradeMap[e.studentId].gradeLetter : null,
                gradeId: gradeMap[e.studentId] ? gradeMap[e.studentId].id : null,
            })),
        });
    }
    for (const tc of trainerCerts) {
        const cert = tc.certification;
        const enrollments = await prisma.enrollment.findMany({
            where: { certificationId: cert.id, status: 'active' },
            include: { student: { include: { user: { select: { fullName: true } } } } },
        });
        const existingGrades = await prisma.grade.findMany({ where: { certificationId: cert.id } });
        const gradeMap = Object.fromEntries(existingGrades.map(g => [g.studentId, g]));
        result.push({
            type: 'certification',
            subjectId: cert.id,
            subjectName: cert.name,
            subjectCode: cert.code,
            programName: null,
            levelName: null,
            semesterName: null,
            students: enrollments.map(e => ({
                studentId: e.studentId,
                // Fixed: Replaced optional chaining
                fullName: (e.student && e.student.user && e.student.user.fullName) || 'Unknown',
                matricule: (e.student && e.student.matricule) || '',
                // Fixed: Replaced optional chaining and nullish coalescing
                existingGrade: gradeMap[e.studentId] ? gradeMap[e.studentId].grade : null,
                existingLetter: gradeMap[e.studentId] ? gradeMap[e.studentId].gradeLetter : null,
                gradeId: gradeMap[e.studentId] ? gradeMap[e.studentId].id : null,
            })),
        });
    }
    return res.json({ success: true, data: result });
});

// ── CERT TIMETABLE GENERATION ─────────────────────────────────────
const generateCertTimetableHandler = asyncHandler(async(req, res) => {
    const trainer = await getTrainer(req.user.userId);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

    const { weekId, certificationId } = req.body;
    if (!weekId || !certificationId)
        return res.status(400).json({ success: false, message: 'weekId and certificationId required' });

    const assignment = await prisma.trainerCourse.findFirst({
        where: { trainerId: trainer.id, certificationId: Number(certificationId) },
    });
    if (!assignment) return res.status(403).json({ success: false, message: 'You are not assigned to this certification' });

    const rooms = await prisma.room.findMany({ where: { status: 'available' }, orderBy: { id: 'asc' } });
    await prisma.certTimetableSlot.deleteMany({ where: { certificationId: Number(certificationId), academicWeekId: Number(weekId) } });

    const trainerAvail = await prisma.availability.findMany({
        where: { trainerId: trainer.id, academicWeekId: Number(weekId) },
        orderBy: [{ dayOfWeek: 'asc' }, { timeStart: 'asc' }],
    });
    if (!trainerAvail.length) return res.status(400).json({ success: false, message: 'You have not submitted availability for this week' });

    const enrollments = await prisma.enrollment.findMany({ where: { certificationId: Number(certificationId), status: 'active' } });
    if (!enrollments.length) return res.status(400).json({ success: false, message: 'No students enrolled' });

    const studentIds = enrollments.map(e => e.studentId);
    let scheduled = 0,
        skipped = 0;

    for (const slot of trainerAvail) {
        const tc = await prisma.timetableSlot.findFirst({ where: { trainerId: trainer.id, dayOfWeek: slot.dayOfWeek, timeStart: slot.timeStart, academicWeekId: Number(weekId) } });
        if (tc) { skipped++; continue; }
        const cc = await prisma.certTimetableSlot.findFirst({ where: { trainerId: trainer.id, dayOfWeek: slot.dayOfWeek, timeStart: slot.timeStart, academicWeekId: Number(weekId) } });
        if (cc) { skipped++; continue; }
        let allAvail = true;
        for (const sid of studentIds) {
            const sa = await prisma.studentAvailability.findFirst({
                where: { studentId: sid, certificationId: Number(certificationId), academicWeekId: Number(weekId), dayOfWeek: slot.dayOfWeek, timeStart: slot.timeStart },
            });
            if (!sa) { allAvail = false; break; }
        }
        if (!allAvail) { skipped++; continue; }
        let room = null;
        for (const r of rooms) {
            const ra = await prisma.timetableSlot.findFirst({ where: { roomId: r.id, dayOfWeek: slot.dayOfWeek, timeStart: slot.timeStart, academicWeekId: Number(weekId) } });
            const rc = await prisma.certTimetableSlot.findFirst({ where: { roomId: r.id, dayOfWeek: slot.dayOfWeek, timeStart: slot.timeStart, academicWeekId: Number(weekId) } });
            if (!ra && !rc) { room = r; break; }
        }
        await prisma.certTimetableSlot.create({
            // Fixed: Replaced optional chaining and nullish coalescing
            data: { certificationId: Number(certificationId), trainerId: trainer.id, academicWeekId: Number(weekId), dayOfWeek: slot.dayOfWeek, timeStart: slot.timeStart, timeEnd: slot.timeEnd, roomId: room ? room.id : null, status: 'scheduled' },
        });
        scheduled++;
    }
    return res.status(201).json({ success: true, data: { scheduled, skipped } });
});

const getCertStudentAvailabilityStatusHandler = asyncHandler(async(req, res) => {
    const trainer = await getTrainer(req.user.userId);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });
    const { weekId, certificationId } = req.query;
    if (!weekId || !certificationId) return res.status(400).json({ success: false, message: 'weekId and certificationId required' });
    const enrollments = await prisma.enrollment.findMany({
        where: { certificationId: Number(certificationId), status: 'active' },
        include: { student: { include: { user: { select: { fullName: true } } } } },
    });
    const result = await Promise.all(enrollments.map(async e => {
        const count = await prisma.studentAvailability.count({ where: { studentId: e.studentId, certificationId: Number(certificationId), academicWeekId: Number(weekId) } });
        return {
            studentId: e.studentId,
            // Fixed: Replaced optional chaining
            studentName: (e.student && e.student.user && e.student.user.fullName) || 'Unknown',
            matricule: e.student ? e.student.matricule : null,
            hasSubmitted: count > 0,
            slotCount: count
        };
    }));
    return res.json({ success: true, data: result });
});

// ── TIMETABLE (academic + cert) ───────────────────────────────────
const getTimetableHandler = asyncHandler(async(req, res) => {
    const trainer = await getTrainer(req.user.userId);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });
    const { weekId } = req.query;
    const [academic, certs] = await Promise.all([
        prisma.timetableSlot.findMany({
            where: { trainerId: trainer.id, ...(weekId ? { academicWeekId: Number(weekId) } : {}), timetable: { status: 'published' } },
            include: { room: true, course: { include: { session: { include: { program: true, academicLevel: true, semester: true } } } }, timetable: { include: { academicWeek: true } } },
            orderBy: [{ dayOfWeek: 'asc' }, { timeStart: 'asc' }],
        }),
        prisma.certTimetableSlot.findMany({
            where: { trainerId: trainer.id, ...(weekId ? { academicWeekId: Number(weekId) } : {}) },
            include: { room: true, certification: true, academicWeek: true },
            orderBy: [{ dayOfWeek: 'asc' }, { timeStart: 'asc' }],
        }),
    ]);
    return res.json({ success: true, data: { academicSlots: academic, certSlots: certs } });
});

// ── GRADES ────────────────────────────────────────────────────────
const getGradesHandler = asyncHandler(async(req, res) => {
    const trainer = await getTrainer(req.user.userId);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });
    const grades = await prisma.grade.findMany({
        where: { trainerId: trainer.id },
        include: { student: { include: { user: true } }, course: true, certification: true },
        orderBy: { submittedAt: 'desc' },
    });
    return res.json({ success: true, data: grades });
});

const upsertGradeHandler = asyncHandler(async(req, res) => {
    const trainer = await getTrainer(req.user.userId);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });
    const { studentId, courseId, certificationId, grade, academicYearId } = req.body;
    if (!studentId || (!courseId && !certificationId))
        return res.status(400).json({ success: false, message: 'studentId and courseId or certificationId required' });
    const num = parseFloat(grade);
    let letter = 'F';
    if (num >= 90) letter = 'A+';
    else if (num >= 80) letter = 'A';
    else if (num >= 70) letter = 'B';
    else if (num >= 60) letter = 'C';
    else if (num >= 50) letter = 'D';
    // Fixed: Replaced nullish coalescing
    const data = { grade: num, gradeLetter: letter, trainerId: trainer.id, academicYearId: academicYearId ? Number(academicYearId) : null };
    const where = courseId ? { studentId_courseId: { studentId: Number(studentId), courseId: Number(courseId) } } : { studentId_certificationId: { studentId: Number(studentId), certificationId: Number(certificationId) } };
    const result = await prisma.grade.upsert({
        where,
        update: data,
        // Fixed: Replaced nullish coalescing
        create: {...data, studentId: Number(studentId), courseId: courseId ? Number(courseId) : null, certificationId: certificationId ? Number(certificationId) : null },
    });
    return res.json({ success: true, data: result });
});

// ── COMPLAINTS ────────────────────────────────────────────────────
const getComplaintsHandler = asyncHandler(async(req, res) => {
    const trainer = await getTrainer(req.user.userId);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

    // Get all courseIds and certificationIds this trainer teaches
    const trainerCourses = await prisma.trainerCourse.findMany({
        where: { trainerId: trainer.id },
        select: { courseId: true, certificationId: true },
    });

    const courseIds = trainerCourses.map(tc => tc.courseId).filter(Boolean);
    const certIds = trainerCourses.map(tc => tc.certificationId).filter(Boolean);

    // Find complaints related to trainer directly OR to their courses/certs
    const complaints = await prisma.markComplaint.findMany({
        where: {
            OR: [
                { trainerId: trainer.id },
                ...(courseIds.length > 0 ? [{ courseId: { in: courseIds } }] : []),
                ...(certIds.length > 0 ? [{ certificationId: { in: certIds } }] : []),
            ],
        },
        include: {
            student: { include: { user: { select: { fullName: true } } } },
            course: true,
            certification: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: complaints });
});

const respondToComplaintHandler = asyncHandler(async(req, res) => {
    const { trainerResponse, status } = req.body;
    const c = await prisma.markComplaint.update({
        where: { id: Number(req.params.id) },
        data: { trainerResponse, status: status || 'reviewed' },
    });
    return res.json({ success: true, data: c });
});

// ── ANNOUNCEMENTS ─────────────────────────────────────────────────
const getAnnouncementsHandler = asyncHandler(async(req, res) => {
    const trainer = await getTrainer(req.user.userId);
    const trainerUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const names = new Set();
    // Fixed: Replaced optional chaining
    if (trainerUser && trainerUser.department) names.add(trainerUser.department);
    if (trainer) {
        const tcs = await prisma.trainerCourse.findMany({
            where: { trainerId: trainer.id, courseId: { not: null } },
            include: { course: { include: { session: { include: { program: { include: { department: true } } } } } } },
        });
        // Fixed: Replaced optional chaining
        tcs.forEach(tc => {
            const d = tc.course && tc.course.session && tc.course.session.program && tc.course.session.program.department ? tc.course.session.program.department.name : null;
            if (d) names.add(d);
        });
    }
    const depts = names.size > 0 ? await prisma.department.findMany({ where: { name: { in: [...names] } } }) : [];
    const deptIds = depts.map(d => d.id);
    const announcements = await prisma.announcement.findMany({
        where: deptIds.length > 0 ? { departmentId: { in: deptIds }, targetRole: { in: ['trainer', 'all'] } } : { targetRole: { in: ['trainer', 'all'] } },
        include: { creator: { select: { fullName: true } }, department: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: announcements });
});

module.exports = {
    getDashboard,
    getCoursesHandler,
    getCertificationsHandler,
    getCertWeeksHandler,
    createCertWeekHandler,
    publishCertWeekHandler,
    unpublishCertWeekHandler,
    deleteCertWeekHandler,
    getPublishedWeeksHandler,
    getAvailabilityHandler,
    submitAvailabilityHandler,
    clearAvailabilityHandler,
    getStudentsForGradingHandler,
    generateCertTimetableHandler,
    getCertStudentAvailabilityStatusHandler,
    getTimetableHandler,
    getGradesHandler,
    upsertGradeHandler,
    getComplaintsHandler,
    respondToComplaintHandler,
    getAnnouncementsHandler,
};