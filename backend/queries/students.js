// FILE: /backend/queries/students.js
// Queries for students, parents, enrollments, and availability

// ============================================================
// STUDENTS
// ============================================================

function createStudent(userId, matricule, dateOfBirth, programId) {
    const sql = `
        INSERT INTO students (user_id, matricule, date_of_birth, program_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
    return [sql, [userId, matricule, dateOfBirth, programId]];
}

function getAllStudents(programId = null) {
    let sql = `
        SELECT s.*, u.full_name, u.email, u.phone, u.status,
               p.name as program_name, p.code as program_code,
               ay.name as academic_year_name, e.status as enrollment_status
        FROM students s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN programs p ON s.program_id = p.id
        LEFT JOIN enrollments e ON s.id = e.student_id AND e.program_id IS NOT NULL
        LEFT JOIN academic_years ay ON e.academic_year_id = ay.id
    `;
    const params = [];
    
    if (programId) {
        sql += ` WHERE s.program_id = $1`;
        params.push(programId);
    }
    
    sql += ` ORDER BY s.created_at DESC`;
    return [sql, params];
}

function getStudentById(studentId) {
    const sql = `
        SELECT s.*, u.full_name, u.email, u.phone, u.status, u.password_changed,
               p.name as program_name, p.code as program_code, p.id as program_id,
               d.name as department_name, d.id as department_id
        FROM students s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN programs p ON s.program_id = p.id
        LEFT JOIN departments d ON p.department_id = d.id
        WHERE s.id = $1
    `;
    return [sql, [studentId]];
}

function getStudentByUserId(userId) {
    const sql = `
        SELECT s.*, u.full_name, u.email, u.phone, u.status,
               p.name as program_name, p.code as program_code, p.id as program_id,
               d.name as department_name, d.id as department_id
        FROM students s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN programs p ON s.program_id = p.id
        LEFT JOIN departments d ON p.department_id = d.id
        WHERE u.id = $1
    `;
    return [sql, [userId]];
}

function searchStudents(searchTerm) {
    const sql = `
        SELECT s.*, u.full_name, u.email, u.phone,
               p.name as program_name
        FROM students s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN programs p ON s.program_id = p.id
        WHERE u.full_name ILIKE $1 OR s.matricule ILIKE $1 OR u.email ILIKE $1
        ORDER BY u.full_name
    `;
    return [sql, [`%${searchTerm}%`]];
}

function countStudents() {
    const sql = `SELECT COUNT(*) as total FROM students`;
    return [sql, []];
}

function updateStudent(studentId, data) {
    const fields = [];
    const values = [studentId];
    let paramCount = 2;
    
    Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
            fields.push(`${key} = $${paramCount}`);
            values.push(data[key]);
            paramCount++;
        }
    });
    
    if (fields.length === 0) return getStudentById(studentId);
    
    const sql = `
        UPDATE students SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
    `;
    return [sql, values];
}

function deleteStudent(studentId) {
    const sql = `DELETE FROM students WHERE id = $1 RETURNING *`;
    return [sql, [studentId]];
}

// ============================================================
// PARENTS
// ============================================================

function createParent(userId, relationship = 'Father') {
    const sql = `
        INSERT INTO parents (user_id, relationship)
        VALUES ($1, $2)
        RETURNING *
    `;
    return [sql, [userId, relationship]];
}

function getAllParents() {
    const sql = `
        SELECT p.*, u.full_name, u.email, u.phone, u.status,
               COUNT(psl.student_id) as children_count
        FROM parents p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN parent_student_links psl ON p.id = psl.parent_id
        GROUP BY p.id, u.id
        ORDER BY u.full_name
    `;
    return [sql, []];
}

function getParentById(parentId) {
    const sql = `
        SELECT p.*, u.full_name, u.email, u.phone, u.status
        FROM parents p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = $1
    `;
    return [sql, [parentId]];
}

function getParentByUserId(userId) {
    const sql = `
        SELECT p.*, u.full_name, u.email, u.phone, u.status
        FROM parents p
        JOIN users u ON p.user_id = u.id
        WHERE u.id = $1
    `;
    return [sql, [userId]];
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

function getParentChildren(parentId) {
    const sql = `
        SELECT s.*, u.full_name, u.email, u.phone,
               p.name as program_name, p.code as program_code
        FROM parent_student_links psl
        JOIN students s ON psl.student_id = s.id
        JOIN users u ON s.user_id = u.id
        LEFT JOIN programs p ON s.program_id = p.id
        WHERE psl.parent_id = $1
    `;
    return [sql, [parentId]];
}

// ============================================================
// ENROLLMENTS
// ============================================================

function enrollStudent(studentId, academicYearId, programId = null, certId = null) {
    const sql = `
        INSERT INTO enrollments (student_id, academic_year_id, program_id, certification_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
    return [sql, [studentId, academicYearId, programId, certId]];
}

function getStudentEnrollments(studentId) {
    const sql = `
        SELECT e.*, p.name as program_name, cert.name as certification_name,
               ay.name as year_name
        FROM enrollments e
        LEFT JOIN programs p ON e.program_id = p.id
        LEFT JOIN certifications cert ON e.certification_id = cert.id
        LEFT JOIN academic_years ay ON e.academic_year_id = ay.id
        WHERE e.student_id = $1
        ORDER BY e.enrolled_at DESC
    `;
    return [sql, [studentId]];
}

function getActiveAcademicYearForProgram(programId) {
    const sql = `
        SELECT ay.* FROM academic_years ay
        JOIN sessions s ON s.academic_year_id = ay.id
        WHERE s.program_id = $1 AND ay.is_active = true
        LIMIT 1
    `;
    return [sql, [programId]];
}

function getActiveAcademicYearForCertification(certId) {
    const sql = `
        SELECT ay.* FROM academic_years ay
        WHERE ay.is_active = true
        LIMIT 1
    `;
    return [sql, [certId]];
}

function getCertificationEnrollments(certId) {
    const sql = `
        SELECT e.*, s.matricule, u.full_name, u.email, u.phone
        FROM enrollments e
        JOIN students s ON e.student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE e.certification_id = $1 AND e.status = 'active'
        ORDER BY u.full_name
    `;
    return [sql, [certId]];
}

// ============================================================
// STUDENT AVAILABILITY (for certification scheduling)
// ============================================================

function submitStudentAvailability(studentId, weekId, dayOfWeek, timeStart, timeEnd) {
    const sql = `
        INSERT INTO student_availability (student_id, academic_week_id, day_of_week, time_start, time_end)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (student_id, academic_week_id, day_of_week, time_start, time_end)
        DO NOTHING
        RETURNING *
    `;
    return [sql, [studentId, weekId, dayOfWeek, timeStart, timeEnd]];
}

function getStudentAvailability(studentId, weekId) {
    let sql = `
        SELECT sa.*, aw.label as week_label, aw.start_date, aw.end_date
        FROM student_availability sa
        JOIN academic_weeks aw ON sa.academic_week_id = aw.id
        WHERE sa.student_id = $1
    `;
    const params = [studentId];
    
    if (weekId) {
        sql += ` AND sa.academic_week_id = $2`;
        params.push(weekId);
    }
    
    sql += ` ORDER BY aw.start_date DESC, sa.day_of_week, sa.time_start`;
    return [sql, params];
}

function deleteStudentAvailability(availabilityId, studentId) {
    const sql = `
        DELETE FROM student_availability 
        WHERE id = $1 AND student_id = $2
        RETURNING *
    `;
    return [sql, [availabilityId, studentId]];
}

function getAvailableWeeksForStudent(studentId) {
    // Get published certification weeks for certifications the student is enrolled in
    const sql = `
        SELECT DISTINCT aw.*, c.name as certification_name, c.id as certification_id
        FROM academic_weeks aw
        JOIN enrollments e ON e.certification_id = aw.certification_id
        JOIN certifications c ON aw.certification_id = c.id
        WHERE e.student_id = $1 
        AND e.status = 'active'
        AND aw.week_type = 'certification'
        AND aw.status = 'published'
        ORDER BY aw.start_date DESC
    `;
    return [sql, [studentId]];
}

// ============================================================
// GRADES
// ============================================================

function getStudentGrades(studentId) {
    const sql = `
        SELECT g.*, c.name as course_name, c.code as course_code,
               cert.name as cert_name, cert.code as cert_code,
               u.full_name as trainer_name, ay.name as year_name
        FROM grades g
        LEFT JOIN courses c ON g.course_id = c.id
        LEFT JOIN certifications cert ON g.certification_id = cert.id
        LEFT JOIN trainers t ON g.trainer_id = t.id
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN academic_years ay ON g.academic_year_id = ay.id
        WHERE g.student_id = $1
        ORDER BY g.submitted_at DESC
    `;
    return [sql, [studentId]];
}

module.exports = {
    // Students
    createStudent,
    getAllStudents,
    getStudentById,
    getStudentByUserId,
    searchStudents,
    countStudents,
    updateStudent,
    deleteStudent,
    
    // Parents
    createParent,
    getAllParents,
    getParentById,
    getParentByUserId,
    linkParentToStudent,
    getParentChildren,
    
    // Enrollments
    enrollStudent,
    getStudentEnrollments,
    getActiveAcademicYearForProgram,
    getActiveAcademicYearForCertification,
    getCertificationEnrollments,
    
    // Student Availability
    submitStudentAvailability,
    getStudentAvailability,
    deleteStudentAvailability,
    getAvailableWeeksForStudent,
    
    // Grades
    getStudentGrades,
};