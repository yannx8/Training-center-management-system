// FILE: /backend/queries/timetables.js
// Queries for timetables, academic weeks, availability, and announcements

// ============================================================
// ACADEMIC WEEKS
// ============================================================

function createAcademicWeek(academicYearId, weekNumber, label, startDate, endDate, createdBy, departmentId) {
    const sql = `
        INSERT INTO academic_weeks 
        (academic_year_id, week_number, label, start_date, end_date, created_by, department_id, week_type, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'academic', 'draft')
        RETURNING *
    `;
    return [sql, [academicYearId, weekNumber, label, startDate, endDate, createdBy, departmentId]];
}

function getAcademicWeeksByDepartment(departmentId) {
    const sql = `
        SELECT aw.*, ay.name as year_name, u.full_name as created_by_name
        FROM academic_weeks aw
        LEFT JOIN academic_years ay ON aw.academic_year_id = ay.id
        LEFT JOIN users u ON aw.created_by = u.id
        WHERE aw.department_id = $1 AND aw.week_type = 'academic'
        ORDER BY aw.start_date DESC
    `;
    return [sql, [departmentId]];
}

function getPublishedWeeksByDepartment(departmentId) {
    const sql = `
        SELECT aw.*, ay.name as year_name
        FROM academic_weeks aw
        LEFT JOIN academic_years ay ON aw.academic_year_id = ay.id
        WHERE aw.department_id = $1 
        AND aw.week_type = 'academic'
        AND aw.status = 'published'
        ORDER BY aw.start_date DESC
    `;
    return [sql, [departmentId]];
}

function getLatestAcademicWeek(departmentId) {
    const sql = `
        SELECT aw.*, ay.name as year_name
        FROM academic_weeks aw
        LEFT JOIN academic_years ay ON aw.academic_year_id = ay.id
        WHERE aw.department_id = $1 AND aw.week_type = 'academic'
        ORDER BY aw.created_at DESC
        LIMIT 1
    `;
    return [sql, [departmentId]];
}

function getLatestPublishedWeek(departmentId) {
    const sql = `
        SELECT aw.*, ay.name as year_name
        FROM academic_weeks aw
        LEFT JOIN academic_years ay ON aw.academic_year_id = ay.id
        WHERE aw.department_id = $1 
        AND aw.week_type = 'academic'
        AND aw.status = 'published'
        ORDER BY aw.start_date DESC
        LIMIT 1
    `;
    return [sql, [departmentId]];
}

function getActiveAcademicWeek(departmentId) {
    return getLatestPublishedWeek(departmentId);
}

function publishAcademicWeek(weekId) {
    const sql = `
        UPDATE academic_weeks 
        SET status = 'published', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND week_type = 'academic'
        RETURNING *
    `;
    return [sql, [weekId]];
}

// ============================================================
// CERTIFICATION WEEKS
// ============================================================

function createCertWeek(certificationId, weekNumber, label, startDate, endDate, createdBy) {
    const sql = `
        INSERT INTO academic_weeks 
        (certification_id, week_number, label, start_date, end_date, created_by, week_type, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'certification', 'draft')
        RETURNING *
    `;
    return [sql, [certificationId, weekNumber, label, startDate, endDate, createdBy]];
}

function getCertWeeksByCert(certificationId) {
    const sql = `
        SELECT aw.*, u.full_name as created_by_name
        FROM academic_weeks aw
        LEFT JOIN users u ON aw.created_by = u.id
        WHERE aw.certification_id = $1 AND aw.week_type = 'certification'
        ORDER BY aw.start_date DESC
    `;
    return [sql, [certificationId]];
}

function getLatestPublishedCertWeek(certificationId) {
    const sql = `
        SELECT * FROM academic_weeks
        WHERE certification_id = $1 
        AND week_type = 'certification'
        AND status = 'published'
        ORDER BY start_date DESC
        LIMIT 1
    `;
    return [sql, [certificationId]];
}

function publishCertWeek(weekId) {
    const sql = `
        UPDATE academic_weeks 
        SET status = 'published', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND week_type = 'certification'
        RETURNING *
    `;
    return [sql, [weekId]];
}

