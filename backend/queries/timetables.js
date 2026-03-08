// FILE: /backend/queries/timetables.js

// ─── ACADEMIC WEEKS (HOD-managed, week_type = 'academic') ─────────────────────

function createAcademicWeek(academicYearId, weekNumber, label, startDate, endDate, createdBy, departmentId) {
    const sql = `
        INSERT INTO academic_weeks
            (academic_year_id, week_number, label, start_date, end_date,
             created_by, department_id, week_type, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'academic', 'draft')
        RETURNING *
    `;
    return [sql, [academicYearId || null, weekNumber, label, startDate, endDate, createdBy, departmentId]];
}

function getAcademicWeeksByDepartment(departmentId) {
    const sql = `
        SELECT aw.*, COALESCE(ay.name, '') AS year_name
        FROM academic_weeks aw
        LEFT JOIN academic_years ay ON aw.academic_year_id = ay.id
        WHERE aw.department_id = $1 AND aw.week_type = 'academic'
        ORDER BY aw.start_date DESC
    `;
    return [sql, [departmentId]];
}

function getPublishedWeeksByDepartment(departmentId) {
    const sql = `
        SELECT aw.*, COALESCE(ay.name, '') AS year_name
        FROM academic_weeks aw
        LEFT JOIN academic_years ay ON aw.academic_year_id = ay.id
        WHERE aw.department_id = $1
          AND aw.week_type = 'academic'
          AND aw.status = 'published'
        ORDER BY aw.start_date DESC
    `;
    return [sql, [departmentId]];
}

function getLatestPublishedWeek(departmentId) {
    const sql = `
        SELECT aw.*, COALESCE(ay.name, '') AS year_name
        FROM academic_weeks aw
        LEFT JOIN academic_years ay ON aw.academic_year_id = ay.id
        WHERE aw.department_id = $1
          AND aw.week_type = 'academic'
          AND aw.status = 'published'
        ORDER BY aw.created_at DESC
        LIMIT 1
    `;
    return [sql, [departmentId]];
}

function getLatestAcademicWeek(departmentId) {
    const sql = `
        SELECT aw.*, COALESCE(ay.name, '') AS year_name
        FROM academic_weeks aw
        LEFT JOIN academic_years ay ON aw.academic_year_id = ay.id
        WHERE aw.department_id = $1 AND aw.week_type = 'academic'
        ORDER BY aw.created_at DESC
        LIMIT 1
    `;
    return [sql, [departmentId]];
}

function getActiveAcademicWeek(departmentId) {
    return getLatestPublishedWeek(departmentId);
}

function publishAcademicWeek(weekId) {
    return [`UPDATE academic_weeks SET status = 'published' WHERE id = $1 RETURNING *`, [weekId]];
}

// ─── CERTIFICATION WEEKS (Trainer-managed, week_type = 'certification') ───────

// Trainer creates a cert week for one specific certification
function createCertWeek(certificationId, weekNumber, label, startDate, endDate, createdBy) {
    const sql = `
        INSERT INTO academic_weeks
            (week_number, label, start_date, end_date,
             created_by, certification_id, week_type, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'certification', 'draft')
        RETURNING *
    `;
    return [sql, [weekNumber, label, startDate, endDate, createdBy, certificationId]];
}

// All cert weeks for a specific certification (trainer's list view)
function getCertWeeksByCert(certificationId) {
    const sql = `
        SELECT aw.*, cert.name AS certification_name, cert.code AS certification_code
        FROM academic_weeks aw
        JOIN certifications cert ON aw.certification_id = cert.id
        WHERE aw.certification_id = $1 AND aw.week_type = 'certification'
        ORDER BY aw.created_at DESC
    `;
    return [sql, [certificationId]];
}

// Latest PUBLISHED cert week for a cert — what students and trainer see for availability
function getLatestPublishedCertWeek(certificationId) {
    const sql = `
        SELECT aw.*, cert.name AS certification_name, cert.code AS certification_code
        FROM academic_weeks aw
        JOIN certifications cert ON aw.certification_id = cert.id
        WHERE aw.certification_id = $1
          AND aw.week_type = 'certification'
          AND aw.status = 'published'
        ORDER BY aw.created_at DESC
        LIMIT 1
    `;
    return [sql, [certificationId]];
}

function publishCertWeek(weekId) {
    return [`UPDATE academic_weeks SET status = 'published' WHERE id = $1 RETURNING *`, [weekId]];
}

// ─── ACADEMIC TIMETABLE (HOD generates + views, read-only) ────────────────────

