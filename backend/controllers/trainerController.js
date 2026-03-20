const prisma = require('../lib/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

async function getTrainer(userId) {
  return prisma.trainer.findUnique({ where: { userId } });
}

const getDashboard = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

  const [courseCount, certCount, pendingComplaints] = await Promise.all([
    prisma.trainerCourse.count({ where: { trainerId: trainer.id, courseId: { not: null } } }),
    prisma.trainerCourse.count({ where: { trainerId: trainer.id, certificationId: { not: null } } }),
    prisma.markComplaint.count({ where: { trainerId: trainer.id, status: 'pending' } }),
  ]);

  const slots = await prisma.timetableSlot.findMany({
    where: { trainerId: trainer.id },
    include: { room: true, course: true, timetable: { include: { academicWeek: true } } },
    orderBy: [{ dayOfWeek: 'asc' }, { timeStart: 'asc' }],
    take: 5,
  });

  return res.json({ success: true, data: { trainerId: trainer.id, courseCount, certCount, pendingComplaints, upcomingSlots: slots } });
});

const getCoursesHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

  const tcs = await prisma.trainerCourse.findMany({
    where: { trainerId: trainer.id, courseId: { not: null } },
    include: { course: { include: { session: { include: { program: { include: { department: true } }, academicLevel: true, semester: true } } } } },
  });
  return res.json({ success: true, data: tcs.map(tc => tc.course) });
});

const getCertificationsHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

  const tcs = await prisma.trainerCourse.findMany({
    where: { trainerId: trainer.id, certificationId: { not: null } },
    include: { certification: true },
  });
  return res.json({ success: true, data: tcs.map(tc => tc.certification) });
});

const getPublishedWeeksHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

  const trainerUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
  const deptNames = new Set();
  if (trainerUser?.department) deptNames.add(trainerUser.department);

  const tcs = await prisma.trainerCourse.findMany({
    where: { trainerId: trainer.id, courseId: { not: null } },
    include: { course: { include: { session: { include: { program: { include: { department: true } } } } } } },
  });
  tcs.forEach(tc => { const d = tc.course?.session?.program?.department?.name; if (d) deptNames.add(d); });

  if (!deptNames.size) return res.json({ success: true, data: [] });

  const depts = await prisma.department.findMany({ where: { name: { in: [...deptNames] } } });
  const weeks = [];
  for (const dept of depts) {
    const latest = await prisma.academicWeek.findFirst({
      where: { departmentId: dept.id, status: 'published' },
      include: { department: { select: { name: true, code: true } } },
      orderBy: { weekNumber: 'desc' },
    });
    if (latest) weeks.push(latest);
  }
  return res.json({ success: true, data: weeks });
});

const getAvailabilityHandler = asyncHandler(async (req, res) => {
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

const submitAvailabilityHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

  const { weekId, slots } = req.body;
  if (!weekId || !Array.isArray(slots))
    return res.status(400).json({ success: false, message: 'weekId and slots[] required' });

  const week = await prisma.academicWeek.findUnique({ where: { id: Number(weekId) } });
  if (!week || week.status !== 'published')
    return res.status(400).json({ success: false, message: 'Week is not published' });

  const lock = await prisma.availabilityLock.findFirst({ where: { academicWeekId: Number(weekId), isLocked: true } });
  if (lock) return res.status(403).json({ success: false, message: 'Availability locked by HOD' });

  await prisma.availability.deleteMany({ where: { trainerId: trainer.id, academicWeekId: Number(weekId) } });
  const created = await prisma.availability.createMany({
    data: slots.map(s => ({ trainerId: trainer.id, academicWeekId: Number(weekId), dayOfWeek: s.dayOfWeek, timeStart: s.timeStart, timeEnd: s.timeEnd })),
    skipDuplicates: true,
  });
  return res.status(201).json({ success: true, data: { created: created.count } });
});

const clearAvailabilityHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

  const lock = await prisma.availabilityLock.findFirst({ where: { academicWeekId: Number(req.params.weekId), isLocked: true } });
  if (lock) return res.status(403).json({ success: false, message: 'Availability locked' });

  await prisma.availability.deleteMany({ where: { trainerId: trainer.id, academicWeekId: Number(req.params.weekId) } });
  return res.json({ success: true, data: { cleared: true } });
});

