// FILE: /backend/controllers/hodController.js
const pool = require('../config/db');
const { getTrainerByUserId, getAvailabilityLock, upsertAvailabilityLock } = require('../queries/trainers');
const {
    createTimetable,
    checkTrainerConflict,
    checkRoomConflict,
    createTimetableSlot,
    getAcademicTimetable,
    getCertificationTimetable,
    getLatestTimetable,
    publishTimetable
} = require('../queries/timetables');

async function getAvailabilityHandler(req, res) {
    // HOD sees all trainer availability in their department
    const result = await pool.query(`
    SELECT a.*, u.full_name AS trainer_name
    FROM availability a
    JOIN trainers t ON a.trainer_id = t.id
    JOIN users u ON t.user_id = u.id
    ORDER BY u.full_name, a.day_of_week, a.time_start
  `);
    return res.json({ success: true, data: result.rows });
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

async function getLockStatus(req, res) {
    const [sql, params] = getAvailabilityLock(req.user.userId);
    const result = await pool.query(sql, params);
    const isLocked = result.rows.length ? result.rows[0].is_locked : false;
    return res.json({ success: true, data: { isLocked } });
}

// Timetable generation:
// 1. Fetch all trainer courses + certifications
// 2. For each trainer's availability slot, attempt to schedule their courses
// 3. Check trainer conflict AND room conflict before inserting
// 4. On conflict: skip that slot (do not abort entire generation)
async function generateTimetable(req, res) {
    const { weekStart, academicYearId } = req.body;
    if (!weekStart || !academicYearId)
        return res.status(400).json({ success: false, message: 'weekStart and academicYearId required', code: 'MISSING_FIELDS' });

    // Get all available rooms
    const roomsResult = await pool.query(`SELECT id FROM rooms WHERE status='available'`);
    const rooms = roomsResult.rows;
    if (!rooms.length)
        return res.status(400).json({ success: false, message: 'No available rooms', code: 'NO_ROOMS' });

    // Get all trainer availability
    const availResult = await pool.query(`
    SELECT a.*, tc.course_id, tc.certification_id, t.id AS trainer_id
    FROM availability a
    JOIN trainers t ON a.trainer_id = t.id
    JOIN trainer_courses tc ON tc.trainer_id = t.id
    ORDER BY t.id
  `);
    const slots = availResult.rows;

    const [timetableSql, timetableParams] = createTimetable(academicYearId, req.user.userId, weekStart);
    const timetableResult = await pool.query(timetableSql, timetableParams);
    const timetableId = timetableResult.rows[0].id;

    let scheduled = 0;
    let skipped = 0;
    let roomIndex = 0;

    for (const slot of slots) {
        const roomId = rooms[roomIndex % rooms.length].id;

        // Check trainer conflict — skip this slot if conflict found
        const [trainerConflictSql, trainerConflictParams] = checkTrainerConflict(
            slot.trainer_id, slot.day_of_week, slot.time_start, slot.time_end, null
        );
        const trainerConflict = await pool.query(trainerConflictSql, trainerConflictParams);
        if (trainerConflict.rows.length) { skipped++; continue; }

        // Check room conflict — try next room if current room is taken
        const [roomConflictSql, roomConflictParams] = checkRoomConflict(
            roomId, slot.day_of_week, slot.time_start, slot.time_end, null
        );
        const roomConflict = await pool.query(roomConflictSql, roomConflictParams);
        if (roomConflict.rows.length) { skipped++; continue; }

        const [insertSql, insertParams] = createTimetableSlot(
            timetableId, slot.day_of_week, slot.time_start, slot.time_end,
            roomId, slot.trainer_id, slot.course_id, slot.certification_id
        );
        await pool.query(insertSql, insertParams);
        scheduled++;
        roomIndex++;
    }

    return res.status(201).json({
        success: true,
        data: { timetableId, scheduled, skipped, message: `Timetable generated: ${scheduled} slots scheduled, ${skipped} skipped due to conflicts` },
    });
}

async function getTimetableHandler(req, res) {
    const [latestSql, latestParams] = getLatestTimetable();
    const latestResult = await pool.query(latestSql, latestParams);
    if (!latestResult.rows.length)
        return res.json({ success: true, data: { academic: [], certification: [], timetable: null } });

    const timetableId = latestResult.rows[0].id;
    const [acaSql, acaParams] = getAcademicTimetable(timetableId);
    const [certSql, certParams] = getCertificationTimetable(timetableId);
    const [acadResult, certResult] = await Promise.all([
        pool.query(acaSql, acaParams),
        pool.query(certSql, certParams),
    ]);

    return res.json({
        success: true,
        data: {
            timetable: latestResult.rows[0],
            academic: acadResult.rows,
            certification: certResult.rows,
        },
    });
}

async function publishTimetableHandler(req, res) {
    const { id } = req.params;
    const [sql, params] = publishTimetable(id);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Timetable not found', code: 'NOT_FOUND' });
    return res.json({ success: true, data: result.rows[0] });
}

module.exports = { getAvailabilityHandler, lockAvailabilityHandler, unlockAvailabilityHandler, getLockStatus, generateTimetable, getTimetableHandler, publishTimetableHandler };