const prisma = require("../lib/prisma");
const { asyncHandler } = require("../middleware/errorHandler");


const TIME_SLOTS = [
    { start: "08:00", end: "10:00", hours: 2 },
    { start: "10:30", end: "12:00", hours: 1.5 },
    { start: "13:00", end: "15:00", hours: 2 },
    { start: "15:30", end: "17:00", hours: 1.5 },
    { start: "17:00", end: "19:00", hours: 2 },
    { start: "19:30", end: "21:30", hours: 2 },
];

function slotHours(timeStart, timeEnd) {
    const found = TIME_SLOTS.find(s => s.start === timeStart && s.end === timeEnd);
    if (found) return found.hours;
    // fallback: parse difference
    const [sh, sm] = timeStart.split(":").map(Number);
    const [eh, em] = timeEnd.split(":").map(Number);
    return (eh + em / 60) - (sh + sm / 60);
}

// Finds the department managed by the current logged-in HOD.
async function getHodDept(userId) {
    return prisma.department.findFirst({ where: { hodUserId: userId } });
}

// Pulls together all the metrics an HOD needs to see on their main page.
// Shows programs, trainer counts, and how many have submitted their availability for the week.
const getDashboard = asyncHandler(async (req, res) => {
    const dept = await getHodDept(req.user.userId);
    if (!dept) return res.status(404).json({ success: false, message: "No department assigned", code: "NO_DEPT" });

    const programs = await prisma.program.findMany({
        where: { departmentId: dept.id },
        include: { _count: { select: { enrollments: true } } },
        orderBy: { name: "asc" },
    });

    // We count trainers who are either assigned to this department directly 
    // or are teaching a course that belongs to one of its programs.
    const trainersInDept = await prisma.trainer.findMany({
        where: {
            OR: [
                { user: { department: dept.name } },
                { trainerCourses: { some: { course: { session: { program: { departmentId: dept.id } } } } } }
            ]
        },
        select: { id: true }
    });
    const trainerCount = trainersInDept.length;

    // Track participation for the currently active academic week.
    const activeWeek = await prisma.academicWeek.findFirst({
        where: { departmentId: dept.id, status: "published" },
        orderBy: { weekNumber: "desc" },
    });
    const availabilityCount = activeWeek ? await prisma.availability.count({ where: { academicWeekId: activeWeek.id } }) : 0;

    return res.json({
        success: true,
        data: {
            department: dept.name,
            departmentCode: dept.code,
            programs: programs.map(p => ({ ...p, enrollmentCount: p._count.enrollments })),
            stats: { programCount: programs.length, trainerCount, availabilityCount, activeWeek: activeWeek ? activeWeek.label : null },
        }
    });
});

const getProgramsHandler = asyncHandler(async (req, res) => {
    const dept = await getHodDept(req.user.userId);
    if (!dept) return res.status(404).json({ success: false, message: "No department assigned", code: "NO_DEPT" });
    const programs = await prisma.program.findMany({
        where: { departmentId: dept.id },
        include: { levels: { orderBy: { levelOrder: 'asc' } } },   // <-- added
        orderBy: { name: "asc" },
    });
    return res.json({ success: true, data: programs });
});

// WEEKS
const createAcademicWeekHandler = asyncHandler(async (req, res) => {
    const dept = await getHodDept(req.user.userId);
    if (!dept) return res.status(404).json({ success: false, message: "No department assigned", code: "NO_DEPT" });
    const { weekNumber, label, startDate, endDate, academicYearId, availabilityDeadline } = req.body;
    if (!weekNumber || !label || !startDate || !endDate)
        return res.status(400).json({ success: false, message: "weekNumber, label, startDate, endDate required", code: "MISSING_FIELDS" });
    const week = await prisma.academicWeek.create({
        data: {
            weekNumber: Number(weekNumber),
            label,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            departmentId: dept.id,
            createdBy: req.user.userId,
            academicYearId: academicYearId ? Number(academicYearId) : null,
            availabilityDeadline: availabilityDeadline ? new Date(availabilityDeadline) : null,
            status: "draft"
        },
    });
    return res.status(201).json({ success: true, data: week });
});

const getAcademicWeeksHandler = asyncHandler(async (req, res) => {
    const dept = await getHodDept(req.user.userId);
    if (!dept) return res.status(404).json({ success: false, message: "No department assigned", code: "NO_DEPT" });
    const weeks = await prisma.academicWeek.findMany({ where: { departmentId: dept.id }, orderBy: { weekNumber: "desc" } });
    return res.json({ success: true, data: weeks });
});

