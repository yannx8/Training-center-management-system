// FILE: backend/controllers/hodController.js
const prisma = require("../lib/prisma");
const { asyncHandler } = require("../middleware/errorHandler");

async function getHodDept(userId) {
  return prisma.department.findFirst({ where:{ hodUserId:userId } });
}

const getDashboard = asyncHandler(async (req, res) => {
  const dept = await getHodDept(req.user.userId);
  if (!dept) return res.status(404).json({ success:false, message:"No department assigned", code:"NO_DEPT" });
  const programs = await prisma.program.findMany({
    where:{ departmentId:dept.id },
    include:{ _count:{ select:{ enrollments:true } } }, orderBy:{ name:"asc" },
  });
  const trainerCount = await prisma.trainer.count({ where:{ user:{ department:dept.name } } });
  const activeWeek = await prisma.academicWeek.findFirst({
    where:{ departmentId:dept.id, status:"published" }, orderBy:{ weekNumber:"desc" },
  });
  const availabilityCount = activeWeek ? await prisma.availability.count({ where:{ academicWeekId:activeWeek.id } }) : 0;
  return res.json({ success:true, data:{
    department:dept.name, departmentCode:dept.code,
    programs:programs.map(p=>({ ...p, enrollmentCount:p._count.enrollments })),
    stats:{ programCount:programs.length, trainerCount, availabilityCount, activeWeek:activeWeek?.label || null },
  }});
});

const getProgramsHandler = asyncHandler(async (req, res) => {
  const dept = await getHodDept(req.user.userId);
  if (!dept) return res.status(404).json({ success:false, message:"No department assigned", code:"NO_DEPT" });
  const programs = await prisma.program.findMany({ where:{ departmentId:dept.id }, orderBy:{ name:"asc" } });
  return res.json({ success:true, data:programs });
});

// ── WEEKS ─────────────────────────────────────────────────────────
const createAcademicWeekHandler = asyncHandler(async (req, res) => {
  const dept = await getHodDept(req.user.userId);
  if (!dept) return res.status(404).json({ success:false, message:"No department assigned", code:"NO_DEPT" });
  const { weekNumber, label, startDate, endDate, academicYearId } = req.body;
  if (!weekNumber || !label || !startDate || !endDate)
    return res.status(400).json({ success:false, message:"weekNumber, label, startDate, endDate required", code:"MISSING_FIELDS" });
  const week = await prisma.academicWeek.create({
    data:{ weekNumber:Number(weekNumber), label, startDate:new Date(startDate), endDate:new Date(endDate),
      departmentId:dept.id, createdBy:req.user.userId,
      academicYearId:academicYearId ? Number(academicYearId) : null, status:"draft" },
  });
  return res.status(201).json({ success:true, data:week });
});

const getAcademicWeeksHandler = asyncHandler(async (req, res) => {
  const dept = await getHodDept(req.user.userId);
  if (!dept) return res.status(404).json({ success:false, message:"No department assigned", code:"NO_DEPT" });
  const weeks = await prisma.academicWeek.findMany({ where:{ departmentId:dept.id }, orderBy:{ weekNumber:"desc" } });
  return res.json({ success:true, data:weeks });
});

const getPublishedWeeksHandler = asyncHandler(async (req, res) => {
  const dept = await getHodDept(req.user.userId);
  if (!dept) return res.status(404).json({ success:false, message:"No department assigned", code:"NO_DEPT" });
  const latest = await prisma.academicWeek.findFirst({
    where:{ departmentId:dept.id, status:"published" }, orderBy:{ weekNumber:"desc" },
  });
  return res.json({ success:true, data:latest ? [latest] : [] });
});

const publishWeekHandler = asyncHandler(async (req, res) => {
  const dept = await getHodDept(req.user.userId);
  if (!dept) return res.status(404).json({ success:false, message:"No department assigned", code:"NO_DEPT" });
  const existing = await prisma.academicWeek.findFirst({ where:{ id:Number(req.params.id), departmentId:dept.id } });
  if (!existing) return res.status(404).json({ success:false, message:"Week not found", code:"NOT_FOUND" });
  const week = await prisma.academicWeek.update({ where:{ id:Number(req.params.id) }, data:{ status:"published" } });
  return res.json({ success:true, data:week });
});

const unpublishWeekHandler = asyncHandler(async (req, res) => {
  const week = await prisma.academicWeek.update({ where:{ id:Number(req.params.id) }, data:{ status:"draft" } });
  return res.json({ success:true, data:week });
});

const deleteWeekHandler = asyncHandler(async (req, res) => {
  await prisma.academicWeek.delete({ where:{ id:Number(req.params.id) } });
  return res.json({ success:true, data:{ deleted:true } });
});

