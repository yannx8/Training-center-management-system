// FILE: backend/controllers/trainerController.js
const prisma = require("../lib/prisma");
const { asyncHandler } = require("../middleware/errorHandler");

async function getTrainer(userId) {
  return prisma.trainer.findUnique({ where: { userId } });
}

// ── DASHBOARD ────────────────────────────────────────────────────
const getDashboard = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success:false, message:"Trainer not found", code:"NOT_FOUND" });
  const [courseCount, certCount, pendingComplaints] = await Promise.all([
    prisma.trainerCourse.count({ where:{ trainerId:trainer.id, courseId:{ not:null } } }),
    prisma.trainerCourse.count({ where:{ trainerId:trainer.id, certificationId:{ not:null } } }),
    prisma.markComplaint.count({ where:{ trainerId:trainer.id, status:"pending" } }),
  ]);
  const academicSlots = await prisma.timetableSlot.findMany({
    where:{ trainerId:trainer.id },
    include:{ room:true, course:true, timetable:{ include:{ academicWeek:true } } },
    orderBy:[{ dayOfWeek:"asc" },{ timeStart:"asc" }], take:5,
  });
  return res.json({ success:true, data:{ trainerId:trainer.id, courseCount, certCount, pendingComplaints, upcomingAcademicSlots:academicSlots } });
});

// ── COURSES ──────────────────────────────────────────────────────
const getCoursesHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success:false, message:"Trainer not found", code:"NOT_FOUND" });
  const tcs = await prisma.trainerCourse.findMany({
    where:{ trainerId:trainer.id, courseId:{ not:null } },
    include:{ course:{ include:{ session:{ include:{ program:{ include:{ department:true } }, academicLevel:true, semester:true } } } } },
  });
  return res.json({ success:true, data:tcs.map(tc=>tc.course) });
});

// ── CERTIFICATIONS ───────────────────────────────────────────────
const getCertificationsHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success:false, message:"Trainer not found", code:"NOT_FOUND" });
  const tcs = await prisma.trainerCourse.findMany({
    where:{ trainerId:trainer.id, certificationId:{ not:null } },
    include:{ certification:true },
  });
  return res.json({ success:true, data:tcs.map(tc=>tc.certification) });
});

// ── PUBLISHED WEEKS (latest per dept) ────────────────────────────
const getPublishedWeeksHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success:false, message:"Trainer not found", code:"NOT_FOUND" });
  const trainerUser = await prisma.user.findUnique({ where:{ id:req.user.userId } });
  const deptNames = new Set();
  if (trainerUser?.department) deptNames.add(trainerUser.department);
  const tcs = await prisma.trainerCourse.findMany({
    where:{ trainerId:trainer.id, courseId:{ not:null } },
    include:{ course:{ include:{ session:{ include:{ program:{ include:{ department:true } } } } } } },
  });
  tcs.forEach(tc => { const d = tc.course?.session?.program?.department?.name; if(d) deptNames.add(d); });
  if (!deptNames.size) return res.json({ success:true, data:[] });
  const depts = await prisma.department.findMany({ where:{ name:{ in:[...deptNames] } } });
  const weeks = [];
  for (const dept of depts) {
    const latest = await prisma.academicWeek.findFirst({
      where:{ departmentId:dept.id, status:"published" },
      include:{ department:{ select:{ name:true, code:true } } },
      orderBy:{ weekNumber:"desc" },
    });
    if (latest) weeks.push(latest);
  }
  return res.json({ success:true, data:weeks });
});

// ── AVAILABILITY ─────────────────────────────────────────────────
const getAvailabilityHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success:false, message:"Trainer not found", code:"NOT_FOUND" });
  const { weekId } = req.query;
  const availability = await prisma.availability.findMany({
    where:{ trainerId:trainer.id, ...(weekId ? { academicWeekId:Number(weekId) } : {}) },
    include:{ academicWeek:true },
    orderBy:[{ dayOfWeek:"asc" },{ timeStart:"asc" }],
  });
  return res.json({ success:true, data:availability });
});

const submitAvailabilityHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success:false, message:"Trainer not found", code:"NOT_FOUND" });
  const { weekId, slots } = req.body;
  if (!weekId || !Array.isArray(slots))
    return res.status(400).json({ success:false, message:"weekId and slots[] required", code:"MISSING_FIELDS" });
  const week = await prisma.academicWeek.findUnique({ where:{ id:Number(weekId) } });
  if (!week || week.status !== "published")
    return res.status(400).json({ success:false, message:"Week is not published", code:"WEEK_NOT_PUBLISHED" });
  const lock = await prisma.availabilityLock.findFirst({ where:{ academicWeekId:Number(weekId), isLocked:true } });
  if (lock) return res.status(403).json({ success:false, message:"Availability is locked by the HOD", code:"LOCKED" });
  await prisma.availability.deleteMany({ where:{ trainerId:trainer.id, academicWeekId:Number(weekId) } });
  const created = await prisma.availability.createMany({
    data:slots.map(s=>({ trainerId:trainer.id, academicWeekId:Number(weekId), dayOfWeek:s.dayOfWeek, timeStart:s.timeStart, timeEnd:s.timeEnd })),
    skipDuplicates:true,
  });
  return res.status(201).json({ success:true, data:{ created:created.count } });
});

const clearAvailabilityHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success:false, message:"Trainer not found", code:"NOT_FOUND" });
  const lock = await prisma.availabilityLock.findFirst({ where:{ academicWeekId:Number(req.params.weekId), isLocked:true } });
  if (lock) return res.status(403).json({ success:false, message:"Availability is locked", code:"LOCKED" });
  await prisma.availability.deleteMany({ where:{ trainerId:trainer.id, academicWeekId:Number(req.params.weekId) } });
  return res.json({ success:true, data:{ cleared:true } });
});

// ── CERT TIMETABLE GENERATION (moved from HOD to Trainer) ────────
// The trainer responsible for the cert generates the timetable by
// intersecting their own availability with enrolled students' availabilities.
const generateCertTimetableHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success:false, message:"Trainer not found", code:"NOT_FOUND" });
  const { weekId, certificationId } = req.body;
  if (!weekId || !certificationId)
    return res.status(400).json({ success:false, message:"weekId and certificationId required", code:"MISSING_FIELDS" });

  // Verify this trainer is assigned to this certification
  const assignment = await prisma.trainerCourse.findFirst({
    where:{ trainerId:trainer.id, certificationId:Number(certificationId) },
  });
  if (!assignment)
    return res.status(403).json({ success:false, message:"You are not assigned to this certification", code:"FORBIDDEN" });

  const rooms = await prisma.room.findMany({ where:{ status:"available" }, orderBy:{ id:"asc" } });

  // Delete existing cert slots for this cert+week
  await prisma.certTimetableSlot.deleteMany({
    where:{ certificationId:Number(certificationId), academicWeekId:Number(weekId) },
  });

  // Trainer's own availability for this week
  const trainerAvail = await prisma.availability.findMany({
    where:{ trainerId:trainer.id, academicWeekId:Number(weekId) },
    orderBy:[{ dayOfWeek:"asc" },{ timeStart:"asc" }],
  });
  if (!trainerAvail.length)
    return res.status(400).json({ success:false, message:"You have no availability submitted for this week", code:"NO_TRAINER_AVAIL" });

  // Enrolled students
  const enrollments = await prisma.enrollment.findMany({
    where:{ certificationId:Number(certificationId), status:"active" },
  });
  if (!enrollments.length)
    return res.status(400).json({ success:false, message:"No students enrolled in this certification", code:"NO_STUDENTS" });
  const studentIds = enrollments.map(e => e.studentId);

  let scheduled = 0, skipped = 0;
  for (const slot of trainerAvail) {
    // No conflict with academic TT for this trainer
    const trainerConflict = await prisma.timetableSlot.findFirst({
      where:{ trainerId:trainer.id, dayOfWeek:slot.dayOfWeek, timeStart:slot.timeStart, academicWeekId:Number(weekId) },
    });
    if (trainerConflict) { skipped++; continue; }

    // No existing cert slot conflict for this trainer
    const trainerCertConflict = await prisma.certTimetableSlot.findFirst({
      where:{ trainerId:trainer.id, dayOfWeek:slot.dayOfWeek, timeStart:slot.timeStart, academicWeekId:Number(weekId) },
    });
    if (trainerCertConflict) { skipped++; continue; }

    // ALL enrolled students must have submitted availability for this slot
    let allAvailable = true;
    for (const sid of studentIds) {
      const sAvail = await prisma.studentAvailability.findFirst({
        where:{ studentId:sid, certificationId:Number(certificationId), academicWeekId:Number(weekId), dayOfWeek:slot.dayOfWeek, timeStart:slot.timeStart },
      });
      if (!sAvail) { allAvailable = false; break; }
    }
    if (!allAvailable) { skipped++; continue; }

    // Find a free room (not booked in academic or cert TT)
    let chosenRoom = null;
    for (const room of rooms) {
      const ac = await prisma.timetableSlot.findFirst({ where:{ roomId:room.id, dayOfWeek:slot.dayOfWeek, timeStart:slot.timeStart, academicWeekId:Number(weekId) } });
      const cc = await prisma.certTimetableSlot.findFirst({ where:{ roomId:room.id, dayOfWeek:slot.dayOfWeek, timeStart:slot.timeStart, academicWeekId:Number(weekId) } });
      if (!ac && !cc) { chosenRoom = room; break; }
    }

    await prisma.certTimetableSlot.create({
      data:{
        certificationId:Number(certificationId), trainerId:trainer.id,
        academicWeekId:Number(weekId), dayOfWeek:slot.dayOfWeek,
        timeStart:slot.timeStart, timeEnd:slot.timeEnd,
        roomId:chosenRoom?.id ?? null, status:"scheduled",
      },
    });
    scheduled++;
  }

  return res.status(201).json({ success:true, data:{ scheduled, skipped } });
});

