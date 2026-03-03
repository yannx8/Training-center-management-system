// FILE: /backend/queries/students.js

function createStudent(userId, matricule, dateOfBirth, programId) {
    const sql = `
    INSERT INTO students (user_id, matricule, date_of_birth, program_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
    return [sql, [userId, matricule, dateOfBirth, programId]];
}

function createParent(userId, relationship) {
    const sql = `
    INSERT INTO parents (user_id, relationship)
    VALUES ($1, $2)
    RETURNING *
  `;
    return [sql, [userId, relationship]];
}

function linkParentToStudent(parentId, studentId) {
    const sql = `
    INSERT INTO parent_student_links (parent_id, student_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
    RETURNING *
  `;
    return [sql, [parentId, studentId]];
}

// enrollStudent: program_id and certification_id are mutually exclusive.
// academicYearId is determined before calling this (active year lookup).
function enrollStudent(studentId, academicYearId, programId, certificationId) {
    const sql = `
    INSERT INTO enrollments (student_id, academic_year_id, program_id, certification_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
    return [sql, [studentId, academicYearId, programId || null, certificationId || null]];
}

function findStudentByUserId(userId) {
    const sql = `
    SELECT s.*, u.full_name, u.email, u.phone,
           p.name AS program_name, p.code AS program_code
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN programs p ON s.program_id = p.id
    WHERE s.user_id = $1 LIMIT 1
  `;
    return [sql, [userId]];
}

function findStudentById(id) {
    const sql = `
    SELECT s.*, u.full_name, u.email, u.phone,
           p.name AS program_name, p.code AS program_code
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN programs p ON s.program_id = p.id
    WHERE s.id = $1 LIMIT 1
  `;
    return [sql, [id]];
}

// Search by name, matricule, or program — used by secretary search bar
function searchStudents(query) {
    const sql = `
    SELECT s.id, s.matricule, u.full_name, u.email, u.phone,
           p.name AS program_name, s.created_at
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN programs p ON s.program_id = p.id
    WHERE u.full_name ILIKE $1 OR s.matricule ILIKE $1 OR p.name ILIKE $1
    ORDER BY s.created_at DESC
  `;
    return [sql, [`%${query}%`]];
}

function getAllStudents(programId) {
    // programId is optional — if null, return all students
    const sql = programId ?
        `SELECT s.id, s.matricule, u.full_name, u.email, u.phone,
              p.name AS program_name, s.created_at
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN programs p ON s.program_id = p.id
       WHERE s.program_id = $1
       ORDER BY s.created_at DESC` :
        `SELECT s.id, s.matricule, u.full_name, u.email, u.phone,
              p.name AS program_name, s.created_at
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN programs p ON s.program_id = p.id
       ORDER BY s.created_at DESC`;
    return programId ? [sql, [programId]] : [sql, []];
}

function getAllParents() {
    const sql = `
    SELECT p.id, u.full_name, u.email, u.phone, p.relationship,
           COUNT(psl.student_id) AS student_count
    FROM parents p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN parent_student_links psl ON p.id = psl.parent_id
    GROUP BY p.id, u.full_name, u.email, u.phone, p.relationship
    ORDER BY u.full_name
  `;
    return [sql, []];
}

function getStudentEnrollments(studentId) {
    const sql = `
    SELECT e.*, ay.name AS year_name, ay.start_date, ay.end_date,
           p.name AS program_name, c.name AS certification_name
    FROM enrollments e
    JOIN academic_years ay ON e.academic_year_id = ay.id
    LEFT JOIN programs p ON e.program_id = p.id
    LEFT JOIN certifications c ON e.certification_id = c.id
    WHERE e.student_id = $1
  `;
    return [sql, [studentId]];
}

// Find the active academic year for a given program
function getActiveAcademicYearForProgram(programId) {
    const sql = `
    SELECT * FROM academic_years
    WHERE program_id=$1 AND is_active=true
    LIMIT 1
  `;
    return [sql, [programId]];
}

// Find the active academic year for a given certification
function getActiveAcademicYearForCertification(certificationId) {
    const sql = `
    SELECT * FROM academic_years
    WHERE certification_id=$1 AND is_active=true
    LIMIT 1
  `;
    return [sql, [certificationId]];
}

// Count existing students to generate the next matricule sequence
function countStudents() {
    const sql = `SELECT COUNT(*) AS total FROM students`;
    return [sql, []];
}

module.exports = {
    createStudent,
    createParent,
    linkParentToStudent,
    enrollStudent,
    findStudentByUserId,
    findStudentById,
    searchStudents,
    getAllStudents,
    getAllParents,
    getStudentEnrollments,
    getActiveAcademicYearForProgram,
    getActiveAcademicYearForCertification,
    countStudents,
};