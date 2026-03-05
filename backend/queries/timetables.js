function createAcademicWeek(academicYearId, weekNumber, label, startDate, endDate, createdBy, departmentId) {
    const sql = `
        INSERT INTO academic_weeks
            (academic_year_id, week_number, label, start_date, end_date, created_by, department_id, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
        RETURNING *
    `;
    return [sql, [academicYearId || null, weekNumber, label, startDate, endDate, createdBy, departmentId]];
}


function getAcademicWeeksByDepartment(departmentId) {
    const sql = `
        SELECT aw.*, COALESCE(ay.name, '') AS year_name
        FROM academic_weeks aw
        LEFT JOIN academic_years ay ON aw.academic_year_id = ay.id
        WHERE aw.department_id = $1
        ORDER BY aw.start_date DESC
    `;
    return [sql, [departmentId]];
}


function getLatestAcademicWeek(departmentId) {
    const sql = `
        SELECT aw.*, COALESCE(ay.name, '') AS year_name
        FROM academic_weeks aw
        LEFT JOIN academic_years ay ON aw.academic_year_id = ay.id
        WHERE aw.department_id = $1
        ORDER BY aw.created_at DESC
        LIMIT 1
    `;
    return [sql, [departmentId]];
}

function getActiveAcademicWeek(departmentId) {
    return getLatestAcademicWeek(departmentId);
}

function publishAcademicWeek(weekId) {
    const sql = `UPDATE academic_weeks SET status = 'published' WHERE id = $1 RETURNING *`;
    return [sql, [weekId]];
}

function createTimetable(academicWeekId, generatedBy, label) {
    const sql = `
        INSERT INTO timetables (academic_week_id, generated_by, label, status, generated_at)
        VALUES ($1, $2, $3, 'draft', NOW())
        RETURNING *
    `;
    return [sql, [academicWeekId, generatedBy, label]];
}

function getAllTimetables() {
    const sql = `
        SELECT t.*, aw.label as week_label, aw.start_date, aw.end_date
        FROM timetables t
        LEFT JOIN academic_weeks aw ON t.academic_week_id = aw.id
        ORDER BY t.generated_at DESC
    `;
    return [sql, []];
}

function publishTimetable(timetableId) {
    const sql = `UPDATE timetables SET status = 'published' WHERE id = $1 RETURNING *`;
    return [sql, [timetableId]];
}

function checkTrainerConflict(trainerId, dayOfWeek, timeStart, timeEnd) {
    const sql = `
        SELECT id FROM timetable_slots
        WHERE trainer_id = $1 AND day_of_week = $2
          AND time_start < $4::time AND time_end > $3::time
    `;
    return [sql, [trainerId, dayOfWeek, timeStart, timeEnd]];
}

function checkRoomConflict(roomId, dayOfWeek, timeStart, timeEnd) {
    const sql = `
        SELECT id FROM timetable_slots
        WHERE room_id = $1 AND day_of_week = $2
          AND time_start < $4::time AND time_end > $3::time
    `;
    return [sql, [roomId, dayOfWeek, timeStart, timeEnd]];
}

function createTimetableSlot(timetableId, dayOfWeek, timeStart, timeEnd, roomId, trainerId, courseId, academicWeekId) {
    const sql = `
        INSERT INTO timetable_slots
            (timetable_id, day_of_week, time_start, time_end, room_id, trainer_id, course_id, academic_week_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `;
    return [sql, [timetableId, dayOfWeek, timeStart, timeEnd, roomId, trainerId, courseId, academicWeekId]];
}

function getTimetableByProgram(timetableId, programId) {
    const sql = `
        SELECT
            ts.id,
            ts.day_of_week,
            ts.time_start,
            ts.time_end,
            r.name      AS room_name,
            r.code      AS room_code,
            u.full_name AS trainer_name,
            c.name      AS course_name,
            c.code      AS course_code,
            p.name      AS program_name,
            aw.label    AS week_label,
            aw.start_date,
            aw.end_date
        FROM timetable_slots ts
        LEFT JOIN rooms    r  ON ts.room_id    = r.id
        LEFT JOIN trainers tr ON ts.trainer_id = tr.id
        LEFT JOIN users    u  ON tr.user_id    = u.id
        LEFT JOIN courses  c  ON ts.course_id  = c.id
        LEFT JOIN sessions s  ON c.session_id  = s.id
        LEFT JOIN programs p  ON s.program_id  = p.id
        LEFT JOIN academic_weeks aw ON ts.academic_week_id = aw.id
        WHERE ts.timetable_id = $1 AND p.id = $2
        ORDER BY
            CASE ts.day_of_week
                WHEN 'Monday' THEN 1 WHEN 'Tuesday'   THEN 2 WHEN 'Wednesday' THEN 3
                WHEN 'Thursday' THEN 4 WHEN 'Friday'  THEN 5 WHEN 'Saturday'  THEN 6
            END, ts.time_start
    `;
    return [sql, [timetableId, programId]];
}