// Timetable is immediately published at generation time — no separate publish step
function createTimetable(academicWeekId, generatedBy, label) {
    const sql = `
        INSERT INTO timetables (academic_week_id, generated_by, label, status, generated_at)
        VALUES ($1, $2, $3, 'published', NOW())
        RETURNING *
    `;
    return [sql, [academicWeekId, generatedBy, label]];
}

function getAllTimetables() {
    const sql = `
        SELECT t.*, aw.label AS week_label, aw.start_date, aw.end_date
        FROM timetables t
        LEFT JOIN academic_weeks aw ON t.academic_week_id = aw.id
        ORDER BY t.generated_at DESC
    `;
    return [sql, []];
}

function getTimetablesByDepartment(departmentId) {
    const sql = `
        SELECT DISTINCT t.id, t.label, t.status, t.generated_at,
               aw.label AS week_label, aw.start_date, aw.end_date, aw.id AS week_id
        FROM timetables t
        JOIN academic_weeks aw ON t.academic_week_id = aw.id
        WHERE aw.department_id = $1 AND aw.week_type = 'academic'
        ORDER BY t.generated_at DESC
    `;
    return [sql, [departmentId]];
}

function publishTimetable(timetableId) {
    return [`UPDATE timetables SET status = 'published' WHERE id = $1 RETURNING *`, [timetableId]];
}

function checkTrainerConflict(trainerId, dayOfWeek, timeStart, timeEnd, weekId) {
    const sql = `
        SELECT id FROM timetable_slots
        WHERE trainer_id = $1 AND day_of_week = $2 AND academic_week_id = $5
          AND time_start < $4::time AND time_end > $3::time
        UNION ALL
        SELECT id FROM cert_timetable_slots
        WHERE trainer_id = $1 AND day_of_week = $2 AND academic_week_id = $5
          AND time_start < $4::time AND time_end > $3::time
    `;
    return [sql, [trainerId, dayOfWeek, timeStart, timeEnd, weekId]];
}

