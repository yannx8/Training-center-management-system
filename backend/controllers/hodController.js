// FILE: /backend/controllers/hodController.js
const pool = require('../config/db');
const { upsertAvailabilityLock, getAvailabilityLock } = require('../queries/trainers');
const {
    createTimetable,
    checkTrainerConflict,
    checkRoomConflict,
    createTimetableSlot,
    getAllTimetables,
    getTimetableByProgram,
    publishTimetable,
} = require('../queries/timetables');

// ── helper: get HOD's department from departments table ──────────────────────
async function getHodDepartment(userId) {
    const r = await pool.query(
        `SELECT id AS dept_id, name AS dept_name
         FROM departments
         WHERE hod_user_id = $1
         LIMIT 1`, [userId]
    );
    return r.rows[0] || null;
}

// GET /hod/dashboard
// Returns department name + all programs with their courses and assigned trainers
async function getDashboard(req, res) {
    const dept = await getHodDepartment(req.user.userId);
    if (!dept)
        return res.status(404).json({ success: false, message: 'No department assigned to this HOD account', code: 'NO_DEPT' });

    const programsRes = await pool.query(
        `SELECT id, name, code, status
         FROM programs
         WHERE department_id = $1
         ORDER BY name`, [dept.dept_id]
    );

    const programs = [];
    for (const prog of programsRes.rows) {
        const coursesRes = await pool.query(
            `SELECT c.id, c.name, c.code, c.credits, c.hours_per_week,
                    u.full_name AS trainer_name
             FROM sessions s
             JOIN courses c ON c.session_id = s.id
             LEFT JOIN trainer_courses tc ON tc.course_id = c.id
             LEFT JOIN trainers        tr ON tc.trainer_id = tr.id
             LEFT JOIN users           u  ON tr.user_id   = u.id
             WHERE s.program_id = $1
             ORDER BY c.name`, [prog.id]
        );
        programs.push({...prog, courses: coursesRes.rows });
    }

    return res.json({
        success: true,
        data: { department: dept.dept_name, programs },
    });
}

// GET /hod/programs  — lightweight list for the timetable program selector
async function getProgramsHandler(req, res) {
    const dept = await getHodDepartment(req.user.userId);
    if (!dept)
        return res.status(404).json({ success: false, message: 'No department assigned', code: 'NO_DEPT' });

    const r = await pool.query(
        `SELECT id, name, code FROM programs WHERE department_id = $1 ORDER BY name`, [dept.dept_id]
    );
    return res.json({ success: true, data: r.rows });
}

// GET /hod/availability
// All trainer availability in HOD's department, grouped naturally by day
async function getAvailabilityHandler(req, res) {
    const dept = await getHodDepartment(req.user.userId);
    if (!dept)
        return res.status(404).json({ success: false, message: 'No department assigned', code: 'NO_DEPT' });

    const r = await pool.query(
        `SELECT a.id, a.day_of_week, a.time_start, a.time_end,
                t.id AS trainer_id, u.full_name AS trainer_name
         FROM availability a
         JOIN trainers t ON a.trainer_id = t.id
         JOIN users    u ON t.user_id    = u.id
         WHERE u.department = $1
         ORDER BY
           CASE a.day_of_week
             WHEN 'Monday'    THEN 1
             WHEN 'Tuesday'   THEN 2
             WHEN 'Wednesday' THEN 3
             WHEN 'Thursday'  THEN 4
             WHEN 'Friday'    THEN 5
             WHEN 'Saturday'  THEN 6
           END,
           a.time_start,
           u.full_name`, [dept.dept_name]
    );
    return res.json({ success: true, data: r.rows });
}

async function getLockStatus(req, res) {
    const [sql, params] = getAvailabilityLock(req.user.userId);
    const r = await pool.query(sql, params);
    return res.json({ success: true, data: { isLocked: r.rows.length ? r.rows[0].is_locked : false } });
}

async function lockAvailabilityHandler(req, res) {
    const [sql, params] = upsertAvailabilityLock(req.user.userId, true);
    await pool.query(sql, params);
    return res.json({ success: true, data: { locked: true } });
}

async function unlockAvailabilityHandler(req, res) {
    const [sql, params] = upsertAvailabilityLock(req.user.userId, false);
    await pool.query(sql, params);
    return res.json({ success: true, data: { locked: false } });
}

