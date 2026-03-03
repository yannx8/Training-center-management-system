// FILE: /backend/queries/timetables.js

// Create a timetable without requiring academic_year_id
function createTimetable(generatedBy, label) {
    const sql = `
    INSERT INTO timetables (generated_by, label, status, generated_at)
    VALUES ($1, $2, 'draft', NOW())
    RETURNING *
  `;
    return [sql, [generatedBy, label || 'Timetable']];
}

function getTimetableById(id) {
    return [`SELECT * FROM timetables WHERE id=$1`, [id]];
}

// List all timetables — used for the dropdown selector in HOD view
function getAllTimetables() {
    const sql = `
    SELECT id, label, status, generated_at
    FROM timetables
    ORDER BY generated_at DESC
  `;
    return [sql, []];
}

// Conflict: same trainer, same day, overlapping time window
function checkTrainerConflict(trainerId, dayOfWeek, timeStart, timeEnd) {
    const sql = `
    SELECT id FROM timetable_slots
    WHERE trainer_id = $1
      AND day_of_week = $2
      AND NOT (time_end <= $3 OR time_start >= $4)
  `;
    return [sql, [trainerId, dayOfWeek, timeStart, timeEnd]];
}

// Conflict: same room, same day, overlapping time window
function checkRoomConflict(roomId, dayOfWeek, timeStart, timeEnd) {
    const sql = `
    SELECT id FROM timetable_slots
    WHERE room_id = $1
      AND day_of_week = $2
      AND NOT (time_end <= $3 OR time_start >= $4)
  `;
    return [sql, [roomId, dayOfWeek, timeStart, timeEnd]];
}

// Insert one slot — course_id only (certifications removed from timetable generation)
function createTimetableSlot(timetableId, dayOfWeek, timeStart, timeEnd, roomId, trainerId, courseId) {
    const sql = `
    INSERT INTO timetable_slots
      (timetable_id, day_of_week, time_start, time_end, room_id, trainer_id, course_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
    return [sql, [timetableId, dayOfWeek, timeStart, timeEnd, roomId, trainerId, courseId]];
}

// Slots for a given timetable filtered by program — what the HOD views
function getTimetableByProgram(timetableId, programId) {
    const sql = `
    SELECT
      ts.id,
      ts.day_of_week,
      ts.time_start,
      ts.time_end,
      r.name  AS room_name,
      r.code  AS room_code,
      u.full_name AS trainer_name,
      c.name  AS course_name,
      c.code  AS course_code,
      p.name  AS program_name
    FROM timetable_slots ts
    JOIN rooms    r  ON ts.room_id    = r.id
    JOIN trainers tr ON ts.trainer_id = tr.id
    JOIN users    u  ON tr.user_id    = u.id
    JOIN courses  c  ON ts.course_id  = c.id
    JOIN sessions s  ON c.session_id  = s.id
    JOIN programs p  ON s.program_id  = p.id
    WHERE ts.timetable_id = $1
      AND p.id = $2
    ORDER BY
      CASE ts.day_of_week
        WHEN 'Monday'    THEN 1
        WHEN 'Tuesday'   THEN 2
        WHEN 'Wednesday' THEN 3
        WHEN 'Thursday'  THEN 4
        WHEN 'Friday'    THEN 5
        WHEN 'Saturday'  THEN 6
      END,
      ts.time_start
  `;
    return [sql, [timetableId, programId]];
}

// Published timetable slots for a student's program
function getStudentTimetable(studentId) {
    const sql = `
    SELECT
      ts.day_of_week,
      ts.time_start,
      ts.time_end,
      r.name      AS room_name,
      u.full_name AS trainer_name,
      c.name      AS course_name,
      t.label     AS timetable_label
    FROM students st
    JOIN sessions      sess ON sess.program_id   = st.program_id
    JOIN courses       c    ON c.session_id      = sess.id
    JOIN timetable_slots ts ON ts.course_id      = c.id
    JOIN timetables    t    ON ts.timetable_id   = t.id AND t.status = 'published'
    LEFT JOIN rooms    r    ON ts.room_id        = r.id
    LEFT JOIN trainers tr   ON ts.trainer_id     = tr.id
    LEFT JOIN users    u    ON tr.user_id        = u.id
    WHERE st.id = $1
    ORDER BY
      CASE ts.day_of_week
        WHEN 'Monday'    THEN 1
        WHEN 'Tuesday'   THEN 2
        WHEN 'Wednesday' THEN 3
        WHEN 'Thursday'  THEN 4
        WHEN 'Friday'    THEN 5
        WHEN 'Saturday'  THEN 6
      END,
      ts.time_start
  `;
    return [sql, [studentId]];
}

// Trainer's published slots
function getTrainerTimetable(trainerId) {
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
      t.label AS timetable_label
    FROM timetable_slots ts
    JOIN timetables t   ON ts.timetable_id = t.id AND t.status = 'published'
    LEFT JOIN rooms r   ON ts.room_id      = r.id
    LEFT JOIN courses c ON ts.course_id    = c.id
    WHERE ts.trainer_id = $1
    ORDER BY
      CASE ts.day_of_week
        WHEN 'Monday'    THEN 1
        WHEN 'Tuesday'   THEN 2
        WHEN 'Wednesday' THEN 3
        WHEN 'Thursday'  THEN 4
        WHEN 'Friday'    THEN 5
        WHEN 'Saturday'  THEN 6
      END,
      ts.time_start
  `;
    return [sql, [trainerId]];
}

function publishTimetable(id) {
    return [`UPDATE timetables SET status='published' WHERE id=$1 RETURNING *`, [id]];
}

module.exports = {
    createTimetable,
    getTimetableById,
    getAllTimetables,
    checkTrainerConflict,
    checkRoomConflict,
    createTimetableSlot,
    getTimetableByProgram,
    getStudentTimetable,
    getTrainerTimetable,
    publishTimetable,
};