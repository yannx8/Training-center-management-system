// backend/controllers/studentController.js
const pool = require('../config/db');
const {
    getStudentByUserId,
    getStudentEnrollments,
} = require('../queries/students');
const {
    getStudentTimetable,
    getAllStudentWeeks,
    getStudentCertTimetable,
    getStudentCertTimetableWeeks,
    getAllCertWeeksForStudent,
    submitStudentAvailability,
    getStudentAvailability,
    deleteStudentAvailability,
    getLatestPublishedCertWeeksForStudent,
    getStudentGradesByPeriod,
    getStudentGradePeriods,
    getStudentMarkComplaints,
    checkExistingMarkComplaint,
    getAnnouncementsForStudent,
} = require('../queries/timetables');
const { gradeToLetter } = require('../helpers/gpa');

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

async function getStudent(req, res, next) {
    const [sql, params] = getStudentByUserId(req.user.userId);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Student profile not found' });
    req.student = result.rows[0];
    next();
}

// ─── PROFILE & ENROLLMENTS ────────────────────────────────────────────────────

async function getProfileHandler(req, res) {
    return res.json({ success: true, data: req.student });
}

async function getEnrollmentsHandler(req, res) {
    const [sql, params] = getStudentEnrollments(req.student.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// ─── ACADEMIC TIMETABLE ───────────────────────────────────────────────────────

async function getTimetableHandler(req, res) {
    const { weekId } = req.query;
    const [sql, params] = getStudentTimetable(req.student.id, weekId);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function getTimetableWeeksHandler(req, res) {
    const [sql, params] = getAllStudentWeeks(req.student.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// ─── CERTIFICATION TIMETABLE (history — all sessions from first to last) ─────

async function getCertTimetableHandler(req, res) {
    const { weekId } = req.query;
    const [sql, params] = getStudentCertTimetable(req.student.id, weekId || null);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function getCertTimetableWeeksHandler(req, res) {
    const [sql, params] = getStudentCertTimetableWeeks(req.student.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// GET all cert weeks (including unscheduled ones) — for session history page
async function getAllCertWeeksHandler(req, res) {
    const [sql, params] = getAllCertWeeksForStudent(req.student.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// ─── STUDENT CERT AVAILABILITY ────────────────────────────────────────────────

// GET /student/cert-availability/weeks — latest published week per cert enrolled
async function getCertAvailabilityWeeksHandler(req, res) {
    const [sql, params] = getLatestPublishedCertWeeksForStudent(req.student.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// GET /student/cert-availability?weekId=...
async function getCertAvailabilityHandler(req, res) {
    const { weekId } = req.query;
    const [sql, params] = getStudentAvailability(req.student.id, weekId);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// POST /student/cert-availability
async function submitCertAvailabilityHandler(req, res) {
    const { academicWeekId, dayOfWeek, timeStart, timeEnd } = req.body;
    if (!academicWeekId || !dayOfWeek || !timeStart || !timeEnd)
        return res.status(400).json({ success: false, message: 'academicWeekId, dayOfWeek, timeStart, timeEnd required' });

    // Verify this is a published cert week AND student is enrolled in that cert
    const weekRes = await pool.query(
        `SELECT aw.* FROM academic_weeks aw
         WHERE aw.id = $1 AND aw.week_type = 'certification' AND aw.status = 'published'`, [academicWeekId]
    );
    if (!weekRes.rows.length)
        return res.status(400).json({ success: false, message: 'Week not found or not published' });

    // Check student is enrolled in this certification
    const certId = weekRes.rows[0].certification_id;
    const enrollRes = await pool.query(
        `SELECT id FROM enrollments WHERE student_id=$1 AND certification_id=$2 AND status='active'`, [req.student.id, certId]
    );
    if (!enrollRes.rows.length)
        return res.status(403).json({ success: false, message: 'Not enrolled in this certification' });

    // Verify this is the LATEST published week for the cert
    const latestRes = await pool.query(
        `SELECT id FROM academic_weeks
         WHERE certification_id=$1 AND week_type='certification' AND status='published'
         ORDER BY created_at DESC LIMIT 1`, [certId]
    );
    if (!latestRes.rows.length || latestRes.rows[0].id !== parseInt(academicWeekId))
        return res.status(403).json({ success: false, message: 'You may only submit availability for the latest published week' });

    const [sql, params] = submitStudentAvailability(req.student.id, academicWeekId, dayOfWeek, timeStart, timeEnd);
    const result = await pool.query(sql, params);
    return res.status(201).json({ success: true, data: result.rows[0] });
}

// DELETE /student/cert-availability/:id
async function deleteCertAvailabilityHandler(req, res) {
    const [sql, params] = deleteStudentAvailability(req.params.id, req.student.id);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Slot not found' });
    return res.json({ success: true, data: { deleted: true } });
}

// ─── GRADES ──────────────────────────────────────────────────────────────────

async function getGradesHandler(req, res) {
    const { periodId } = req.query;
    const [sql, params] = getStudentGradesByPeriod(req.student.id, periodId);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function getGradePeriodsHandler(req, res) {
    const [sql, params] = getStudentGradePeriods(req.student.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// ─── MARK COMPLAINTS ─────────────────────────────────────────────────────────

async function getMarkComplaintsHandler(req, res) {
    const [sql, params] = getStudentMarkComplaints(req.student.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function submitMarkComplaintHandler(req, res) {
    const { courseId, certificationId, subject, description } = req.body;
    if (!subject || !description)
        return res.status(400).json({ success: false, message: 'subject and description required' });
    if (!courseId && !certificationId)
        return res.status(400).json({ success: false, message: 'courseId or certificationId required' });

    // One complaint per course/cert
    const [checkSql, checkParams] = checkExistingMarkComplaint(req.student.id, courseId, certificationId);
    const existing = await pool.query(checkSql, checkParams);
    if (existing.rows.length)
        return res.status(409).json({ success: false, message: 'A complaint already exists for this course/certification' });

    // Find trainer
    let trainerRes;
    if (courseId) {
        trainerRes = await pool.query(
            `SELECT tc.trainer_id FROM trainer_courses tc WHERE tc.course_id = $1 LIMIT 1`, [courseId]
        );
    } else {
        trainerRes = await pool.query(
            `SELECT tc.trainer_id FROM trainer_courses tc WHERE tc.certification_id = $1 LIMIT 1`, [certificationId]
        );
    }

    const trainerId = trainerRes.rows[0] ? .trainer_id || null;

    const result = await pool.query(
        `INSERT INTO mark_complaints (student_id, trainer_id, course_id, certification_id, subject, description)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [req.student.id, trainerId, courseId || null, certificationId || null, subject, description]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
}

// ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────────

async function getAnnouncementsHandler(req, res) {
    const [sql, params] = getAnnouncementsForStudent(req.student.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

module.exports = {
    getStudent,
    getProfileHandler,
    getEnrollmentsHandler,
    getTimetableHandler,
    getTimetableWeeksHandler,
    getCertTimetableHandler,
    getCertTimetableWeeksHandler,
    getAllCertWeeksHandler,
    getCertAvailabilityWeeksHandler,
    getCertAvailabilityHandler,
    submitCertAvailabilityHandler,
    deleteCertAvailabilityHandler,
    getGradesHandler,
    getGradePeriodsHandler,
    getMarkComplaintsHandler,
    submitMarkComplaintHandler,
    getAnnouncementsHandler,
};