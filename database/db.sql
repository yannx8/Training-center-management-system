-- ============================================================
-- TCMS - Training Center Management System
-- Complete Database Schema + Seed Data
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL  -- 'admin','secretary','hod','trainer','student','parent'
);

INSERT INTO roles (name) VALUES
  ('admin'), ('secretary'), ('hod'), ('trainer'), ('student'), ('parent')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
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
-- USER_ROLES  (many-to-many: one user can have multiple roles)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE(user_id, role_id)
);

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
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
-- PROGRAMS  (academic programs, e.g. Bachelor of CS)
-- ============================================================
CREATE TABLE IF NOT EXISTS programs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  department_id INT REFERENCES departments(id) ON DELETE SET NULL,
  duration_years INT DEFAULT 3,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACADEMIC LEVELS  (Year 1, Year 2, etc. within a program)
-- ============================================================
CREATE TABLE IF NOT EXISTS academic_levels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,     -- e.g. "Year 1", "Level 2"
  program_id INT REFERENCES programs(id) ON DELETE CASCADE,
  level_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEMESTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS semesters (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,    -- e.g. "Semester 1"
  semester_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CERTIFICATIONS  (must be created before academic_years)
-- ============================================================
CREATE TABLE IF NOT EXISTS certifications (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(30) UNIQUE NOT NULL,
  description TEXT,
  duration_hours INT DEFAULT 40,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACADEMIC YEARS
-- ============================================================
CREATE TABLE IF NOT EXISTS academic_years (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,      -- e.g. "2025-2026"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  program_id INT REFERENCES programs(id) ON DELETE CASCADE,
  certification_id INT REFERENCES certifications(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_year_subject CHECK (
    (program_id IS NOT NULL AND certification_id IS NULL) OR
    (program_id IS NULL AND certification_id IS NOT NULL) OR
    (program_id IS NULL AND certification_id IS NULL)
  )
);

-- ============================================================
-- ACADEMIC WEEKS (for weekly scheduling)
-- ============================================================
CREATE TABLE IF NOT EXISTS academic_weeks (
  id SERIAL PRIMARY KEY,
  academic_year_id INT REFERENCES academic_years(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  label VARCHAR(100) NOT NULL,    -- e.g. "Week 1", "Orientation Week"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by INT REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SESSIONS  (a teaching session within a program/level/semester/year)
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
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
CREATE TABLE IF NOT EXISTS rooms (
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
-- COURSES  (belong to a session → academic year → program → department)
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(30) UNIQUE NOT NULL,
  session_id INT REFERENCES sessions(id) ON DELETE SET NULL,
  credits INT DEFAULT 3,
  hours_per_week INT DEFAULT 2,
  school_period_id INT REFERENCES academic_weeks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRAINERS  (extends users with trainer-specific data)
-- ============================================================
CREATE TABLE IF NOT EXISTS trainers (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialization VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRAINER_COURSES  (which trainer teaches which course or certification)
-- Exactly one of course_id / certification_id is set per row
-- ============================================================
CREATE TABLE IF NOT EXISTS trainer_courses (
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
CREATE TABLE IF NOT EXISTS students (
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
CREATE TABLE IF NOT EXISTS parents (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  relationship VARCHAR(50) DEFAULT 'Father'
    CHECK (relationship IN ('Father','Mother','Guardian')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PARENT_STUDENT_LINKS  (a parent can have multiple students)
-- ============================================================
CREATE TABLE IF NOT EXISTS parent_student_links (
  id SERIAL PRIMARY KEY,
  parent_id INT REFERENCES parents(id) ON DELETE CASCADE,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE(parent_id, student_id)
);

-- ============================================================
-- ENROLLMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS enrollments (
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
CREATE TABLE IF NOT EXISTS grades (
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
-- AVAILABILITY  (trainer weekly availability slots)
-- ============================================================
CREATE TABLE IF NOT EXISTS availability (
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
-- AVAILABILITY LOCKS (HOD can lock availability submission)
-- ============================================================
CREATE TABLE IF NOT EXISTS availability_locks (
  id SERIAL PRIMARY KEY,
  hod_user_id INT REFERENCES users(id) ON DELETE CASCADE,
  academic_week_id INT REFERENCES academic_weeks(id) ON DELETE CASCADE,
  is_locked BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hod_user_id, academic_week_id)
);

-- ============================================================
-- TIMETABLES  (a generated weekly schedule)
-- ============================================================
CREATE TABLE IF NOT EXISTS timetables (
  id SERIAL PRIMARY KEY,
  academic_week_id INT REFERENCES academic_weeks(id),
  generated_by INT REFERENCES users(id),  -- HOD user
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  label VARCHAR(255),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','published'))
);

-- ============================================================
-- TIMETABLE_SLOTS
-- ============================================================
CREATE TABLE IF NOT EXISTS timetable_slots (
  id SERIAL PRIMARY KEY,
  timetable_id INT REFERENCES timetables(id) ON DELETE CASCADE,
  academic_week_id INT REFERENCES academic_weeks(id),
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
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  timetable_slot_id INT REFERENCES timetable_slots(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present','absent','late')),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMPLAINTS  (parent → admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS complaints (
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
-- MARK_COMPLAINTS  (student → trainer, about a grade)
-- ============================================================
CREATE TABLE IF NOT EXISTS mark_complaints (
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
  UNIQUE(student_id, course_id)
);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  target_role VARCHAR(50),  -- null = all roles
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_timetable ON timetable_slots(timetable_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_trainer ON timetable_slots(trainer_id);
CREATE INDEX IF NOT EXISTS idx_availability_trainer ON availability(trainer_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_mark_complaints_trainer ON mark_complaints(trainer_id);
CREATE INDEX IF NOT EXISTS idx_academic_weeks_year ON academic_weeks(academic_year_id);

-- ============================================================
-- SEED DATA
-- Admin user: password = bcrypt hash of "admin1234" (12 rounds)
-- ============================================================
INSERT INTO users (full_name, email, password_hash, phone, status, password_changed)
VALUES (
  'Admin User',
  'admin@center.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMZJaaaSwm.b34i4uf.lmFcOOO',
  '+1000000000',
  'active',
  true
) ON CONFLICT (email) DO NOTHING;

-- Assign admin role to the seeded admin user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'admin@center.com' AND r.name = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Insert default semesters
INSERT INTO semesters (name, semester_order) VALUES
  ('Semester 1', 1),
  ('Semester 2', 2)
ON CONFLICT DO NOTHING;

-- Insert sample rooms
INSERT INTO rooms (name, code, building, capacity, room_type, status) VALUES
  ('Room 101', 'R101', 'Main Building', 30, 'Classroom', 'available'),
  ('Room 102', 'R102', 'Main Building', 30, 'Classroom', 'available'),
  ('Computer Lab 1', 'LAB01', 'Tech Building', 25, 'Lab', 'available'),
  ('Lecture Hall A', 'LHA', 'Main Building', 100, 'Lecture Hall', 'available')
ON CONFLICT (code) DO NOTHING;