// NEW: returns students with existing grades for each course/cert the trainer teaches
// so trainer can add new entries as well as edit existing ones
const getStudentsForGradingHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

  // Courses this trainer teaches
  const trainerCourses = await prisma.trainerCourse.findMany({
    where: { trainerId: trainer.id, courseId: { not: null } },
    include: { course: { include: { session: { include: { program: true, academicLevel: true, semester: true } } } } },
  });

  const trainerCerts = await prisma.trainerCourse.findMany({
    where: { trainerId: trainer.id, certificationId: { not: null } },
    include: { certification: true },
  });

  const result = [];

  // For each course, get all students enrolled in that program
  for (const tc of trainerCourses) {
    const course = tc.course;
    if (!course?.session?.programId) continue;

    const enrollments = await prisma.enrollment.findMany({
      where: { programId: course.session.programId, status: 'active' },
      include: { student: { include: { user: { select: { fullName: true } } } } },
    });

    const existingGrades = await prisma.grade.findMany({
      where: { courseId: course.id },
    });
    const gradeMap = Object.fromEntries(existingGrades.map(g => [g.studentId, g]));

    result.push({
      type: 'course',
      subjectId: course.id,
      subjectName: course.name,
      subjectCode: course.code,
      programName: course.session?.program?.name,
      levelName: course.session?.academicLevel?.name,
      semesterName: course.session?.semester?.name,
      students: enrollments.map(e => ({
        studentId: e.studentId,
        fullName: e.student?.user?.fullName || 'Unknown',
        matricule: e.student?.matricule || '',
        existingGrade: gradeMap[e.studentId]?.grade ?? null,
        existingLetter: gradeMap[e.studentId]?.gradeLetter ?? null,
        gradeId: gradeMap[e.studentId]?.id ?? null,
      })),
    });
  }

  // For each certification, get enrolled students
  for (const tc of trainerCerts) {
    const cert = tc.certification;

    const enrollments = await prisma.enrollment.findMany({
      where: { certificationId: cert.id, status: 'active' },
      include: { student: { include: { user: { select: { fullName: true } } } } },
    });

    const existingGrades = await prisma.grade.findMany({
      where: { certificationId: cert.id },
    });
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
        fullName: e.student?.user?.fullName || 'Unknown',
        matricule: e.student?.matricule || '',
        existingGrade: gradeMap[e.studentId]?.grade ?? null,
        existingLetter: gradeMap[e.studentId]?.gradeLetter ?? null,
        gradeId: gradeMap[e.studentId]?.id ?? null,
      })),
    });
  }

  return res.json({ success: true, data: result });
});

const generateCertTimetableHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

  const { weekId, certificationId } = req.body;
  if (!weekId || !certificationId)
    return res.status(400).json({ success: false, message: 'weekId and certificationId required' });

  const assignment = await prisma.trainerCourse.findFirst({
    where: { trainerId: trainer.id, certificationId: Number(certificationId) },
  });
  if (!assignment)
    return res.status(403).json({ success: false, message: 'You are not assigned to this certification' });

  const rooms = await prisma.room.findMany({ where: { status: 'available' }, orderBy: { id: 'asc' } });

  await prisma.certTimetableSlot.deleteMany({
    where: { certificationId: Number(certificationId), academicWeekId: Number(weekId) },
  });

  const trainerAvail = await prisma.availability.findMany({
    where: { trainerId: trainer.id, academicWeekId: Number(weekId) },
    orderBy: [{ dayOfWeek: 'asc' }, { timeStart: 'asc' }],
  });

  if (!trainerAvail.length)
    return res.status(400).json({ success: false, message: 'You have not submitted availability for this week' });

  const enrollments = await prisma.enrollment.findMany({
    where: { certificationId: Number(certificationId), status: 'active' },
  });
  if (!enrollments.length)
    return res.status(400).json({ success: false, message: 'No students enrolled' });

  const studentIds = enrollments.map(e => e.studentId);
  let scheduled = 0, skipped = 0;

  for (const slot of trainerAvail) {
    const tc = await prisma.timetableSlot.findFirst({
      where: { trainerId: trainer.id, dayOfWeek: slot.dayOfWeek, timeStart: slot.timeStart, academicWeekId: Number(weekId) },
    });
    if (tc) { skipped++; continue; }

    const cc = await prisma.certTimetableSlot.findFirst({
      where: { trainerId: trainer.id, dayOfWeek: slot.dayOfWeek, timeStart: slot.timeStart, academicWeekId: Number(weekId) },
    });
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
      data: { certificationId: Number(certificationId), trainerId: trainer.id, academicWeekId: Number(weekId), dayOfWeek: slot.dayOfWeek, timeStart: slot.timeStart, timeEnd: slot.timeEnd, roomId: room?.id ?? null, status: 'scheduled' },
    });
    scheduled++;
  }

  return res.status(201).json({ success: true, data: { scheduled, skipped } });
});

const getCertStudentAvailabilityStatusHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

  const { weekId, certificationId } = req.query;
  if (!weekId || !certificationId)
    return res.status(400).json({ success: false, message: 'weekId and certificationId required' });

  const enrollments = await prisma.enrollment.findMany({
    where: { certificationId: Number(certificationId), status: 'active' },
    include: { student: { include: { user: { select: { fullName: true } } } } },
  });

  const result = await Promise.all(enrollments.map(async e => {
    const count = await prisma.studentAvailability.count({
      where: { studentId: e.studentId, certificationId: Number(certificationId), academicWeekId: Number(weekId) },
    });
    return { studentId: e.studentId, studentName: e.student?.user?.fullName || 'Unknown', matricule: e.student?.matricule, hasSubmitted: count > 0, slotCount: count };
  }));

  return res.json({ success: true, data: result });
});

const getTimetableHandler = asyncHandler(async (req, res) => {
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

const getGradesHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

  const grades = await prisma.grade.findMany({
    where: { trainerId: trainer.id },
    include: { student: { include: { user: true } }, course: true, certification: true },
    orderBy: { submittedAt: 'desc' },
  });
  return res.json({ success: true, data: grades });
});

const upsertGradeHandler = asyncHandler(async (req, res) => {
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

  const data = { grade: num, gradeLetter: letter, trainerId: trainer.id, academicYearId: academicYearId ? Number(academicYearId) : null };
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
  if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

  const complaints = await prisma.markComplaint.findMany({
    where: { trainerId: trainer.id },
    include: { student: { include: { user: true } }, course: true, certification: true },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ success: true, data: complaints });
});

const respondToComplaintHandler = asyncHandler(async (req, res) => {
  const { trainerResponse, status } = req.body;
  const c = await prisma.markComplaint.update({
    where: { id: Number(req.params.id) },
    data: { trainerResponse, status: status || 'reviewed' },
  });
  return res.json({ success: true, data: c });
});

const getAnnouncementsHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  const trainerUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
  const names = new Set();
  if (trainerUser?.department) names.add(trainerUser.department);
  if (trainer) {
    const tcs = await prisma.trainerCourse.findMany({
      where: { trainerId: trainer.id, courseId: { not: null } },
      include: { course: { include: { session: { include: { program: { include: { department: true } } } } } } },
    });
    tcs.forEach(tc => { const d = tc.course?.session?.program?.department?.name; if (d) names.add(d); });
  }
  const depts = await prisma.department.findMany({ where: { name: { in: [...names] } } });
  const items = await prisma.announcement.findMany({
    where: { departmentId: { in: depts.map(d => d.id) }, targetRole: { in: ['trainer', 'all'] } },
    include: { creator: { select: { fullName: true } }, department: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ success: true, data: items });
});

module.exports = {
  getDashboard, getCoursesHandler, getCertificationsHandler, getPublishedWeeksHandler,
  getAvailabilityHandler, submitAvailabilityHandler, clearAvailabilityHandler,
  getStudentsForGradingHandler,
  generateCertTimetableHandler, getCertStudentAvailabilityStatusHandler,
  getTimetableHandler, getGradesHandler, upsertGradeHandler,
  getComplaintsHandler, respondToComplaintHandler, getAnnouncementsHandler,
};
