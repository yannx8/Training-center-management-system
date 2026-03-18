// FILE: backend/controllers/trainerController.js
const prisma = require('../lib/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

// ─── HELPER: get trainer record ───────────────────────────────
async function getTrainer(userId) {
  return prisma.trainer.findUnique({ where: { userId } });
}

// ─── DASHBOARD ────────────────────────────────────────────────
const getDashboard = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: 'Trainer profile not found', code: 'NOT_FOUND' });

  // Courses assigned
  const courses = await prisma.trainerCourse.findMany({
    where: { trainerId: trainer.id, courseId: { not: null } },
    include: {
      course: {
        include: { session: { include: { program: { include: { department: true } }, academicLevel: true, semester: true } } },
      },
    },
  });

  // Certifications assigned
  const certifications = await prisma.trainerCourse.findMany({
    where: { trainerId: trainer.id, certificationId: { not: null } },
    include: { certification: true },
  });

  // Upcoming timetable slots (academic)
  const academicSlots = await prisma.timetableSlot.findMany({
    where: { trainerId: trainer.id },
    include: {
      room: true,
      course: true,
      timetable: { include: { academicWeek: true } },
    },
    orderBy: [{ dayOfWeek: 'asc' }, { timeStart: 'asc' }],
    take: 10,
  });

  // Cert slots
  const certSlots = await prisma.certTimetableSlot.findMany({
    where: { trainerId: trainer.id },
    include: { room: true, certification: true, academicWeek: true },
    orderBy: [{ dayOfWeek: 'asc' }, { timeStart: 'asc' }],
    take: 10,
  });

  // Pending mark complaints
  const pendingComplaints = await prisma.markComplaint.count({
    where: { trainerId: trainer.id, status: 'pending' },
  });

  return res.json({
    success: true,
    data: {
      trainerId: trainer.id,
      courseCount: courses.length,
      certCount: certifications.length,
      upcomingAcademicSlots: academicSlots,
      upcomingCertSlots: certSlots,
      pendingComplaints,
    },
  });
});

// ─── COURSES ──────────────────────────────────────────────────
const getCoursesHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found', code: 'NOT_FOUND' });

  const trainerCourses = await prisma.trainerCourse.findMany({
    where: { trainerId: trainer.id, courseId: { not: null } },
    include: {
      course: {
        include: {
          session: {
            include: {
              program: { include: { department: true } },
              academicLevel: true,
              semester: true,
            },
          },
        },
      },
    },
  });

  return res.json({ success: true, data: trainerCourses.map(tc => tc.course) });
});

// ─── CERTIFICATIONS ───────────────────────────────────────────
const getCertificationsHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found', code: 'NOT_FOUND' });

  const trainerCerts = await prisma.trainerCourse.findMany({
    where: { trainerId: trainer.id, certificationId: { not: null } },
    include: { certification: true },
  });

  return res.json({ success: true, data: trainerCerts.map(tc => tc.certification) });
});

// ─── PUBLISHED WEEKS (BUG FIX) ───────────────────────────────
// Trainers see published weeks of departments where they have course assignments.
const getPublishedWeeksHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found', code: 'NOT_FOUND' });

  // Find all department IDs where this trainer has course assignments
  const deptIds = await prisma.trainerCourse.findMany({
    where: {
      trainerId: trainer.id,
      course: { session: { programId: { not: null } } },
    },
    include: {
      course: { include: { session: { include: { program: true } } } },
    },
  });

  const departmentIds = [...new Set(
    deptIds
      .map(tc => tc.course?.session?.program?.departmentId)
      .filter(Boolean)
  )];

  // Also include departments from the trainer's user.department field
  const trainerUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (trainerUser?.department) {
    const dept = await prisma.department.findFirst({ where: { name: trainerUser.department } });
    if (dept && !departmentIds.includes(dept.id)) departmentIds.push(dept.id);
  }

  if (!departmentIds.length) {
    return res.json({ success: true, data: [] });
  }

  const weeks = await prisma.academicWeek.findMany({
    where: { departmentId: { in: departmentIds }, status: 'published' },
    include: { department: { select: { name: true, code: true } } },
    orderBy: [{ weekNumber: 'desc' }],
  });

  return res.json({ success: true, data: weeks });
});