// ============================================================
// AVAILABILITY
// ============================================================

function getAvailabilityForWeek(weekId) {
    const sql = `
        SELECT a.*, u.full_name as trainer_name
        FROM availability a
        JOIN trainers t ON a.trainer_id = t.id
        JOIN users u ON t.user_id = u.id
        WHERE a.academic_week_id = $1
        ORDER BY a.day_of_week, a.time_start
    `;
    return [sql, [weekId]];
}

function getStudentAvailabilityForWeek(weekId) {
    const sql = `
        SELECT sa.*, u.full_name as student_name, s.matricule
        FROM student_availability sa
        JOIN students s ON sa.student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE sa.academic_week_id = $1
        ORDER BY sa.day_of_week, sa.time_start
    `;
    return [sql, [weekId]];
}

function deleteExistingSlots(weekId, type = 'all') {
    if (type === 'academic') {
        const sql = `DELETE FROM timetable_slots WHERE academic_week_id = $1 AND course_id IS NOT NULL`;
        return [sql, [weekId]];
    } else if (type === 'certification') {
        const sql = `DELETE FROM timetable_slots WHERE academic_week_id = $1 AND certification_id IS NOT NULL`;
        return [sql, [weekId]];
    }
    const sql = `DELETE FROM timetable_slots WHERE academic_week_id = $1`;
    return [sql, [weekId]];
}

function checkTrainerConflict(trainerId, dayOfWeek, timeStart, timeEnd, weekId) {
    const sql = `
        SELECT * FROM timetable_slots
        WHERE trainer_id = $1 
        AND day_of_week = $2
        AND academic_week_id = $5
        AND (
            (time_start <= $3::time AND time_end > $3::time) OR
            (time_start < $4::time AND time_end >= $4::time) OR
            (time_start >= $3::time AND time_end <= $4::time)
        )
        LIMIT 1
    `;
    return [sql, [trainerId, dayOfWeek, timeStart, timeEnd, weekId]];
}

function checkRoomConflict(roomId, dayOfWeek, timeStart, timeEnd, weekId) {
    const sql = `
        SELECT * FROM timetable_slots
        WHERE room_id = $1 
        AND day_of_week = $2
        AND academic_week_id = $5
        AND (
            (time_start <= $3::time AND time_end > $3::time) OR
            (time_start < $4::time AND time_end >= $4::time) OR
            (time_start >= $3::time AND time_end <= $4::time)
        )
        LIMIT 1
    `;
    return [sql, [roomId, dayOfWeek, timeStart, timeEnd, weekId]];
}

function checkStudentConflict(studentId, dayOfWeek, timeStart, timeEnd, weekId) {
    const sql = `
        SELECT ts.* FROM timetable_slots ts
        JOIN enrollments e ON (
            (ts.program_id IS NOT NULL AND e.program_id = ts.program_id) OR
            (ts.certification_id IS NOT NULL AND e.certification_id = ts.certification_id)
        )
        WHERE e.student_id = $1
        AND ts.day_of_week = $2
        AND ts.academic_week_id = $5
        AND (
            (ts.time_start <= $3::time AND ts.time_end > $3::time) OR
            (ts.time_start < $4::time AND ts.time_end >= $4::time) OR
            (ts.time_start >= $3::time AND ts.time_end <= $4::time)
        )
        LIMIT 1
    `;
    return [sql, [studentId, dayOfWeek, timeStart, timeEnd, weekId]];
}

// ============================================================
// TIMETABLES
// ============================================================

function createTimetable(weekId, generatedBy, label, type = 'academic') {
    const sql = `
        INSERT INTO timetables (academic_week_id, generated_by, label, timetable_type, status)
        VALUES ($1, $2, $3, $4, 'draft')
        RETURNING *
    `;
    return [sql, [weekId, generatedBy, label, type]];
}