const getPublishedWeeksHandler = asyncHandler(async (req, res) => {
    const dept = await getHodDept(req.user.userId);
    if (!dept) return res.status(404).json({ success: false, message: "No department assigned", code: "NO_DEPT" });
    const latest = await prisma.academicWeek.findFirst({
        where: { departmentId: dept.id, status: "published" },
        orderBy: { weekNumber: "desc" },
    });
    return res.json({ success: true, data: latest ? [latest] : [] });
});

const publishWeekHandler = asyncHandler(async (req, res) => {
    const dept = await getHodDept(req.user.userId);
    if (!dept) return res.status(404).json({ success: false, message: "No department assigned", code: "NO_DEPT" });
    const existing = await prisma.academicWeek.findFirst({ where: { id: Number(req.params.id), departmentId: dept.id } });
    if (!existing) return res.status(404).json({ success: false, message: "Week not found", code: "NOT_FOUND" });

    // Auto-close any currently published weeks in this department
    await prisma.academicWeek.updateMany({
        where: { departmentId: dept.id, status: "published", id: { not: Number(req.params.id) } },
        data: { status: "closed" },
    });

    const week = await prisma.academicWeek.update({ where: { id: Number(req.params.id) }, data: { status: "published" } });

    // Auto-create announcement targeted to trainers
    const deadlineStr = week.availabilityDeadline ?
        new Date(week.availabilityDeadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) :
        "as soon as possible";
    await prisma.announcement.create({
        data: {
            title: `Availability submission required for the class scheduling`,
            body: `Academic week "${week.label}" is now active. Please submit your availability before ${deadlineStr}.`,
            targetRole: "trainer",
            departmentId: dept.id,
            createdBy: req.user.userId,
        },
    });

    return res.json({ success: true, data: week });
});

const unpublishWeekHandler = asyncHandler(async (req, res) => {
    const week = await prisma.academicWeek.update({ where: { id: Number(req.params.id) }, data: { status: "draft" } });
    return res.json({ success: true, data: week });
});

const deleteWeekHandler = asyncHandler(async (req, res) => {
    await prisma.academicWeek.delete({ where: { id: Number(req.params.id) } });
    return res.json({ success: true, data: { deleted: true } });
});

// Close week 
const closeWeekHandler = asyncHandler(async (req, res) => {
    const dept = await getHodDept(req.user.userId);
    if (!dept) return res.status(404).json({ success: false, message: "No department assigned", code: "NO_DEPT" });

    const week = await prisma.academicWeek.findFirst({ where: { id: Number(req.params.id), departmentId: dept.id } });
    if (!week) return res.status(404).json({ success: false, message: "Week not found", code: "NOT_FOUND" });

    // Safety check: Don't allow closing the week unless we have an official schedule.
    const timetable = await prisma.timetable.findFirst({
        where: { academicWeekId: week.id, status: "published" }
    });
    if (!timetable) {
        return res.status(400).json({ success: false, message: "A timetable must be generated and published before closing the week." });
    }

    // Find timetable slots for this week
    const slots = await prisma.timetableSlot.findMany({
        where: { academicWeekId: week.id },
        include: { course: true },
    });

    // Accumulate hours per course
    const courseHoursMap = {};
    for (const slot of slots) {
        if (!slot.courseId) continue;
        const hours = slotHours(slot.timeStart, slot.timeEnd);
        courseHoursMap[slot.courseId] = (courseHoursMap[slot.courseId] || 0) + hours;
    }

    // Here we wrap up the week by deducting scheduled hours from each course's bank.
    // This helps trainers and HODs see how much teaching time is left for each course.
    for (const [courseId, hours] of Object.entries(courseHoursMap)) {
        const course = await prisma.course.findUnique({ where: { id: Number(courseId) } });
        if (course) {
            await prisma.course.update({
                where: { id: Number(courseId) },
                data: { remainingHours: Math.max(0, course.remainingHours - hours) },
            });
        }
    }

    const updated = await prisma.academicWeek.update({ where: { id: week.id }, data: { status: "closed" } });
    return res.json({ success: true, data: { week: updated, hoursDeducted: courseHoursMap } });
});

// AVAILABILITY 
const getAvailabilityHandler = asyncHandler(async (req, res) => {
    const dept = await getHodDept(req.user.userId);
    if (!dept) return res.status(404).json({ success: false, message: "No department assigned", code: "NO_DEPT" });
    const { weekId } = req.query;
    const availability = await prisma.availability.findMany({
        where: { academicWeek: { departmentId: dept.id }, ...(weekId ? { academicWeekId: Number(weekId) } : {}) },
        include: { trainer: { include: { user: true } }, academicWeek: true },
        orderBy: [{ dayOfWeek: "asc" }, { timeStart: "asc" }],
    });
    return res.json({
        success: true,
        data: availability.map(a => ({
            id: a.id,
            dayOfWeek: a.dayOfWeek,
            timeStart: a.timeStart,
            timeEnd: a.timeEnd,
            trainerId: a.trainerId,
            trainerName: a.trainer.user.fullName,
            weekLabel: a.academicWeek.label,
            weekId: a.academicWeekId,
        }))
    });
});