// ─── AVAILABILITY ─────────────────────────────────────────────

// GET /trainer/availability?weekId=
const getAvailabilityHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found', code: 'NOT_FOUND' });

  const { weekId } = req.query;

  const availability = await prisma.availability.findMany({
    where: {
      trainerId: trainer.id,
      ...(weekId ? { academicWeekId: Number(weekId) } : {}),
    },
    include: { academicWeek: true },
    orderBy: [{ dayOfWeek: 'asc' }, { timeStart: 'asc' }],
  });

  return res.json({ success: true, data: availability });
});

// POST /trainer/availability — submit availability for a published week
const submitAvailabilityHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found', code: 'NOT_FOUND' });

  const { weekId, slots } = req.body;
  // slots: [{ dayOfWeek, timeStart, timeEnd }, ...]
  if (!weekId || !Array.isArray(slots))
    return res.status(400).json({ success: false, message: 'weekId and slots[] required', code: 'MISSING_FIELDS' });

  // Verify the week is published
  const week = await prisma.academicWeek.findUnique({ where: { id: Number(weekId) } });
  if (!week || week.status !== 'published')
    return res.status(400).json({ success: false, message: 'Week is not published', code: 'WEEK_NOT_PUBLISHED' });

  // Check lock
  const lock = await prisma.availabilityLock.findFirst({
    where: { academicWeekId: Number(weekId), isLocked: true },
  });
  if (lock) return res.status(403).json({ success: false, message: 'Availability is locked for this week', code: 'LOCKED' });

  // Delete old slots for this week, then bulk-create new ones
  await prisma.availability.deleteMany({ where: { trainerId: trainer.id, academicWeekId: Number(weekId) } });

  const created = await prisma.availability.createMany({
    data: slots.map(s => ({
      trainerId: trainer.id,
      academicWeekId: Number(weekId),
      dayOfWeek: s.dayOfWeek,
      timeStart: s.timeStart,
      timeEnd: s.timeEnd,
    })),
    skipDuplicates: true,
  });

  return res.status(201).json({ success: true, data: { created: created.count } });
});

// DELETE /trainer/availability/:weekId — clear availability for a week
const clearAvailabilityHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found', code: 'NOT_FOUND' });

  await prisma.availability.deleteMany({
    where: { trainerId: trainer.id, academicWeekId: Number(req.params.weekId) },
  });
  return res.json({ success: true, data: { cleared: true } });
});

// ─── TIMETABLE (combined academic + cert) ────────────────────
const getTimetableHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found', code: 'NOT_FOUND' });

  const { weekId } = req.query;

  // Academic slots
  const academicSlots = await prisma.timetableSlot.findMany({
    where: {
      trainerId: trainer.id,
      ...(weekId ? { academicWeekId: Number(weekId) } : {}),
      timetable: { status: 'published' },
    },
    include: {
      room: true,
      course: { include: { session: { include: { program: true, academicLevel: true, semester: true } } } },
      timetable: { include: { academicWeek: true } },
    },
    orderBy: [{ dayOfWeek: 'asc' }, { timeStart: 'asc' }],
  });

  // Cert slots
  const certSlots = await prisma.certTimetableSlot.findMany({
    where: {
      trainerId: trainer.id,
      ...(weekId ? { academicWeekId: Number(weekId) } : {}),
    },
    include: {
      room: true,
      certification: true,
      academicWeek: true,
    },
    orderBy: [{ dayOfWeek: 'asc' }, { timeStart: 'asc' }],
  });

  return res.json({
    success: true,
    data: {
      academicSlots: academicSlots.map(s => ({ ...s, type: 'academic' })),
      certSlots: certSlots.map(s => ({ ...s, type: 'certification' })),
    },
  });
});