// ── CHECK WHO SUBMITTED AVAILABILITY for a cert's students ────────
const getCertStudentAvailabilityStatusHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success:false, message:"Trainer not found", code:"NOT_FOUND" });
  const { weekId, certificationId } = req.query;
  if (!weekId || !certificationId)
    return res.status(400).json({ success:false, message:"weekId and certificationId required", code:"MISSING_FIELDS" });

  const enrollments = await prisma.enrollment.findMany({
    where:{ certificationId:Number(certificationId), status:"active" },
    include:{ student:{ include:{ user:{ select:{ fullName:true } } } } },
  });

  const result = await Promise.all(enrollments.map(async e => {
    const count = await prisma.studentAvailability.count({
      where:{ studentId:e.studentId, certificationId:Number(certificationId), academicWeekId:Number(weekId) },
    });
    return {
      studentId:e.studentId,
      studentName:e.student?.user?.fullName || "Unknown",
      matricule:e.student?.matricule,
      hasSubmitted:count > 0,
      slotCount:count,
    };
  }));

  return res.json({ success:true, data:result });
});

// ── TIMETABLE (combined) ──────────────────────────────────────────
const getTimetableHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success:false, message:"Trainer not found", code:"NOT_FOUND" });
  const { weekId } = req.query;
  const [academicSlots, certSlots] = await Promise.all([
    prisma.timetableSlot.findMany({
      where:{ trainerId:trainer.id, ...(weekId ? { academicWeekId:Number(weekId) } : {}), timetable:{ status:"published" } },
      include:{ room:true, course:{ include:{ session:{ include:{ program:true, academicLevel:true, semester:true } } } }, timetable:{ include:{ academicWeek:true } } },
      orderBy:[{ dayOfWeek:"asc" },{ timeStart:"asc" }],
    }),
    prisma.certTimetableSlot.findMany({
      where:{ trainerId:trainer.id, ...(weekId ? { academicWeekId:Number(weekId) } : {}) },
      include:{ room:true, certification:true, academicWeek:true },
      orderBy:[{ dayOfWeek:"asc" },{ timeStart:"asc" }],
    }),
  ]);
  return res.json({ success:true, data:{
    academicSlots:academicSlots.map(s=>({ ...s, type:"academic" })),
    certSlots:certSlots.map(s=>({ ...s, type:"certification" })),
  }});
});