const getTrainerAvailabilityStatusHandler = asyncHandler(async (req, res) => {
    const dept = await getHodDept(req.user.userId);
    if (!dept) return res.status(404).json({ success: false, message: "No department assigned", code: "NO_DEPT" });
    const { weekId } = req.query;
    const trainers = await prisma.trainer.findMany({
        where: { user: { department: dept.name } },
        include: { user: { select: { id: true, fullName: true, email: true } } },
    });
    if (!weekId) return res.json({ success: true, data: { trainers: trainers.map(t => ({ ...t, submitted: false, slotCount: 0 })), weekId: null } });
    const result = await Promise.all(trainers.map(async t => {
        const count = await prisma.availability.count({ where: { trainerId: t.id, academicWeekId: Number(weekId) } });
        const slots = count > 0 ? await prisma.availability.findMany({
            where: { trainerId: t.id, academicWeekId: Number(weekId) },
            orderBy: [{ dayOfWeek: "asc" }, { timeStart: "asc" }],
        }) : [];
        return { ...t, submitted: count > 0, slotCount: count, slots };
    }));
    return res.json({ success: true, data: { trainers: result, weekId: Number(weekId) } });
});

const lockAvailabilityHandler = asyncHandler(async (req, res) => {
    const { weekId } = req.body;
    if (!weekId) return res.status(400).json({ success: false, message: "weekId required", code: "MISSING_FIELDS" });
    await prisma.availabilityLock.upsert({
        where: { hodUserId_academicWeekId: { hodUserId: req.user.userId, academicWeekId: Number(weekId) } },
        update: { isLocked: true },
        create: { hodUserId: req.user.userId, academicWeekId: Number(weekId), isLocked: true },
    });
    return res.json({ success: true, data: { locked: true } });
});

const unlockAvailabilityHandler = asyncHandler(async (req, res) => {
    const { weekId } = req.body;
    await prisma.availabilityLock.upsert({
        where: { hodUserId_academicWeekId: { hodUserId: req.user.userId, academicWeekId: Number(weekId) } },
        update: { isLocked: false },
        create: { hodUserId: req.user.userId, academicWeekId: Number(weekId), isLocked: false },
    });
    return res.json({ success: true, data: { locked: false } });
});

const getLockStatus = asyncHandler(async (req, res) => {
    const { weekId } = req.query;
    if (!weekId) return res.json({ success: true, data: { isLocked: false } });
    const lock = await prisma.availabilityLock.findUnique({
        where: { hodUserId_academicWeekId: { hodUserId: req.user.userId, academicWeekId: Number(weekId) } },
    });
    // Fixed: Replaced optional chaining
    return res.json({ success: true, data: { isLocked: lock ? lock.isLocked : false } });
});

