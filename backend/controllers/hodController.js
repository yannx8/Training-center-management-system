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
    getPublishedWeeksByDepartment,
    getLatestAcademicWeek,
    getLatestPublishedWeek,
    getActiveAcademicWeek,
    publishAcademicWeek,
    createCertTimetableSlot,
    deleteCertSlotsForWeek,
    createAnnouncement,
    getAnnouncementsByDepartment,
} = require('../queries/timetables');

async function getHodDepartment(userId) {
    const r = await pool.query(
        `SELECT id AS dept_id, name AS dept_name FROM departments WHERE hod_user_id = $1 LIMIT 1`, [userId]
    );
    return r.rows[0] || null;
}

// GET /hod/dashboard
async function getDashboard(req, res) {
    const dept = await getHodDepartment(req.user.userId);
    if (!dept)
        return res.status(404).json({ success: false, message: 'No department assigned', code: 'NO_DEPT' });

    const programsRes = await pool.query(
        `SELECT id, name, code, status FROM programs WHERE department_id = $1 ORDER BY name`, [dept.dept_id]
    );
    const programs = [];
    for (const prog of programsRes.rows) {
        const coursesRes = await pool.query(
            `SELECT c.id, c.name, c.code, c.credits, u.full_name AS trainer_name
             FROM sessions s JOIN courses c ON c.session_id = s.id
             LEFT JOIN trainer_courses tc ON tc.course_id = c.id
             LEFT JOIN trainers tr ON tc.trainer_id = tr.id
             LEFT JOIN users u ON tr.user_id = u.id
             WHERE s.program_id = $1 ORDER BY c.name`, [prog.id]
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

    const [sql, params] = createAcademicWeek(
        academicYearId, weekNumber, label, startDate, endDate, req.user.userId, dept.dept_id
    );
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

// GET /hod/weeks/published — published weeks (for trainer availability)
async function getPublishedWeeksHandler(req, res) {
    const dept = await getHodDepartment(req.user.userId);
    if (!dept)
        return res.status(404).json({ success: false, message: 'No department assigned', code: 'NO_DEPT' });
    const [sql, params] = getPublishedWeeksByDepartment(dept.dept_id);
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

async function getActiveWeekHandler(req, res) { return getLatestWeekHandler(req, res); }

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
                aw.label AS week_label, aw.start_date, aw.end_date, aw.id AS week_id
         FROM availability a
         JOIN trainers t ON a.trainer_id = t.id
         JOIN users u ON t.user_id = u.id
         LEFT JOIN academic_weeks aw ON a.academic_week_id = aw.id
         WHERE aw.department_id = $1 ${weekId ? 'AND a.academic_week_id = $2' : ''}
         ORDER BY
             CASE a.day_of_week WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2
                 WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4
                 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 END,
             a.time_start, u.full_name`, [dept.dept_id, ...(weekId ? [weekId] : [])]
    );
    return res.json({ success: true, data: r.rows });
}

// POST /hod/availability/lock & unlock
async function lockAvailabilityHandler(req, res) {
    const { weekId } = req.body;
    if (!weekId)
        return res.status(400).json({ success: false, message: 'weekId required', code: 'MISSING_FIELDS' });
    const [sql, params] = upsertAvailabilityLock(req.user.userId, weekId, true);
    await pool.query(sql, params);
    return res.json({ success: true, data: { locked: true } });
}

async function unlockAvailabilityHandler(req, res) {
    const { weekId } = req.body;
    if (!weekId)
        return res.status(400).json({ success: false, message: 'weekId required', code: 'MISSING_FIELDS' });
    const [sql, params] = upsertAvailabilityLock(req.user.userId, weekId, false);
    await pool.query(sql, params);
    return res.json({ success: true, data: { locked: false } });
}

async function getLockStatus(req, res) {
    const { weekId } = req.query;
    const [sql, params] = getAvailabilityLock(req.user.userId, weekId);
    const r = await pool.query(sql, params);
    return res.json({ success: true, data: { isLocked: r.rows.length ? r.rows[0].is_locked : false } });
}

// POST /hod/timetable/generate  — ACADEMIC timetable only
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
        return res.status(400).json({ success: false, message: 'No available rooms', code: 'NO_ROOMS' });

    // Candidates: trainer-available slots for trainers in this dept who have course assignments
    const candidatesRes = await pool.query(
        `SELECT t.id AS trainer_id, u.full_name AS trainer_name,
                a.day_of_week, a.time_start, a.time_end,
                c.id AS course_id, c.name AS course_name
         FROM availability a
         JOIN trainers t ON a.trainer_id = t.id
         JOIN users u ON t.user_id = u.id
         JOIN trainer_courses tc ON tc.trainer_id = t.id AND tc.course_id IS NOT NULL
         JOIN courses c ON tc.course_id = c.id
         JOIN sessions s ON c.session_id = s.id
         JOIN programs p ON s.program_id = p.id
         WHERE p.department_id = $1
           AND a.academic_week_id = $2
         ORDER BY t.id, a.day_of_week, a.time_start`, [dept.dept_id, weekId]
    );

    if (!candidatesRes.rows.length)
        return res.status(400).json({ success: false, message: 'No trainer availability found for this week', code: 'NO_CANDIDATES' });

    const [ttSql, ttParams] = createTimetable(
        weekId, req.user.userId,
        label || `${dept.dept_name} — Week ${new Date().toLocaleDateString()}`
    );
    const ttRes = await pool.query(ttSql, ttParams);
    const timetableId = ttRes.rows[0].id;

    const trainerBooked = new Set();
    const roomBooked = new Set();
    let scheduled = 0,
        skipped = 0;

    for (const c of candidatesRes.rows) {
        const tKey = `${c.trainer_id}|${c.day_of_week}|${c.time_start}`;
        if (trainerBooked.has(tKey)) { skipped++; continue; }

        const [tcSql, tcParams] = checkTrainerConflict(c.trainer_id, c.day_of_week, c.time_start, c.time_end, weekId);
        const tcRes = await pool.query(tcSql, tcParams);
        if (tcRes.rows.length) { skipped++; continue; }

        let chosenRoom = null;
        for (const room of rooms) {
            const rKey = `${room.id}|${c.day_of_week}|${c.time_start}`;
            if (roomBooked.has(rKey)) continue;
            const [rcSql, rcParams] = checkRoomConflict(room.id, c.day_of_week, c.time_start, c.time_end, weekId);
            const rcRes = await pool.query(rcSql, rcParams);
            if (!rcRes.rows.length) { chosenRoom = room;
                roomBooked.add(rKey); break; }
        }
        if (!chosenRoom) { skipped++; continue; }

        const [insSql, insParams] = createTimetableSlot(
            timetableId, c.day_of_week, c.time_start, c.time_end, chosenRoom.id, c.trainer_id, c.course_id, weekId
        );
        await pool.query(insSql, insParams);
        trainerBooked.add(tKey);
        scheduled++;
    }

    return res.status(201).json({ success: true, data: { timetableId, scheduled, skipped } });
}

// POST /hod/cert-timetable/generate — CERTIFICATION timetable
// Intersects trainer availability + student availability for each cert in this dept
async function generateCertTimetable(req, res) {
    const { weekId } = req.body;
    if (!weekId)
        return res.status(400).json({ success: false, message: 'weekId required', code: 'MISSING_FIELDS' });

    const dept = await getHodDepartment(req.user.userId);
    if (!dept)
        return res.status(404).json({ success: false, message: 'No department assigned', code: 'NO_DEPT' });

    // Get all certs in this dept
    const certsRes = await pool.query(
        `SELECT DISTINCT cert.id, cert.name
         FROM certifications cert
         JOIN trainer_courses tc ON tc.certification_id = cert.id
         JOIN trainers tr ON tc.trainer_id = tr.id
         JOIN users u ON tr.user_id = u.id
         WHERE u.department = $1`, [dept.dept_name]
    );

    const rooms = (await pool.query(`SELECT id, name FROM rooms WHERE status = 'available' ORDER BY id`)).rows;

    let totalScheduled = 0,
        totalSkipped = 0;

    for (const cert of certsRes.rows) {
        // Delete existing slots for this cert+week
        const [delSql, delParams] = deleteCertSlotsForWeek(cert.id, weekId);
        await pool.query(delSql, delParams);

        // Get trainer for this cert
        const trainerRes = await pool.query(
            `SELECT tr.id AS trainer_id, u.full_name
             FROM trainer_courses tc
             JOIN trainers tr ON tc.trainer_id = tr.id
             JOIN users u ON tr.user_id = u.id
             WHERE tc.certification_id = $1 LIMIT 1`, [cert.id]
        );
        if (!trainerRes.rows.length) continue;
        const trainer = trainerRes.rows[0];

        // Trainer availability for this week
        const trainerAvail = await pool.query(
            `SELECT day_of_week, time_start, time_end FROM availability
             WHERE trainer_id = $1 AND academic_week_id = $2`, [trainer.trainer_id, weekId]
        );

        // Get enrolled students for this cert
        const studentsRes = await pool.query(
            `SELECT e.student_id FROM enrollments e WHERE e.certification_id = $1`, [cert.id]
        );
        if (!studentsRes.rows.length) continue;
        const studentIds = studentsRes.rows.map(r => r.student_id);

        // For each trainer slot, check if ALL enrolled students are also available
        for (const tSlot of trainerAvail.rows) {
            // Check trainer conflict
            const [tcSql, tcParams] = checkTrainerConflict(trainer.trainer_id, tSlot.day_of_week, tSlot.time_start, tSlot.time_end, weekId);
            const tcRes = await pool.query(tcSql, tcParams);
            if (tcRes.rows.length) { totalSkipped++; continue; }

            // Check all students are available in this slot
            let allStudentsAvail = true;
            for (const sid of studentIds) {
                const sAvail = await pool.query(
                    `SELECT id FROM student_availability
                     WHERE student_id=$1 AND academic_week_id=$2 AND day_of_week=$3
                       AND time_start <= $4::time AND time_end >= $5::time`, [sid, weekId, tSlot.day_of_week, tSlot.time_start, tSlot.time_end]
                );
                if (!sAvail.rows.length) { allStudentsAvail = false; break; }
            }
            if (!allStudentsAvail) { totalSkipped++; continue; }

            // Find available room
            let chosenRoom = null;
            for (const room of rooms) {
                const [rcSql, rcParams] = checkRoomConflict(room.id, tSlot.day_of_week, tSlot.time_start, tSlot.time_end, weekId);
                const rcRes = await pool.query(rcSql, rcParams);
                if (!rcRes.rows.length) { chosenRoom = room; break; }
            }

            const [insSql, insParams] = createCertTimetableSlot(
                cert.id, trainer.trainer_id, weekId,
                tSlot.day_of_week, tSlot.time_start, tSlot.time_end,
                chosenRoom ? chosenRoom.id : null
            );
            await pool.query(insSql, insParams);
            totalScheduled++;
        }
    }

    return res.status(201).json({
        success: true,
        data: { scheduled: totalScheduled, skipped: totalSkipped, message: `${totalScheduled} cert sessions scheduled` },
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

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────

// POST /hod/announcements
async function createAnnouncementHandler(req, res) {
    const { title, body, targetRole } = req.body;
    if (!title || !body)
        return res.status(400).json({ success: false, message: 'title and body required', code: 'MISSING_FIELDS' });

    const dept = await getHodDepartment(req.user.userId);
    if (!dept)
        return res.status(404).json({ success: false, message: 'No department assigned', code: 'NO_DEPT' });

    const [sql, params] = createAnnouncement(title, body, targetRole || null, dept.dept_id, req.user.userId);
    const result = await pool.query(sql, params);
    return res.status(201).json({ success: true, data: result.rows[0] });
}

// GET /hod/announcements
async function getAnnouncementsHandler(req, res) {
    const dept = await getHodDepartment(req.user.userId);
    if (!dept)
        return res.status(404).json({ success: false, message: 'No department assigned', code: 'NO_DEPT' });
    const [sql, params] = getAnnouncementsByDepartment(dept.dept_id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

module.exports = {
    getDashboard,
    getProgramsHandler,
    createAcademicWeekHandler,
    getAcademicWeeksHandler,
    getPublishedWeeksHandler,
    getLatestWeekHandler,
    getActiveWeekHandler,
    publishWeekHandler,
    getAvailabilityHandler,
    getLockStatus,
    lockAvailabilityHandler,
    unlockAvailabilityHandler,
    generateTimetable,
    generateCertTimetable,
    getTimetablesHandler,
    getTimetableByProgramHandler,
    publishTimetableHandler,
    createAnnouncementHandler,
    getAnnouncementsHandler,
};