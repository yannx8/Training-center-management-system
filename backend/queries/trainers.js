// FILE: /backend/queries/trainers.js

function getTrainerByUserId(userId) {
    const sql = `SELECT * FROM trainers WHERE user_id=$1 LIMIT 1`;
    return [sql, [userId]];
}

// Returns academic program courses assigned to this trainer
function getMyCourses(trainerId) {
    const sql = `
    SELECT c.id, c.name, c.code, c.credits, c.hours_per_week,
           p.name AS program_name, al.name AS level_name
    FROM trainer_courses tc
    JOIN courses c ON tc.course_id = c.id
    LEFT JOIN sessions s ON c.session_id = s.id
    LEFT JOIN programs p ON s.program_id = p.id
    LEFT JOIN academic_levels al ON s.academic_level_id = al.id
    WHERE tc.trainer_id=$1 AND tc.course_id IS NOT NULL
  `;
    return [sql, [trainerId]];
}

// Returns certifications assigned to this trainer
function getMyCertifications(trainerId) {
    const sql = `
    SELECT cert.id, cert.name, cert.code, cert.duration_hours, cert.status
    FROM trainer_courses tc
    JOIN certifications cert ON tc.certification_id = cert.id
    WHERE tc.trainer_id=$1 AND tc.certification_id IS NOT NULL
  `;
    return [sql, [trainerId]];
}

// Students enrolled in a specific course
function getCourseStudents(courseId) {
    const sql = `
    SELECT s.id AS student_id, u.full_name, s.matricule,
           g.grade, g.grade_letter
    FROM enrollments e
    JOIN students s ON e.student_id = s.id
    JOIN users u ON s.user_id = u.id
    JOIN sessions sess ON e.academic_year_id = sess.academic_year_id
    JOIN courses c ON c.session_id = sess.id AND c.id = $1
    LEFT JOIN grades g ON g.student_id = s.id AND g.course_id = $1
    GROUP BY s.id, u.full_name, s.matricule, g.grade, g.grade_letter
  `;
    return [sql, [courseId]];
}

// Students enrolled in a specific certification
function getCertificationStudents(certificationId) {
    const sql = `
    SELECT s.id AS student_id, u.full_name, s.matricule,
           g.grade, g.grade_letter
    FROM enrollments e
    JOIN students s ON e.student_id = s.id
    JOIN users u ON s.user_id = u.id
    LEFT JOIN grades g ON g.student_id = s.id AND g.certification_id = $1
    WHERE e.certification_id = $1
    GROUP BY s.id, u.full_name, s.matricule, g.grade, g.grade_letter
  `;
    return [sql, [certificationId]];
}

// Upsert grade — ON CONFLICT handles re-submission
function submitGradeForCourse(studentId, courseId, trainerId, grade, gradeLetter, academicYearId) {
    const sql = `
    INSERT INTO grades (student_id, course_id, trainer_id, grade, grade_letter, academic_year_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (student_id, course_id)
    DO UPDATE SET grade=$4, grade_letter=$5, submitted_at=NOW()
    RETURNING *
  `;
    return [sql, [studentId, courseId, trainerId, grade, gradeLetter, academicYearId]];
}

function submitGradeForCertification(studentId, certificationId, trainerId, grade, gradeLetter, academicYearId) {
    const sql = `
    INSERT INTO grades (student_id, certification_id, trainer_id, grade, grade_letter, academic_year_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (student_id, certification_id)
    DO UPDATE SET grade=$4, grade_letter=$5, submitted_at=NOW()
    RETURNING *
  `;
    return [sql, [studentId, certificationId, trainerId, grade, gradeLetter, academicYearId]];
}

// Mark complaints directed at this trainer
function getMarkComplaints(trainerId) {
    const sql = `
    SELECT mc.*, u.full_name AS student_name, s.matricule,
           c.name AS course_name, cert.name AS certification_name
    FROM mark_complaints mc
    JOIN students s ON mc.student_id = s.id
    JOIN users u ON s.user_id = u.id
    LEFT JOIN courses c ON mc.course_id = c.id
    LEFT JOIN certifications cert ON mc.certification_id = cert.id
    WHERE mc.trainer_id=$1
    ORDER BY mc.created_at DESC
  `;
    return [sql, [trainerId]];
}

function reviewMarkComplaint(complaintId, response) {
    const sql = `
    UPDATE mark_complaints
    SET status='reviewed', trainer_response=$2
    WHERE id=$1
    RETURNING *
  `;
    return [sql, [complaintId, response]];
}

// Trainer's personal timetable — both course and certification slots
function getMyTimetable(trainerId) {
    const sql = `
    SELECT ts.id, ts.day_of_week, ts.time_start, ts.time_end,
           r.name AS room_name, r.code AS room_code,
           c.name AS course_name, c.code AS course_code,
           cert.name AS certification_name, cert.code AS certification_code,
           t.week_start
    FROM timetable_slots ts
    JOIN timetables t ON ts.timetable_id = t.id
    LEFT JOIN rooms r ON ts.room_id = r.id
    LEFT JOIN courses c ON ts.course_id = c.id
    LEFT JOIN certifications cert ON ts.certification_id = cert.id
    WHERE ts.trainer_id=$1 AND t.status='published'
    ORDER BY
      CASE ts.day_of_week
        WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
      END, ts.time_start
  `;
    return [sql, [trainerId]];
}

function submitAvailability(trainerId, dayOfWeek, timeStart, timeEnd) {
    const sql = `
    INSERT INTO availability (trainer_id, day_of_week, time_start, time_end)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
    return [sql, [trainerId, dayOfWeek, timeStart, timeEnd]];
}

function getMyAvailability(trainerId) {
    const sql = `
    SELECT * FROM availability WHERE trainer_id=$1 ORDER BY
    CASE day_of_week
      WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
      WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
    END, time_start
  `;
    return [sql, [trainerId]];
}

function deleteAvailability(id, trainerId) {
    // trainerId in WHERE clause prevents a trainer deleting another trainer's slot
    const sql = `DELETE FROM availability WHERE id=$1 AND trainer_id=$2 RETURNING id`;
    return [sql, [id, trainerId]];
}

function getAvailabilityLock(hodUserId) {
    const sql = `SELECT is_locked FROM availability_locks WHERE hod_user_id=$1 LIMIT 1`;
    return [sql, [hodUserId]];
}

function upsertAvailabilityLock(hodUserId, isLocked) {
    const sql = `
    INSERT INTO availability_locks (hod_user_id, is_locked, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (hod_user_id)
    DO UPDATE SET is_locked=$2, updated_at=NOW()
    RETURNING *
  `;
    return [sql, [hodUserId, isLocked]];
}

module.exports = {
    getTrainerByUserId,
    getMyCourses,
    getMyCertifications,
    getCourseStudents,
    getCertificationStudents,
    submitGradeForCourse,
    submitGradeForCertification,
    getMarkComplaints,
    reviewMarkComplaint,
    getMyTimetable,
    submitAvailability,
    getMyAvailability,
    deleteAvailability,
    getAvailabilityLock,
    upsertAvailabilityLock,
};