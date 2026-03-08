// FILE: /backend/controllers/trainerController.js
const pool = require('../config/db');
const {
    getTrainerByUserId, getMyCourses, getMyCertifications,
    getCourseStudents, getCertificationStudents,
    submitGradeForCourse, submitGradeForCertification,
    getMarkComplaints, reviewMarkComplaint,
    submitAvailability, getMyAvailability, deleteAvailability,
    getAvailabilityLock,
} = require('../queries/trainers');
const {
    // Academic weeks (published by HOD — trainer reads these for availability)
    getPublishedWeeksByDepartment,
    // Cert weeks (trainer manages these)
    createCertWeek, getCertWeeksByCert, getLatestPublishedCertWeek, publishCertWeek,
    // Academic timetable
    getTrainerTimetable, getAllTrainerWeeks,
    // Cert timetable generation
    createCertTimetableSlot, deleteCertSlotsForWeek,
    getCertTimetablesByTrainer, getCertTimetableSlots,
    checkTrainerConflict, checkRoomConflict,
    // Announcements
    getAnnouncementsForTrainer,
} = require('../queries/timetables');
const { gradeToLetter } = require('../helpers/gpa');

// ─── MIDDLEWARE: attach trainer to req ────────────────────────────────────────

async function getTrainer(req, res, next) {
    const [sql, params] = getTrainerByUserId(req.user.userId);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Trainer profile not found', code: 'NOT_FOUND' });
    req.trainer = result.rows[0];
    next();
}

// ─── COURSES & CERTIFICATIONS ─────────────────────────────────────────────────

