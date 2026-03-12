// FILE: /backend/queries/trainers.js
// Queries for trainers, courses, grades, availability, and complaints

// ============================================================
// TRAINER PROFILE
// ============================================================

function getTrainerByUserId(userId) {
    const sql = `
        SELECT t.*, u.full_name, u.email, u.phone, u.department
        FROM trainers t
        JOIN users u ON t.user_id = u.id
        WHERE u.id = $1
    `;
    return [sql, [userId]];
}

function getTrainerById(trainerId) {
    const sql = `
        SELECT t.*, u.full_name, u.email, u.phone, u.department
        FROM trainers t
        JOIN users u ON t.user_id = u.id
        WHERE t.id = $1
    `;
    return [sql, [trainerId]];
}

// ============================================================
// COURSES & CERTIFICATIONS
// ============================================================

function getMyCourses(trainerId) {
    const sql = `
        SELECT c.*, s.name as session_name, ay.name as year_name,
               p.name as program_name, p.id as program_id,
               al.name as level_name, sem.name as semester_name
        FROM trainer_courses tc
        JOIN courses c ON tc.course_id = c.id
        LEFT JOIN sessions s ON c.session_id = s.id
        LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
        LEFT JOIN programs p ON s.program_id = p.id
        LEFT JOIN academic_levels al ON s.academic_level_id = al.id
        LEFT JOIN semesters sem ON s.semester_id = sem.id
        WHERE tc.trainer_id = $1 AND tc.course_id IS NOT NULL
        ORDER BY c.name
    `;
    return [sql, [trainerId]];
}

function getMyCertifications(trainerId) {
    const sql = `
        SELECT cert.*, d.name as department_name
        FROM trainer_courses tc
        JOIN certifications cert ON tc.certification_id = cert.id
        LEFT JOIN departments d ON cert.department_id = d.id
        WHERE tc.trainer_id = $1 AND tc.certification_id IS NOT NULL
        ORDER BY cert.name
    `;
    return [sql, [trainerId]];
}

function getCourseStudents(courseId) {
    const sql = `
        SELECT s.id, s.matricule, u.full_name, u.email, u.phone,
               g.grade, g.grade_letter, g.submitted_at
        FROM enrollments e
        JOIN students s ON e.student_id = s.id
        JOIN users u ON s.user_id = u.id
        JOIN sessions sess ON e.program_id = sess.program_id
        JOIN courses c ON c.session_id = sess.id
        LEFT JOIN grades g ON g.student_id = s.id AND g.course_id = c.id
        WHERE c.id = $1 AND e.status = 'active'
        ORDER BY u.full_name
    `;
    return [sql, [courseId]];
}

function getCertificationStudents(certId) {
    const sql = `
        SELECT s.id, s.matricule, u.full_name, u.email, u.phone,
               g.grade, g.grade_letter, g.submitted_at
        FROM enrollments e
        JOIN students s ON e.student_id = s.id
        JOIN users u ON s.user_id = u.id
        LEFT JOIN grades g ON g.student_id = s.id AND g.certification_id = $1
        WHERE e.certification_id = $1 AND e.status = 'active'
        ORDER BY u.full_name
    `;
    return [sql, [certId]];
}

// ============================================================
// GRADES
// ============================================================

function submitGradeForCourse(studentId, courseId, trainerId, grade, gradeLetter, academicYearId) {
    const sql = `
        INSERT INTO grades (student_id, course_id, trainer_id, grade, grade_letter, academic_year_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (student_id, course_id) 
        DO UPDATE SET grade = $4, grade_letter = $5, trainer_id = $3, submitted_at = CURRENT_TIMESTAMP
        RETURNING *
    `;
    return [sql, [studentId, courseId, trainerId, grade, gradeLetter, academicYearId]];
}

function submitGradeForCertification(studentId, certId, trainerId, grade, gradeLetter, academicYearId) {
    const sql = `
        INSERT INTO grades (student_id, certification_id, trainer_id, grade, grade_letter, academic_year_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (student_id, certification_id) 
        DO UPDATE SET grade = $4, grade_letter = $5, trainer_id = $3, submitted_at = CURRENT_TIMESTAMP
        RETURNING *
    `;
    return [sql, [studentId, certId, trainerId, grade, gradeLetter, academicYearId]];
}

// ============================================================
// MARK COMPLAINTS
// ============================================================

function getMarkComplaints(trainerId) {
    const sql = `
        SELECT mc.*, s.matricule, u.full_name as student_name,
               c.name as course_name, cert.name as certification_name
        FROM mark_complaints mc
        JOIN students s ON mc.student_id = s.id
        JOIN users u ON s.user_id = u.id
        LEFT JOIN courses c ON mc.course_id = c.id
        LEFT JOIN certifications cert ON mc.certification_id = cert.id
        WHERE mc.trainer_id = $1
        ORDER BY mc.created_at DESC
    `;
    return [sql, [trainerId]];
}

