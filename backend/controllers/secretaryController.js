// FILE: backend/controllers/secretaryController.js
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { asyncHandler } = require("../middleware/errorHandler");

function generateMatricule(programCode, year, seq) {
  return `${programCode}-${year}-${String(seq).padStart(4,"0")}`;
}

// ── DASHBOARD (programs for active year + certifications, no recent registrations) ──
const getDashboard = asyncHandler(async (req, res) => {
  const activeYear = await prisma.academicYear.findFirst({ where:{ isActive:true } });

  // All academic programs for the active year
  const programs = await prisma.program.findMany({
    where:{ status:"active", academicYears:activeYear ? { some:{ id:activeYear.id } } : {} },
    include:{ department:{ select:{ name:true } }, _count:{ select:{ enrollments:true } } },
    orderBy:{ name:"asc" },
  });

  // All certifications with enrollment counts
  const certifications = await prisma.certification.findMany({
    where:{ status:"active" },
    include:{
      _count:{ select:{ enrollments:true } },
      trainerCourses:{ include:{ trainer:{ include:{ user:{ select:{ fullName:true } } } } } },
    },
    orderBy:{ name:"asc" },
  });

  const studentCount = await prisma.student.count();

  return res.json({ success:true, data:{ activeYear, programs, certifications, studentCount } });
});

// ── ALL STUDENTS (with filters) ───────────────────────────────────
const getAllStudentsHandler = asyncHandler(async (req, res) => {
  const { search, programId, certificationId, status, levelId } = req.query;
  const where = {};

  if (status && status !== "all") {
    where.user = { status };
  }
  if (programId) {
    where.programId = Number(programId);
  }
  if (certificationId) {
    where.enrollments = { some:{ certificationId:Number(certificationId) } };
  }

  const students = await prisma.student.findMany({
    where,
    include:{
      user:{ select:{ fullName:true, email:true, phone:true, status:true, createdAt:true } },
      program:{ include:{ department:{ select:{ name:true } } } },
      enrollments:{ include:{ certification:{ select:{ name:true } }, program:{ select:{ name:true } } } },
    },
    orderBy:{ createdAt:"desc" },
  });

  // Client-side name search (simple)
  const filtered = search
    ? students.filter(s => s.user?.fullName?.toLowerCase().includes(search.toLowerCase()) || s.matricule?.toLowerCase().includes(search.toLowerCase()))
    : students;

  return res.json({ success:true, data:filtered });
});