// ── GRADES ───────────────────────────────────────────────────────
const getGradesHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success:false, message:"Trainer not found", code:"NOT_FOUND" });
  const grades = await prisma.grade.findMany({
    where:{ trainerId:trainer.id },
    include:{ student:{ include:{ user:true } }, course:true, certification:true, academicYear:true },
    orderBy:{ submittedAt:"desc" },
  });
  return res.json({ success:true, data:grades });
});

const upsertGradeHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success:false, message:"Trainer not found", code:"NOT_FOUND" });
  const { studentId, courseId, certificationId, grade, academicYearId } = req.body;
  if (!studentId || (!courseId && !certificationId))
    return res.status(400).json({ success:false, message:"studentId and courseId or certificationId required", code:"MISSING_FIELDS" });
  const gradeNum = parseFloat(grade);
  let gradeLetter = "F";
  if (gradeNum >= 90) gradeLetter = "A+";
  else if (gradeNum >= 80) gradeLetter = "A";
  else if (gradeNum >= 70) gradeLetter = "B";
  else if (gradeNum >= 60) gradeLetter = "C";
  else if (gradeNum >= 50) gradeLetter = "D";
  const data = { grade:gradeNum, gradeLetter, trainerId:trainer.id, academicYearId:academicYearId ? Number(academicYearId) : null };
  const where = courseId
    ? { studentId_courseId:{ studentId:Number(studentId), courseId:Number(courseId) } }
    : { studentId_certificationId:{ studentId:Number(studentId), certificationId:Number(certificationId) } };
  const result = await prisma.grade.upsert({
    where, update:data,
    create:{ ...data, studentId:Number(studentId), courseId:courseId ? Number(courseId):null, certificationId:certificationId ? Number(certificationId):null },
  });
  return res.json({ success:true, data:result });
});

// ── COMPLAINTS ───────────────────────────────────────────────────
const getComplaintsHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  if (!trainer) return res.status(404).json({ success:false, message:"Trainer not found", code:"NOT_FOUND" });
  const complaints = await prisma.markComplaint.findMany({
    where:{ trainerId:trainer.id },
    include:{ student:{ include:{ user:true } }, course:true, certification:true },
    orderBy:{ createdAt:"desc" },
  });
  return res.json({ success:true, data:complaints });
});

const respondToComplaintHandler = asyncHandler(async (req, res) => {
  const { trainerResponse, status } = req.body;
  const complaint = await prisma.markComplaint.update({
    where:{ id:Number(req.params.id) },
    data:{ trainerResponse, status:status || "reviewed" },
  });
  return res.json({ success:true, data:complaint });
});

// ── ANNOUNCEMENTS ────────────────────────────────────────────────
const getAnnouncementsHandler = asyncHandler(async (req, res) => {
  const trainer = await getTrainer(req.user.userId);
  const trainerUser = await prisma.user.findUnique({ where:{ id:req.user.userId } });
  const deptNames = new Set();
  if (trainerUser?.department) deptNames.add(trainerUser.department);
  if (trainer) {
    const tcs = await prisma.trainerCourse.findMany({
      where:{ trainerId:trainer.id, courseId:{ not:null } },
      include:{ course:{ include:{ session:{ include:{ program:{ include:{ department:true } } } } } } },
    });
    tcs.forEach(tc => { const d = tc.course?.session?.program?.department?.name; if(d) deptNames.add(d); });
  }
  const depts = await prisma.department.findMany({ where:{ name:{ in:[...deptNames] } } });
  const deptIds = depts.map(d => d.id);
  const announcements = await prisma.announcement.findMany({
    where:{ departmentId:{ in:deptIds }, targetRole:{ in:["trainer","all"] } },
    include:{ creator:{ select:{ fullName:true } }, department:{ select:{ name:true } } },
    orderBy:{ createdAt:"desc" },
  });
  return res.json({ success:true, data:announcements });
});

module.exports = {
  getDashboard, getCoursesHandler, getCertificationsHandler, getPublishedWeeksHandler,
  getAvailabilityHandler, submitAvailabilityHandler, clearAvailabilityHandler,
  generateCertTimetableHandler, getCertStudentAvailabilityStatusHandler,
  getTimetableHandler, getGradesHandler, upsertGradeHandler,
  getComplaintsHandler, respondToComplaintHandler, getAnnouncementsHandler,
};