// POST /hod/timetable/generate
// Algorithm (simple, conflict-safe):
//   1. Load all available rooms
//   2. Load all (trainer, availability_slot, course) triples for HOD's dept
//   3. For each triple:
//      a. Skip if trainer already scheduled that day+time IN THIS RUN (in-memory)
//      b. Skip if trainer has existing DB slot that day+time (DB conflict check)
//      c. Find first free room for that day+time (in-memory + DB check)
//      d. Insert slot
// Guarantees: no trainer double-booking, no room double-booking
async function generateTimetable(req, res) {
    const { label } = req.body;
    const dept = await getHodDepartment(req.user.userId);
    if (!dept)
        return res.status(404).json({ success: false, message: 'No department assigned', code: 'NO_DEPT' });

    // 1. Available rooms
    const roomsRes = await pool.query(
        `SELECT id, name FROM rooms WHERE status = 'available' ORDER BY id`
    );
    const rooms = roomsRes.rows;
    if (!rooms.length)
        return res.status(400).json({ success: false, message: 'No available rooms in the system', code: 'NO_ROOMS' });

    // 2. All trainer-availability × course combinations for this dept
    // Each row = one (trainer, availability slot, course) — a candidate session
    const candidatesRes = await pool.query(
        `SELECT
           t.id          AS trainer_id,
           u.full_name   AS trainer_name,
           a.day_of_week,
           a.time_start,
           a.time_end,
           c.id          AS course_id,
           c.name        AS course_name
         FROM availability a
         JOIN trainers       t  ON a.trainer_id  = t.id
         JOIN users          u  ON t.user_id     = u.id
         JOIN trainer_courses tc ON tc.trainer_id = t.id
         JOIN courses        c  ON tc.course_id  = c.id
         WHERE u.department = $1
           AND tc.course_id IS NOT NULL
         ORDER BY t.id, a.day_of_week, a.time_start`, [dept.dept_name]
    );

    if (!candidatesRes.rows.length)
        return res.status(400).json({
            success: false,
            message: 'No trainer availability or course assignments found in this department',
            code: 'NO_CANDIDATES',
        });

    // 3. Create timetable header
    const [ttSql, ttParams] = createTimetable(
        req.user.userId,
        label || `${dept.dept_name} — ${new Date().toLocaleDateString()}`
    );
    const ttRes = await pool.query(ttSql, ttParams);
    const timetableId = ttRes.rows[0].id;

    // In-memory conflict trackers for slots added IN THIS GENERATION RUN
    // Key format: "id|day|HH:MM"
    const trainerBooked = new Set(); // trainerId|day|timeStart
    const roomBooked = new Set(); // roomId|day|timeStart

    let scheduled = 0;
    let skipped = 0;

    for (const c of candidatesRes.rows) {
        const tKey = `${c.trainer_id}|${c.day_of_week}|${c.time_start}`;

        // a. In-memory trainer conflict (current run)
        if (trainerBooked.has(tKey)) { skipped++; continue; }

        // b. DB trainer conflict (pre-existing timetable slots)
        const [tcSql, tcParams] = checkTrainerConflict(c.trainer_id, c.day_of_week, c.time_start, c.time_end);
        const tcRes = await pool.query(tcSql, tcParams);
        if (tcRes.rows.length) { skipped++; continue; }

        // c. Find a free room
        let chosenRoom = null;
        for (const room of rooms) {
            const rKey = `${room.id}|${c.day_of_week}|${c.time_start}`;
            if (roomBooked.has(rKey)) continue;

            const [rcSql, rcParams] = checkRoomConflict(room.id, c.day_of_week, c.time_start, c.time_end);
            const rcRes = await pool.query(rcSql, rcParams);
            if (!rcRes.rows.length) {
                chosenRoom = room;
                roomBooked.add(rKey);
                break;
            }
        }
        if (!chosenRoom) { skipped++; continue; }

        // d. Insert slot
        const [insSql, insParams] = createTimetableSlot(
            timetableId, c.day_of_week, c.time_start, c.time_end,
            chosenRoom.id, c.trainer_id, c.course_id
        );
        await pool.query(insSql, insParams);
        trainerBooked.add(tKey);
        scheduled++;
    }

    return res.status(201).json({
        success: true,
        data: {
            timetableId,
            scheduled,
            skipped,
            message: `Done — ${scheduled} sessions scheduled, ${skipped} skipped (conflicts / no free room)`,
        },
    });
}

// GET /hod/timetables  — list for the dropdown
async function getTimetablesHandler(req, res) {
    const [sql, params] = getAllTimetables();
    const r = await pool.query(sql, params);
    return res.json({ success: true, data: r.rows });
}

// GET /hod/timetable/:timetableId/program/:programId
async function getTimetableByProgramHandler(req, res) {
    const { timetableId, programId } = req.params;
    const [sql, params] = getTimetableByProgram(timetableId, programId);
    const r = await pool.query(sql, params);
    return res.json({ success: true, data: r.rows });
}

// PUT /hod/timetable/:id/publish
async function publishTimetableHandler(req, res) {
    const { id } = req.params;
    const [sql, params] = publishTimetable(id);
    const r = await pool.query(sql, params);
    if (!r.rows.length)
        return res.status(404).json({ success: false, message: 'Timetable not found', code: 'NOT_FOUND' });
    return res.json({ success: true, data: r.rows[0] });
}

module.exports = {
    getDashboard,
    getProgramsHandler,
    getAvailabilityHandler,
    getLockStatus,
    lockAvailabilityHandler,
    unlockAvailabilityHandler,
    generateTimetable,
    getTimetablesHandler,
    getTimetableByProgramHandler,
    publishTimetableHandler,
};