//ACADEMIC TIMETABLE GENERATION (priority-based) 
const generateTimetable = asyncHandler(async (req, res) => {
    const { weekId, label } = req.body;
    if (!weekId) return res.status(400).json({ success: false, message: "weekId required", code: "MISSING_FIELDS" });
    const dept = await getHodDept(req.user.userId);
    if (!dept) return res.status(404).json({ success: false, message: "No department assigned", code: "NO_DEPT" });
    const week = await prisma.academicWeek.findUnique({ where: { id: Number(weekId) } });
    if (!week || week.status !== "published")
        return res.status(400).json({ success: false, message: "Week must be published first", code: "WEEK_NOT_PUBLISHED" });

    // Ensure it's the latest published week
    const latestPublished = await prisma.academicWeek.findFirst({
        where: { departmentId: dept.id, status: 'published' },
        orderBy: { weekNumber: 'desc' },
    });
    if (!latestPublished || latestPublished.id !== week.id) {
        return res.status(400).json({ success: false, message: "Timetable generation is only allowed for the active (latest published) week." });
    }
    const rooms = await prisma.room.findMany({ where: { status: "available" }, orderBy: { id: "asc" } });
    if (!rooms.length) return res.status(400).json({ success: false, message: "No available rooms", code: "NO_ROOMS" });

    // Get all trainer-course assignments for this department
    const trainerCourses = await prisma.trainerCourse.findMany({
        where: { courseId: { not: null }, course: { session: { program: { departmentId: dept.id } } } },
        include: { course: true, trainer: true },
    });
    if (!trainerCourses.length)
        return res.status(400).json({ success: false, message: "No courses assigned to trainers in this department", code: "NO_CANDIDATES" });

    // Sort courses by remainingHours descending (highest priority first)
    const courseEntries = trainerCourses
        .filter(tc => tc.course && tc.course.remainingHours > 0)
        .sort((a, b) => b.course.remainingHours - a.course.remainingHours);

    if (!courseEntries.length)
        return res.status(400).json({ success: false, message: "All courses have 0 remaining hours", code: "NO_REMAINING" });

    // Get all availabilities for this week from relevant trainers
    const trainerIds = [...new Set(courseEntries.map(tc => tc.trainerId))];
    const availabilities = await prisma.availability.findMany({
        where: { academicWeekId: Number(weekId), trainerId: { in: trainerIds } },
        orderBy: [{ dayOfWeek: "asc" }, { timeStart: "asc" }],
    });

    if (!availabilities.length)
        return res.status(400).json({ success: false, message: "No trainer availability found", code: "NO_CANDIDATES" });

    // Delete old timetable for this week
    await prisma.timetable.deleteMany({ where: { academicWeekId: Number(weekId) } });
    const timetable = await prisma.timetable.create({
        data: { academicWeekId: Number(weekId), generatedBy: req.user.userId, label: label || `${dept.name} — ${week.label}`, status: "draft" },
    });

    // This is the core logic for building the schedule.
    // We prioritize courses that have the most remaining hours first.
    const trainerBooked = new Set();
    const roomBooked = new Set();
    let scheduled = 0,
        skipped = 0;

    // For each course (sorted by remaining hours desc = priority)
    for (const tc of courseEntries) {
        const course = tc.course;
        if (course.remainingHours <= 0) { skipped++; continue; }

        // Find this trainer's available slots for this week
        const trainerAvail = availabilities.filter(a => a.trainerId === tc.trainerId);

        for (const avail of trainerAvail) {
            const tKey = `${tc.trainerId}|${avail.dayOfWeek}|${avail.timeStart}`;
            if (trainerBooked.has(tKey)) continue;

            // Check no existing conflict in DB
            const trainerConflict = await prisma.timetableSlot.findFirst({
                where: { trainerId: tc.trainerId, dayOfWeek: avail.dayOfWeek, timeStart: avail.timeStart, academicWeekId: Number(weekId) },
            });
            if (trainerConflict) continue;

            // Find available room
            let chosenRoom = null;
            for (const room of rooms) {
                const rKey = `${room.id}|${avail.dayOfWeek}|${avail.timeStart}`;
                if (roomBooked.has(rKey)) continue;
                const roomConflict = await prisma.timetableSlot.findFirst({
                    where: { roomId: room.id, dayOfWeek: avail.dayOfWeek, timeStart: avail.timeStart, academicWeekId: Number(weekId) },
                });
                if (!roomConflict) {
                    chosenRoom = room;
                    roomBooked.add(rKey);
                    break;
                }
            }
            if (!chosenRoom) continue;

            await prisma.timetableSlot.create({
                data: { timetableId: timetable.id, academicWeekId: Number(weekId), dayOfWeek: avail.dayOfWeek, timeStart: avail.timeStart, timeEnd: avail.timeEnd, roomId: chosenRoom.id, trainerId: tc.trainerId, courseId: tc.courseId },
            });
            trainerBooked.add(tKey);
            scheduled++;
            break; // One slot per course per pass — move to next course
        }
    }
    return res.status(201).json({ success: true, data: { timetableId: timetable.id, scheduled, count: scheduled, skipped } });
});

const getTimetablesHandler = asyncHandler(async (req, res) => {
    const dept = await getHodDept(req.user.userId);
    if (!dept) return res.status(404).json({ success: false, message: "No department assigned", code: "NO_DEPT" });
    const timetables = await prisma.timetable.findMany({
        where: { academicWeek: { departmentId: dept.id } },
        include: { academicWeek: true, slots: { include: { room: true, trainer: { include: { user: true } }, course: { include: { session: { include: { program: true, academicLevel: true, semester: true } } } } }, orderBy: [{ dayOfWeek: "asc" }, { timeStart: "asc" }] } },
        orderBy: { generatedAt: "desc" },
    });
    const result = timetables.map(tt => {
        const programMap = {};
        for (const slot of tt.slots) {
            // Fixed: Replaced optional chaining
            const prog = slot.course && slot.course.session && slot.course.session.program;
            if (!prog) continue;
            if (!programMap[prog.id]) programMap[prog.id] = { program: prog, slots: [] };
            programMap[prog.id].slots.push(slot);
        }
        return { ...tt, programGroups: Object.values(programMap) };
    });
    return res.json({ success: true, data: result });
});

