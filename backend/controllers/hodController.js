// FILE: /backend/controllers/hodController.js
const pool = require('../config/db');
const { upsertAvailabilityLock, getAvailabilityLock } = require('../queries/trainers');
const {
    createTimetable,
    checkTrainerConflict,
    checkRoomConflict,
    createTimetableSlot,
    getAllTimetables,
    getTimetablesByDepartment,
    getTimetableByProgram,
    publishTimetable,
    createAcademicWeek,
    getAcademicWeeksByDepartment,
    getLatestAcademicWeek,
    getActiveAcademicWeek,
    publishAcademicWeek,
} = require('../queries/timetables');

// Helper: get HOD's department
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
             LEFT JOIN trainers tr ON tc.trainer_id = tr.id
             LEFT JOIN users u ON tr.user_id = u.id
             WHERE s.program_id = $1
             ORDER BY c.name`, [prog.id]
        );
        programs.push({...prog, courses: coursesRes.rows });
    }

    return res.json({ success: true, data: { department: dept.dept_name, programs } });
}

// GET /hod/programs
async function getProgramsHandler(req, res) {
    const dept = await getHodDepartment(req.user.userId);
    if (!dept)
        return res.status(404).json({ success: false, message: 'No department assigned', code: 'NO_DEPT' });

    const result = await pool.query(
        `SELECT id, name, code, status FROM programs WHERE department_id = $1 ORDER BY name`, [dept.dept_id]
    );
    return res.json({ success: true, data: result.rows });
}

// POST /hod/weeks
async function createAcademicWeekHandler(req, res) {
    const dept = await getHodDepartment(req.user.userId);
    if (!dept)
        return res.status(404).json({ success: false, message: 'No department assigned', code: 'NO_DEPT' });

    const { weekNumber, label, startDate, endDate, academicYearId } = req.body;
    if (!weekNumber || !label || !startDate || !endDate)
        return res.status(400).json({ success: false, message: 'weekNumber, label, startDate, endDate required', code: 'MISSING_FIELDS' });

    const [sql, params] = createAcademicWeek(academicYearId, weekNumber, label, startDate, endDate, req.user.userId);
    const result = await pool.query(sql, params);
    return res.status(201).json({ success: true, data: result.rows[0] });
}

// GET /hod/weeks
async function getAcademicWeeksHandler(req, res) {
    const dept = await getHodDepartment(req.user.userId);
    if (!dept)
        return res.status(404).json({ success: false, message: 'No department assigned', code: 'NO_DEPT' });

    const [sql, params] = getAcademicWeeksByDepartment(dept.dept_id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// GET /hod/weeks/latest
async function getLatestWeekHandler(req, res) {
    const dept = await getHodDepartment(req.user.userId);
    if (!dept)
        return res.status(404).json({ success: false, message: 'No department assigned', code: 'NO_DEPT' });

    const [sql, params] = getLatestAcademicWeek(dept.dept_id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows[0] || null });
}

// GET /hod/weeks/active (alias)
async function getActiveWeekHandler(req, res) {
    return getLatestWeekHandler(req, res);
}

// PUT /hod/weeks/:id/publish
async function publishWeekHandler(req, res) {
    const { id } = req.params;
    const [sql, params] = publishAcademicWeek(id);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Week not found', code: 'NOT_FOUND' });
    return res.json({ success: true, data: result.rows[0] });
}

// GET /hod/availability
async function getAvailabilityHandler(req, res) {
    const dept = await getHodDepartment(req.user.userId);
    if (!dept)
        return res.status(404).json({ success: false, message: 'No department assigned', code: 'NO_DEPT' });

    const { weekId } = req.query;
    const r = await pool.query(
        `SELECT a.id, a.day_of_week, a.time_start, a.time_end,
                t.id AS trainer_id, u.full_name AS trainer_name,
                aw.label as week_label, aw.start_date, aw.end_date, aw.id as week_id
         FROM availability a
         JOIN trainers t ON a.trainer_id = t.id
         JOIN users u ON t.user_id = u.id
         LEFT JOIN academic_weeks aw ON a.academic_week_id = aw.id
         WHERE u.department = $1 ${weekId ? 'AND a.academic_week_id = $2' : ''}
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
             u.full_name`, [dept.dept_name, ...(weekId ? [weekId] : [])]
    );
    return res.json({ success: true, data: r.rows });
}

// POST /hod/availability/lock
async function lockAvailabilityHandler(req, res) {
    const { weekId } = req.body;
    if (!weekId)
        return res.status(400).json({ success: false, message: 'weekId required', code: 'MISSING_FIELDS' });
    const [sql, params] = upsertAvailabilityLock(req.user.userId, weekId, true);
    await pool.query(sql, params);
    return res.json({ success: true, data: { locked: true } });
}

// POST /hod/availability/unlock
async function unlockAvailabilityHandler(req, res) {
    const { weekId } = req.body;
    if (!weekId)
        return res.status(400).json({ success: false, message: 'weekId required', code: 'MISSING_FIELDS' });
    const [sql, params] = upsertAvailabilityLock(req.user.userId, weekId, false);
    await pool.query(sql, params);
    return res.json({ success: true, data: { locked: false } });
}

// GET /hod/availability/lock-status
async function getLockStatus(req, res) {
    const { weekId } = req.query;
    const [sql, params] = getAvailabilityLock(req.user.userId, weekId);
    const r = await pool.query(sql, params);
    return res.json({ success: true, data: { isLocked: r.rows.length ? r.rows[0].is_locked : false } });
}

// POST /hod/timetable/generate
async function generateTimetable(req, res) {
    const { weekId, label } = req.body;
    if (!weekId)
        return res.status(400).json({ success: false, message: 'weekId required', code: 'MISSING_FIELDS' });

    const dept = await getHodDepartment(req.user.userId);
    if (!dept)
        return res.status(404).json({ success: false, message: 'No department assigned', code: 'NO_DEPT' });

    const roomsRes = await pool.query(`SELECT id, name FROM rooms WHERE status = 'available' ORDER BY id`);
    const rooms = roomsRes.rows;
    if (!rooms.length)
        return res.status(400).json({ success: false, message: 'No available rooms in the system', code: 'NO_ROOMS' });

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
         AND a.academic_week_id = $2
         AND tc.course_id IS NOT NULL
         ORDER BY t.id, a.day_of_week, a.time_start`, [dept.dept_name, weekId]
    );

    if (!candidatesRes.rows.length)
        return res.status(400).json({
            success: false,
            message: 'No trainer availability or course assignments found for this week',
            code: 'NO_CANDIDATES',
        });

    const [ttSql, ttParams] = createTimetable(
        weekId,
        req.user.userId,
        label || `${dept.dept_name} — Week ${new Date().toLocaleDateString()}`
    );
    const ttRes = await pool.query(ttSql, ttParams);
    const timetableId = ttRes.rows[0].id;

    const trainerBooked = new Set();
    const roomBooked = new Set();
    let scheduled = 0;
    let skipped = 0;

    for (const c of candidatesRes.rows) {
        const tKey = `${c.trainer_id}|${c.day_of_week}|${c.time_start}`;
        if (trainerBooked.has(tKey)) { skipped++; continue; }

        const [tcSql, tcParams] = checkTrainerConflict(c.trainer_id, c.day_of_week, c.time_start, c.time_end);
        const tcRes = await pool.query(tcSql, tcParams);
        if (tcRes.rows.length) { skipped++; continue; }

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

        const [insSql, insParams] = createTimetableSlot(
            timetableId, c.day_of_week, c.time_start, c.time_end,
            chosenRoom.id, c.trainer_id, c.course_id, weekId
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
            message: `Done — ${scheduled} sessions scheduled, ${skipped} skipped`,
        },
    });
}

// GET /hod/timetables
async function getTimetablesHandler(req, res) {
    const dept = await getHodDepartment(req.user.userId);
    if (!dept)
        return res.status(404).json({ success: false, message: 'No department assigned', code: 'NO_DEPT' });

    const [sql, params] = getTimetablesByDepartment(dept.dept_id);
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
    createAcademicWeekHandler,
    getAcademicWeeksHandler,
    getLatestWeekHandler,
    getActiveWeekHandler,
    publishWeekHandler,
    getAvailabilityHandler,
    getLockStatus,
    lockAvailabilityHandler,
    unlockAvailabilityHandler,
    generateTimetable,
    getTimetablesHandler,
    getTimetableByProgramHandler,
    publishTimetableHandler,
};