// ─── GRADES ───────────────────────────────────────────────────
const getGradesHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found', code: 'NOT_FOUND' });

  const grades = await prisma.grade.findMany({
    where: { trainerId: trainer.id },
    include: {
      student: { include: { user: true } },
      course: true,
      certification: true,
      academicYear: true,
    },
    orderBy: { submittedAt: 'desc' },
  });

  return res.json({ success: true, data: grades });
});

const upsertGradeHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found', code: 'NOT_FOUND' });

  const { studentId, courseId, certificationId, grade, academicYearId } = req.body;
  if (!studentId || (!courseId && !certificationId))
    return res.status(400).json({ success: false, message: 'studentId and (courseId or certificationId) required', code: 'MISSING_FIELDS' });

  // Compute letter grade
  const gradeNum = parseFloat(grade);
  let gradeLetter = 'F';
  if (gradeNum >= 90) gradeLetter = 'A+';
  else if (gradeNum >= 80) gradeLetter = 'A';
  else if (gradeNum >= 70) gradeLetter = 'B';
  else if (gradeNum >= 60) gradeLetter = 'C';
  else if (gradeNum >= 50) gradeLetter = 'D';

  const where = courseId
    ? { studentId_courseId: { studentId: Number(studentId), courseId: Number(courseId) } }
    : { studentId_certificationId: { studentId: Number(studentId), certificationId: Number(certificationId) } };

  const data = {
    grade: gradeNum,
    gradeLetter,
    trainerId: trainer.id,
    academicYearId: academicYearId ? Number(academicYearId) : null,
  };

  const result = await prisma.grade.upsert({
    where,
    update: data,
    create: {
      ...data,
      studentId: Number(studentId),
      courseId: courseId ? Number(courseId) : null,
      certificationId: certificationId ? Number(certificationId) : null,
    },
  });

  return res.json({ success: true, data: result });
});

// ─── MARK COMPLAINTS ─────────────────────────────────────────
const getComplaintsHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found', code: 'NOT_FOUND' });

  const complaints = await prisma.markComplaint.findMany({
    where: { trainerId: trainer.id },
    include: {
      student: { include: { user: true } },
      course: true,
      certification: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ success: true, data: complaints });
});

const respondToComplaintHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { trainerResponse, status } = req.body;

  const complaint = await prisma.markComplaint.update({
    where: { id: Number(id) },
    data: { trainerResponse, status: status || 'reviewed' },
  });
  return res.json({ success: true, data: complaint });
});

// ─── ANNOUNCEMENTS ────────────────────────────────────────────
// Trainers see announcements from departments they are assigned to
const getAnnouncementsHandler = asyncHandler(async (req, res) => {
  const trainerUser = await prisma.user.findUnique({ where: { id: req.user.userId } });

  // Collect dept IDs
  const trainer = await getTrainer(req.user.userId);
  const deptNames = new Set();
  if (trainerUser?.department) deptNames.add(trainerUser.department);

  if (trainer) {
    const tcs = await prisma.trainerCourse.findMany({
      where: { trainerId: trainer.id, courseId: { not: null } },
      include: { course: { include: { session: { include: { program: { include: { department: true } } } } } } },
    });
    tcs.forEach(tc => {
      const dName = tc.course?.session?.program?.department?.name;
      if (dName) deptNames.add(dName);
    });
  }

  const depts = await prisma.department.findMany({ where: { name: { in: [...deptNames] } } });
  const deptIds = depts.map(d => d.id);

  const announcements = await prisma.announcement.findMany({
    where: {
      OR: [
        { departmentId: { in: deptIds }, targetRole: { in: ['trainer', 'all'] } },
        { departmentId: { in: deptIds }, targetRole: null },
      ],
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
  getCoursesHandler,
  getCertificationsHandler,
  getPublishedWeeksHandler,
  getAvailabilityHandler,
  submitAvailabilityHandler,
  clearAvailabilityHandler,
  getTimetableHandler,
  getGradesHandler,
  upsertGradeHandler,
  getComplaintsHandler,
  respondToComplaintHandler,
  getAnnouncementsHandler,
};