function getTimetablesByDepartment(departmentId) {
    const sql = `
        SELECT DISTINCT t.id, t.label, t.status, t.generated_at,
               aw.label as week_label, aw.start_date, aw.end_date, aw.id as week_id
        FROM timetables t
        JOIN academic_weeks aw ON t.academic_week_id = aw.id
        WHERE aw.department_id = $1
        ORDER BY t.generated_at DESC
    `;
    return [sql, [departmentId]];
}

function getStudentTimetable(studentId, weekId) {
    const weekFilter = weekId ? 'AND ts.academic_week_id = $2' : '';
    const params = weekId ? [studentId, weekId] : [studentId];
    const sql = `
        SELECT
            ts.day_of_week,
            ts.time_start,
            ts.time_end,
            r.name      AS room_name,
            u.full_name AS trainer_name,
            c.name      AS course_name,
            c.id        AS course_id,
            aw.label    AS week_label,
            aw.start_date,
            aw.end_date,
            aw.id       AS week_id
        FROM students st
        JOIN sessions        sess ON sess.program_id     = st.program_id
        JOIN courses         c    ON c.session_id        = sess.id
        JOIN timetable_slots ts   ON ts.course_id        = c.id
        JOIN academic_weeks  aw   ON ts.academic_week_id = aw.id AND aw.status = 'published'
        LEFT JOIN rooms      r    ON ts.room_id          = r.id
        LEFT JOIN trainers   tr   ON ts.trainer_id       = tr.id
        LEFT JOIN users      u    ON tr.user_id          = u.id
        WHERE st.id = $1 ${weekFilter}
        ORDER BY
            CASE ts.day_of_week
                WHEN 'Monday' THEN 1 WHEN 'Tuesday'   THEN 2 WHEN 'Wednesday' THEN 3
                WHEN 'Thursday' THEN 4 WHEN 'Friday'  THEN 5 WHEN 'Saturday'  THEN 6
            END, ts.time_start
    `;
    return [sql, params];
}

function getTrainerTimetable(trainerId, weekId) {
    const weekFilter = weekId ? 'AND ts.academic_week_id = $2' : '';
    const params = weekId ? [trainerId, weekId] : [trainerId];
    const sql = `
        SELECT
            ts.id,
            ts.day_of_week,
            ts.time_start,
            ts.time_end,
            r.name AS room_name,
            r.code AS room_code,
            c.name AS course_name,
            c.code AS course_code,
            c.id   AS course_id,
            aw.label    AS week_label,
            aw.start_date,
            aw.end_date,
            aw.id AS week_id
        FROM timetable_slots ts
        JOIN academic_weeks aw ON ts.academic_week_id = aw.id AND aw.status = 'published'
        LEFT JOIN rooms   r ON ts.room_id   = r.id
        LEFT JOIN courses c ON ts.course_id = c.id
        WHERE ts.trainer_id = $1 ${weekFilter}
        ORDER BY
            CASE ts.day_of_week
                WHEN 'Monday' THEN 1 WHEN 'Tuesday'   THEN 2 WHEN 'Wednesday' THEN 3
                WHEN 'Thursday' THEN 4 WHEN 'Friday'  THEN 5 WHEN 'Saturday'  THEN 6
            END, ts.time_start
    `;
    return [sql, params];
}

function getAllTrainerWeeks(trainerId) {
    const sql = `
        SELECT DISTINCT aw.id, aw.label, aw.start_date, aw.end_date, aw.status
        FROM academic_weeks aw
        JOIN timetable_slots ts ON ts.academic_week_id = aw.id
        WHERE ts.trainer_id = $1 AND aw.status = 'published'
        ORDER BY aw.start_date DESC
    `;
    return [sql, [trainerId]];
}

function getAllStudentWeeks(studentId) {
    const sql = `
        SELECT DISTINCT aw.id, aw.label, aw.start_date, aw.end_date, aw.status
        FROM academic_weeks aw
        JOIN timetable_slots ts ON ts.academic_week_id = aw.id
        JOIN courses c ON ts.course_id = c.id
        JOIN sessions s ON c.session_id = s.id
        JOIN students st ON s.program_id = st.program_id
        WHERE st.id = $1 AND aw.status = 'published'
        ORDER BY aw.start_date DESC
    `;
    return [sql, [studentId]];
}

