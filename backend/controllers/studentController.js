// FILE: /backend/controllers/studentController.js
const pool = require('../config/db');
const {
    getStudentByUserId,
    getStudentDashboard,
    getStudentEnrollments,
} = require('../queries/students');
const {
    getStudentTimetable, getAllStudentWeeks,
    getStudentCertTimetable, getStudentCertTimetableWeeks, studentHasCertEnrollments,
    submitStudentAvailability, getStudentAvailability, deleteStudentAvailability,
    getLatestPublishedCertWeeksForStudent,
    getStudentCoursesWithGrades, getStudentMarkComplaints,
    getStudentGradesByPeriod, getStudentGradePeriods,
    checkExistingMarkComplaint,
    getAnnouncementsForStudent,
} = require('../queries/timetables');

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

async function getStudent(req, res, next) {
    const [sql, params] = getStudentByUserId(req.user.userId);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Student profile not found', code: 'NOT_FOUND' });
    req.student = result.rows[0];
    next();
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

async function getDashboard(req, res) {
    const [sql, params] = getStudentDashboard(req.student.id);
    const result = await pool.query(sql, params);

    // Also fetch latest 5 announcements
    const [aSql, aParams] = getAnnouncementsForStudent(req.student.id);
    const aResult = await pool.query(aSql, aParams);

    return res.json({
        success: true,
        data: {
            ...(result.rows[0] || {}),
            announcements: aResult.rows.slice(0, 5),
        },
    });
}

// ─── ENROLLMENTS ──────────────────────────────────────────────────────────────

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

// ─── CERTIFICATION TIMETABLE ──────────────────────────────────────────────────

async function getCertTimetableHandler(req, res) {
    const { weekId } = req.query;
    const [sql, params] = getStudentCertTimetable(req.student.id, weekId);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function getCertTimetableWeeksHandler(req, res) {
    const [sql, params] = getStudentCertTimetableWeeks(req.student.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// ─── CERTIFICATION AVAILABILITY ───────────────────────────────────────────────
//
// Flow:
//   1. Trainer creates + publishes a cert week
//   2. Student calls GET /student/cert-availability/weeks → sees one week per cert (latest published)
//   3. Student submits availability for that week
//   4. Trainer generates the cert timetable (intersection algo)
//

// GET /student/cert-availability/weeks
// Returns the latest published cert week for each cert the student is enrolled in
async function getCertAvailabilityWeeks(req, res) {
    const [sql, params] = getLatestPublishedCertWeeksForStudent(req.student.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// GET /student/cert-availability?weekId=xx
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
        return res.status(400).json({ success: false, message: 'academicWeekId, dayOfWeek, timeStart, timeEnd required', code: 'MISSING_FIELDS' });

    // Verify the week is a published cert week and the student is enrolled in that cert
    const weekCheck = await pool.query(
        `SELECT aw.certification_id
         FROM academic_weeks aw
         JOIN enrollments e ON e.certification_id = aw.certification_id AND e.student_id = $1
         WHERE aw.id = $2 AND aw.week_type = 'certification' AND aw.status = 'published'`,
        [req.student.id, academicWeekId]
    );
    if (!weekCheck.rows.length)
        return res.status(403).json({
            success: false,
            message: 'Week not found, not published, or you are not enrolled in this certification',
            code: 'INVALID_WEEK',
        });

    const [sql, params] = submitStudentAvailability(req.student.id, academicWeekId, dayOfWeek, timeStart, timeEnd);
    const result = await pool.query(sql, params);
    return res.status(201).json({ success: true, data: result.rows[0] || { duplicate: true } });
}

// DELETE /student/cert-availability/:id
async function deleteCertAvailabilityHandler(req, res) {
    const [sql, params] = deleteStudentAvailability(req.params.id, req.student.id);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Slot not found', code: 'NOT_FOUND' });
    return res.json({ success: true, data: { deleted: true } });
}

// ─── GRADES ───────────────────────────────────────────────────────────────────

async function getGradesHandler(req, res) {
    const { weekId } = req.query;
    const [sql, params] = getStudentGradesByPeriod(req.student.id, weekId);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function getGradePeriodsHandler(req, res) {
    const [sql, params] = getStudentGradePeriods(req.student.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function getCoursesWithGradesHandler(req, res) {
    const [sql, params] = getStudentCoursesWithGrades(req.student.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// ─── MARK COMPLAINTS ──────────────────────────────────────────────────────────

async function getMarkComplaintsHandler(req, res) {
    const [sql, params] = getStudentMarkComplaints(req.student.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function submitMarkComplaintHandler(req, res) {
    const { courseId, subject, body } = req.body;
    if (!courseId || !subject || !body)
        return res.status(400).json({ success: false, message: 'courseId, subject, body required', code: 'MISSING_FIELDS' });

    const [chkSql, chkParams] = checkExistingMarkComplaint(req.student.id, courseId);
    const existing = await pool.query(chkSql, chkParams);
    if (existing.rows.length)
        return res.status(409).json({ success: false, message: 'Complaint already submitted for this course', code: 'DUPLICATE_COMPLAINT' });

    // Verify student is enrolled in the program that has this course
    const trainerRes = await pool.query(
        `SELECT tc.trainer_id FROM courses c
         JOIN sessions s ON c.session_id = s.id
         JOIN students st ON s.program_id = st.program_id
         JOIN trainer_courses tc ON tc.course_id = c.id
         WHERE c.id = $1 AND st.id = $2 LIMIT 1`,
        [courseId, req.student.id]
    );
    if (!trainerRes.rows.length)
        return res.status(400).json({ success: false, message: 'Course or trainer not found for your enrollment', code: 'NOT_FOUND' });

    const result = await pool.query(
        `INSERT INTO mark_complaints (student_id, course_id, trainer_id, subject, body, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         RETURNING *`,
        [req.student.id, courseId, trainerRes.rows[0].trainer_id, subject, body]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
}

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────

async function getAnnouncementsHandler(req, res) {
    const [sql, params] = getAnnouncementsForStudent(req.student.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

module.exports = {
    getStudent,
    getDashboard,
    getEnrollmentsHandler,
    // Academic timetable
    getTimetableHandler,
    getTimetableWeeksHandler,
    // Cert timetable
    getCertTimetableHandler,
    getCertTimetableWeeksHandler,
    // Cert availability
    getCertAvailabilityWeeks,
    getCertAvailabilityHandler,
    submitCertAvailabilityHandler,
    deleteCertAvailabilityHandler,
    // Grades
    getGradesHandler,
    getGradePeriodsHandler,
    getCoursesWithGradesHandler,
    // Complaints
    getMarkComplaintsHandler,
    submitMarkComplaintHandler,
    // Announcements
    getAnnouncementsHandler,
};
