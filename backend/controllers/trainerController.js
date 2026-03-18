// FILE: backend/controllers/trainerController.js
const prisma = require("../lib/prisma");
const { asyncHandler } = require("../middleware/errorHandler");

async function getTrainer(userId) {
  return prisma.trainer.findUnique({ where: { userId } });
}

const getDashboard = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: "Trainer profile not found", code: "NOT_FOUND" });
  const [courseCount, certCount, pendingComplaints] = await Promise.all([
    prisma.trainerCourse.count({ where: { trainerId: trainer.id, courseId: { not: null } } }),
    prisma.trainerCourse.count({ where: { trainerId: trainer.id, certificationId: { not: null } } }),
    prisma.markComplaint.count({ where: { trainerId: trainer.id, status: "pending" } }),
  ]);
  const academicSlots = await prisma.timetableSlot.findMany({
    where: { trainerId: trainer.id },
    include: { room: true, course: true, timetable: { include: { academicWeek: true } } },
    orderBy: [{ dayOfWeek: "asc" }, { timeStart: "asc" }],
    take: 5,
  });
  return res.json({ success: true, data: { trainerId: trainer.id, courseCount, certCount, pendingComplaints, upcomingAcademicSlots: academicSlots } });
});

const getCoursesHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: "Trainer not found", code: "NOT_FOUND" });
  const tcs = await prisma.trainerCourse.findMany({
    where: { trainerId: trainer.id, courseId: { not: null } },
    include: { course: { include: { session: { include: { program: { include: { department: true } }, academicLevel: true, semester: true } } } } },
  });
  return res.json({ success: true, data: tcs.map(tc => tc.course) });
});

const getCertificationsHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: "Trainer not found", code: "NOT_FOUND" });
  const tcs = await prisma.trainerCourse.findMany({
    where: { trainerId: trainer.id, certificationId: { not: null } },
    include: { certification: true },
  });
  return res.json({ success: true, data: tcs.map(tc => tc.certification) });
});

// FIX: Trainers only see the LATEST published week of their department
const getPublishedWeeksHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: "Trainer not found", code: "NOT_FOUND" });

  // Find department(s) this trainer belongs to
  const trainerUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
  const deptNames = new Set();
  if (trainerUser?.department) deptNames.add(trainerUser.department);

  const tcs = await prisma.trainerCourse.findMany({
    where: { trainerId: trainer.id, courseId: { not: null } },
    include: { course: { include: { session: { include: { program: { include: { department: true } } } } } } },
  });
  tcs.forEach(tc => {
    const d = tc.course?.session?.program?.department?.name;
    if (d) deptNames.add(d);
  });

  if (!deptNames.size) return res.json({ success: true, data: [] });

  const depts = await prisma.department.findMany({ where: { name: { in: [...deptNames] } } });
  const deptIds = depts.map(d => d.id);

  // Only the latest published week per department
  const weeks = [];
  for (const deptId of deptIds) {
    const latest = await prisma.academicWeek.findFirst({
      where: { departmentId: deptId, status: "published" },
      include: { department: { select: { name: true, code: true } } },
      orderBy: { weekNumber: "desc" },
    });
    if (latest) weeks.push(latest);
  }

  return res.json({ success: true, data: weeks });
});

const getAvailabilityHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: "Trainer not found", code: "NOT_FOUND" });
  const { weekId } = req.query;
  const availability = await prisma.availability.findMany({
    where: { trainerId: trainer.id, ...(weekId ? { academicWeekId: Number(weekId) } : {}) },
    include: { academicWeek: true },
    orderBy: [{ dayOfWeek: "asc" }, { timeStart: "asc" }],
  });
  return res.json({ success: true, data: availability });
});

// FIX: Check lock before allowing availability submission
const submitAvailabilityHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: "Trainer not found", code: "NOT_FOUND" });
  const { weekId, slots } = req.body;
  if (!weekId || !Array.isArray(slots))
    return res.status(400).json({ success: false, message: "weekId and slots[] required", code: "MISSING_FIELDS" });

  const week = await prisma.academicWeek.findUnique({ where: { id: Number(weekId) } });
  if (!week || week.status !== "published")
    return res.status(400).json({ success: false, message: "Week is not published", code: "WEEK_NOT_PUBLISHED" });

  // FIX: Check if HOD has locked this week
  const lock = await prisma.availabilityLock.findFirst({
    where: { academicWeekId: Number(weekId), isLocked: true },
  });
  if (lock)
    return res.status(403).json({ success: false, message: "Availability is locked for this week by the HOD. You cannot make changes.", code: "LOCKED" });

  await prisma.availability.deleteMany({ where: { trainerId: trainer.id, academicWeekId: Number(weekId) } });
  const created = await prisma.availability.createMany({
    data: slots.map(s => ({
      trainerId: trainer.id, academicWeekId: Number(weekId),
      dayOfWeek: s.dayOfWeek, timeStart: s.timeStart, timeEnd: s.timeEnd,
    })),
    skipDuplicates: true,
  });
  return res.status(201).json({ success: true, data: { created: created.count } });
});

const clearAvailabilityHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: "Trainer not found", code: "NOT_FOUND" });

  // Check lock before clearing
  const lock = await prisma.availabilityLock.findFirst({
    where: { academicWeekId: Number(req.params.weekId), isLocked: true },
  });
  if (lock) return res.status(403).json({ success: false, message: "Availability is locked for this week", code: "LOCKED" });

  await prisma.availability.deleteMany({ where: { trainerId: trainer.id, academicWeekId: Number(req.params.weekId) } });
  return res.json({ success: true, data: { cleared: true } });
});

const getTimetableHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: "Trainer not found", code: "NOT_FOUND" });
  const { weekId } = req.query;
  const [academicSlots, certSlots] = await Promise.all([
    prisma.timetableSlot.findMany({
      where: { trainerId: trainer.id, ...(weekId ? { academicWeekId: Number(weekId) } : {}), timetable: { status: "published" } },
      include: { room: true, course: { include: { session: { include: { program: true, academicLevel: true, semester: true } } } }, timetable: { include: { academicWeek: true } } },
      orderBy: [{ dayOfWeek: "asc" }, { timeStart: "asc" }],
    }),
    prisma.certTimetableSlot.findMany({
      where: { trainerId: trainer.id, ...(weekId ? { academicWeekId: Number(weekId) } : {}) },
      include: { room: true, certification: true, academicWeek: true },
      orderBy: [{ dayOfWeek: "asc" }, { timeStart: "asc" }],
    }),
  ]);
  return res.json({ success: true, data: { academicSlots: academicSlots.map(s => ({ ...s, type: "academic" })), certSlots: certSlots.map(s => ({ ...s, type: "certification" })) } });
});

const getGradesHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: "Trainer not found", code: "NOT_FOUND" });
  const grades = await prisma.grade.findMany({
    where: { trainerId: trainer.id },
    include: { student: { include: { user: true } }, course: true, certification: true, academicYear: true },
    orderBy: { submittedAt: "desc" },
  });
  return res.json({ success: true, data: grades });
});

const upsertGradeHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: "Trainer not found", code: "NOT_FOUND" });
  const { studentId, courseId, certificationId, grade, academicYearId } = req.body;
  if (!studentId || (!courseId && !certificationId))
    return res.status(400).json({ success: false, message: "studentId and courseId or certificationId required", code: "MISSING_FIELDS" });
  const gradeNum = parseFloat(grade);
  let gradeLetter = "F";
  if (gradeNum >= 90) gradeLetter = "A+";
  else if (gradeNum >= 80) gradeLetter = "A";
  else if (gradeNum >= 70) gradeLetter = "B";
  else if (gradeNum >= 60) gradeLetter = "C";
  else if (gradeNum >= 50) gradeLetter = "D";
  const data = { grade: gradeNum, gradeLetter, trainerId: trainer.id, academicYearId: academicYearId ? Number(academicYearId) : null };
  const where = courseId
    ? { studentId_courseId: { studentId: Number(studentId), courseId: Number(courseId) } }
    : { studentId_certificationId: { studentId: Number(studentId), certificationId: Number(certificationId) } };
  const result = await prisma.grade.upsert({
    where, update: data,
    create: { ...data, studentId: Number(studentId), courseId: courseId ? Number(courseId) : null, certificationId: certificationId ? Number(certificationId) : null },
  });
  return res.json({ success: true, data: result });
});

const getComplaintsHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: "Trainer not found", code: "NOT_FOUND" });
  const complaints = await prisma.markComplaint.findMany({
    where: { trainerId: trainer.id },
    include: { student: { include: { user: true } }, course: true, certification: true },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ success: true, data: complaints });
});

const respondToComplaintHandler = asyncHandler(async (req, res) => {
  const { trainerResponse, status } = req.body;
  const complaint = await prisma.markComplaint.update({
    where: { id: Number(req.params.id) },
    data: { trainerResponse, status: status || "reviewed" },
  });
  return res.json({ success: true, data: complaint });
});

// FIX: Announcements — filter by targetRole trainer or all
const getAnnouncementsHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  const trainerUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
  const deptNames = new Set();
  if (trainerUser?.department) deptNames.add(trainerUser.department);
  if (trainer) {
    const tcs = await prisma.trainerCourse.findMany({
      where: { trainerId: trainer.id, courseId: { not: null } },
      include: { course: { include: { session: { include: { program: { include: { department: true } } } } } } },
    });
    tcs.forEach(tc => { const d = tc.course?.session?.program?.department?.name; if (d) deptNames.add(d); });
  }
  const depts = await prisma.department.findMany({ where: { name: { in: [...deptNames] } } });
  const deptIds = depts.map(d => d.id);
  const announcements = await prisma.announcement.findMany({
    where: {
      departmentId: { in: deptIds },
      targetRole: { in: ["trainer", "all"] },
    },
    include: { creator: { select: { fullName: true } }, department: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ success: true, data: announcements });
});

module.exports = {
  getDashboard, getCoursesHandler, getCertificationsHandler, getPublishedWeeksHandler,
  getAvailabilityHandler, submitAvailabilityHandler, clearAvailabilityHandler,
  getTimetableHandler, getGradesHandler, upsertGradeHandler,
  getComplaintsHandler, respondToComplaintHandler, getAnnouncementsHandler,
};