function checkRoomConflict(roomId, dayOfWeek, timeStart, timeEnd, weekId) {
    const sql = `
        SELECT id FROM timetable_slots
        WHERE room_id = $1 AND day_of_week = $2 AND academic_week_id = $5
          AND time_start < $4::time AND time_end > $3::time
        UNION ALL
        SELECT id FROM cert_timetable_slots
        WHERE room_id = $1 AND day_of_week = $2 AND academic_week_id = $5
          AND time_start < $4::time AND time_end > $3::time
    `;
    return [sql, [roomId, dayOfWeek, timeStart, timeEnd, weekId]];
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
        SELECT ts.id, ts.day_of_week, ts.time_start, ts.time_end,
               r.name AS room_name, r.code AS room_code,
               u.full_name AS trainer_name,
               c.name AS course_name, c.code AS course_code,
               p.name AS program_name,
               aw.label AS week_label, aw.start_date, aw.end_date
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
                WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
                WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
            END, ts.time_start
    `;
    return [sql, [timetableId, programId]];
}

// ─── STUDENT ACADEMIC TIMETABLE ───────────────────────────────────────────────

function getStudentTimetable(studentId, weekId) {
    const weekFilter = weekId ? 'AND ts.academic_week_id = $2' : '';
    const params = weekId ? [studentId, weekId] : [studentId];
    const sql = `
        SELECT ts.day_of_week, ts.time_start, ts.time_end,
               r.name AS room_name, u.full_name AS trainer_name,
               c.name AS course_name, c.id AS course_id,
               aw.label AS week_label, aw.start_date, aw.end_date, aw.id AS week_id,
               'academic' AS slot_type
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
                WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
                WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
            END, ts.time_start
    `;
    return [sql, params];
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

// ─── CERTIFICATION TIMETABLE (Trainer generates + views, read-only) ───────────

function createCertTimetableSlot(certificationId, trainerId, academicWeekId, dayOfWeek, timeStart, timeEnd, roomId) {
    const sql = `
        INSERT INTO cert_timetable_slots
            (certification_id, trainer_id, academic_week_id, day_of_week, time_start, time_end, room_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `;
    return [sql, [certificationId, trainerId, academicWeekId, dayOfWeek, timeStart, timeEnd, roomId || null]];
}

function deleteCertSlotsForWeek(certificationId, academicWeekId) {
    return [`DELETE FROM cert_timetable_slots WHERE certification_id=$1 AND academic_week_id=$2`, [certificationId, academicWeekId]];
}

// All generated cert timetables for a trainer — summary list (read-only)
function getCertTimetablesByTrainer(trainerId) {
    const sql = `
        SELECT DISTINCT
               aw.id AS week_id, aw.label AS week_label,
               aw.start_date, aw.end_date,
               cert.id AS certification_id,
               cert.name AS certification_name,
               cert.code AS certification_code,
               COUNT(cts.id) AS slot_count
        FROM cert_timetable_slots cts
        JOIN academic_weeks aw ON cts.academic_week_id = aw.id
        JOIN certifications cert ON cts.certification_id = cert.id
        WHERE cts.trainer_id = $1
        GROUP BY aw.id, aw.label, aw.start_date, aw.end_date,
                 cert.id, cert.name, cert.code
        ORDER BY aw.start_date DESC
    `;
    return [sql, [trainerId]];
}

// Grid slots for a specific cert+week (read-only detail view)
function getCertTimetableSlots(certificationId, weekId) {
    const sql = `
        SELECT cts.id, cts.day_of_week, cts.time_start, cts.time_end,
               r.name AS room_name, r.code AS room_code,
               u.full_name AS trainer_name,
               cert.name AS certification_name,
               aw.label AS week_label, aw.start_date, aw.end_date
        FROM cert_timetable_slots cts
        JOIN certifications cert ON cts.certification_id = cert.id
        JOIN academic_weeks aw ON cts.academic_week_id = aw.id
        LEFT JOIN rooms r ON cts.room_id = r.id
        LEFT JOIN trainers tr ON cts.trainer_id = tr.id
        LEFT JOIN users u ON tr.user_id = u.id
        WHERE cts.certification_id = $1 AND cts.academic_week_id = $2
        ORDER BY
            CASE cts.day_of_week
                WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
                WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
            END, cts.time_start
    `;
    return [sql, [certificationId, weekId]];
}

// Student cert timetable
function getStudentCertTimetable(studentId, weekId) {
    const weekFilter = weekId ? 'AND cts.academic_week_id = $2' : '';
    const params = weekId ? [studentId, weekId] : [studentId];
    const sql = `
        SELECT cts.id, cts.day_of_week, cts.time_start, cts.time_end,
               cert.name AS certification_name, cert.id AS certification_id,
               u.full_name AS trainer_name,
               r.name AS room_name,
               aw.label AS week_label, aw.start_date, aw.end_date, aw.id AS week_id,
               'certification' AS slot_type
        FROM enrollments e
        JOIN certifications cert ON e.certification_id = cert.id
        JOIN cert_timetable_slots cts ON cts.certification_id = cert.id
        JOIN academic_weeks aw ON cts.academic_week_id = aw.id
        LEFT JOIN rooms r ON cts.room_id = r.id
        LEFT JOIN trainers tr ON cts.trainer_id = tr.id
        LEFT JOIN users u ON tr.user_id = u.id
        WHERE e.student_id = $1 ${weekFilter}
        ORDER BY
            CASE cts.day_of_week
                WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
                WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
            END, cts.time_start
    `;
    return [sql, params];
}

// Weeks where student has cert timetable slots
function getStudentCertTimetableWeeks(studentId) {
    const sql = `
        SELECT DISTINCT aw.id, aw.label, aw.start_date, aw.end_date
        FROM academic_weeks aw
        JOIN cert_timetable_slots cts ON cts.academic_week_id = aw.id
        JOIN enrollments e ON e.certification_id = cts.certification_id AND e.student_id = $1
        ORDER BY aw.start_date DESC
    `;
    return [sql, [studentId]];
}

function studentHasCertEnrollments(studentId) {
    return [`SELECT COUNT(*) AS cnt FROM enrollments WHERE student_id=$1 AND certification_id IS NOT NULL`, [studentId]];
}

// ─── TRAINER COMBINED TIMETABLE (academic + cert, read-only) ─────────────────

function getTrainerTimetable(trainerId, weekId) {
    const aFilter = weekId ? 'AND ts.academic_week_id = $2' : '';
    const cFilter = weekId ? 'AND cts.academic_week_id = $2' : '';
    const params = weekId ? [trainerId, weekId] : [trainerId];
    const sql = `
        SELECT ts.id, ts.day_of_week, ts.time_start, ts.time_end,
               r.name AS room_name, r.code AS room_code,
               c.name AS course_name, c.code AS course_code, c.id AS course_id,
               NULL::int AS certification_id, NULL::varchar AS certification_name,
               aw.label AS week_label, aw.start_date, aw.end_date, aw.id AS week_id,
               'academic' AS slot_type
        FROM timetable_slots ts
        JOIN academic_weeks aw ON ts.academic_week_id = aw.id AND aw.status = 'published'
        LEFT JOIN rooms r ON ts.room_id = r.id
        LEFT JOIN courses c ON ts.course_id = c.id
        WHERE ts.trainer_id = $1 ${aFilter}

        UNION ALL

        SELECT cts.id, cts.day_of_week, cts.time_start, cts.time_end,
               r.name AS room_name, r.code AS room_code,
               NULL::varchar AS course_name, NULL::varchar AS course_code, NULL::int AS course_id,
               cert.id AS certification_id, cert.name AS certification_name,
               aw.label AS week_label, aw.start_date, aw.end_date, aw.id AS week_id,
               'certification' AS slot_type
        FROM cert_timetable_slots cts
        JOIN academic_weeks aw ON cts.academic_week_id = aw.id
        LEFT JOIN rooms r ON cts.room_id = r.id
        LEFT JOIN certifications cert ON cts.certification_id = cert.id
        WHERE cts.trainer_id = $1 ${cFilter}

        ORDER BY
            CASE day_of_week
                WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
                WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
            END, time_start
    `;
    return [sql, params];
}

function getAllTrainerWeeks(trainerId) {
    const sql = `
        SELECT DISTINCT aw.id, aw.label, aw.start_date, aw.end_date, aw.status
        FROM academic_weeks aw
        WHERE aw.id IN (
            SELECT DISTINCT academic_week_id FROM timetable_slots WHERE trainer_id = $1
            UNION
            SELECT DISTINCT academic_week_id FROM cert_timetable_slots WHERE trainer_id = $1
        ) AND aw.status = 'published'
        ORDER BY aw.start_date DESC
    `;
    return [sql, [trainerId]];
}

// ─── STUDENT AVAILABILITY (cert weeks only) ───────────────────────────────────

function submitStudentAvailability(studentId, academicWeekId, dayOfWeek, timeStart, timeEnd) {
    const sql = `
        INSERT INTO student_availability (student_id, academic_week_id, day_of_week, time_start, time_end)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (student_id, academic_week_id, day_of_week, time_start, time_end) DO NOTHING
        RETURNING *
    `;
    return [sql, [studentId, academicWeekId, dayOfWeek, timeStart, timeEnd]];
}

function getStudentAvailability(studentId, weekId) {
    const weekFilter = weekId ? 'AND sa.academic_week_id = $2' : '';
    const params = weekId ? [studentId, weekId] : [studentId];
    const sql = `
        SELECT sa.*, aw.label AS week_label, cert.name AS certification_name
        FROM student_availability sa
        LEFT JOIN academic_weeks aw ON sa.academic_week_id = aw.id
        LEFT JOIN certifications cert ON aw.certification_id = cert.id
        WHERE sa.student_id = $1 ${weekFilter}
        ORDER BY
            CASE sa.day_of_week
                WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
                WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
            END, sa.time_start
    `;
    return [sql, params];
}

function deleteStudentAvailability(id, studentId) {
    return [`DELETE FROM student_availability WHERE id=$1 AND student_id=$2 RETURNING id`, [id, studentId]];
}

// For each cert the student is enrolled in, return the latest published cert week
// Student sees one week per cert (the latest published one)
function getLatestPublishedCertWeeksForStudent(studentId) {
    const sql = `
        SELECT DISTINCT ON (cert.id)
               aw.id AS week_id, aw.label AS week_label,
               aw.start_date, aw.end_date,
               cert.id AS certification_id, cert.name AS certification_name
        FROM enrollments e
        JOIN certifications cert ON e.certification_id = cert.id
        JOIN academic_weeks aw
            ON aw.certification_id = cert.id
           AND aw.week_type = 'certification'
           AND aw.status = 'published'
        WHERE e.student_id = $1
        ORDER BY cert.id, aw.created_at DESC
    `;
    return [sql, [studentId]];
}

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────

function createAnnouncement(title, body, targetRole, departmentId, createdBy) {
    const sql = `
        INSERT INTO announcements (title, body, target_role, department_id, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    return [sql, [title, body, targetRole || null, departmentId || null, createdBy]];
}

function getAnnouncementsByDepartment(departmentId, role) {
    const roleFilter = role ? `AND (target_role IS NULL OR target_role LIKE '%' || $2 || '%')` : '';
    const params = role ? [departmentId, role] : [departmentId];
    const sql = `
        SELECT a.*, u.full_name AS author_name
        FROM announcements a
        LEFT JOIN users u ON a.created_by = u.id
        WHERE a.department_id = $1 ${roleFilter}
        ORDER BY a.created_at DESC
    `;
    return [sql, params];
}

function getAnnouncementsForTrainer(trainerId) {
    const sql = `
        SELECT DISTINCT a.*, u.full_name AS author_name, d.name AS department_name
        FROM announcements a
        LEFT JOIN users u ON a.created_by = u.id
        LEFT JOIN departments d ON a.department_id = d.id
        WHERE a.department_id IN (
            SELECT DISTINCT p.department_id
            FROM trainer_courses tc
            JOIN courses c ON tc.course_id = c.id
            JOIN sessions s ON c.session_id = s.id
            JOIN programs p ON s.program_id = p.id
            WHERE tc.trainer_id = $1
        )
        AND (a.target_role IS NULL OR a.target_role LIKE '%trainer%')
        ORDER BY a.created_at DESC
    `;
    return [sql, [trainerId]];
}

function getAnnouncementsForStudent(studentId) {
    const sql = `
        SELECT a.*, u.full_name AS author_name, d.name AS department_name
        FROM announcements a
        LEFT JOIN users u ON a.created_by = u.id
        LEFT JOIN departments d ON a.department_id = d.id
        WHERE a.department_id = (
            SELECT p.department_id FROM students st
            JOIN programs p ON st.program_id = p.id
            WHERE st.id = $1 LIMIT 1
        )
        AND (a.target_role IS NULL OR a.target_role LIKE '%student%')
        ORDER BY a.created_at DESC
    `;
    return [sql, [studentId]];
}

function getAnnouncementsForParent(userId) {
    const sql = `
        SELECT DISTINCT a.*, u.full_name AS author_name, d.name AS department_name
        FROM announcements a
        LEFT JOIN users u ON a.created_by = u.id
        LEFT JOIN departments d ON a.department_id = d.id
        WHERE a.department_id IN (
            SELECT DISTINCT p.department_id
            FROM parent_student_links psl
            JOIN parents par ON psl.parent_id = par.id
            JOIN students st ON psl.student_id = st.id
            JOIN programs p ON st.program_id = p.id
            WHERE par.user_id = $1
        )
        AND (a.target_role IS NULL OR a.target_role LIKE '%parent%')
        ORDER BY a.created_at DESC
    `;
    return [sql, [userId]];
}

// ─── MISC ─────────────────────────────────────────────────────────────────────

function getCourseWithTrainer(courseId) {
    const sql = `
        SELECT c.id, c.name, c.code,
               aw.id AS school_period_id, aw.label AS school_period_label,
               u.full_name AS trainer_name, tr.id AS trainer_id
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
               aw.id AS school_period_id, aw.label AS school_period_label,
               u.full_name AS trainer_name, tr.id AS trainer_id,
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
               c.name AS course_name, c.code AS course_code,
               u.full_name AS trainer_name,
               aw.label AS school_period_label
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
               aw.label AS school_period
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
    return [`SELECT id FROM mark_complaints WHERE student_id=$1 AND course_id=$2`, [studentId, courseId]];
}

module.exports = {
    // Academic weeks (HOD)
    createAcademicWeek,
    getAcademicWeeksByDepartment,
    getPublishedWeeksByDepartment,
    getLatestAcademicWeek,
    getLatestPublishedWeek,
    getActiveAcademicWeek,
    publishAcademicWeek,
    // Cert weeks (Trainer)
    createCertWeek,
    getCertWeeksByCert,
    getLatestPublishedCertWeek,
    publishCertWeek,
    // Academic timetable (HOD view-only)
    createTimetable,
    getAllTimetables,
    getTimetablesByDepartment,
    publishTimetable,
    checkTrainerConflict,
    checkRoomConflict,
    createTimetableSlot,
    getTimetableByProgram,
    // Cert timetable (Trainer generates + views)
    createCertTimetableSlot,
    deleteCertSlotsForWeek,
    getCertTimetablesByTrainer,
    getCertTimetableSlots,
    getStudentCertTimetable,
    getStudentCertTimetableWeeks,
    studentHasCertEnrollments,
    // Trainer combined view
    getTrainerTimetable,
    getAllTrainerWeeks,
    // Student academic
    getStudentTimetable,
    getAllStudentWeeks,
    // Student cert availability
    submitStudentAvailability,
    getStudentAvailability,
    deleteStudentAvailability,
    getLatestPublishedCertWeeksForStudent,
    // Announcements
    createAnnouncement,
    getAnnouncementsByDepartment,
    getAnnouncementsForTrainer,
    getAnnouncementsForStudent,
    getAnnouncementsForParent,
    // Misc
    getCourseWithTrainer,
    getStudentCoursesWithGrades,
    getStudentMarkComplaints,
    getStudentGradesByPeriod,
    getStudentGradePeriods,
    checkExistingMarkComplaint,
};