// ── AVAILABILITY ──────────────────────────────────────────────────
const getAvailabilityHandler = asyncHandler(async (req, res) => {
  const dept = await getHodDept(req.user.userId);
  if (!dept) return res.status(404).json({ success:false, message:"No department assigned", code:"NO_DEPT" });
  const { weekId } = req.query;
  const availability = await prisma.availability.findMany({
    where:{ academicWeek:{ departmentId:dept.id }, ...(weekId ? { academicWeekId:Number(weekId) } : {}) },
    include:{ trainer:{ include:{ user:true } }, academicWeek:true },
    orderBy:[{ dayOfWeek:"asc" },{ timeStart:"asc" }],
  });
  return res.json({ success:true, data:availability.map(a=>({
    id:a.id, dayOfWeek:a.dayOfWeek, timeStart:a.timeStart, timeEnd:a.timeEnd,
    trainerId:a.trainerId, trainerName:a.trainer.user.fullName,
    weekLabel:a.academicWeek.label, weekId:a.academicWeekId,
  }))});
});

// NEW: trainers grouped — who submitted and who did not for the latest published week
const getTrainerAvailabilityStatusHandler = asyncHandler(async (req, res) => {
  const dept = await getHodDept(req.user.userId);
  if (!dept) return res.status(404).json({ success:false, message:"No department assigned", code:"NO_DEPT" });
  const { weekId } = req.query;

  // All trainers in this department
  const trainers = await prisma.trainer.findMany({
    where:{ user:{ department:dept.name } },
    include:{ user:{ select:{ id:true, fullName:true, email:true } } },
  });

  if (!weekId) return res.json({ success:true, data:{ trainers:trainers.map(t=>({ ...t, submitted:false, slotCount:0 })), weekId:null } });

  const result = await Promise.all(trainers.map(async t => {
    const count = await prisma.availability.count({ where:{ trainerId:t.id, academicWeekId:Number(weekId) } });
    const slots = count > 0 ? await prisma.availability.findMany({
      where:{ trainerId:t.id, academicWeekId:Number(weekId) },
      orderBy:[{ dayOfWeek:"asc" },{ timeStart:"asc" }],
    }) : [];
    return { ...t, submitted:count > 0, slotCount:count, slots };
  }));

  return res.json({ success:true, data:{ trainers:result, weekId:Number(weekId) } });
});

const lockAvailabilityHandler = asyncHandler(async (req, res) => {
  const { weekId } = req.body;
  if (!weekId) return res.status(400).json({ success:false, message:"weekId required", code:"MISSING_FIELDS" });
  await prisma.availabilityLock.upsert({
    where:{ hodUserId_academicWeekId:{ hodUserId:req.user.userId, academicWeekId:Number(weekId) } },
    update:{ isLocked:true }, create:{ hodUserId:req.user.userId, academicWeekId:Number(weekId), isLocked:true },
  });
  return res.json({ success:true, data:{ locked:true } });
});

const unlockAvailabilityHandler = asyncHandler(async (req, res) => {
  const { weekId } = req.body;
  await prisma.availabilityLock.upsert({
    where:{ hodUserId_academicWeekId:{ hodUserId:req.user.userId, academicWeekId:Number(weekId) } },
    update:{ isLocked:false }, create:{ hodUserId:req.user.userId, academicWeekId:Number(weekId), isLocked:false },
  });
  return res.json({ success:true, data:{ locked:false } });
});

const getLockStatus = asyncHandler(async (req, res) => {
  const { weekId } = req.query;
  if (!weekId) return res.json({ success:true, data:{ isLocked:false } });
  const lock = await prisma.availabilityLock.findUnique({
    where:{ hodUserId_academicWeekId:{ hodUserId:req.user.userId, academicWeekId:Number(weekId) } },
  });
  return res.json({ success:true, data:{ isLocked:lock?.isLocked || false } });
});