async function getCoursesHandler(req, res) {
    const [sql, params] = getMyCourses(req.trainer.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function getCertificationsHandler(req, res) {
    const [sql, params] = getMyCertifications(req.trainer.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function getCourseStudentsHandler(req, res) {
    const [sql, params] = getCourseStudents(req.params.courseId);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function getCertificationStudentsHandler(req, res) {
    const [sql, params] = getCertificationStudents(req.params.certId);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// ─── GRADES ───────────────────────────────────────────────────────────────────

async function submitGradesHandler(req, res) {
    const { studentId, courseId, certificationId, grade, academicYearId } = req.body;
    if (!studentId || grade === undefined)
        return res.status(400).json({ success: false, message: 'studentId and grade required', code: 'MISSING_FIELDS' });
    if (!courseId && !certificationId)
        return res.status(400).json({ success: false, message: 'courseId or certificationId required', code: 'MISSING_SUBJECT' });

    const gradeLetter = gradeToLetter(parseFloat(grade));
    let result;
    if (courseId) {
        const [sql, params] = submitGradeForCourse(studentId, courseId, req.trainer.id, grade, gradeLetter, academicYearId);
        result = await pool.query(sql, params);
    } else {
        const [sql, params] = submitGradeForCertification(studentId, certificationId, req.trainer.id, grade, gradeLetter, academicYearId);
        result = await pool.query(sql, params);
    }
    return res.json({ success: true, data: result.rows[0] });
}

// ─── MARK COMPLAINTS ──────────────────────────────────────────────────────────

async function getMarkComplaintsHandler(req, res) {
    const [sql, params] = getMarkComplaints(req.trainer.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function reviewMarkComplaintHandler(req, res) {
    const { response } = req.body;
    if (!response)
        return res.status(400).json({ success: false, message: 'response required', code: 'MISSING_FIELDS' });
    const [sql, params] = reviewMarkComplaint(req.params.id, response);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Complaint not found', code: 'NOT_FOUND' });
    return res.json({ success: true, data: result.rows[0] });
}

// ─── TRAINER AVAILABILITY (for HOD-published academic weeks) ──────────────────

// GET /trainer/availability/published-weeks
// Returns all published ACADEMIC weeks from departments this trainer teaches in
async function getPublishedWeeksForTrainer(req, res) {
    // Get department(s) this trainer has course assignments in
    const deptRes = await pool.query(
        `SELECT DISTINCT p.department_id
         FROM trainer_courses tc
         JOIN courses c ON tc.course_id = c.id
         JOIN sessions s ON c.session_id = s.id
         JOIN programs p ON s.program_id = p.id
         WHERE tc.trainer_id = $1`,
        [req.trainer.id]
    );

    if (!deptRes.rows.length) {
        // Fallback: look up via users.department string
        const userDept = await pool.query(
            `SELECT d.id FROM departments d
             JOIN users u ON u.department = d.name
             WHERE u.id = $1 LIMIT 1`,
            [req.user.userId]
        );
        if (!userDept.rows.length) return res.json({ success: true, data: [] });
        const [sql, params] = getPublishedWeeksByDepartment(userDept.rows[0].id);
        const result = await pool.query(sql, params);
        return res.json({ success: true, data: result.rows });
    }

    const deptIds = deptRes.rows.map(r => r.department_id);
    const result = await pool.query(
        `SELECT DISTINCT aw.*, COALESCE(ay.name, '') AS year_name
         FROM academic_weeks aw
         LEFT JOIN academic_years ay ON aw.academic_year_id = ay.id
         WHERE aw.department_id = ANY($1)
           AND aw.week_type = 'academic'
           AND aw.status = 'published'
         ORDER BY aw.start_date DESC`,
        [deptIds]
    );
    return res.json({ success: true, data: result.rows });
}

// Legacy endpoint — returns latest published academic week
async function getActiveWeekForAvailability(req, res) {
    const deptRes = await pool.query(
        `SELECT DISTINCT p.department_id
         FROM trainer_courses tc
         JOIN courses c ON tc.course_id = c.id
         JOIN sessions s ON c.session_id = s.id
         JOIN programs p ON s.program_id = p.id
         WHERE tc.trainer_id = $1 LIMIT 1`,
        [req.trainer.id]
    );
    if (!deptRes.rows.length) return res.json({ success: true, data: null });
    const [sql, params] = getPublishedWeeksByDepartment(deptRes.rows[0].department_id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows[0] || null });
}

async function getAvailabilityHandler(req, res) {
    const { weekId } = req.query;
    const [sql, params] = getMyAvailability(req.trainer.id, weekId);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function submitAvailabilityHandler(req, res) {
    const { dayOfWeek, timeStart, timeEnd, weekId } = req.body;
    if (!dayOfWeek || !timeStart || !timeEnd || !weekId)
        return res.status(400).json({ success: false, message: 'dayOfWeek, timeStart, timeEnd, weekId required', code: 'MISSING_FIELDS' });

    const [lockSql, lockParams] = getAvailabilityLock(req.user.userId, weekId);
    const lockResult = await pool.query(lockSql, lockParams);
    if (lockResult.rows.length && lockResult.rows[0].is_locked)
        return res.status(403).json({ success: false, message: 'Availability submission is locked', code: 'AVAILABILITY_LOCKED' });

    const [sql, params] = submitAvailability(req.trainer.id, weekId, dayOfWeek, timeStart, timeEnd);
    const result = await pool.query(sql, params);
    return res.status(201).json({ success: true, data: result.rows[0] });
}

async function deleteAvailabilityHandler(req, res) {
    const [sql, params] = deleteAvailability(req.params.id, req.trainer.id);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Slot not found', code: 'NOT_FOUND' });
    return res.json({ success: true, data: { deleted: true } });
}

// ─── CERTIFICATION WEEK MANAGEMENT ───────────────────────────────────────────

// Helper: verify this trainer is assigned to the given certification
async function trainerOwnsCert(trainerId, certificationId) {
    const r = await pool.query(
        `SELECT id FROM trainer_courses WHERE trainer_id=$1 AND certification_id=$2`,
        [trainerId, certificationId]
    );
    return r.rows.length > 0;
}

// GET /trainer/cert-weeks/:certId
// All weeks for a certification (trainer's management list)
async function getCertWeeksHandler(req, res) {
    const { certId } = req.params;
    if (!await trainerOwnsCert(req.trainer.id, certId))
        return res.status(403).json({ success: false, message: 'Not assigned to this certification', code: 'FORBIDDEN' });

    const [sql, params] = getCertWeeksByCert(certId);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// POST /trainer/cert-weeks
// Trainer creates a new week for their certification
async function createCertWeekHandler(req, res) {
    const { certificationId, weekNumber, label, startDate, endDate } = req.body;
    if (!certificationId || !weekNumber || !label || !startDate || !endDate)
        return res.status(400).json({ success: false, message: 'certificationId, weekNumber, label, startDate, endDate required', code: 'MISSING_FIELDS' });

    if (!await trainerOwnsCert(req.trainer.id, certificationId))
        return res.status(403).json({ success: false, message: 'Not assigned to this certification', code: 'FORBIDDEN' });

    const [sql, params] = createCertWeek(certificationId, weekNumber, label, startDate, endDate, req.user.userId);
    const result = await pool.query(sql, params);
    return res.status(201).json({ success: true, data: result.rows[0] });
}

// PUT /trainer/cert-weeks/:weekId/publish
// Trainer publishes the week so enrolled students can submit availability
async function publishCertWeekHandler(req, res) {
    const { weekId } = req.params;

    // Verify the week belongs to a cert this trainer manages
    const weekRes = await pool.query(
        `SELECT aw.*, aw.certification_id FROM academic_weeks aw WHERE aw.id=$1 AND aw.week_type='certification'`,
        [weekId]
    );
    if (!weekRes.rows.length)
        return res.status(404).json({ success: false, message: 'Cert week not found', code: 'NOT_FOUND' });

    if (!await trainerOwnsCert(req.trainer.id, weekRes.rows[0].certification_id))
        return res.status(403).json({ success: false, message: 'Not your certification', code: 'FORBIDDEN' });

    const [sql, params] = publishCertWeek(weekId);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows[0] });
}

// GET /trainer/cert-weeks/:certId/latest-published
// Returns the latest published cert week for a cert (used by trainer's own availability)
async function getLatestPublishedCertWeekHandler(req, res) {
    const { certId } = req.params;
    const [sql, params] = getLatestPublishedCertWeek(certId);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows[0] || null });
}

// ─── CERTIFICATION TIMETABLE GENERATION ──────────────────────────────────────

// POST /trainer/cert-timetable/generate
// Trainer generates cert timetable: intersects their availability with ALL enrolled students
async function generateCertTimetable(req, res) {
    const { certificationId, weekId } = req.body;
    if (!certificationId || !weekId)
        return res.status(400).json({ success: false, message: 'certificationId and weekId required', code: 'MISSING_FIELDS' });

    if (!await trainerOwnsCert(req.trainer.id, certificationId))
        return res.status(403).json({ success: false, message: 'Not assigned to this certification', code: 'FORBIDDEN' });

    // Verify it's a published cert week
    const weekRes = await pool.query(
        `SELECT * FROM academic_weeks WHERE id=$1 AND certification_id=$2 AND week_type='certification' AND status='published'`,
        [weekId, certificationId]
    );
    if (!weekRes.rows.length)
        return res.status(400).json({ success: false, message: 'Week not found or not published', code: 'INVALID_WEEK' });

    // Get available rooms
    const rooms = (await pool.query(`SELECT id, name FROM rooms WHERE status='available' ORDER BY id`)).rows;

    // Delete existing slots for this cert+week (allow re-generation)
    const [delSql, delParams] = deleteCertSlotsForWeek(certificationId, weekId);
    await pool.query(delSql, delParams);

    // Get enrolled students
    const studentsRes = await pool.query(
        `SELECT student_id FROM enrollments WHERE certification_id=$1`, [certificationId]
    );
    const studentIds = studentsRes.rows.map(r => r.student_id);

    if (!studentIds.length)
        return res.status(400).json({ success: false, message: 'No students enrolled in this certification', code: 'NO_STUDENTS' });

    // Get trainer's own availability for this week
    const trainerAvail = await pool.query(
        `SELECT day_of_week, time_start, time_end
         FROM availability
         WHERE trainer_id=$1 AND academic_week_id=$2
         ORDER BY day_of_week, time_start`,
        [req.trainer.id, weekId]
    );

    if (!trainerAvail.rows.length)
        return res.status(400).json({ success: false, message: 'You have not submitted availability for this week', code: 'NO_TRAINER_AVAIL' });

    let scheduled = 0, skipped = 0;
    const bookedTrainerSlots = new Set();

    for (const slot of trainerAvail.rows) {
        const tKey = `${slot.day_of_week}|${slot.time_start}`;
        if (bookedTrainerSlots.has(tKey)) { skipped++; continue; }

        // Check trainer not already booked (academic or cert conflict)
        const [tcSql, tcParams] = checkTrainerConflict(req.trainer.id, slot.day_of_week, slot.time_start, slot.time_end, weekId);
        const tcRes = await pool.query(tcSql, tcParams);
        if (tcRes.rows.length) { skipped++; continue; }

        // Check ALL enrolled students are available in this slot
        let allAvailable = true;
        for (const sid of studentIds) {
            const sRes = await pool.query(
                `SELECT id FROM student_availability
                 WHERE student_id=$1
                   AND academic_week_id=$2
                   AND day_of_week=$3
                   AND time_start <= $4::time
                   AND time_end >= $5::time`,
                [sid, weekId, slot.day_of_week, slot.time_start, slot.time_end]
            );
            if (!sRes.rows.length) { allAvailable = false; break; }
        }
        if (!allAvailable) { skipped++; continue; }

        // Find a free room
        let chosenRoom = null;
        for (const room of rooms) {
            const [rcSql, rcParams] = checkRoomConflict(room.id, slot.day_of_week, slot.time_start, slot.time_end, weekId);
            const rcRes = await pool.query(rcSql, rcParams);
            if (!rcRes.rows.length) { chosenRoom = room; break; }
        }
        // Room optional for certs (small groups may not need a dedicated room)

        const [insSql, insParams] = createCertTimetableSlot(
            certificationId, req.trainer.id, weekId,
            slot.day_of_week, slot.time_start, slot.time_end,
            chosenRoom ? chosenRoom.id : null
        );
        await pool.query(insSql, insParams);
        bookedTrainerSlots.add(tKey);
        scheduled++;
    }

    return res.status(201).json({
        success: true,
        data: {
            scheduled,
            skipped,
            message: `${scheduled} session(s) scheduled for ${weekRes.rows[0].label}`,
        },
    });
}

// GET /trainer/cert-timetables
// All generated cert timetables for this trainer (read-only list)
async function getCertTimetablesHandler(req, res) {
    const [sql, params] = getCertTimetablesByTrainer(req.trainer.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// GET /trainer/cert-timetable/:certId/:weekId
// Slot detail for one cert+week combination (read-only grid)
async function getCertTimetableSlotsHandler(req, res) {
    const { certId, weekId } = req.params;
    const [sql, params] = getCertTimetableSlots(certId, weekId);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// ─── TRAINER COMBINED TIMETABLE ───────────────────────────────────────────────

async function getTrainerWeeksHandler(req, res) {
    const [sql, params] = getAllTrainerWeeks(req.trainer.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function getTimetableHandler(req, res) {
    const { weekId } = req.query;
    const [sql, params] = getTrainerTimetable(req.trainer.id, weekId);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────

async function getAnnouncementsHandler(req, res) {
    const [sql, params] = getAnnouncementsForTrainer(req.trainer.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

module.exports = {
    getTrainer,
    // Courses & certs
    getCoursesHandler,
    getCertificationsHandler,
    getCourseStudentsHandler,
    getCertificationStudentsHandler,
    // Grades
    submitGradesHandler,
    // Complaints
    getMarkComplaintsHandler,
    reviewMarkComplaintHandler,
    // Trainer availability (academic weeks by HOD)
    getActiveWeekForAvailability,
    getPublishedWeeksForTrainer,
    submitAvailabilityHandler,
    getAvailabilityHandler,
    deleteAvailabilityHandler,
    // Cert week management (trainer owns these)
    getCertWeeksHandler,
    createCertWeekHandler,
    publishCertWeekHandler,
    getLatestPublishedCertWeekHandler,
    // Cert timetable (trainer generates + views read-only)
    generateCertTimetable,
    getCertTimetablesHandler,
    getCertTimetableSlotsHandler,
    // Combined timetable (read-only)
    getTimetableHandler,
    getTrainerWeeksHandler,
    // Announcements
    getAnnouncementsHandler,
};