function reviewMarkComplaint(complaintId, response) {
    const sql = `
        UPDATE mark_complaints 
        SET status = 'reviewed', trainer_response = $2
        WHERE id = $1
        RETURNING *
    `;
    return [sql, [complaintId, response]];
}

// ============================================================
// AVAILABILITY
// ============================================================

function submitAvailability(trainerId, weekId, dayOfWeek, timeStart, timeEnd) {
    const sql = `
        INSERT INTO availability (trainer_id, academic_week_id, day_of_week, time_start, time_end)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (trainer_id, academic_week_id, day_of_week, time_start, time_end)
        DO NOTHING
        RETURNING *
    `;
    return [sql, [trainerId, weekId, dayOfWeek, timeStart, timeEnd]];
}

function getMyAvailability(trainerId, weekId) {
    let sql = `
        SELECT a.*, aw.label as week_label, aw.start_date, aw.end_date
        FROM availability a
        JOIN academic_weeks aw ON a.academic_week_id = aw.id
        WHERE a.trainer_id = $1
    `;
    const params = [trainerId];
    
    if (weekId) {
        sql += ` AND a.academic_week_id = $2`;
        params.push(weekId);
    }
    
    sql += ` ORDER BY aw.start_date DESC, a.day_of_week, a.time_start`;
    return [sql, params];
}

function deleteAvailability(availabilityId, trainerId) {
    const sql = `
        DELETE FROM availability 
        WHERE id = $1 AND trainer_id = $2
        RETURNING *
    `;
    return [sql, [availabilityId, trainerId]];
}

function getAvailabilityLock(hodUserId, weekId) {
    const sql = `
        SELECT * FROM availability_locks
        WHERE hod_user_id = $1 AND academic_week_id = $2
    `;
    return [sql, [hodUserId, weekId]];
}

function upsertAvailabilityLock(hodUserId, weekId, isLocked) {
    const sql = `
        INSERT INTO availability_locks (hod_user_id, academic_week_id, is_locked, updated_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (hod_user_id, academic_week_id)
        DO UPDATE SET is_locked = $3, updated_at = CURRENT_TIMESTAMP
        RETURNING *
    `;
    return [sql, [hodUserId, weekId, isLocked]];
}

// ============================================================
// TRAINER ASSIGNMENTS (Admin use)
// ============================================================

function assignCourseToTrainer(trainerId, courseId) {
    const sql = `
        INSERT INTO trainer_courses (trainer_id, course_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        RETURNING *
    `;
    return [sql, [trainerId, courseId]];
}

function assignCertificationToTrainer(trainerId, certId) {
    const sql = `
        INSERT INTO trainer_courses (trainer_id, certification_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        RETURNING *
    `;
    return [sql, [trainerId, certId]];
}

function removeCourseFromTrainer(trainerId, courseId) {
    const sql = `
        DELETE FROM trainer_courses 
        WHERE trainer_id = $1 AND course_id = $2
        RETURNING *
    `;
    return [sql, [trainerId, courseId]];
}

function removeCertificationFromTrainer(trainerId, certId) {
    const sql = `
        DELETE FROM trainer_courses 
        WHERE trainer_id = $1 AND certification_id = $2
        RETURNING *
    `;
    return [sql, [trainerId, certId]];
}

function getTrainerAssignments(trainerId) {
    const sql = `
        SELECT tc.*, 
               c.name as course_name, c.code as course_code,
               cert.name as cert_name, cert.code as cert_code
        FROM trainer_courses tc
        LEFT JOIN courses c ON tc.course_id = c.id
        LEFT JOIN certifications cert ON tc.certification_id = cert.id
        WHERE tc.trainer_id = $1
    `;
    return [sql, [trainerId]];
}

// ============================================================
// ALL TRAINERS (for Admin)
// ============================================================

function getAllTrainers() {
    const sql = `
        SELECT t.*, u.full_name, u.email, u.phone, u.status as user_status,
               COUNT(DISTINCT tc.course_id) as course_count,
               COUNT(DISTINCT tc.certification_id) as cert_count
        FROM trainers t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN trainer_courses tc ON t.id = tc.trainer_id
        GROUP BY t.id, u.id
        ORDER BY u.full_name
    `;
    return [sql, []];
}

module.exports = {
    // Profile
    getTrainerByUserId,
    getTrainerById,
    
    // Courses & Certs
    getMyCourses,
    getMyCertifications,
    getCourseStudents,
    getCertificationStudents,
    
    // Grades
    submitGradeForCourse,
    submitGradeForCertification,
    
    // Complaints
    getMarkComplaints,
    reviewMarkComplaint,
    
    // Availability
    submitAvailability,
    getMyAvailability,
    deleteAvailability,
    getAvailabilityLock,
    upsertAvailabilityLock,
    
    // Assignments
    assignCourseToTrainer,
    assignCertificationToTrainer,
    removeCourseFromTrainer,
    removeCertificationFromTrainer,
    getTrainerAssignments,
    getAllTrainers,
};