// ── REGISTER STUDENT (hashes outside tx, optional parent) ────────
const registerStudentHandler = asyncHandler(async (req, res) => {
  const { fullName, email, phone, dateOfBirth, programId, certificationId, parentFullName, parentEmail, parentPhone, parentRelationship } = req.body;
  if (!fullName || !email || !phone)
    return res.status(400).json({ success:false, message:"fullName, email, phone required", code:"MISSING_FIELDS" });
  if (!programId && !certificationId)
    return res.status(400).json({ success:false, message:"Must enroll in a program or a certification", code:"MISSING_ENROLLMENT" });

  // Capacity check
  if (programId) {
    const prog = await prisma.program.findUnique({ where:{ id:Number(programId) }, include:{ _count:{ select:{ enrollments:true } } } });
    if (!prog) return res.status(404).json({ success:false, message:"Program not found", code:"NOT_FOUND" });
    if (prog.capacity && prog._count.enrollments >= prog.capacity)
      return res.status(409).json({ success:false, message:`Program "${prog.name}" is full`, code:"PROGRAM_FULL" });
  }
  if (certificationId) {
    const cert = await prisma.certification.findUnique({ where:{ id:Number(certificationId) }, include:{ _count:{ select:{ enrollments:true } } } });
    if (!cert) return res.status(404).json({ success:false, message:"Certification not found", code:"NOT_FOUND" });
    if (cert.capacity && cert._count.enrollments >= cert.capacity)
      return res.status(409).json({ success:false, message:`Certification "${cert.name}" is full`, code:"CERT_FULL" });
  }

  const SALT = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
  const studentHash = await bcrypt.hash(phone, SALT);
  const parentHash  = parentEmail ? await bcrypt.hash(parentPhone || phone, SALT) : null;

  let deptName = "";
  if (programId) {
    const p = await prisma.program.findUnique({ where:{ id:Number(programId) }, include:{ department:true } });
    deptName = p?.department?.name || "";
  }

  const count = await prisma.student.count();
  const code  = programId
    ? (await prisma.program.findUnique({ where:{ id:Number(programId) } }))?.code || "STU"
    : (await prisma.certification.findUnique({ where:{ id:Number(certificationId) } }))?.code || "CERT";
  const matricule = generateMatricule(code, new Date().getFullYear(), count + 1);
  const activeYear = programId ? await prisma.academicYear.findFirst({ where:{ programId:Number(programId), isActive:true } }) : null;

  const result = await prisma.$transaction(async (tx) => {
    const studentRole = await tx.role.findUnique({ where:{ name:"student" } });
    const studentUser = await tx.user.create({
      data:{ fullName, email:email.toLowerCase().trim(), passwordHash:studentHash, phone, department:deptName, status:"active", passwordChanged:false, userRoles:{ create:{ roleId:studentRole.id } } },
    });
    const student = await tx.student.create({ data:{ userId:studentUser.id, matricule, dateOfBirth:dateOfBirth?new Date(dateOfBirth):null, programId:programId?Number(programId):null } });

    if (programId) {
      await tx.enrollment.create({ data:{ studentId:student.id, programId:Number(programId), academicYearId:activeYear?.id||null, status:"active" } });
    } else {
      await tx.enrollment.create({ data:{ studentId:student.id, certificationId:Number(certificationId), status:"active" } });
    }

    let parentRecord = null;
    if (parentEmail && parentHash) {
      const parentRole = await tx.role.findUnique({ where:{ name:"parent" } });
      let parentUser = await tx.user.findUnique({ where:{ email:parentEmail.toLowerCase().trim() } });
      if (!parentUser) {
        parentUser = await tx.user.create({ data:{ fullName:parentFullName||"Parent", email:parentEmail.toLowerCase().trim(), passwordHash:parentHash, phone:parentPhone||phone, status:"active", passwordChanged:false, userRoles:{ create:{ roleId:parentRole.id } } } });
      }
      let parent = await tx.parent.findUnique({ where:{ userId:parentUser.id } });
      if (!parent) parent = await tx.parent.create({ data:{ userId:parentUser.id, relationship:parentRelationship||"Father" } });
      await tx.parentStudentLink.upsert({
        where:{ parentId_studentId:{ parentId:parent.id, studentId:student.id } },
        update:{}, create:{ parentId:parent.id, studentId:student.id },
      });
      parentRecord = parent;
    }
    return { student, parentRecord };
  }, { timeout:30000 });

  return res.status(201).json({ success:true, data:result });
});

// ── UPDATE STUDENT (no delete) ────────────────────────────────────
const updateStudentHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullName, phone, dateOfBirth, programId, status } = req.body;
  const student = await prisma.student.findUnique({ where:{ id:Number(id) } });
  if (!student) return res.status(404).json({ success:false, message:"Student not found", code:"NOT_FOUND" });
  if (student.userId) await prisma.user.update({ where:{ id:student.userId }, data:{ fullName, phone, status } });
  const updated = await prisma.student.update({ where:{ id:Number(id) }, data:{ dateOfBirth:dateOfBirth?new Date(dateOfBirth):undefined, programId:programId?Number(programId):undefined } });
  return res.json({ success:true, data:updated });
});

const getProgramsHandler = asyncHandler(async (req, res) => {
  const { departmentId } = req.query;
  const programs = await prisma.program.findMany({
    where:{ status:"active", ...(departmentId ? { departmentId:Number(departmentId) } : {}) },
    include:{ department:{ select:{ name:true } }, _count:{ select:{ enrollments:true } } },
    orderBy:{ name:"asc" },
  });
  return res.json({ success:true, data:programs });
});

const getCertificationsHandler = asyncHandler(async (req, res) => {
  const certs = await prisma.certification.findMany({ where:{ status:"active" }, include:{ _count:{ select:{ enrollments:true } } }, orderBy:{ name:"asc" } });
  return res.json({ success:true, data:certs });
});

const getDepartmentsHandler = asyncHandler(async (req, res) => {
  const depts = await prisma.department.findMany({ where:{ status:"active" }, orderBy:{ name:"asc" } });
  return res.json({ success:true, data:depts });
});

module.exports = { getDashboard, getAllStudentsHandler, registerStudentHandler, updateStudentHandler, getProgramsHandler, getCertificationsHandler, getDepartmentsHandler };