// ── ACADEMIC TIMETABLE GENERATION ─────────────────────────────────
const generateTimetable = asyncHandler(async (req, res) => {
  const { weekId, label } = req.body;
  if (!weekId) return res.status(400).json({ success:false, message:"weekId required", code:"MISSING_FIELDS" });
  const dept = await getHodDept(req.user.userId);
  if (!dept) return res.status(404).json({ success:false, message:"No department assigned", code:"NO_DEPT" });
  const week = await prisma.academicWeek.findUnique({ where:{ id:Number(weekId) } });
  if (!week || week.status !== "published")
    return res.status(400).json({ success:false, message:"Week must be published first", code:"WEEK_NOT_PUBLISHED" });
  const rooms = await prisma.room.findMany({ where:{ status:"available" }, orderBy:{ id:"asc" } });
  if (!rooms.length) return res.status(400).json({ success:false, message:"No available rooms", code:"NO_ROOMS" });
  const availabilities = await prisma.availability.findMany({
    where:{ academicWeekId:Number(weekId), trainer:{ trainerCourses:{ some:{ course:{ session:{ program:{ departmentId:dept.id } } } } } } },
    include:{ trainer:{ include:{ trainerCourses:{ where:{ courseId:{ not:null } }, include:{ course:true } } } } },
  });
  if (!availabilities.length)
    return res.status(400).json({ success:false, message:"No trainer availability found", code:"NO_CANDIDATES" });
  await prisma.timetable.deleteMany({ where:{ academicWeekId:Number(weekId) } });
  const timetable = await prisma.timetable.create({
    data:{ academicWeekId:Number(weekId), generatedBy:req.user.userId, label:label || `${dept.name} — ${week.label}`, status:"draft" },
  });
  const trainerBooked = new Set(), roomBooked = new Set();
  let scheduled = 0, skipped = 0;
  for (const avail of availabilities) {
    for (const tc of avail.trainer.trainerCourses) {
      const tKey = `${avail.trainerId}|${avail.dayOfWeek}|${avail.timeStart}`;
      if (trainerBooked.has(tKey)) { skipped++; continue; }
      const trainerConflict = await prisma.timetableSlot.findFirst({ where:{ trainerId:avail.trainerId, dayOfWeek:avail.dayOfWeek, timeStart:avail.timeStart, academicWeekId:Number(weekId) } });
      if (trainerConflict) { skipped++; continue; }
      let chosenRoom = null;
      for (const room of rooms) {
        const rKey = `${room.id}|${avail.dayOfWeek}|${avail.timeStart}`;
        if (roomBooked.has(rKey)) continue;
        const roomConflict = await prisma.timetableSlot.findFirst({ where:{ roomId:room.id, dayOfWeek:avail.dayOfWeek, timeStart:avail.timeStart, academicWeekId:Number(weekId) } });
        if (!roomConflict) { chosenRoom = room; roomBooked.add(rKey); break; }
      }
      if (!chosenRoom) { skipped++; continue; }
      await prisma.timetableSlot.create({ data:{ timetableId:timetable.id, academicWeekId:Number(weekId), dayOfWeek:avail.dayOfWeek, timeStart:avail.timeStart, timeEnd:avail.timeEnd, roomId:chosenRoom.id, trainerId:avail.trainerId, courseId:tc.courseId } });
      trainerBooked.add(tKey); scheduled++; break;
    }
  }
  return res.status(201).json({ success:true, data:{ timetableId:timetable.id, scheduled, skipped } });
});

const getTimetablesHandler = asyncHandler(async (req, res) => {
  const dept = await getHodDept(req.user.userId);
  if (!dept) return res.status(404).json({ success:false, message:"No department assigned", code:"NO_DEPT" });
  const timetables = await prisma.timetable.findMany({
    where:{ academicWeek:{ departmentId:dept.id } },
    include:{ academicWeek:true, slots:{ include:{ room:true, trainer:{ include:{ user:true } }, course:{ include:{ session:{ include:{ program:true, academicLevel:true, semester:true } } } } }, orderBy:[{ dayOfWeek:"asc" },{ timeStart:"asc" }] } },
    orderBy:{ generatedAt:"desc" },
  });
  const result = timetables.map(tt => {
    const programMap = {};
    for (const slot of tt.slots) {
      const prog = slot.course?.session?.program;
      if (!prog) continue;
      if (!programMap[prog.id]) programMap[prog.id] = { program:prog, slots:[] };
      programMap[prog.id].slots.push(slot);
    }
    return { ...tt, programGroups:Object.values(programMap) };
  });
  return res.json({ success:true, data:result });
});

const publishTimetableHandler = asyncHandler(async (req, res) => {
  const timetable = await prisma.timetable.update({ where:{ id:Number(req.params.id) }, data:{ status:"published" } });
  return res.json({ success:true, data:timetable });
});

// ── ANNOUNCEMENTS ─────────────────────────────────────────────────
const createAnnouncementHandler = asyncHandler(async (req, res) => {
  const { title, body, targetRole } = req.body;
  if (!title || !body) return res.status(400).json({ success:false, message:"title and body required", code:"MISSING_FIELDS" });
  const dept = await getHodDept(req.user.userId);
  if (!dept) return res.status(404).json({ success:false, message:"No department assigned", code:"NO_DEPT" });
  const announcement = await prisma.announcement.create({
    data:{ title, body, targetRole:targetRole || "all", departmentId:dept.id, createdBy:req.user.userId },
  });
  return res.status(201).json({ success:true, data:announcement });
});

const getAnnouncementsHandler = asyncHandler(async (req, res) => {
  const dept = await getHodDept(req.user.userId);
  if (!dept) return res.status(404).json({ success:false, message:"No department assigned", code:"NO_DEPT" });
  const announcements = await prisma.announcement.findMany({
    where:{ departmentId:dept.id },
    include:{ creator:{ select:{ fullName:true } } },
    orderBy:{ createdAt:"desc" },
  });
  return res.json({ success:true, data:announcements });
});

const deleteAnnouncementHandler = asyncHandler(async (req, res) => {
  await prisma.announcement.delete({ where:{ id:Number(req.params.id) } });
  return res.json({ success:true, data:{ deleted:true } });
});

module.exports = {
  getDashboard, getProgramsHandler,
  createAcademicWeekHandler, getAcademicWeeksHandler, getPublishedWeeksHandler,
  publishWeekHandler, unpublishWeekHandler, deleteWeekHandler,
  getAvailabilityHandler, getTrainerAvailabilityStatusHandler,
  getLockStatus, lockAvailabilityHandler, unlockAvailabilityHandler,
  generateTimetable, getTimetablesHandler, publishTimetableHandler,
  createAnnouncementHandler, getAnnouncementsHandler, deleteAnnouncementHandler,
};