function createTimetableSlot(timetableId, dayOfWeek, timeStart, timeEnd, roomId, trainerId, courseId, weekId, programId = null) {
    const sql = `
        INSERT INTO timetable_slots 
        (timetable_id, day_of_week, time_start, time_end, room_id, trainer_id, course_id, academic_week_id, program_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
    `;
    return [sql, [timetableId, dayOfWeek, timeStart, timeEnd, roomId, trainerId, courseId, weekId, programId]];
}

function createCertTimetableSlot(certificationId, trainerId, weekId, dayOfWeek, timeStart, timeEnd, roomId) {
    const sql = `
        INSERT INTO timetable_slots 
        (certification_id, trainer_id, academic_week_id, day_of_week, time_start, time_end, room_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `;
    return [sql, [certificationId, trainerId, weekId, dayOfWeek, timeStart, timeEnd, roomId]];
}

function getAllTimetables() {
    const sql = `
        SELECT t.*, aw.label as week_label, aw.start_date, aw.end_date, u.full_name as generated_by_name
        FROM timetables t
        JOIN academic_weeks aw ON t.academic_week_id = aw.id
        LEFT JOIN users u ON t.generated_by = u.id
        ORDER BY t.generated_at DESC
    `;
    return [sql, []];
}

function getTimetablesByDepartment(departmentId) {
    const sql = `
        SELECT t.*, aw.label as week_label, aw.start_date, aw.end_date, aw.week_number,
               u.full_name as generated_by_name
        FROM timetables t
        JOIN academic_weeks aw ON t.academic_week_id = aw.id
        LEFT JOIN users u ON t.generated_by = u.id
        WHERE aw.department_id = $1
        ORDER BY t.generated_at DESC
    `;
    return [sql, [departmentId]];
}

function getTimetableByProgram(timetableId, programId) {
    const sql = `
        SELECT ts.*, c.name as course_name, c.code as course_code,
               u.full_name as trainer_name, r.name as room_name, r.code as room_code
        FROM timetable_slots ts
        LEFT JOIN courses c ON ts.course_id = c.id
        LEFT JOIN trainers t ON ts.trainer_id = t.id
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN rooms r ON ts.room_id = r.id
        WHERE ts.timetable_id = $1 AND ts.program_id = $2
        ORDER BY ts.day_of_week, ts.time_start
    `;
    return [sql, [timetableId, programId]];
}

function getTimetableSlots(timetableId) {
    const sql = `
        SELECT ts.*, c.name as course_name, cert.name as certification_name,
               u.full_name as trainer_name, r.name as room_name
        FROM timetable_slots ts
        LEFT JOIN courses c ON ts.course_id = c.id
        LEFT JOIN certifications cert ON ts.certification_id = cert.id
        LEFT JOIN trainers t ON ts.trainer_id = t.id
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN rooms r ON ts.room_id = r.id
        WHERE ts.timetable_id = $1
        ORDER BY ts.day_of_week, ts.time_start
    `;
    return [sql, [timetableId]];
}

function publishTimetable(timetableId) {
    const sql = `
        UPDATE timetables 
        SET status = 'published'
        WHERE id = $1
        RETURNING *
    `;
    return [sql, [timetableId]];
}

// ============================================================
// TRAINER TIMETABLE VIEW
// ============================================================

function getTrainerTimetable(trainerId, weekId = null) {
    let sql = `
        SELECT ts.*, c.name as course_name, cert.name as certification_name,
               r.name as room_name, r.code as room_code,
               aw.label as week_label, aw.start_date, aw.end_date,
               p.name as program_name
        FROM timetable_slots ts
        LEFT JOIN courses c ON ts.course_id = c.id
        LEFT JOIN certifications cert ON ts.certification_id = cert.id
        LEFT JOIN programs p ON ts.program_id = p.id
        LEFT JOIN rooms r ON ts.room_id = r.id
        LEFT JOIN academic_weeks aw ON ts.academic_week_id = aw.id
        WHERE ts.trainer_id = $1
    `;
    const params = [trainerId];
    
    if (weekId) {
        sql += ` AND ts.academic_week_id = $2`;
        params.push(weekId);
    }
    
    sql += ` ORDER BY aw.start_date DESC, ts.day_of_week, ts.time_start`;
    return [sql, params];
}