function getCourseWithTrainer(courseId) {
    const sql = `
        SELECT c.id, c.name, c.code,
               aw.id as school_period_id, aw.label as school_period_label,
               u.full_name as trainer_name, tr.id as trainer_id
        FROM courses c
        LEFT JOIN trainer_courses tc ON tc.course_id = c.id
        LEFT JOIN trainers tr ON tc.trainer_id = tr.id
        LEFT JOIN users u ON tr.user_id = u.id
        LEFT JOIN academic_weeks aw ON c.school_period_id = aw.id
        WHERE c.id = $1
    `;
    return [sql, [courseId]];
}

function getStudentCoursesWithGrades(studentId) {
    const sql = `
        SELECT DISTINCT c.id, c.name, c.code,
               aw.id as school_period_id, aw.label as school_period_label,
               u.full_name as trainer_name, tr.id as trainer_id,
               g.grade, g.grade_letter
        FROM courses c
        JOIN sessions s ON c.session_id = s.id
        JOIN students st ON s.program_id = st.program_id
        LEFT JOIN grades g ON g.course_id = c.id AND g.student_id = st.id
        LEFT JOIN trainer_courses tc ON tc.course_id = c.id
        LEFT JOIN trainers tr ON tc.trainer_id = tr.id
        LEFT JOIN users u ON tr.user_id = u.id
        LEFT JOIN academic_weeks aw ON c.school_period_id = aw.id
        WHERE st.id = $1 AND g.grade IS NOT NULL
        ORDER BY c.name
    `;
    return [sql, [studentId]];
}

function getStudentMarkComplaints(studentId) {
    const sql = `
        SELECT mc.id, mc.subject, mc.status, mc.created_at,
               c.name as course_name, c.code as course_code,
               u.full_name as trainer_name,
               aw.label as school_period_label
        FROM mark_complaints mc
        LEFT JOIN courses c ON mc.course_id = c.id
        LEFT JOIN trainers tr ON mc.trainer_id = tr.id
        LEFT JOIN users u ON tr.user_id = u.id
        LEFT JOIN academic_weeks aw ON c.school_period_id = aw.id
        WHERE mc.student_id = $1
        ORDER BY mc.created_at DESC
    `;
    return [sql, [studentId]];
}

function getStudentGradesByPeriod(studentId, weekId) {
    const sql = `
        SELECT g.*, c.name AS course_name, c.code AS course_code,
               cert.name AS certification_name, cert.code AS certification_code,
               u.full_name AS trainer_name, ay.name AS academic_year,
               aw.label as school_period
        FROM grades g
        LEFT JOIN courses c ON g.course_id = c.id
        LEFT JOIN certifications cert ON g.certification_id = cert.id
        LEFT JOIN trainers t ON g.trainer_id = t.id
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN academic_years ay ON g.academic_year_id = ay.id
        LEFT JOIN academic_weeks aw ON (c.school_period_id = aw.id OR cert.school_period_id = aw.id)
        WHERE g.student_id = $1 AND ($2::int IS NULL OR aw.id = $2)
        ORDER BY g.submitted_at DESC
    `;
    return [sql, [studentId, weekId || null]];
}

function getStudentGradePeriods(studentId) {
    const sql = `
        SELECT DISTINCT aw.id, aw.label, aw.start_date, aw.end_date
        FROM academic_weeks aw
        JOIN courses c ON c.school_period_id = aw.id
        JOIN sessions s ON c.session_id = s.id
        JOIN students st ON s.program_id = st.program_id
        WHERE st.id = $1
        ORDER BY aw.start_date DESC
    `;
    return [sql, [studentId]];
}

function checkExistingMarkComplaint(studentId, courseId) {
    const sql = `SELECT id FROM mark_complaints WHERE student_id = $1 AND course_id = $2`;
    return [sql, [studentId, courseId]];
}

module.exports = {
    createAcademicWeek,
    getAcademicWeeksByDepartment,
    getLatestAcademicWeek,
    getActiveAcademicWeek,
    publishAcademicWeek,
    createTimetable,
    getAllTimetables,
    getTimetablesByDepartment,
    publishTimetable,
    checkTrainerConflict,
    checkRoomConflict,
    createTimetableSlot,
    getTimetableByProgram,
    getStudentTimetable,
    getTrainerTimetable,
    getAllTrainerWeeks,
    getAllStudentWeeks,
    getCourseWithTrainer,
    getStudentCoursesWithGrades,
    getStudentMarkComplaints,
    getStudentGradesByPeriod,
    getStudentGradePeriods,
    checkExistingMarkComplaint,
};