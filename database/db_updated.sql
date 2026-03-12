-- ============================================================
-- TCMS - Training Center Management System
-- Updated Schema for Comprehensive Refactoring
-- ============================================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS announcements, mark_complaints, complaints, attendance,
    timetable_slots, timetables, availability_locks, availability, student_availability,
    grades, enrollments, parent_student_links, parents, students,
    trainer_courses, trainers, courses, academic_weeks, rooms,
    sessions, academic_years, semesters, academic_levels, programs,
    certifications, departments, user_roles, users, roles CASCADE;

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
-- USER_ROLES (for multi-role support)
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
-- CERTIFICATIONS (Atomic entities - not courses)
-- ============================================================
CREATE TABLE certifications (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(30) UNIQUE NOT NULL,
  description TEXT,
  duration_hours INT DEFAULT 40,
  department_id INT REFERENCES departments(id) ON DELETE SET NULL,
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
-- ACADEMIC LEVELS (Years within a program)
-- ============================================================
CREATE TABLE academic_levels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL, -- e.g., "Year 1", "Year 2"
  program_id INT REFERENCES programs(id) ON DELETE CASCADE,
  level_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEMESTERS
-- ============================================================
CREATE TABLE semesters (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL, -- e.g., "Semester 1", "Semester 2"
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SESSIONS (Program + Academic Year + Level + Semester)
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
-- ACADEMIC WEEKS (For both academic and certification scheduling)
-- ============================================================
CREATE TABLE academic_weeks (
  id SERIAL PRIMARY KEY,
  academic_year_id INT REFERENCES academic_years(id) ON DELETE CASCADE,
  department_id INT REFERENCES departments(id) ON DELETE CASCADE,
  certification_id INT REFERENCES certifications(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  label VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  week_type VARCHAR(20) DEFAULT 'academic' CHECK (week_type IN ('academic','certification')),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COURSES (Belong to sessions/programs)
-- ============================================================
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(30) UNIQUE NOT NULL,
  session_id INT REFERENCES sessions(id) ON DELETE SET NULL,
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
-- TRAINER_COURSES (Assignments - trainer can teach course OR certification)
-- ============================================================
CREATE TABLE trainer_courses (
  id SERIAL PRIMARY KEY,
  trainer_id INT REFERENCES trainers(id) ON DELETE CASCADE,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  certification_id INT REFERENCES certifications(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
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
-- ENROLLMENTS (Students enroll in programs OR certifications)
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
-- TRAINER AVAILABILITY (For academic weeks)
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
-- STUDENT AVAILABILITY (For certification weeks)
-- ============================================================
CREATE TABLE student_availability (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  academic_week_id INT REFERENCES academic_weeks(id) ON DELETE CASCADE,
  day_of_week VARCHAR(10) NOT NULL
    CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')),
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, academic_week_id, day_of_week, time_start, time_end)
);

-- ============================================================
-- AVAILABILITY_LOCKS (HOD can lock availability submissions)
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
  academic_week_id INT REFERENCES academic_weeks(id) ON DELETE CASCADE,
  generated_by INT REFERENCES users(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  label VARCHAR(150),
  timetable_type VARCHAR(20) DEFAULT 'academic' CHECK (timetable_type IN ('academic','certification')),
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
  program_id INT REFERENCES programs(id) ON DELETE SET NULL, -- For academic timetables
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
-- COMPLAINTS (Parent to Admin)
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
-- MARK_COMPLAINTS (Student to Trainer)
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
-- ANNOUNCEMENTS (HOD can target specific roles)
-- ============================================================
CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  department_id INT REFERENCES departments(id) ON DELETE CASCADE,
  target_roles VARCHAR(50)[] DEFAULT ARRAY['student','trainer','parent'], -- Array of target roles
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
CREATE INDEX idx_student_availability_student ON student_availability(student_id);
CREATE INDEX idx_student_availability_week ON student_availability(academic_week_id);
CREATE INDEX idx_academic_weeks_dept ON academic_weeks(department_id);
CREATE INDEX idx_academic_weeks_cert ON academic_weeks(certification_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_mark_complaints_trainer ON mark_complaints(trainer_id);
CREATE INDEX idx_announcements_dept ON announcements(department_id);

-- ============================================================
-- SEED DATA
-- ============================================================

-- 1. ROLES
INSERT INTO roles (id, name) VALUES
(1,'admin'),(2,'secretary'),(3,'hod'),(4,'trainer'),(5,'student'),(6,'parent');
SELECT setval('roles_id_seq', 6);

-- 2. USERS
INSERT INTO users (id, full_name, email, password_hash, phone, department, status, password_changed, created_at) VALUES
(1, 'System Administrator', 'admin@tcms.edu', '$2b$12$pZz/cvqzmfqaCYz/ZVr6nuSp1MKRrHuB884Z2jxFyKnNH.TwJRH9e', '+1000000001', 'Administration', 'active', true, NOW() - INTERVAL '1 year'),
(2, 'Sarah Johnson', 'sarah.j@tcms.edu', '$2b$12$74s1Q401hs8PcI8delAMb.csxUwIe1JOaQWr0NxsU9ynbjeuVbD6y', '+1000000002', 'Administration', 'active', true, NOW() - INTERVAL '300 days'),
(3, 'Michael Chen', 'michael.c@tcms.edu', '$2b$12$6KYWwmRg9gQ9EccZ65.V5ek1/uwhrXStlB0noHgFYPLreT0eVIHcG', '+1000000003', 'Administration', 'active', false, NOW() - INTERVAL '280 days'),
(4, 'Dr. Emily Rodriguez', 'emily.r@tcms.edu', '$2b$12$o6UOPiwEtdduLdDODXI3hOq5jIfWxD3Nxat8/LyRM15G6wv3IO5.6', '+1000000004', 'Computer Science', 'active', true, NOW() - INTERVAL '250 days'),
(5, 'Prof. James Wilson', 'james.w@tcms.edu', '$2b$12$0lh0.Q01DQwM8Q6VJUwyz.llD4EseEEL4d/5r51C1cbSKuEPX0j5q', '+1000000005', 'Business Administration', 'active', true, NOW() - INTERVAL '240 days'),
(6, 'Dr. Lisa Thompson', 'lisa.t@tcms.edu', '$2b$12$3PVr7hoCXhFEdljkX6ZiPORZEVB9p5NQcOg4lfaybjAz4yMbP6e7.', '+1000000006', 'Engineering', 'active', false, NOW() - INTERVAL '230 days'),
(7, 'Robert Martinez', 'robert.m@tcms.edu', '$2b$12$BbX/u0jX.dqGA9maDiz9pO4fLN8TgGR/jDuQ8TI.oYFp4xAkLPJ06', '+1000000007', 'Computer Science', 'active', true, NOW() - INTERVAL '200 days'),
(8, 'Jennifer Lee', 'jennifer.l@tcms.edu', '$2b$12$.F4893aOiRVkr7yOI76bLepRlMpABdhPSGCLJBXlwDTb.GhcPnNwS', '+1000000008', 'Computer Science', 'active', true, NOW() - INTERVAL '190 days'),
(9, 'David Brown', 'david.b@tcms.edu', '$2b$12$Xk721ow7hkvA2tDmkukttuOQsGFGBV8cs7J4JFzVkl0YKftzjHjSG', '+1000000009', 'Business Administration', 'active', false, NOW() - INTERVAL '180 days'),
(10, 'Amanda White', 'amanda.w@tcms.edu', '$2b$12$mC3r5lNSC/g6kn8YoU4soOmVg6DLJarf7jIUWCAPFMrZ9JSACJDhG', '+1000000010', 'Business Administration', 'active', true, NOW() - INTERVAL '170 days'),
(11, 'Christopher Davis', 'chris.d@tcms.edu', '$2b$12$kANWwKIFBh1u1JKwfB7S1uSZTIYxHCss/MJLDEdcxwrt.Mad1T6ge', '+1000000011', 'Engineering', 'active', true, NOW() - INTERVAL '160 days'),
(12, 'Dr. Michelle Garcia', 'michelle.g@tcms.edu', '$2b$12$8glC8wrdK0/7Ad5ZtuJZ0eBbDIjzXfC5E3cU.HdIWwDzWHbL3dI2q', '+1000000012', 'Engineering', 'active', true, NOW() - INTERVAL '150 days'),
(13, 'Alex Johnson', 'alex.j@student.tcms.edu', '$2b$12$2tkFhn5T8aAqTJA1lRg8BuAPTAHGzoJ8LKl.oqgAHsYi7m6ByBPBi', '+1000000013', 'Computer Science', 'active', true, NOW() - INTERVAL '100 days'),
(14, 'Maria Garcia', 'maria.g@student.tcms.edu', '$2b$12$XU8dLlkxVlEMrSKx3YyyEuZg6S7v97.C0C6crFet1FTgk1/g0oI..', '+1000000014', 'Computer Science', 'active', false, NOW() - INTERVAL '95 days'),
(15, 'James Smith', 'james.s@student.tcms.edu', '$2b$12$E.quHlKan79DMsv2twKJ.OzqkIfqha631c/ZVn/AcZsoFAO7TKnAC', '+1000000015', 'Business Administration', 'active', true, NOW() - INTERVAL '90 days'),
(16, 'Sophia Williams', 'sophia.w@student.tcms.edu', '$2b$12$jcWSXUccRG40cZM62sZb6eQVh9z3P0LKwCqnb1ubuE92yceZhkMnm', '+1000000016', 'Business Administration', 'active', true, NOW() - INTERVAL '85 days'),
(17, 'Daniel Brown', 'daniel.b@student.tcms.edu', '$2b$12$vNeGrwO7guaFEWwltIek.OxHsica4yrIfSL9ko8dry0kshwu5nOaq', '+1000000017', 'Engineering', 'active', false, NOW() - INTERVAL '80 days'),
(18, 'Emma Davis', 'emma.d@student.tcms.edu', '$2b$12$y9BBZogNWBL5j9HIW2GkoOfPY.iqoDLro5LXKDT5wkTyBlGpc3rfu', '+1000000018', 'Engineering', 'active', true, NOW() - INTERVAL '75 days'),
(19, 'Michael Wilson', 'michael.w@student.tcms.edu', '$2b$12$nVVO2UsZUlv/dX5JeG34SeqJEqcdIAndZYAZO/D7Ikl3iqAs1aHoq', '+1000000019', 'Computer Science', 'active', true, NOW() - INTERVAL '70 days'),
(20, 'Olivia Martinez', 'olivia.m@student.tcms.edu', '$2b$12$Bk2v0IhJM7BbhYW3mmD2BevdnGo7irukKq1qEo.A5J2c0BRUg1cpe', '+1000000020', 'Business Administration', 'active', true, NOW() - INTERVAL '65 days'),
(21, 'Thomas Johnson', 'thomas.j@parent.tcms.edu', '$2b$12$yxG70ge1Sol9llpgGYv/Gu73z6egU88NW6W.VheS0hBfmZ7tSCTA.', '+1000000021', NULL, 'active', true, NOW() - INTERVAL '100 days'),
(22, 'Carmen Garcia', 'carmen.g@parent.tcms.edu', '$2b$12$KYhwzNYI754mIrTcGwRRH.6GuinEm/qgPt7glkBKEFbWQuk5CrRk.', '+1000000022', NULL, 'active', false, NOW() - INTERVAL '95 days'),
(23, 'Robert Smith', 'robert.s@parent.tcms.edu', '$2b$12$4Kv21P2I.0KVYVC9sPvUeO8P6WGbMJNRPjd8oJMGyMTIg23Z/QZGi', '+1000000023', NULL, 'active', true, NOW() - INTERVAL '90 days'),
(24, 'Patricia Williams', 'patricia.w@parent.tcms.edu', '$2b$12$pzZeL6yJXiyOq24QKWs0gO6Nu22kOavvQzS27xQL89PygW1Ieo/p.', '+1000000024', NULL, 'active', true, NOW() - INTERVAL '85 days'),
(25, 'William Brown', 'william.b@parent.tcms.edu', '$2b$12$OKMpSctqJCrArfFhn9Yfl.2d9AkArK8uuyDNXM9e.gb3wKgbTJ8zK', '+1000000025', NULL, 'active', true, NOW() - INTERVAL '80 days');
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

-- 5. CERTIFICATIONS
INSERT INTO certifications (id, name, code, description, duration_hours, department_id, status) VALUES
(1, 'Web Development Fundamentals', 'WEB-FUND', 'HTML, CSS, JavaScript basics', 60, 1, 'active'),
(2, 'Data Science Essentials', 'DS-ESS', 'Python, pandas, numpy fundamentals', 80, 1, 'active'),
(3, 'Project Management Professional', 'PMP', 'PMP certification preparation', 120, 2, 'active'),
(4, 'AutoCAD Fundamentals', 'CAD-FUND', '2D and 3D CAD design basics', 60, 3, 'active');
SELECT setval('certifications_id_seq', 4);

-- 6. PROGRAMS
INSERT INTO programs (id, name, code, department_id, duration_years, status) VALUES
(1, 'Bachelor of Computer Science', 'BCS', 1, 3, 'active'),
(2, 'Business Administration', 'BBA', 2, 3, 'active'),
(3, 'Mechanical Engineering', 'ME', 3, 4, 'active');
SELECT setval('programs_id_seq', 3);

-- 7. ACADEMIC LEVELS
INSERT INTO academic_levels (id, name, program_id, level_order) VALUES
(1, 'Year 1', 1, 1), (2, 'Year 2', 1, 2), (3, 'Year 3', 1, 3),
(4, 'Year 1', 2, 1), (5, 'Year 2', 2, 2), (6, 'Year 3', 2, 3),
(7, 'Year 1', 3, 1), (8, 'Year 2', 3, 2), (9, 'Year 3', 3, 3), (10, 'Year 4', 3, 4);
SELECT setval('academic_levels_id_seq', 10);

-- 8. SEMESTERS
INSERT INTO semesters (id, name, semester_order) VALUES
(1, 'Semester 1', 1), (2, 'Semester 2', 2);
SELECT setval('semesters_id_seq', 2);

-- 9. ACADEMIC YEARS
INSERT INTO academic_years (id, name, start_date, end_date, is_active) VALUES
(1, '2025-2026', '2025-09-01', '2026-06-30', true),
(2, '2024-2025', '2024-09-01', '2025-06-30', false);
SELECT setval('academic_years_id_seq', 2);

-- 10. SESSIONS
INSERT INTO sessions (id, academic_year_id, academic_level_id, semester_id, program_id) VALUES
(1, 1, 1, 1, 1), (2, 1, 1, 2, 1),
(3, 1, 4, 1, 2), (4, 1, 4, 2, 2),
(5, 1, 7, 1, 3), (6, 1, 7, 2, 3);
SELECT setval('sessions_id_seq', 6);

-- 11. ROOMS
INSERT INTO rooms (id, name, code, building, capacity, room_type, status) VALUES
(1, 'Lecture Hall A', 'LH-A', 'Main Building', 100, 'Lecture Hall', 'available'),
(2, 'Lecture Hall B', 'LH-B', 'Main Building', 80, 'Lecture Hall', 'available'),
(3, 'Computer Lab 1', 'LAB-01', 'Science Block', 30, 'Lab', 'available'),
(4, 'Computer Lab 2', 'LAB-02', 'Science Block', 30, 'Lab', 'available'),
(5, 'Classroom 101', 'CR-101', 'Main Building', 40, 'Classroom', 'available'),
(6, 'Classroom 102', 'CR-102', 'Main Building', 40, 'Classroom', 'available');
SELECT setval('rooms_id_seq', 6);

-- 12. COURSES
INSERT INTO courses (id, name, code, session_id, credits, hours_per_week) VALUES
(1, 'Introduction to Programming', 'CS101', 1, 3, 4),
(2, 'Data Structures', 'CS201', 2, 3, 4),
(3, 'Business Communication', 'BUS101', 3, 2, 2),
(4, 'Marketing Principles', 'BUS102', 4, 3, 3),
(5, 'Engineering Mechanics', 'ME101', 5, 4, 4),
(6, 'Thermodynamics', 'ME102', 6, 4, 4);
SELECT setval('courses_id_seq', 6);

-- 13. TRAINERS
INSERT INTO trainers (id, user_id, specialization) VALUES
(1, 4, 'Computer Science, AI'),
(2, 5, 'Business Management'),
(3, 6, 'Mechanical Engineering'),
(4, 7, 'Web Development'),
(5, 8, 'Data Science'),
(6, 9, 'Finance'),
(7, 10, 'Marketing'),
(8, 11, 'CAD Design'),
(9, 12, 'Thermodynamics');
SELECT setval('trainers_id_seq', 9);

-- 14. TRAINER_COURSES (Assignments)
INSERT INTO trainer_courses (trainer_id, course_id, certification_id) VALUES
(1, 1, NULL), (1, 2, NULL),
(2, 3, NULL), (2, 4, NULL),
(3, 5, NULL), (3, 6, NULL),
(4, NULL, 1), -- Web Dev trainer teaches Web Fundamentals cert
(5, NULL, 2), -- Data Science trainer teaches DS cert
(6, NULL, 3), -- Business trainer teaches PMP cert
(7, NULL, 3), -- Marketing trainer also teaches PMP cert
(8, NULL, 4), -- CAD trainer teaches CAD cert
(9, 6, NULL); -- Thermodynamics expert

-- 15. STUDENTS
INSERT INTO students (id, user_id, matricule, date_of_birth, program_id) VALUES
(1, 13, 'ST-2025-001', '2000-05-15', 1),
(2, 14, 'ST-2025-002', '2001-03-22', 1),
(3, 15, 'ST-2025-003', '1999-11-08', 2),
(4, 16, 'ST-2025-004', '2000-07-30', 2),
(5, 17, 'ST-2025-005', '1998-12-12', 3),
(6, 18, 'ST-2025-006', '2001-01-25', 3),
(7, 19, 'ST-2025-007', '2000-09-18', 1),
(8, 20, 'ST-2025-008', '1999-06-05', 2);
SELECT setval('students_id_seq', 8);

-- 16. PARENTS
INSERT INTO parents (id, user_id, relationship) VALUES
(1, 21, 'Father'),
(2, 22, 'Mother'),
(3, 23, 'Father'),
(4, 24, 'Mother'),
(5, 25, 'Father');
SELECT setval('parents_id_seq', 5);

-- 17. PARENT_STUDENT_LINKS
INSERT INTO parent_student_links (parent_id, student_id) VALUES
(1, 1), (2, 2), (3, 3), (4, 4), (5, 5);

-- 18. ENROLLMENTS (Program enrollments)
INSERT INTO enrollments (id, student_id, academic_year_id, program_id, certification_id, status) VALUES
(1, 1, 1, 1, NULL, 'active'),
(2, 2, 1, 1, NULL, 'active'),
(3, 3, 1, 2, NULL, 'active'),
(4, 4, 1, 2, NULL, 'active'),
(5, 5, 1, 3, NULL, 'active'),
(6, 6, 1, 3, NULL, 'active'),
(7, 7, 1, 1, NULL, 'active'),
(8, 8, 1, 2, NULL, 'active');
SELECT setval('enrollments_id_seq', 8);

-- 19. CERTIFICATION ENROLLMENTS (Some students also enrolled in certifications)
INSERT INTO enrollments (student_id, academic_year_id, program_id, certification_id, status) VALUES
(1, 1, NULL, 1, 'active'), -- Alex in Web Dev cert
(2, 1, NULL, 2, 'active'), -- Maria in Data Science cert
(3, 1, NULL, 3, 'active'); -- James in PMP cert

-- Passwords for testing:
-- admin@tcms.edu -> admin1234 (changed)
-- All other users -> their phone number (e.g., +1000000002)