function getAllTrainerWeeks(trainerId) {
    const sql = `
        SELECT DISTINCT aw.id, aw.label, aw.start_date, aw.end_date, aw.status
        FROM timetable_slots ts
        JOIN academic_weeks aw ON ts.academic_week_id = aw.id
        WHERE ts.trainer_id = $1
        ORDER BY aw.start_date DESC
    `;
    return [sql, [trainerId]];
}

// ============================================================
// STUDENT TIMETABLE VIEW
// ============================================================

function getStudentTimetable(studentId, weekId = null) {
    let sql = `
        SELECT ts.*, c.name as course_name, cert.name as certification_name,
               u.full_name as trainer_name, r.name as room_name, r.code as room_code,
               aw.label as week_label, aw.start_date, aw.end_date
        FROM timetable_slots ts
        JOIN enrollments e ON (
            (ts.program_id IS NOT NULL AND e.program_id = ts.program_id) OR
            (ts.certification_id IS NOT NULL AND e.certification_id = ts.certification_id)
        )
        LEFT JOIN courses c ON ts.course_id = c.id
        LEFT JOIN certifications cert ON ts.certification_id = cert.id
        LEFT JOIN trainers t ON ts.trainer_id = t.id
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN rooms r ON ts.room_id = r.id
        LEFT JOIN academic_weeks aw ON ts.academic_week_id = aw.id
        WHERE e.student_id = $1
    `;
    const params = [studentId];
    
    if (weekId) {
        sql += ` AND ts.academic_week_id = $2`;
        params.push(weekId);
    }
    
    sql += ` ORDER BY ts.day_of_week, ts.time_start`;
    return [sql, params];
}

function getStudentWeeks(studentId) {
    const sql = `
        SELECT DISTINCT aw.id, aw.label, aw.start_date, aw.end_date
        FROM timetable_slots ts
        JOIN enrollments e ON (
            (ts.program_id IS NOT NULL AND e.program_id = ts.program_id) OR
            (ts.certification_id IS NOT NULL AND e.certification_id = ts.certification_id)
        )
        JOIN academic_weeks aw ON ts.academic_week_id = aw.id
        WHERE e.student_id = $1
        ORDER BY aw.start_date DESC
    `;
    return [sql, [studentId]];
}

// ============================================================
// ANNOUNCEMENTS
// ============================================================

function createAnnouncement(title, body, targetRoles, departmentId, createdBy) {
    const sql = `
        INSERT INTO announcements (title, body, target_roles, department_id, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *, (SELECT full_name FROM users WHERE id = $5) as created_by_name
    `;
    return [sql, [title, body, targetRoles, departmentId, createdBy]];
}

function getAnnouncementsByDepartment(departmentId) {
    const sql = `
        SELECT a.*, u.full_name as created_by_name, d.name as department_name
        FROM announcements a
        JOIN users u ON a.created_by = u.id
        JOIN departments d ON a.department_id = d.id
        WHERE a.department_id = $1
        ORDER BY a.created_at DESC
    `;
    return [sql, [departmentId]];
}

function getAnnouncementsForTrainer(trainerId) {
    const sql = `
        SELECT DISTINCT a.*, u.full_name as created_by_name, d.name as department_name
        FROM announcements a
        JOIN users u ON a.created_by = u.id
        JOIN departments d ON a.department_id = d.id
        JOIN trainer_courses tc ON (
            EXISTS (
                SELECT 1 FROM courses c
                JOIN sessions s ON c.session_id = s.id
                JOIN programs p ON s.program_id = p.id
                WHERE tc.course_id = c.id AND p.department_id = a.department_id
            ) OR EXISTS (
                SELECT 1 FROM certifications cert
                WHERE tc.certification_id = cert.id AND cert.department_id = a.department_id
            )
        )
        WHERE tc.trainer_id = $1
        AND 'trainer' = ANY(a.target_roles)
        ORDER BY a.created_at DESC
    `;
    return [sql, [trainerId]];
}