const publishTimetableHandler = asyncHandler(async (req, res) => {
    const timetableId = Number(req.params.id);

    // 1. Fetch the timetable with its week, slots, and department
    const timetable = await prisma.timetable.findUnique({
        where: { id: timetableId },
        include: {
            academicWeek: {
                include: { department: true }
            },
            slots: {
                include: {
                    trainer: true,
                    course: {
                        include: {
                            session: {
                                include: {
                                    program: {
                                        include: {
                                            enrollments: {
                                                include: { student: true }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!timetable) {
        return res.status(404).json({ success: false, message: 'Timetable not found', code: 'NOT_FOUND' });
    }

    const dept = timetable.academicWeek?.department;
    const weekLabel = timetable.academicWeek?.label || 'the upcoming week';

    // 2. Mark as published
    const updated = await prisma.timetable.update({
        where: { id: timetableId },
        data: { status: 'published' }
    });

    // 3. Collect unique trainer IDs involved in this timetable
    const trainerIds = [...new Set(timetable.slots.map(s => s.trainerId).filter(Boolean))];

    // 4. Collect unique student user IDs enrolled in programs that appear in this timetable
    const programIds = [
        ...new Set(
            timetable.slots
                .map(s => s.course?.session?.programId)
                .filter(Boolean)
        )
    ];

    // 5. Build announcement body
    const dateRange = timetable.academicWeek
        ? `${new Date(timetable.academicWeek.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(timetable.academicWeek.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
        : '';

    // 6. Announcement for trainers assigned in this timetable
    if (dept && trainerIds.length > 0) {
        await prisma.announcement.create({
            data: {
                title: `Your schedule for "${weekLabel}" has been published`,
                body: `The timetable for ${weekLabel}${dateRange ? ` (${dateRange})` : ''} is now live. Please log in to view your assigned sessions.`,
                targetRole: 'trainer',
                departmentId: dept.id,
                createdBy: req.user.userId,
            }
        });
    }

    // 7. Announcement for students in programs covered by this timetable
    if (dept && programIds.length > 0) {
        await prisma.announcement.create({
            data: {
                title: `Your class schedule for "${weekLabel}" is available`,
                body: `The timetable for ${weekLabel}${dateRange ? ` (${dateRange})` : ''} has been published. Log in to check your sessions, rooms, and times.`,
                targetRole: 'student',
                departmentId: dept.id,
                createdBy: req.user.userId,
            }
        });
    }

    return res.json({ success: true, data: updated });
});

//  ANNOUNCEMENTS 
const createAnnouncementHandler = asyncHandler(async (req, res) => {
    const { title, body, targetRole } = req.body;
    if (!title || !body) return res.status(400).json({ success: false, message: "title and body required", code: "MISSING_FIELDS" });
    const dept = await getHodDept(req.user.userId);
    if (!dept) return res.status(404).json({ success: false, message: "No department assigned", code: "NO_DEPT" });
    const announcement = await prisma.announcement.create({
        data: { title, body, targetRole: targetRole || "all", departmentId: dept.id, createdBy: req.user.userId },
    });
    return res.status(201).json({ success: true, data: announcement });
});

const getAnnouncementsHandler = asyncHandler(async (req, res) => {
    const dept = await getHodDept(req.user.userId);
    if (!dept) return res.status(404).json({ success: false, message: "No department assigned", code: "NO_DEPT" });
    const announcements = await prisma.announcement.findMany({
        where: { departmentId: dept.id },
        include: { creator: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, data: announcements });
});

const deleteAnnouncementHandler = asyncHandler(async (req, res) => {
    await prisma.announcement.delete({ where: { id: Number(req.params.id) } });
    return res.json({ success: true, data: { deleted: true } });
});

module.exports = {
    getDashboard,
    getProgramsHandler,
    createAcademicWeekHandler,
    getAcademicWeeksHandler,
    getPublishedWeeksHandler,
    publishWeekHandler,
    unpublishWeekHandler,
    deleteWeekHandler,
    closeWeekHandler,
    getAvailabilityHandler,
    getTrainerAvailabilityStatusHandler,
    getLockStatus,
    lockAvailabilityHandler,
    unlockAvailabilityHandler,
    generateTimetable,
    getTimetablesHandler,
    publishTimetableHandler,
    createAnnouncementHandler,
    getAnnouncementsHandler,
    deleteAnnouncementHandler,
};