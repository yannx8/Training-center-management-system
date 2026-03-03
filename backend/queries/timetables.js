// FILE: /backend/queries/timetables.js

function createTimetable(academicYearId, generatedBy, weekStart) {
    const sql = `
    INSERT INTO timetables (academic_year_id, generated_by, week_start, status)
    VALUES ($1,$2,$3,'draft') RETURNING *
  `;
    return [sql, [academicYearId, generatedBy, weekStart]];
}

function getTimetableById(id) {
    return [`SELECT * FROM timetables WHERE id=$1`, [id]];
}

// Conflict check: same trainer, same day, overlapping time
// Returns rows if conflict exists — caller aborts slot insertion if non-empty
function checkTrainerConflict(trainerId, dayOfWeek, timeStart, timeEnd, excludeSlotId) {
    const sql = excludeSlotId ?
        `SELECT id FROM timetable_slots
       WHERE trainer_id=$1 AND day_of_week=$2 AND id != $5
         AND NOT (time_end <= $3 OR time_start >= $4)` :
        `SELECT id FROM timetable_slots
       WHERE trainer_id=$1 AND day_of_week=$2
         AND NOT (time_end <= $3 OR time_start >= $4)`;
    return excludeSlotId ?
        [sql, [trainerId, dayOfWeek, timeStart, timeEnd, excludeSlotId]] :
        [sql, [trainerId, dayOfWeek, timeStart, timeEnd]];
}

// Conflict check: same room, same day, overlapping time
function checkRoomConflict(roomId, dayOfWeek, timeStart, timeEnd, excludeSlotId) {
    const sql = excludeSlotId ?
        `SELECT id FROM timetable_slots
       WHERE room_id=$1 AND day_of_week=$2 AND id != $5
         AND NOT (time_end <= $3 OR time_start >= $4)` :
        `SELECT id FROM timetable_slots
       WHERE room_id=$1 AND day_of_week=$2
         AND NOT (time_end <= $3 OR time_start >= $4)`;
    return excludeSlotId ?
        [sql, [roomId, dayOfWeek, timeStart, timeEnd, excludeSlotId]] :
        [sql, [roomId, dayOfWeek, timeStart, timeEnd]];
}

function createTimetableSlot(timetableId, dayOfWeek, timeStart, timeEnd, roomId, trainerId, courseId, certificationId) {
    const sql = `
    INSERT INTO timetable_slots
      (timetable_id, day_of_week, time_start, time_end, room_id, trainer_id, course_id, certification_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
  `;
    return [sql, [timetableId, dayOfWeek, timeStart, timeEnd, roomId, trainerId, courseId || null, certificationId || null]];
}

// Academic timetable: slots where course_id is set
function getAcademicTimetable(timetableId) {
    const sql = `
    SELECT ts.*, r.name AS room_name, u.full_name AS trainer_name,
           c.name AS course_name, c.code AS course_code,
           p.name AS program_name, al.name AS level_name
    FROM timetable_slots ts
    LEFT JOIN rooms r ON ts.room_id = r.id
    LEFT JOIN trainers tr ON ts.trainer_id = tr.id
    LEFT JOIN users u ON tr.user_id = u.id
    LEFT JOIN courses c ON ts.course_id = c.id
    LEFT JOIN sessions s ON c.session_id = s.id
    LEFT JOIN programs p ON s.program_id = p.id
    LEFT JOIN academic_levels al ON s.academic_level_id = al.id
    WHERE ts.timetable_id=$1 AND ts.course_id IS NOT NULL
    ORDER BY
      CASE ts.day_of_week
        WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
      END, ts.time_start
  `;
    return [sql, [timetableId]];
}

// Certification timetable: slots where certification_id is set
function getCertificationTimetable(timetableId) {
    const sql = `
    SELECT ts.*, r.name AS room_name, u.full_name AS trainer_name,
           cert.name AS certification_name, cert.code AS certification_code
    FROM timetable_slots ts
    LEFT JOIN rooms r ON ts.room_id = r.id
    LEFT JOIN trainers tr ON ts.trainer_id = tr.id
    LEFT JOIN users u ON tr.user_id = u.id
    LEFT JOIN certifications cert ON ts.certification_id = cert.id
    WHERE ts.timetable_id=$1 AND ts.certification_id IS NOT NULL
    ORDER BY
      CASE ts.day_of_week
        WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
      END, ts.time_start
  `;
    return [sql, [timetableId]];
}

// Student timetable: slots for the program the student is enrolled in
function getStudentTimetable(studentId) {
    const sql = `
    SELECT ts.day_of_week, ts.time_start, ts.time_end,
           r.name AS room_name, u.full_name AS trainer_name,
           c.name AS course_name, cert.name AS certification_name,
           t.week_start
    FROM enrollments e
    JOIN timetables t ON t.academic_year_id = e.academic_year_id
    JOIN timetable_slots ts ON ts.timetable_id = t.id
    LEFT JOIN courses c ON ts.course_id = c.id
    LEFT JOIN certifications cert ON ts.certification_id = cert.id
    LEFT JOIN sessions s ON c.session_id = s.id
    LEFT JOIN rooms r ON ts.room_id = r.id
    LEFT JOIN trainers tr ON ts.trainer_id = tr.id
    LEFT JOIN users u ON tr.user_id = u.id
    WHERE e.student_id=$1 AND t.status='published'
      AND (s.program_id = e.program_id OR ts.certification_id = e.certification_id)
    ORDER BY
      CASE ts.day_of_week
        WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
      END, ts.time_start
  `;
    return [sql, [studentId]];
}

function getLatestTimetable() {
    const sql = `SELECT * FROM timetables ORDER BY generated_at DESC LIMIT 1`;
    return [sql, []];
}

function publishTimetable(id) {
    return [`UPDATE timetables SET status='published' WHERE id=$1 RETURNING *`, [id]];
}

module.exports = {
    createTimetable,
    getTimetableById,
    checkTrainerConflict,
    checkRoomConflict,
    createTimetableSlot,
    getAcademicTimetable,
    getCertificationTimetable,
    getStudentTimetable,
    getLatestTimetable,
    publishTimetable,
};