function getAnnouncementsForStudent(studentId) {
    const sql = `
        SELECT a.*, u.full_name as created_by_name, d.name as department_name
        FROM announcements a
        JOIN users u ON a.created_by = u.id
        JOIN departments d ON a.department_id = d.id
        JOIN students s ON s.program_id IS NOT NULL
        JOIN programs p ON s.program_id = p.id
        WHERE s.id = $1 AND p.department_id = a.department_id
        AND 'student' = ANY(a.target_roles)
        ORDER BY a.created_at DESC
    `;
    return [sql, [studentId]];
}

function getAnnouncementsForParent(parentId) {
    const sql = `
        SELECT DISTINCT a.*, u.full_name as created_by_name, d.name as department_name
        FROM announcements a
        JOIN users u ON a.created_by = u.id
        JOIN departments d ON a.department_id = d.id
        JOIN parent_student_links psl ON psl.parent_id = $1
        JOIN students s ON psl.student_id = s.id
        JOIN programs p ON s.program_id = p.id
        WHERE p.department_id = a.department_id
        AND 'parent' = ANY(a.target_roles)
        ORDER BY a.created_at DESC
    `;
    return [sql, [parentId]];
}

// ============================================================
// CERTIFICATION TIMETABLE
// ============================================================

function getCertTimetablesByTrainer(trainerId) {
    const sql = `
        SELECT DISTINCT ts.academic_week_id, ts.certification_id,
               aw.label as week_label, aw.start_date, aw.end_date,
               c.name as certification_name, c.code as certification_code
        FROM timetable_slots ts
        JOIN academic_weeks aw ON ts.academic_week_id = aw.id
        JOIN certifications c ON ts.certification_id = c.id
        WHERE ts.trainer_id = $1 AND ts.certification_id IS NOT NULL
        ORDER BY aw.start_date DESC
    `;
    return [sql, [trainerId]];
}

function getCertTimetableSlots(certId, weekId) {
    const sql = `
        SELECT ts.*, u.full_name as trainer_name, r.name as room_name, r.code as room_code
        FROM timetable_slots ts
        LEFT JOIN trainers t ON ts.trainer_id = t.id
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN rooms r ON ts.room_id = r.id
        WHERE ts.certification_id = $1 AND ts.academic_week_id = $2
        ORDER BY ts.day_of_week, ts.time_start
    `;
    return [sql, [certId, weekId]];
}

function deleteCertSlotsForWeek(certificationId, weekId) {
    const sql = `
        DELETE FROM timetable_slots 
        WHERE certification_id = $1 AND academic_week_id = $2
    `;
    return [sql, [certificationId, weekId]];
}

module.exports = {
    // Academic weeks
    createAcademicWeek,
    getAcademicWeeksByDepartment,
    getPublishedWeeksByDepartment,
    getLatestAcademicWeek,
    getLatestPublishedWeek,
    getActiveAcademicWeek,
    publishAcademicWeek,
    
    // Certification weeks
    createCertWeek,
    getCertWeeksByCert,
    getLatestPublishedCertWeek,
    publishCertWeek,
    
    // Availability
    getAvailabilityForWeek,
    getStudentAvailabilityForWeek,
    deleteExistingSlots,
    checkTrainerConflict,
    checkRoomConflict,
    checkStudentConflict,
    
    // Timetables
    createTimetable,
    createTimetableSlot,
    createCertTimetableSlot,
    getAllTimetables,
    getTimetablesByDepartment,
    getTimetableByProgram,
    getTimetableSlots,
    publishTimetable,
    
    // Views
    getTrainerTimetable,
    getAllTrainerWeeks,
    getStudentTimetable,
    getStudentWeeks,
    
    // Announcements
    createAnnouncement,
    getAnnouncementsByDepartment,
    getAnnouncementsForTrainer,
    getAnnouncementsForStudent,
    getAnnouncementsForParent,
    
    // Certification timetables
    getCertTimetablesByTrainer,
    getCertTimetableSlots,
    deleteCertSlotsForWeek,
};