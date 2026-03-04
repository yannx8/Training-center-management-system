-- ============================================================
-- TCMS - Training Center Management System
-- Reset & Seed Script for Testing (Safe Version)
-- ============================================================

-- Function to safely truncate tables if they exist
DO $$
DECLARE
    tables TEXT[] := ARRAY[
        'announcements', 'mark_complaints', 'complaints', 'attendance',
        'timetable_slots', 'timetables', 'availability_locks', 'availability',
        'grades', 'enrollments', 'parent_student_links', 'parents', 'students',
        'trainer_courses', 'trainers', 'courses', 'academic_weeks', 'rooms',
        'sessions', 'academic_years', 'semesters', 'academic_levels', 'programs',
        'certifications', 'departments', 'user_roles', 'users', 'roles'
    ];
    t TEXT;
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', t);
    END LOOP;
END $$;

-- Now create the schema fresh
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  department VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
  password_changed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER_ROLES
-- ============================================================
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE(user_id, role_id)
);

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  hod_name VARCHAR(150),
  hod_user_id INT REFERENCES users(id) ON DELETE SET NULL,
  student_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CERTIFICATIONS
-- ============================================================
CREATE TABLE certifications (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(30) UNIQUE NOT NULL,
  description TEXT,
  duration_hours INT DEFAULT 40,
  school_period_id INT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROGRAMS
-- ============================================================
CREATE TABLE programs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  department_id INT REFERENCES departments(id) ON DELETE SET NULL,
  duration_years INT DEFAULT 3,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACADEMIC LEVELS
-- ============================================================
CREATE TABLE academic_levels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  program_id INT REFERENCES programs(id) ON DELETE CASCADE,
  level_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEMESTERS
-- ============================================================
CREATE TABLE semesters (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  semester_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACADEMIC YEARS
-- ============================================================
CREATE TABLE academic_years (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  program_id INT REFERENCES programs(id) ON DELETE CASCADE,
  certification_id INT REFERENCES certifications(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SESSIONS
-- ============================================================
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  academic_year_id INT REFERENCES academic_years(id) ON DELETE CASCADE,
  academic_level_id INT REFERENCES academic_levels(id) ON DELETE CASCADE,
  semester_id INT REFERENCES semesters(id) ON DELETE CASCADE,
  program_id INT REFERENCES programs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROOMS
-- ============================================================
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(30) UNIQUE NOT NULL,
  building VARCHAR(100),
  capacity INT DEFAULT 30,
  room_type VARCHAR(50) DEFAULT 'Classroom'
    CHECK (room_type IN ('Classroom','Lab','Lecture Hall','Auditorium')),
  status VARCHAR(20) DEFAULT 'available'
    CHECK (status IN ('available','occupied','maintenance')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACADEMIC WEEKS
-- ============================================================
CREATE TABLE academic_weeks (
  id SERIAL PRIMARY KEY,
  academic_year_id INT REFERENCES academic_years(id) ON DELETE CASCADE,
  department_id INT REFERENCES departments(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  label VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK to certifications (now that academic_weeks exists)
ALTER TABLE certifications
  ADD CONSTRAINT fk_cert_school_period
  FOREIGN KEY (school_period_id) REFERENCES academic_weeks(id) ON DELETE SET NULL;

-- ============================================================
-- COURSES
-- ============================================================
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(30) UNIQUE NOT NULL,
  session_id INT REFERENCES sessions(id) ON DELETE SET NULL,
  school_period_id INT REFERENCES academic_weeks(id) ON DELETE SET NULL,
  credits INT DEFAULT 3,
  hours_per_week INT DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRAINERS
-- ============================================================
CREATE TABLE trainers (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialization VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRAINER_COURSES
-- ============================================================
CREATE TABLE trainer_courses (
  id SERIAL PRIMARY KEY,
  trainer_id INT REFERENCES trainers(id) ON DELETE CASCADE,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  certification_id INT REFERENCES certifications(id) ON DELETE CASCADE,
  CONSTRAINT chk_one_subject CHECK (
    (course_id IS NOT NULL AND certification_id IS NULL) OR
    (course_id IS NULL AND certification_id IS NOT NULL)
  )
);

-- ============================================================
-- STUDENTS
-- ============================================================
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  matricule VARCHAR(50) UNIQUE NOT NULL,
  date_of_birth DATE,
  program_id INT REFERENCES programs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PARENTS
-- ============================================================
CREATE TABLE parents (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  relationship VARCHAR(50) DEFAULT 'Father'
    CHECK (relationship IN ('Father','Mother','Guardian')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PARENT_STUDENT_LINKS
-- ============================================================
CREATE TABLE parent_student_links (
  id SERIAL PRIMARY KEY,
  parent_id INT REFERENCES parents(id) ON DELETE CASCADE,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE(parent_id, student_id)
);

-- ============================================================
-- ENROLLMENTS
-- ============================================================
CREATE TABLE enrollments (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  academic_year_id INT REFERENCES academic_years(id) ON DELETE CASCADE,
  program_id INT REFERENCES programs(id) ON DELETE CASCADE,
  certification_id INT REFERENCES certifications(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','completed')),
  CONSTRAINT chk_enrollment_subject CHECK (
    (program_id IS NOT NULL AND certification_id IS NULL) OR
    (program_id IS NULL AND certification_id IS NOT NULL)
  )
);

-- ============================================================
-- GRADES
-- ============================================================
CREATE TABLE grades (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  certification_id INT REFERENCES certifications(id) ON DELETE CASCADE,
  trainer_id INT REFERENCES trainers(id) ON DELETE SET NULL,
  grade NUMERIC(5,2),
  grade_letter VARCHAR(5),
  academic_year_id INT REFERENCES academic_years(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_grade_subject CHECK (
    (course_id IS NOT NULL AND certification_id IS NULL) OR
    (course_id IS NULL AND certification_id IS NOT NULL)
  ),
  UNIQUE(student_id, course_id),
  UNIQUE(student_id, certification_id)
);

-- ============================================================
-- AVAILABILITY
-- ============================================================
CREATE TABLE availability (
  id SERIAL PRIMARY KEY,
  trainer_id INT REFERENCES trainers(id) ON DELETE CASCADE,
  academic_week_id INT REFERENCES academic_weeks(id) ON DELETE CASCADE,
  day_of_week VARCHAR(10) NOT NULL
    CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')),
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trainer_id, academic_week_id, day_of_week, time_start, time_end)
);

-- ============================================================
-- AVAILABILITY_LOCKS
-- ============================================================
CREATE TABLE availability_locks (
  id SERIAL PRIMARY KEY,
  hod_user_id INT REFERENCES users(id) ON DELETE CASCADE,
  academic_week_id INT REFERENCES academic_weeks(id) ON DELETE CASCADE,
  is_locked BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hod_user_id, academic_week_id)
);

-- ============================================================
-- TIMETABLES
-- ============================================================
CREATE TABLE timetables (
  id SERIAL PRIMARY KEY,
  academic_week_id INT UNIQUE REFERENCES academic_weeks(id) ON DELETE CASCADE,
  generated_by INT REFERENCES users(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  label VARCHAR(150),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','published'))
);

-- ============================================================
-- TIMETABLE_SLOTS
-- ============================================================
CREATE TABLE timetable_slots (
  id SERIAL PRIMARY KEY,
  timetable_id INT REFERENCES timetables(id) ON DELETE CASCADE,
  academic_week_id INT REFERENCES academic_weeks(id) ON DELETE CASCADE,
  day_of_week VARCHAR(10) NOT NULL
    CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')),
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  room_id INT REFERENCES rooms(id) ON DELETE SET NULL,
  trainer_id INT REFERENCES trainers(id) ON DELETE SET NULL,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  certification_id INT REFERENCES certifications(id) ON DELETE CASCADE,
  CONSTRAINT chk_slot_subject CHECK (
    (course_id IS NOT NULL AND certification_id IS NULL) OR
    (course_id IS NULL AND certification_id IS NOT NULL)
  )
);

-- ============================================================
-- ATTENDANCE
-- ============================================================
CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  timetable_slot_id INT REFERENCES timetable_slots(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present','absent','late')),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMPLAINTS (parent → admin)
-- ============================================================
CREATE TABLE complaints (
  id SERIAL PRIMARY KEY,
  parent_id INT REFERENCES parents(id) ON DELETE CASCADE,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','resolved')),
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MARK_COMPLAINTS (student → trainer)
-- ============================================================
CREATE TABLE mark_complaints (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  trainer_id INT REFERENCES trainers(id) ON DELETE CASCADE,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  certification_id INT REFERENCES certifications(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','reviewed')),
  trainer_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_mark_complaint_subject CHECK (
    (course_id IS NOT NULL AND certification_id IS NULL) OR
    (course_id IS NULL AND certification_id IS NOT NULL)
  ),
  UNIQUE(student_id, course_id),
  UNIQUE(student_id, certification_id)
);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  target_role VARCHAR(50),
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_timetable_slots_timetable ON timetable_slots(timetable_id);
CREATE INDEX idx_timetable_slots_trainer ON timetable_slots(trainer_id);
CREATE INDEX idx_availability_trainer ON availability(trainer_id);
CREATE INDEX idx_availability_week ON availability(academic_week_id);
CREATE INDEX idx_academic_weeks_dept ON academic_weeks(department_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_mark_complaints_trainer ON mark_complaints(trainer_id);

-- ============================================================
-- SEED DATA STARTS HERE
-- ============================================================

-- ============================================================
-- SEED DATA
-- Passwords:
--   admin@tcms.edu          -> admin1234
--   All other users         -> their phone number (e.g. +1000000002)
-- ============================================================

-- 1. ROLES
INSERT INTO roles (id, name) VALUES
(1,'admin'),(2,'secretary'),(3,'hod'),(4,'trainer'),(5,'student'),(6,'parent');

SELECT setval('roles_id_seq', 6);

-- 2. USERS
INSERT INTO users (id, full_name, email, password_hash, phone, department, status, password_changed, created_at) VALUES
(1,  'System Administrator',  'admin@tcms.edu',             '$2b$12$pZz/cvqzmfqaCYz/ZVr6nuSp1MKRrHuB884Z2jxFyKnNH.TwJRH9e', '+1000000001', 'Administration',        'active', true,  NOW() - INTERVAL '1 year'),
(2,  'Sarah Johnson',         'sarah.j@tcms.edu',           '$2b$12$74s1Q401hs8PcI8delAMb.csxUwIe1JOaQWr0NxsU9ynbjeuVbD6y', '+1000000002', 'Administration',        'active', true,  NOW() - INTERVAL '300 days'),
(3,  'Michael Chen',          'michael.c@tcms.edu',         '$2b$12$6KYWwmRg9gQ9EccZ65.V5ek1/uwhrXStlB0noHgFYPLreT0eVIHcG', '+1000000003', 'Administration',        'active', false, NOW() - INTERVAL '280 days'),
(4,  'Dr. Emily Rodriguez',   'emily.r@tcms.edu',           '$2b$12$o6UOPiwEtdduLdDODXI3hOq5jIfWxD3Nxat8/LyRM15G6wv3IO5.6', '+1000000004', 'Computer Science',      'active', true,  NOW() - INTERVAL '250 days'),
(5,  'Prof. James Wilson',    'james.w@tcms.edu',           '$2b$12$0lh0.Q01DQwM8Q6VJUwyz.llD4EseEEL4d/5r51C1cbSKuEPX0j5q', '+1000000005', 'Business Administration','active', true,  NOW() - INTERVAL '240 days'),
(6,  'Dr. Lisa Thompson',     'lisa.t@tcms.edu',            '$2b$12$3PVr7hoCXhFEdljkX6ZiPORZEVB9p5NQcOg4lfaybjAz4yMbP6e7.', '+1000000006', 'Engineering',           'active', false, NOW() - INTERVAL '230 days'),
(7,  'Robert Martinez',       'robert.m@tcms.edu',          '$2b$12$BbX/u0jX.dqGA9maDiz9pO4fLN8TgGR/jDuQ8TI.oYFp4xAkLPJ06', '+1000000007', 'Computer Science',      'active', true,  NOW() - INTERVAL '200 days'),
(8,  'Jennifer Lee',          'jennifer.l@tcms.edu',        '$2b$12$.F4893aOiRVkr7yOI76bLepRlMpABdhPSGCLJBXlwDTb.GhcPnNwS', '+1000000008', 'Computer Science',      'active', true,  NOW() - INTERVAL '190 days'),
(9,  'David Brown',           'david.b@tcms.edu',           '$2b$12$Xk721ow7hkvA2tDmkukttuOQsGFGBV8cs7J4JFzVkl0YKftzjHjSG', '+1000000009', 'Business Administration','active', false, NOW() - INTERVAL '180 days'),
(10, 'Amanda White',          'amanda.w@tcms.edu',          '$2b$12$mC3r5lNSC/g6kn8YoU4soOmVg6DLJarf7jIUWCAPFMrZ9JSACJDhG', '+1000000010', 'Business Administration','active', true,  NOW() - INTERVAL '170 days'),
(11, 'Christopher Davis',     'chris.d@tcms.edu',           '$2b$12$kANWwKIFBh1u1JKwfB7S1uSZTIYxHCss/MJLDEdcxwrt.Mad1T6ge', '+1000000011', 'Engineering',           'active', true,  NOW() - INTERVAL '160 days'),
(12, 'Dr. Michelle Garcia',   'michelle.g@tcms.edu',        '$2b$12$8glC8wrdK0/7Ad5ZtuJZ0eBbDIjzXfC5E3cU.HdIWwDzWHbL3dI2q', '+1000000012', 'Engineering',           'active', true,  NOW() - INTERVAL '150 days'),
(13, 'Alex Johnson',          'alex.j@student.tcms.edu',   '$2b$12$2tkFhn5T8aAqTJA1lRg8BuAPTAHGzoJ8LKl.oqgAHsYi7m6ByBPBi', '+1000000013', 'Computer Science',      'active', true,  NOW() - INTERVAL '100 days'),
(14, 'Maria Garcia',          'maria.g@student.tcms.edu',  '$2b$12$XU8dLlkxVlEMrSKx3YyyEuZg6S7v97.C0C6crFet1FTgk1/g0oI..', '+1000000014', 'Computer Science',      'active', false, NOW() - INTERVAL '95 days'),
(15, 'James Smith',           'james.s@student.tcms.edu',  '$2b$12$E.quHlKan79DMsv2twKJ.OzqkIfqha631c/ZVn/AcZsoFAO7TKnAC', '+1000000015', 'Business Administration','active', true,  NOW() - INTERVAL '90 days'),
(16, 'Sophia Williams',       'sophia.w@student.tcms.edu', '$2b$12$jcWSXUccRG40cZM62sZb6eQVh9z3P0LKwCqnb1ubuE92yceZhkMnm', '+1000000016', 'Business Administration','active', true,  NOW() - INTERVAL '85 days'),
(17, 'Daniel Brown',          'daniel.b@student.tcms.edu', '$2b$12$vNeGrwO7guaFEWwltIek.OxHsica4yrIfSL9ko8dry0kshwu5nOaq',  '+1000000017', 'Engineering',           'active', false, NOW() - INTERVAL '80 days'),
(18, 'Emma Davis',            'emma.d@student.tcms.edu',   '$2b$12$y9BBZogNWBL5j9HIW2GkoOfPY.iqoDLro5LXKDT5wkTyBlGpc3rfu',  '+1000000018', 'Engineering',           'active', true,  NOW() - INTERVAL '75 days'),
(19, 'Michael Wilson',        'michael.w@student.tcms.edu','$2b$12$nVVO2UsZUlv/dX5JeG34SeqJEqcdIAndZYAZO/D7Ikl3iqAs1aHoq',  '+1000000019', 'Computer Science',      'active', true,  NOW() - INTERVAL '70 days'),
(20, 'Olivia Martinez',       'olivia.m@student.tcms.edu', '$2b$12$Bk2v0IhJM7BbhYW3mmD2BevdnGo7irukKq1qEo.A5J2c0BRUg1cpe', '+1000000020', 'Business Administration','active', true,  NOW() - INTERVAL '65 days'),
(21, 'Thomas Johnson',        'thomas.j@parent.tcms.edu',  '$2b$12$yxG70ge1Sol9llpgGYv/Gu73z6egU88NW6W.VheS0hBfmZ7tSCTA.', '+1000000021', NULL,                    'active', true,  NOW() - INTERVAL '100 days'),
(22, 'Carmen Garcia',         'carmen.g@parent.tcms.edu',  '$2b$12$KYhwzNYI754mIrTcGwRRH.6GuinEm/qgPt7glkBKEFbWQuk5CrRk.', '+1000000022', NULL,                    'active', false, NOW() - INTERVAL '95 days'),
(23, 'Robert Smith',          'robert.s@parent.tcms.edu',  '$2b$12$4Kv21P2I.0KVYVC9sPvUeO8P6WGbMJNRPjd8oJMGyMTIg23Z/QZGi', '+1000000023', NULL,                    'active', true,  NOW() - INTERVAL '90 days'),
(24, 'Patricia Williams',     'patricia.w@parent.tcms.edu','$2b$12$pzZeL6yJXiyOq24QKWs0gO6Nu22kOavvQzS27xQL89PygW1Ieo/p.', '+1000000024', NULL,                    'active', true,  NOW() - INTERVAL '85 days'),
(25, 'William Brown',         'william.b@parent.tcms.edu', '$2b$12$OKMpSctqJCrArfFhn9Yfl.2d9AkArK8uuyDNXM9e.gb3wKgbTJ8zK', '+1000000025', NULL,                    'active', true,  NOW() - INTERVAL '80 days');

SELECT setval('users_id_seq', 25);

-- 3. USER_ROLES
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1),
(2, 2), (3, 2),
(4, 3), (4, 4),
(5, 3), (5, 4),
(6, 3), (6, 4),
(7, 4), (8, 4), (9, 4), (10, 4), (11, 4), (12, 4),
(13, 5), (14, 5), (15, 5), (16, 5), (17, 5), (18, 5), (19, 5), (20, 5),
(21, 6), (22, 6), (23, 6), (24, 6), (25, 6);

-- 4. DEPARTMENTS
INSERT INTO departments (id, name, code, hod_name, hod_user_id, student_count, status, created_at) VALUES
(1, 'Computer Science & IT', 'CSIT', 'Dr. Emily Rodriguez', 4, 3, 'active', NOW() - INTERVAL '250 days'),
(2, 'Business Administration', 'BUSA', 'Prof. James Wilson', 5, 3, 'active', NOW() - INTERVAL '240 days'),
(3, 'Engineering & Technology', 'ENGT', 'Dr. Lisa Thompson', 6, 2, 'active', NOW() - INTERVAL '230 days');

SELECT setval('departments_id_seq', 3);

-- 5. PROGRAMS
INSERT INTO programs (id, name, code, department_id, duration_years, status, created_at) VALUES
(1, 'Bachelor of Science in Computer Science', 'BSC-CS', 1, 4, 'active', NOW() - INTERVAL '200 days'),
(2, 'Diploma in Software Engineering', 'DIP-SE', 1, 2, 'active', NOW() - INTERVAL '190 days'),
(3, 'Bachelor of Business Administration', 'BBA', 2, 4, 'active', NOW() - INTERVAL '180 days'),
(4, 'Professional Certificate in Management', 'CERT-MGT', 2, 1, 'active', NOW() - INTERVAL '170 days'),
(5, 'Bachelor of Mechanical Engineering', 'BME', 3, 4, 'active', NOW() - INTERVAL '160 days'),
(6, 'Certificate in CAD/CAM', 'CERT-CAD', 3, 1, 'active', NOW() - INTERVAL '150 days');

SELECT setval('programs_id_seq', 6);

-- 6. ACADEMIC_LEVELS
INSERT INTO academic_levels (id, name, program_id, level_order, created_at) VALUES
(1, 'Year 1', 1, 1, NOW() - INTERVAL '200 days'),
(2, 'Year 2', 1, 2, NOW() - INTERVAL '200 days'),
(3, 'Year 3', 1, 3, NOW() - INTERVAL '200 days'),
(4, 'Year 4', 1, 4, NOW() - INTERVAL '200 days'),
(5, 'Year 1', 2, 1, NOW() - INTERVAL '190 days'),
(6, 'Year 2', 2, 2, NOW() - INTERVAL '190 days'),
(7, 'Year 1', 3, 1, NOW() - INTERVAL '180 days'),
(8, 'Year 2', 3, 2, NOW() - INTERVAL '180 days'),
(9, 'Year 3', 3, 3, NOW() - INTERVAL '180 days'),
(10, 'Year 4', 3, 4, NOW() - INTERVAL '180 days'),
(11, 'Level 1', 4, 1, NOW() - INTERVAL '170 days'),
(12, 'Year 1', 5, 1, NOW() - INTERVAL '160 days'),
(13, 'Year 2', 5, 2, NOW() - INTERVAL '160 days'),
(14, 'Level 1', 6, 1, NOW() - INTERVAL '150 days');

SELECT setval('academic_levels_id_seq', 14);

-- 7. SEMESTERS
INSERT INTO semesters (id, name, semester_order, created_at) VALUES
(1, 'First Semester', 1, NOW() - INTERVAL '300 days'),
(2, 'Second Semester', 2, NOW() - INTERVAL '300 days'),
(3, 'Summer Term', 3, NOW() - INTERVAL '300 days');

SELECT setval('semesters_id_seq', 3);

-- 8. CERTIFICATIONS (without school_period_id first)
INSERT INTO certifications (id, name, code, description, duration_hours, school_period_id, status, created_at) VALUES
(1, 'AWS Cloud Practitioner', 'AWS-CP', 'Foundation level AWS certification', 40, NULL, 'active', NOW() - INTERVAL '120 days'),
(2, 'Project Management Professional', 'PMP', 'Industry standard PM certification', 35, NULL, 'active', NOW() - INTERVAL '110 days'),
(3, 'AutoCAD Professional', 'ACAD-PRO', 'Advanced CAD certification', 60, NULL, 'active', NOW() - INTERVAL '100 days'),
(4, 'Data Analytics Fundamentals', 'DA-FUN', 'Introduction to data analysis', 45, NULL, 'active', NOW() - INTERVAL '90 days');

SELECT setval('certifications_id_seq', 4);

-- 9. ACADEMIC_YEARS
INSERT INTO academic_years (id, name, start_date, end_date, is_active, program_id, certification_id, created_at) VALUES
(1, '2025-2026 Academic Year', '2025-09-01', '2026-06-30', true, 1, NULL, NOW() - INTERVAL '100 days'),
(2, '2025-2026 Academic Year', '2025-09-01', '2026-06-30', true, 2, NULL, NOW() - INTERVAL '100 days'),
(3, '2025-2026 Academic Year', '2025-09-01', '2026-06-30', true, 3, NULL, NOW() - INTERVAL '100 days'),
(4, '2025-2026 Academic Year', '2025-09-01', '2026-06-30', true, 5, NULL, NOW() - INTERVAL '100 days'),
(5, 'AWS Winter 2026', '2026-01-15', '2026-02-28', true, NULL, 1, NOW() - INTERVAL '60 days'),
(6, 'PMP Spring 2026', '2026-03-01', '2026-04-15', true, NULL, 2, NOW() - INTERVAL '50 days'),
(7, 'AutoCAD Workshop 2026', '2026-02-01', '2026-03-15', true, NULL, 3, NOW() - INTERVAL '40 days');

SELECT setval('academic_years_id_seq', 7);

-- 10. ROOMS
INSERT INTO rooms (id, name, code, building, capacity, room_type, status, created_at) VALUES
(1, 'Lecture Hall A', 'LH-A', 'Main Building', 120, 'Lecture Hall', 'available', NOW() - INTERVAL '300 days'),
(2, 'Lecture Hall B', 'LH-B', 'Main Building', 100, 'Lecture Hall', 'available', NOW() - INTERVAL '300 days'),
(3, 'Computer Lab 1', 'CL-01', 'Tech Wing', 40, 'Lab', 'available', NOW() - INTERVAL '300 days'),
(4, 'Computer Lab 2', 'CL-02', 'Tech Wing', 40, 'Lab', 'available', NOW() - INTERVAL '300 days'),
(5, 'Computer Lab 3', 'CL-03', 'Tech Wing', 30, 'Lab', 'available', NOW() - INTERVAL '300 days'),
(6, 'Engineering Workshop', 'ENG-W1', 'Engineering Block', 25, 'Lab', 'available', NOW() - INTERVAL '300 days'),
(7, 'Classroom 101', 'CR-101', 'Main Building', 35, 'Classroom', 'available', NOW() - INTERVAL '300 days'),
(8, 'Classroom 102', 'CR-102', 'Main Building', 35, 'Classroom', 'available', NOW() - INTERVAL '300 days'),
(9, 'Conference Room', 'CONF-01', 'Admin Building', 20, 'Classroom', 'available', NOW() - INTERVAL '300 days'),
(10, 'Auditorium', 'AUD-01', 'Main Building', 250, 'Auditorium', 'available', NOW() - INTERVAL '300 days');

SELECT setval('rooms_id_seq', 10);

-- 11. SESSIONS
INSERT INTO sessions (id, academic_year_id, academic_level_id, semester_id, program_id, created_at) VALUES
(1, 1, 1, 1, 1, NOW() - INTERVAL '90 days'),
(2, 1, 2, 1, 1, NOW() - INTERVAL '90 days'),
(3, 2, 5, 1, 2, NOW() - INTERVAL '90 days'),
(4, 3, 7, 1, 3, NOW() - INTERVAL '90 days'),
(5, 3, 8, 1, 3, NOW() - INTERVAL '90 days'),
(6, 4, 12, 1, 5, NOW() - INTERVAL '90 days');

SELECT setval('sessions_id_seq', 6);

-- 12. ACADEMIC_WEEKS
INSERT INTO academic_weeks (id, academic_year_id, department_id, week_number, label, start_date, end_date, status, created_by, created_at) VALUES
(1, 1, 1, 1, 'Week 1 - Introduction', '2026-01-05', '2026-01-11', 'published', 4, NOW() - INTERVAL '60 days'),
(2, 1, 1, 2, 'Week 2 - Fundamentals', '2026-01-12', '2026-01-18', 'published', 4, NOW() - INTERVAL '53 days'),
(3, 1, 1, 3, 'Week 3 - Core Concepts', '2026-01-19', '2026-01-25', 'published', 4, NOW() - INTERVAL '46 days'),
(4, 1, 1, 4, 'Week 4 - Advanced Topics', '2026-01-26', '2026-02-01', 'draft', 4, NOW() - INTERVAL '39 days'),
(5, 3, 2, 1, 'Week 1 - Orientation', '2026-01-05', '2026-01-11', 'published', 5, NOW() - INTERVAL '60 days'),
(6, 3, 2, 2, 'Week 2 - Principles', '2026-01-12', '2026-01-18', 'published', 5, NOW() - INTERVAL '53 days'),
(7, 3, 2, 3, 'Week 3 - Case Studies', '2026-01-19', '2026-01-25', 'draft', 5, NOW() - INTERVAL '46 days'),
(8, 4, 3, 1, 'Week 1 - Safety & Intro', '2026-01-05', '2026-01-11', 'published', 6, NOW() - INTERVAL '60 days'),
(9, 4, 3, 2, 'Week 2 - Mechanics', '2026-01-12', '2026-01-18', 'draft', 6, NOW() - INTERVAL '53 days'),
(10, 5, 1, 1, 'AWS Week 1', '2026-01-15', '2026-01-21', 'published', 4, NOW() - INTERVAL '50 days'),
(11, 5, 1, 2, 'AWS Week 2', '2026-01-22', '2026-01-28', 'published', 4, NOW() - INTERVAL '43 days'),
(12, 6, 2, 1, 'PMP Week 1', '2026-03-01', '2026-03-07', 'draft', 5, NOW() - INTERVAL '20 days');

SELECT setval('academic_weeks_id_seq', 12);

-- Update certifications with school_period_id
UPDATE certifications SET school_period_id = 10 WHERE id = 1;
UPDATE certifications SET school_period_id = 12 WHERE id = 2;
UPDATE certifications SET school_period_id = 8 WHERE id = 3;

-- 13. COURSES
INSERT INTO courses (id, name, code, session_id, school_period_id, credits, hours_per_week, created_at) VALUES
(1, 'Introduction to Programming', 'CS101', 1, NULL, 4, 4, NOW() - INTERVAL '85 days'),
(2, 'Discrete Mathematics', 'CS102', 1, NULL, 3, 3, NOW() - INTERVAL '85 days'),
(3, 'Computer Architecture', 'CS103', 1, NULL, 3, 3, NOW() - INTERVAL '85 days'),
(4, 'Data Structures & Algorithms', 'CS201', 2, NULL, 4, 4, NOW() - INTERVAL '85 days'),
(5, 'Database Systems', 'CS202', 2, NULL, 3, 3, NOW() - INTERVAL '85 days'),
(6, 'Software Development Basics', 'SE101', 3, NULL, 4, 6, NOW() - INTERVAL '85 days'),
(7, 'Web Technologies', 'SE102', 3, NULL, 3, 4, NOW() - INTERVAL '85 days'),
(8, 'Principles of Management', 'MGT101', 4, NULL, 3, 3, NOW() - INTERVAL '85 days'),
(9, 'Business Economics', 'ECO101', 4, NULL, 3, 3, NOW() - INTERVAL '85 days'),
(10, 'Marketing Fundamentals', 'MKT201', 5, NULL, 3, 3, NOW() - INTERVAL '85 days'),
(11, 'Financial Accounting', 'ACC201', 5, NULL, 3, 3, NOW() - INTERVAL '85 days'),
(12, 'Engineering Drawing', 'ME101', 6, NULL, 3, 4, NOW() - INTERVAL '85 days'),
(13, 'Statics & Dynamics', 'ME102', 6, NULL, 4, 4, NOW() - INTERVAL '85 days'),
(14, 'AWS Cloud Fundamentals', 'AWS101', NULL, 10, 6, 20, NOW() - INTERVAL '60 days'),
(15, 'PMP Exam Preparation', 'PMP101', NULL, 12, 6, 20, NOW() - INTERVAL '50 days'),
(16, 'Advanced AutoCAD', 'CAD201', NULL, 8, 4, 15, NOW() - INTERVAL '40 days');

SELECT setval('courses_id_seq', 16);

-- 14. TRAINERS
INSERT INTO trainers (id, user_id, specialization, created_at) VALUES
(1, 4, 'Computer Science, AI, Machine Learning', NOW() - INTERVAL '250 days'),
(2, 5, 'Business Strategy, Management', NOW() - INTERVAL '240 days'),
(3, 6, 'Mechanical Engineering, CAD', NOW() - INTERVAL '230 days'),
(4, 7, 'Software Engineering, Web Development', NOW() - INTERVAL '200 days'),
(5, 8, 'Data Science, Database Systems', NOW() - INTERVAL '190 days'),
(6, 9, 'Marketing, Consumer Behavior', NOW() - INTERVAL '180 days'),
(7, 10, 'Finance, Accounting', NOW() - INTERVAL '170 days'),
(8, 11, 'Thermodynamics, Fluid Mechanics', NOW() - INTERVAL '160 days'),
(9, 12, 'Robotics, Control Systems', NOW() - INTERVAL '150 days');

SELECT setval('trainers_id_seq', 9);

-- 15. TRAINER_COURSES
INSERT INTO trainer_courses (id, trainer_id, course_id, certification_id) VALUES
(1, 1, 1, NULL),
(2, 4, 1, NULL),
(3, 4, 6, NULL),
(4, 4, 7, NULL),
(5, 5, 4, NULL),
(6, 5, 5, NULL),
(7, 1, 2, NULL),
(8, 1, 3, NULL),
(9, 2, 8, NULL),
(10, 6, 10, NULL),
(11, 7, 11, NULL),
(12, 6, 9, NULL),
(13, 3, 12, NULL),
(14, 8, 13, NULL),
(15, 3, 16, NULL),
(16, 4, NULL, 1),
(17, 2, NULL, 2),
(18, 3, NULL, 3);

SELECT setval('trainer_courses_id_seq', 18);

-- 16. STUDENTS
INSERT INTO students (id, user_id, matricule, date_of_birth, program_id, created_at) VALUES
(1, 13, 'CS/2025/001', '2003-05-15', 1, NOW() - INTERVAL '100 days'),
(2, 14, 'CS/2025/002', '2002-08-22', 1, NOW() - INTERVAL '95 days'),
(3, 19, 'CS/2025/003', '2001-12-03', 2, NOW() - INTERVAL '70 days'),
(4, 15, 'BUS/2025/001', '2000-03-10', 3, NOW() - INTERVAL '90 days'),
(5, 16, 'BUS/2025/002', '2002-11-28', 3, NOW() - INTERVAL '85 days'),
(6, 20, 'BUS/2025/003', '1999-07-14', 4, NOW() - INTERVAL '65 days'),
(7, 17, 'ENG/2025/001', '2001-09-05', 5, NOW() - INTERVAL '80 days'),
(8, 18, 'ENG/2025/002', '2003-01-20', 6, NOW() - INTERVAL '75 days');

SELECT setval('students_id_seq', 8);

-- 17. PARENTS
INSERT INTO parents (id, user_id, relationship, created_at) VALUES
(1, 21, 'Father', NOW() - INTERVAL '100 days'),
(2, 22, 'Mother', NOW() - INTERVAL '95 days'),
(3, 23, 'Father', NOW() - INTERVAL '90 days'),
(4, 24, 'Mother', NOW() - INTERVAL '85 days'),
(5, 25, 'Father', NOW() - INTERVAL '80 days');

SELECT setval('parents_id_seq', 5);

-- 18. PARENT_STUDENT_LINKS
INSERT INTO parent_student_links (id, parent_id, student_id) VALUES
(1, 1, 1),
(2, 2, 2),
(3, 3, 4),
(4, 4, 5),
(5, 5, 7);

SELECT setval('parent_student_links_id_seq', 5);

-- 19. ENROLLMENTS
INSERT INTO enrollments (id, student_id, academic_year_id, program_id, certification_id, enrolled_at, status) VALUES
(1, 1, 1, 1, NULL, NOW() - INTERVAL '100 days', 'active'),
(2, 2, 1, 1, NULL, NOW() - INTERVAL '95 days', 'active'),
(3, 3, 2, 2, NULL, NOW() - INTERVAL '70 days', 'active'),
(4, 4, 3, 3, NULL, NOW() - INTERVAL '90 days', 'active'),
(5, 5, 3, 3, NULL, NOW() - INTERVAL '85 days', 'active'),
(6, 7, 4, 5, NULL, NOW() - INTERVAL '80 days', 'active'),
(7, 6, 6, NULL, 2, NOW() - INTERVAL '50 days', 'active'),
(8, 8, 7, NULL, 3, NOW() - INTERVAL '40 days', 'active');

SELECT setval('enrollments_id_seq', 8);

-- 20. GRADES
INSERT INTO grades (id, student_id, course_id, certification_id, trainer_id, grade, grade_letter, academic_year_id, submitted_at) VALUES
(1, 1, 1, NULL, 1, 85.50, 'A', 1, NOW() - INTERVAL '30 days'),
(2, 1, 2, NULL, 1, 78.00, 'B+', 1, NOW() - INTERVAL '28 days'),
(3, 1, 3, NULL, 1, 82.50, 'A-', 1, NOW() - INTERVAL '25 days'),
(4, 2, 1, NULL, 4, 92.00, 'A', 1, NOW() - INTERVAL '30 days'),
(5, 2, 2, NULL, 1, 88.50, 'A', 1, NOW() - INTERVAL '28 days'),
(6, 4, 8, NULL, 2, 76.00, 'B+', 3, NOW() - INTERVAL '20 days'),
(7, 4, 9, NULL, 6, 81.00, 'A-', 3, NOW() - INTERVAL '18 days'),
(8, 5, 10, NULL, 6, 79.50, 'B+', 3, NOW() - INTERVAL '15 days'),
(9, 5, 11, NULL, 7, 74.00, 'B', 3, NOW() - INTERVAL '12 days'),
(10, 6, NULL, 2, 2, 88.00, 'Pass', 6, NOW() - INTERVAL '5 days'),
(11, 8, NULL, 3, 3, 91.50, 'Pass', 7, NOW() - INTERVAL '3 days');

SELECT setval('grades_id_seq', 11);

-- 21. AVAILABILITY
INSERT INTO availability (id, trainer_id, academic_week_id, day_of_week, time_start, time_end, created_at) VALUES
(1, 4, 1, 'Monday', '09:00', '11:00', NOW() - INTERVAL '55 days'),
(2, 4, 1, 'Monday', '14:00', '16:00', NOW() - INTERVAL '55 days'),
(3, 4, 1, 'Wednesday', '09:00', '12:00', NOW() - INTERVAL '55 days'),
(4, 4, 1, 'Friday', '10:00', '12:00', NOW() - INTERVAL '55 days'),
(5, 5, 1, 'Tuesday', '09:00', '12:00', NOW() - INTERVAL '54 days'),
(6, 5, 1, 'Thursday', '14:00', '17:00', NOW() - INTERVAL '54 days'),
(7, 4, 2, 'Monday', '09:00', '11:00', NOW() - INTERVAL '48 days'),
(8, 4, 2, 'Wednesday', '09:00', '12:00', NOW() - INTERVAL '48 days'),
(9, 1, 2, 'Tuesday', '10:00', '12:00', NOW() - INTERVAL '47 days'),
(10, 1, 2, 'Thursday', '14:00', '16:00', NOW() - INTERVAL '47 days'),
(11, 5, 3, 'Monday', '09:00', '12:00', NOW() - INTERVAL '41 days'),
(12, 2, 5, 'Monday', '10:00', '12:00', NOW() - INTERVAL '55 days'),
(13, 6, 5, 'Wednesday', '14:00', '16:00', NOW() - INTERVAL '54 days'),
(14, 7, 5, 'Friday', '09:00', '11:00', NOW() - INTERVAL '53 days');

SELECT setval('availability_id_seq', 14);

-- 22. AVAILABILITY_LOCKS
INSERT INTO availability_locks (id, hod_user_id, academic_week_id, is_locked, updated_at) VALUES
(1, 4, 1, true, NOW() - INTERVAL '50 days'),
(2, 4, 2, true, NOW() - INTERVAL '43 days'),
(3, 4, 3, true, NOW() - INTERVAL '36 days'),
(4, 4, 4, false, NOW() - INTERVAL '30 days'),
(5, 5, 5, true, NOW() - INTERVAL '50 days'),
(6, 5, 6, false, NOW() - INTERVAL '43 days'),
(7, 5, 7, false, NOW() - INTERVAL '36 days'),
(8, 6, 8, true, NOW() - INTERVAL '50 days'),
(9, 6, 9, false, NOW() - INTERVAL '43 days');

SELECT setval('availability_locks_id_seq', 9);

-- 23. TIMETABLES
INSERT INTO timetables (id, academic_week_id, generated_by, generated_at, label, status) VALUES
(1, 1, 4, NOW() - INTERVAL '48 days', 'CS Week 1 Schedule', 'published'),
(2, 2, 4, NOW() - INTERVAL '41 days', 'CS Week 2 Schedule', 'published'),
(3, 3, 4, NOW() - INTERVAL '34 days', 'CS Week 3 Schedule', 'published'),
(4, 5, 5, NOW() - INTERVAL '48 days', 'Business Week 1 Schedule', 'published'),
(5, 8, 6, NOW() - INTERVAL '48 days', 'Engineering Week 1 Schedule', 'published');

SELECT setval('timetables_id_seq', 5);

-- 24. TIMETABLE_SLOTS
INSERT INTO timetable_slots (id, timetable_id, academic_week_id, day_of_week, time_start, time_end, room_id, trainer_id, course_id, certification_id) VALUES
(1, 1, 1, 'Monday', '09:00', '11:00', 3, 4, 1, NULL),
(2, 1, 1, 'Monday', '14:00', '16:00', 7, 4, 6, NULL),
(3, 1, 1, 'Wednesday', '09:00', '12:00', 3, 4, 7, NULL),
(4, 1, 1, 'Friday', '10:00', '12:00', 1, 1, 2, NULL),
(5, 1, 1, 'Tuesday', '09:00', '12:00', 3, 5, 5, NULL),
(6, 1, 1, 'Thursday', '14:00', '17:00', 1, 5, 4, NULL),
(7, 2, 2, 'Monday', '09:00', '11:00', 3, 4, 1, NULL),
(8, 2, 2, 'Wednesday', '09:00', '12:00', 3, 4, 7, NULL),
(9, 2, 2, 'Tuesday', '10:00', '12:00', 1, 1, 3, NULL),
(10, 2, 2, 'Thursday', '14:00', '16:00', 1, 1, 2, NULL),
(11, 4, 5, 'Monday', '10:00', '12:00', 2, 2, 8, NULL),
(12, 4, 5, 'Wednesday', '14:00', '16:00', 8, 6, 9, NULL),
(13, 4, 5, 'Friday', '09:00', '11:00', 9, 7, 11, NULL),
(14, 5, 8, 'Monday', '09:00', '12:00', 6, 3, 12, NULL),
(15, 5, 8, 'Wednesday', '14:00', '16:00', 7, 8, 13, NULL);

SELECT setval('timetable_slots_id_seq', 15);

-- 25. ATTENDANCE
INSERT INTO attendance (id, student_id, timetable_slot_id, status, recorded_at) VALUES
(1, 1, 1, 'present', NOW() - INTERVAL '47 days'),
(2, 1, 4, 'present', NOW() - INTERVAL '45 days'),
(3, 1, 5, 'late', NOW() - INTERVAL '46 days'),
(4, 2, 1, 'present', NOW() - INTERVAL '47 days'),
(5, 2, 4, 'absent', NOW() - INTERVAL '45 days'),
(6, 2, 5, 'present', NOW() - INTERVAL '46 days'),
(7, 4, 11, 'present', NOW() - INTERVAL '47 days'),
(8, 4, 12, 'present', NOW() - INTERVAL '45 days'),
(9, 5, 11, 'present', NOW() - INTERVAL '47 days'),
(10, 5, 13, 'late', NOW() - INTERVAL '43 days');

SELECT setval('attendance_id_seq', 10);

-- 26. COMPLAINTS
INSERT INTO complaints (id, parent_id, student_id, subject, description, priority, status, admin_response, created_at, updated_at) VALUES
(1, 1, 1, 'Grade Discrepancy Concern', 'My son Alex received a B+ in Discrete Math but we believe his assignment grades warrant an A-. Please review.', 'medium', 'in_progress', 'Thank you for your concern. We are reviewing the grading rubric and will respond within 3 business days.', NOW() - INTERVAL '20 days', NOW() - INTERVAL '18 days'),
(2, 3, 4, 'Timetable Conflict', 'James has been scheduled for two classes at the same time on Fridays. This needs immediate correction.', 'high', 'resolved', 'Issue confirmed and resolved. James''s schedule has been updated and he has been notified of the changes.', NOW() - INTERVAL '15 days', NOW() - INTERVAL '12 days'),
(3, 4, 5, 'Request for Absence Excuse', 'Sophia was absent last Tuesday due to a medical appointment. I have attached the doctor''s note.', 'low', 'pending', NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

SELECT setval('complaints_id_seq', 3);

-- 27. MARK_COMPLAINTS
INSERT INTO mark_complaints (id, student_id, trainer_id, course_id, certification_id, subject, description, status, trainer_response, created_at) VALUES
(1, 2, 1, 2, NULL, 'Re-evaluation Request for CS102', 'I believe my final exam score was miscalculated. I scored 85 on the exam but my final grade shows 88.5 overall. Please verify.', 'pending', NULL, NOW() - INTERVAL '10 days'),
(2, 4, 7, 11, NULL, 'Missing Assignment Grade', 'My assignment 3 grade is not included in the final calculation. I submitted it before the deadline.', 'reviewed', 'Verified. Your assignment was found in the system and grade has been updated to reflect the correct calculation. New grade: 79.00 (B+)', NOW() - INTERVAL '15 days');

SELECT setval('mark_complaints_id_seq', 2);

-- 28. ANNOUNCEMENTS
INSERT INTO announcements (id, title, body, target_role, created_by, created_at) VALUES
(1, 'Welcome to Spring Semester 2026', 'We are excited to begin the new semester. Please check your timetables and ensure you have enrolled in all required courses. Office hours are available for any registration issues.', NULL, 1, NOW() - INTERVAL '60 days'),
(2, 'Exam Schedule Published', 'Mid-term examinations will begin on March 15th. Room assignments will be posted next week. Please review the academic calendar for specific dates.', 'student', 4, NOW() - INTERVAL '30 days'),
(3, 'Parent-Teacher Meeting', 'We invite all parents to attend the semester review meeting on February 20th at 6 PM in the Main Auditorium.', 'parent', 5, NOW() - INTERVAL '25 days'),
(4, 'System Maintenance', 'The TCMS portal will be unavailable this Saturday from 2 AM to 6 AM for scheduled maintenance.', NULL, 1, NOW() - INTERVAL '7 days'),
(5, 'New Certification: Cloud Computing', 'We are pleased to announce a new partnership with AWS for certification programs. Registration opens next month.', 'student', 4, NOW() - INTERVAL '3 days');

SELECT setval('announcements_id_seq', 5);

-- Verification
DO $$
DECLARE
    v_count INT;
BEGIN
    RAISE NOTICE '=== TCMS Database Seeding Complete ===';
    SELECT COUNT(*) INTO v_count FROM roles; RAISE NOTICE 'Roles: %', v_count;
    SELECT COUNT(*) INTO v_count FROM users; RAISE NOTICE 'Users: %', v_count;
    SELECT COUNT(*) INTO v_count FROM departments; RAISE NOTICE 'Departments: %', v_count;
    SELECT COUNT(*) INTO v_count FROM programs; RAISE NOTICE 'Programs: %', v_count;
    SELECT COUNT(*) INTO v_count FROM students; RAISE NOTICE 'Students: %', v_count;
    SELECT COUNT(*) INTO v_count FROM parents; RAISE NOTICE 'Parents: %', v_count;
    SELECT COUNT(*) INTO v_count FROM trainers; RAISE NOTICE 'Trainers: %', v_count;
    SELECT COUNT(*) INTO v_count FROM courses; RAISE NOTICE 'Courses: %', v_count;
    SELECT COUNT(*) INTO v_count FROM academic_weeks; RAISE NOTICE 'Academic Weeks: %', v_count;
    SELECT COUNT(*) INTO v_count FROM timetables; RAISE NOTICE 'Timetables: %', v_count;
    SELECT COUNT(*) INTO v_count FROM grades; RAISE NOTICE 'Grades: %', v_count;
    SELECT COUNT(*) INTO v_count FROM announcements; RAISE NOTICE 'Announcements: %', v_count;
    RAISE NOTICE '=====================================';
    RAISE NOTICE 'Default password for all users: password123';
    RAISE NOTICE '=====================================';
END $$;