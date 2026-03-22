// FILE: backend/prisma/seed.js
// Run with: npx prisma db seed
// Or:       node prisma/seed.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const SALT = 12;

// ─── Password helpers ─────────────────────────────────────────
const hash = (pwd) => bcrypt.hashSync(pwd, SALT);
const ADMIN_PASS = hash('admin1234');
const DEFAULT_PASS = hash('1111'); // all other users

async function main() {
  console.log('🌱 Seeding TCMS database...\n');

  // ══════════════════════════════════════════════════════════════
  // 1. ROLES
  // ══════════════════════════════════════════════════════════════
  console.log('📋 Creating roles...');
  const roles = await Promise.all([
    prisma.role.upsert({ where: { name: 'admin' },     update: {}, create: { name: 'admin' } }),
    prisma.role.upsert({ where: { name: 'secretary' }, update: {}, create: { name: 'secretary' } }),
    prisma.role.upsert({ where: { name: 'hod' },       update: {}, create: { name: 'hod' } }),
    prisma.role.upsert({ where: { name: 'trainer' },   update: {}, create: { name: 'trainer' } }),
    prisma.role.upsert({ where: { name: 'student' },   update: {}, create: { name: 'student' } }),
    prisma.role.upsert({ where: { name: 'parent' },    update: {}, create: { name: 'parent' } }),
  ]);
  const roleMap = Object.fromEntries(roles.map(r => [r.name, r]));
  console.log('   ✅ 6 roles created\n');

  // ══════════════════════════════════════════════════════════════
  // 2. SEMESTERS (shared across all programs)
  // ══════════════════════════════════════════════════════════════
  console.log('📅 Creating semesters...');
  const [sem1, sem2] = await Promise.all([
    prisma.semester.upsert({ where: { id: 1 }, update: {}, create: { name: 'Semester 1', semesterOrder: 1 } }),
    prisma.semester.upsert({ where: { id: 2 }, update: {}, create: { name: 'Semester 2', semesterOrder: 2 } }),
  ]);
  console.log('   ✅ 2 semesters created\n');

  // ══════════════════════════════════════════════════════════════
  // 3. DEPARTMENTS
  // ══════════════════════════════════════════════════════════════
  console.log('🏢 Creating departments...');
  const deptData = [
    { name: 'HND Industrials',        code: 'HNDI' },
    { name: 'HND Commercials',        code: 'HNDC' },
    { name: 'Bachelor of Engineering',code: 'BENG' },
    { name: 'Bachelor of Technology', code: 'BTECH' },
  ];
  const depts = {};
  for (const d of deptData) {
    depts[d.code] = await prisma.department.upsert({
      where: { code: d.code }, update: {}, create: { name: d.name, code: d.code, status: 'active' },
    });
  }
  console.log('   ✅ 4 departments created\n');

  // ══════════════════════════════════════════════════════════════
  // 4. USERS — Admin
  // ══════════════════════════════════════════════════════════════
  console.log('👤 Creating admin...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' }, update: {},
    create: {
      fullName: 'System Administrator', email: 'admin@gmail.com',
      passwordHash: ADMIN_PASS, phone: '1111', status: 'active', passwordChanged: true,
      userRoles: { create: { roleId: roleMap.admin.id } },
    },
  });
  console.log('   ✅ Admin created\n');

  // ══════════════════════════════════════════════════════════════
  // 5. SECRETARY
  // ══════════════════════════════════════════════════════════════
  console.log('🧑‍💼 Creating secretary...');
  await prisma.user.upsert({
    where: { email: 'georgia@gmail.com' }, update: {},
    create: {
      fullName: 'Mme Georgia', email: 'georgia@gmail.com',
      passwordHash: DEFAULT_PASS, phone: '1111', status: 'active', passwordChanged: false,
      userRoles: { create: { roleId: roleMap.secretary.id } },
    },
  });
  console.log('   ✅ Secretary created\n');

  // ══════════════════════════════════════════════════════════════
  // 6. HODs (create users + assign to departments)
  // ══════════════════════════════════════════════════════════════
  console.log('👨‍🏫 Creating HODs...');
  const hodData = [
    { name: 'Mr. Fonkou Lester Confiance', email: 'fonkoulester@gmail.com',      deptCode: 'HNDI' },
    { name: 'Mr. Tebeu Yann Vickel',       email: 'tebeuyann@gmail.com',         deptCode: 'HNDC' },
    { name: 'Mr. Noumeu Guy Franklin',     email: 'noumeuguyfranklin@gmail.com', deptCode: 'BENG' },
    { name: 'Miss Helena Jeanny',          email: 'helenajeanny@gmail.com',       deptCode: 'BTECH' },
  ];
  const hodUsers = {};
  for (const h of hodData) {
    const u = await prisma.user.upsert({
      where: { email: h.email }, update: {},
      create: {
        fullName: h.name, email: h.email,
        passwordHash: DEFAULT_PASS, phone: '1111',
        department: depts[h.deptCode].name,
        status: 'active', passwordChanged: false,
        userRoles: { create: { roleId: roleMap.hod.id } },
      },
    });
    hodUsers[h.deptCode] = u;
    await prisma.department.update({
      where: { code: h.deptCode },
      data: { hodUserId: u.id, hodName: h.name },
    });
  }
  console.log('   ✅ 4 HODs created and assigned\n');

  // ══════════════════════════════════════════════════════════════
  // 7. TRAINERS
  // Note: Fonkou & Noumeu are HOD+Trainer (dual role)
  // ══════════════════════════════════════════════════════════════
  console.log('👨‍🏫 Creating trainers...');
  const trainerData = [
    { name: 'Mr. Foko Luc',              email: 'fokoluc@gmail.com',          dept: 'HND Industrials' },
    { name: 'Mr. Nguefack Briss',        email: 'nguefackbriss@gmail.com',    dept: 'HND Industrials' },
    { name: 'Mr. Tapsopteu Endelly',     email: 'tapsopteuendelly@gmail.com', dept: 'Bachelor of Engineering' },
    { name: 'Mme Sandrine',              email: 'sandrine@gmail.com',         dept: 'HND Commercials' },
    { name: 'Mme Marie Therese',         email: 'marietherese@gmail.com',     dept: 'HND Commercials' },
    // Dual-role trainers — already exist as HOD users
    { name: 'Mr. Noumeu Guy Franklin',   email: 'noumeuguyfranklin@gmail.com', dept: 'Bachelor of Engineering', isDual: true },
    { name: 'Mr. Fonkou Lester Confiance', email: 'fonkoulester@gmail.com',   dept: 'HND Industrials', isDual: true },
  ];

  const trainerUsers = {};
  for (const t of trainerData) {
    let user;
    if (t.isDual) {
      // User already exists — just add trainer role if not present
      user = await prisma.user.findUnique({ where: { email: t.email } });
      const existing = await prisma.userRole.findFirst({
        where: { userId: user.id, roleId: roleMap.trainer.id },
      });
      if (!existing) {
        await prisma.userRole.create({ data: { userId: user.id, roleId: roleMap.trainer.id } });
      }
    } else {
      user = await prisma.user.upsert({
        where: { email: t.email }, update: {},
        create: {
          fullName: t.name, email: t.email,
          passwordHash: DEFAULT_PASS, phone: '1111',
          department: t.dept, status: 'active', passwordChanged: false,
          userRoles: { create: { roleId: roleMap.trainer.id } },
        },
      });
    }
    // Create trainer profile
    const trainer = await prisma.trainer.upsert({
      where: { userId: user.id }, update: {}, create: { userId: user.id },
    });
    trainerUsers[t.email] = { user, trainer };
  }
  console.log('   ✅ 7 trainers created\n');

  // ══════════════════════════════════════════════════════════════
  // 8. ACADEMIC YEAR
  // ══════════════════════════════════════════════════════════════
  console.log('📆 Creating academic year...');
  const academicYear = await prisma.academicYear.upsert({
    where: { id: 1 }, update: {},
    create: {
      name: '2024-2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-07-31'),
      isActive: true,
    },
  });
  console.log('   ✅ Academic year 2024-2025 created\n');

  // ══════════════════════════════════════════════════════════════
  // 9. PROGRAMS + LEVELS + SESSIONS + COURSES
  // ══════════════════════════════════════════════════════════════
  console.log('📚 Creating programs, levels, sessions and courses...');

  const programDef = [
    // ── HND Industrials (2 years) ──────────────────────────────
    {
      name: 'Electrical Power Systems', code: 'EPS', dept: 'HNDI', years: 2,
      courses: {
        'Y1S1': [['Circuit Analysis','EPS-CA',3,3],['Electrical Machines I','EPS-EM1',3,3],['Engineering Mathematics I','EPS-MT1',3,3],['Technical Physics','EPS-PHY',3,3]],
        'Y1S2': [['Power Electronics','EPS-PE',3,3],['Electrical Machines II','EPS-EM2',3,3],['Digital Electronics','EPS-DE',3,3],['Technical Drawing','EPS-TD',2,2]],
        'Y2S1': [['Power Systems Analysis','EPS-PSA',3,3],['High Voltage Engineering','EPS-HVE',3,3],['Control Systems','EPS-CS',3,3],['Industrial Safety','EPS-IS',2,2]],
        'Y2S2': [['Renewable Energy Systems','EPS-RES',3,3],['Power Distribution','EPS-PD',3,3],['Project Management','EPS-PM',2,2],['Professional Practice','EPS-PP',2,2]],
      },
    },
    {
      name: 'Industrial Computing and Automation', code: 'ICA', dept: 'HNDI', years: 2,
      courses: {
        'Y1S1': [['Programming Fundamentals','ICA-PF',3,3],['Electronics Basics','ICA-EB',3,3],['Engineering Mathematics','ICA-MT',3,3],['Technical English','ICA-TE',2,2]],
        'Y1S2': [['Microcontrollers','ICA-MC',3,3],['Digital Systems','ICA-DS',3,3],['Sensors & Actuators','ICA-SA',3,3],['Technical Drawing','ICA-TD',2,2]],
        'Y2S1': [['PLC Programming','ICA-PLC',3,3],['Industrial Networks','ICA-IN',3,3],['SCADA Systems','ICA-SCADA',3,3],['Robotics','ICA-ROB',3,3]],
        'Y2S2': [['Automation Project','ICA-AP',3,3],['Industrial Maintenance','ICA-IM',3,3],['Quality Control','ICA-QC',2,2],['Professional Practice','ICA-PP',2,2]],
      },
    },
    {
      name: 'Telecommunication', code: 'TEL', dept: 'HNDI', years: 2,
      courses: {
        'Y1S1': [['Signal Theory','TEL-ST',3,3],['Electronics Fundamentals','TEL-EF',3,3],['Mathematics','TEL-MT',3,3],['Technical Physics','TEL-PHY',3,3]],
        'Y1S2': [['Digital Communications','TEL-DC',3,3],['Analog Electronics','TEL-AE',3,3],['Transmission Lines','TEL-TL',3,3],['Technical English','TEL-TE',2,2]],
        'Y2S1': [['Mobile Networks','TEL-MN',3,3],['Fiber Optics','TEL-FO',3,3],['Satellite Communications','TEL-SC',3,3],['Network Protocols','TEL-NP',3,3]],
        'Y2S2': [['Network Management','TEL-NM',3,3],['Wireless Systems','TEL-WS',3,3],['Telecommunication Project','TEL-TP',3,3],['Professional Practice','TEL-PP',2,2]],
      },
    },
    {
      name: 'Software Engineering', code: 'SWE', dept: 'HNDI', years: 2,
      courses: {
        'Y1S1': [['Programming I (C/C++)','SWE-P1',3,3],['Web Fundamentals','SWE-WF',3,3],['Discrete Mathematics','SWE-DM',3,3],['Algorithms & Logic','SWE-AL',3,3]],
        'Y1S2': [['Programming II (Java)','SWE-P2',3,3],['Database Fundamentals','SWE-DB',3,3],['Web Development','SWE-WD',3,3],['OOP Concepts','SWE-OOP',3,3]],
        'Y2S1': [['Software Architecture','SWE-SA',3,3],['Mobile Development','SWE-MD',3,3],['DevOps Basics','SWE-DEV',3,3],['Software Testing','SWE-TST',3,3]],
        'Y2S2': [['Software Project','SWE-SP',3,3],['Cloud Computing','SWE-CC',3,3],['Application Security','SWE-SEC',3,3],['Professional Practice','SWE-PP',2,2]],
      },
    },
    {
      name: 'Network Security', code: 'NWS', dept: 'HNDI', years: 2,
      courses: {
        'Y1S1': [['Networking Fundamentals','NWS-NF',3,3],['Operating Systems','NWS-OS',3,3],['Mathematics','NWS-MT',3,3],['Programming Basics','NWS-PB',3,3]],
        'Y1S2': [['Network Protocols','NWS-NP',3,3],['Linux Administration','NWS-LA',3,3],['Cryptography','NWS-CRY',3,3],['Web Security','NWS-WS',3,3]],
        'Y2S1': [['Ethical Hacking','NWS-EH',3,3],['Firewall Management','NWS-FM',3,3],['Intrusion Detection','NWS-IDS',3,3],['Cloud Security','NWS-CS',3,3]],
        'Y2S2': [['Security Audit','NWS-AUD',3,3],['Incident Response','NWS-IR',3,3],['Security Project','NWS-SP',3,3],['Professional Practice','NWS-PP',2,2]],
      },
    },
    // ── HND Commercials (2 years) ──────────────────────────────
    {
      name: 'Marketing', code: 'MKT', dept: 'HNDC', years: 2,
      courses: {
        'Y1S1': [['Marketing Principles','MKT-MP',3,3],['Business English','MKT-BE',2,2],['Microeconomics','MKT-EC',3,3],['Statistics I','MKT-ST1',3,3]],
        'Y1S2': [['Consumer Behavior','MKT-CB',3,3],['Market Research','MKT-MR',3,3],['Accounting Basics','MKT-ACC',3,3],['Business Law','MKT-BL',2,2]],
        'Y2S1': [['Digital Marketing','MKT-DM',3,3],['Brand Management','MKT-BM',3,3],['Sales Management','MKT-SM',3,3],['Strategic Marketing','MKT-STRAT',3,3]],
        'Y2S2': [['International Marketing','MKT-IM',3,3],['Marketing Project','MKT-PROJ',3,3],['Entrepreneurship','MKT-ENT',2,2],['Professional Practice','MKT-PP',2,2]],
      },
    },
    {
      name: 'Management', code: 'MGT', dept: 'HNDC', years: 2,
      courses: {
        'Y1S1': [['Management Principles','MGT-MP',3,3],['Business English','MGT-BE',2,2],['Macroeconomics','MGT-EC',3,3],['Financial Accounting','MGT-FA',3,3]],
        'Y1S2': [['Human Resources Management','MGT-HR',3,3],['Organizational Behavior','MGT-OB',3,3],['Statistics','MGT-ST',3,3],['Business Law','MGT-BL',2,2]],
        'Y2S1': [['Strategic Management','MGT-SM',3,3],['Project Management','MGT-PM',3,3],['Leadership & Motivation','MGT-LM',3,3],['Corporate Finance','MGT-CF',3,3]],
        'Y2S2': [['Change Management','MGT-CM',3,3],['Business Ethics','MGT-ETH',2,2],['Entrepreneurship','MGT-ENT',3,3],['Professional Practice','MGT-PP',2,2]],
      },
    },
    {
      name: 'Accountancy', code: 'ACC', dept: 'HNDC', years: 2,
      courses: {
        'Y1S1': [['Financial Accounting I','ACC-FA1',3,3],['Business Mathematics','ACC-BM',3,3],['Economics','ACC-EC',3,3],['Business English','ACC-BE',2,2]],
        'Y1S2': [['Financial Accounting II','ACC-FA2',3,3],['Cost Accounting','ACC-CA',3,3],['Taxation I','ACC-TAX1',3,3],['Business Law','ACC-BL',2,2]],
        'Y2S1': [['Management Accounting','ACC-MA',3,3],['Auditing','ACC-AUD',3,3],['Financial Analysis','ACC-FAN',3,3],['Corporate Finance','ACC-CF',3,3]],
        'Y2S2': [['Advanced Taxation','ACC-TAX2',3,3],['Financial Reporting','ACC-FR',3,3],['Accounting Project','ACC-AP',3,3],['Professional Practice','ACC-PP',2,2]],
      },
    },
    // ── Bachelor of Engineering (3 years) ─────────────────────
    {
      name: 'Computer Science Engineering', code: 'CSE', dept: 'BENG', years: 3,
      courses: {
        'Y1S1': [['Programming I','CSE-P1',3,3],['Mathematics I','CSE-MT1',3,3],['Physics','CSE-PHY',3,3],['Technical English','CSE-TE',2,2]],
        'Y1S2': [['Data Structures','CSE-DS',3,3],['Mathematics II','CSE-MT2',3,3],['Digital Logic Design','CSE-DLD',3,3],['Web Programming','CSE-WP',3,3]],
        'Y2S1': [['Algorithms','CSE-ALG',3,3],['Database Systems','CSE-DBS',3,3],['Operating Systems','CSE-OS',3,3],['Computer Networks','CSE-CN',3,3]],
        'Y2S2': [['Software Engineering','CSE-SE',3,3],['Artificial Intelligence','CSE-AI',3,3],['Computer Architecture','CSE-CA',3,3],['Statistics','CSE-ST',3,3]],
        'Y3S1': [['Machine Learning','CSE-ML',3,3],['Distributed Systems','CSE-DIST',3,3],['Cybersecurity','CSE-CYB',3,3],['Research Methods','CSE-RM',3,3]],
        'Y3S2': [['Final Year Project','CSE-FYP',6,6],['Cloud Computing','CSE-CC',3,3],['Advanced Algorithms','CSE-AA',3,3],['Professional Ethics','CSE-PE',2,2]],
      },
    },
    {
      name: 'Electromechanical Engineering', code: 'EME', dept: 'BENG', years: 3,
      courses: {
        'Y1S1': [['Mechanics I','EME-M1',3,3],['Electrical Fundamentals','EME-EF',3,3],['Mathematics I','EME-MT1',3,3],['Technical Physics','EME-PHY',3,3]],
        'Y1S2': [['Mechanics II','EME-M2',3,3],['Electrical Machines','EME-EM',3,3],['Mathematics II','EME-MT2',3,3],['Technical Drawing','EME-TD',2,2]],
        'Y2S1': [['Thermodynamics','EME-THD',3,3],['Control Systems','EME-CS',3,3],['Fluid Mechanics','EME-FM',3,3],['Materials Science','EME-MS',3,3]],
        'Y2S2': [['Industrial Automation','EME-IA',3,3],['Manufacturing Processes','EME-MP',3,3],['Heat Transfer','EME-HT',3,3],['Statistics','EME-ST',3,3]],
        'Y3S1': [['Advanced Mechatronics','EME-AM',3,3],['Robotics','EME-ROB',3,3],['Maintenance Engineering','EME-ME',3,3],['Research Methods','EME-RM',3,3]],
        'Y3S2': [['Final Year Project','EME-FYP',6,6],['Industrial Management','EME-IM',3,3],['Advanced Control Systems','EME-ACS',3,3],['Professional Ethics','EME-PE',2,2]],
      },
    },
    {
      name: 'Civil and Environmental Engineering', code: 'CEE', dept: 'BENG', years: 3,
      courses: {
        'Y1S1': [['Structural Mechanics','CEE-SM',3,3],['Mathematics I','CEE-MT1',3,3],['Physics','CEE-PHY',3,3],['Technical Drawing','CEE-TD',2,2]],
        'Y1S2': [['Soil Mechanics','CEE-SOIL',3,3],['Mathematics II','CEE-MT2',3,3],['Construction Materials','CEE-CM',3,3],['Surveying','CEE-SUR',3,3]],
        'Y2S1': [['Structural Analysis','CEE-SA',3,3],['Hydraulics','CEE-HYD',3,3],['Environmental Engineering','CEE-EE',3,3],['Statistics','CEE-ST',3,3]],
        'Y2S2': [['Foundation Engineering','CEE-FE',3,3],['Water Resources','CEE-WR',3,3],['Waste Management','CEE-WM',3,3],['AutoCAD','CEE-CAD',2,2]],
        'Y3S1': [['Advanced Structures','CEE-AS',3,3],['Environmental Impact Assessment','CEE-EIA',3,3],['Project Management','CEE-PM',3,3],['Research Methods','CEE-RM',3,3]],
        'Y3S2': [['Final Year Project','CEE-FYP',6,6],['Construction Management','CEE-CMGT',3,3],['Advanced Hydraulics','CEE-AH',3,3],['Professional Ethics','CEE-PE',2,2]],
      },
    },
    // ── Bachelor of Technology (3 years) ──────────────────────
    {
      name: 'Chemical Engineering', code: 'CHE', dept: 'BTECH', years: 3,
      courses: {
        'Y1S1': [['General Chemistry','CHE-GC',3,3],['Mathematics I','CHE-MT1',3,3],['Physics','CHE-PHY',3,3],['Technical English','CHE-TE',2,2]],
        'Y1S2': [['Organic Chemistry','CHE-OC',3,3],['Mathematics II','CHE-MT2',3,3],['Physical Chemistry','CHE-PC',3,3],['Lab Techniques','CHE-LAB',3,3]],
        'Y2S1': [['Chemical Reaction Engineering','CHE-CRE',3,3],['Thermodynamics','CHE-THD',3,3],['Transport Phenomena','CHE-TP',3,3],['Statistics','CHE-ST',3,3]],
        'Y2S2': [['Process Control','CHE-PRC',3,3],['Separation Processes','CHE-SP',3,3],['Industrial Chemistry','CHE-IC',3,3],['Safety Engineering','CHE-SE',3,3]],
        'Y3S1': [['Process Design','CHE-PD',3,3],['Environmental Engineering','CHE-EE',3,3],['Research Methods','CHE-RM',3,3],['Advanced Thermodynamics','CHE-ATH',3,3]],
        'Y3S2': [['Final Year Project','CHE-FYP',6,6],['Plant Design','CHE-PLANT',3,3],['Advanced Process Control','CHE-APC',3,3],['Professional Ethics','CHE-PE',2,2]],
      },
    },
    {
      name: 'Electrical and Electronics Engineering', code: 'EEE', dept: 'BTECH', years: 3,
      courses: {
        'Y1S1': [['Circuit Theory','EEE-CT',3,3],['Mathematics I','EEE-MT1',3,3],['Physics','EEE-PHY',3,3],['Technical English','EEE-TE',2,2]],
        'Y1S2': [['Electronics I','EEE-EL1',3,3],['Mathematics II','EEE-MT2',3,3],['Digital Systems','EEE-DS',3,3],['Electrical Measurements','EEE-EM',3,3]],
        'Y2S1': [['Electronics II','EEE-EL2',3,3],['Power Systems','EEE-PS',3,3],['Control Theory','EEE-CT2',3,3],['Electromagnetics','EEE-EMG',3,3]],
        'Y2S2': [['Power Electronics','EEE-PE',3,3],['Signal Processing','EEE-SP',3,3],['Microprocessors','EEE-MP',3,3],['Statistics','EEE-ST',3,3]],
        'Y3S1': [['Advanced Power Systems','EEE-APS',3,3],['Embedded Systems','EEE-ES',3,3],['Renewable Energy','EEE-RE',3,3],['Research Methods','EEE-RM',3,3]],
        'Y3S2': [['Final Year Project','EEE-FYP',6,6],['Smart Grid Technology','EEE-SGT',3,3],['Advanced Electronics','EEE-AE',3,3],['Professional Ethics','EEE-PE',2,2]],
      },
    },
    {
      name: 'Civil Engineering', code: 'CVE', dept: 'BTECH', years: 3,
      courses: {
        'Y1S1': [['Engineering Mathematics I','CVE-MT1',3,3],['Mechanics','CVE-M',3,3],['Physics','CVE-PHY',3,3],['Technical Drawing','CVE-TD',2,2]],
        'Y1S2': [['Engineering Mathematics II','CVE-MT2',3,3],['Structural Analysis I','CVE-SA1',3,3],['Materials Science','CVE-MS',3,3],['Surveying','CVE-SUR',3,3]],
        'Y2S1': [['Structural Analysis II','CVE-SA2',3,3],['Geotechnical Engineering','CVE-GE',3,3],['Hydraulics','CVE-HYD',3,3],['Statistics','CVE-ST',3,3]],
        'Y2S2': [['Reinforced Concrete Design','CVE-RCD',3,3],['Road Engineering','CVE-RE',3,3],['Environmental Engineering','CVE-EE',3,3],['CAD for Civil','CVE-CAD',2,2]],
        'Y3S1': [['Advanced Structural Design','CVE-ASD',3,3],['Bridge Engineering','CVE-BE',3,3],['Project Management','CVE-PM',3,3],['Research Methods','CVE-RM',3,3]],
        'Y3S2': [['Final Year Project','CVE-FYP',6,6],['Construction Technology','CVE-CT',3,3],['Urban Planning','CVE-UP',3,3],['Professional Ethics','CVE-PE',2,2]],
      },
    },
    {
      name: 'Software Engineering (B-Tech)', code: 'SWE-BT', dept: 'BTECH', years: 3,
      courses: {
        'Y1S1': [['Programming Fundamentals','SWEBT-PF',3,3],['Discrete Mathematics','SWEBT-DM',3,3],['Physics','SWEBT-PHY',3,3],['Technical English','SWEBT-TE',2,2]],
        'Y1S2': [['Object Oriented Programming','SWEBT-OOP',3,3],['Data Structures','SWEBT-DS',3,3],['Web Development','SWEBT-WD',3,3],['Mathematics II','SWEBT-MT2',3,3]],
        'Y2S1': [['Software Design Patterns','SWEBT-SDP',3,3],['Database Management','SWEBT-DB',3,3],['Mobile Development','SWEBT-MD',3,3],['Statistics','SWEBT-ST',3,3]],
        'Y2S2': [['Software Testing','SWEBT-TST',3,3],['DevOps','SWEBT-DEV',3,3],['Cloud Computing','SWEBT-CC',3,3],['Computer Networks','SWEBT-CN',3,3]],
        'Y3S1': [['Distributed Systems','SWEBT-DIST',3,3],['Machine Learning','SWEBT-ML',3,3],['Cybersecurity','SWEBT-CYB',3,3],['Research Methods','SWEBT-RM',3,3]],
        'Y3S2': [['Final Year Project','SWEBT-FYP',6,6],['Advanced Software Architecture','SWEBT-ASA',3,3],['Agile Methods','SWEBT-AGI',3,3],['Professional Ethics','SWEBT-PE',2,2]],
      },
    },
  ];

  let semKey = { S1: sem1, S2: sem2 };

  for (const pd of programDef) {
    // Create program
    const program = await prisma.program.upsert({
      where: { code: pd.code }, update: {},
      create: {
        name: pd.name, code: pd.code,
        departmentId: depts[pd.dept].id,
        durationYears: pd.years, status: 'active',
      },
    });

    // Create academic levels (Year 1..N) for this program
    const levelMap = {};
    for (let y = 1; y <= pd.years; y++) {
      const level = await prisma.academicLevel.create({
        data: { name: `Year ${y}`, programId: program.id, levelOrder: y },
      });
      levelMap[y] = level;
    }

    // Create sessions (Year x Semester) and courses
    for (let y = 1; y <= pd.years; y++) {
      for (const sNum of [1, 2]) {
        const sessionKey = `Y${y}S${sNum}`;
        const coursesForSession = pd.courses[sessionKey] || [];

        const session = await prisma.session.create({
          data: {
            academicYearId: academicYear.id,
            academicLevelId: levelMap[y].id,
            semesterId: semKey[`S${sNum}`].id,
            programId: program.id,
          },
        });

        for (const [cName, cCode, credits, hpw] of coursesForSession) {
          await prisma.course.upsert({
            where: { code: cCode }, update: {},
            create: {
              name: cName, code: cCode,
              credits, hoursPerWeek: hpw,
              sessionId: session.id,
            },
          });
        }
      }
    }
    process.stdout.write(`   ✅ ${pd.name} (${Object.values(pd.courses).flat().length} courses)\n`);
  }

  // ══════════════════════════════════════════════════════════════
  // 10. CERTIFICATIONS
  // ══════════════════════════════════════════════════════════════
  console.log('\n🎓 Creating certifications...');
  await prisma.certification.upsert({
    where: { code: 'PHS' }, update: {},
    create: { name: 'Professional Hair Style', code: 'PHS', durationHours: 20, status: 'active', description: 'Professional certification in hair styling techniques' },
  });
  await prisma.certification.upsert({
    where: { code: 'FSD' }, update: {},
    create: { name: 'Fashion Design', code: 'FSD', durationHours: 20, status: 'active', description: 'Professional certification in fashion design and garment making' },
  });
  console.log('   ✅ 2 certifications created\n');

  // ══════════════════════════════════════════════════════════════
  // DONE
  // ══════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Seed complete!\n');
  console.log('🔐 Login credentials:');
  console.log('   Admin       → admin@gmail.com         / admin1234');
  console.log('   HODs        → [email]@gmail.com        / 1111');
  console.log('   Trainers    → [email]@gmail.com        / 1111');
  console.log('   Secretary   → georgia@gmail.com        / 1111');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
