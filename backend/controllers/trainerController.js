// FILE: /backend/controllers/trainerController.js
const pool = require('../config/db');
const {
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
    getAllTrainerWeeks
} = require('../queries/trainers');
const {
    getActiveAcademicWeek,
    getTrainerTimetable,
    getAllTrainerWeeks: getAllWeeks
} = require('../queries/timetables');
const { gradeToLetter } = require('../helpers/gpa');

async function getTrainer(req, res, next) {
    const [sql, params] = getTrainerByUserId(req.user.userId);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Trainer profile not found', code: 'NOT_FOUND' });
    req.trainer = result.rows[0];
    next();
}

// GET /trainer/courses
async function getCoursesHandler(req, res) {
    const [sql, params] = getMyCourses(req.trainer.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// GET /trainer/certifications
async function getCertificationsHandler(req, res) {
    const [sql, params] = getMyCertifications(req.trainer.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// GET /trainer/courses/:courseId/students
async function getCourseStudentsHandler(req, res) {
    const { courseId } = req.params;
    const [sql, params] = getCourseStudents(courseId);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// GET /trainer/certifications/:certId/students
async function getCertificationStudentsHandler(req, res) {
    const { certId } = req.params;
    const [sql, params] = getCertificationStudents(certId);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// POST /trainer/grades
async function submitGradesHandler(req, res) {
    const { studentId, courseId, certificationId, grade, academicYearId } = req.body;

    if (!studentId || grade === undefined)
        return res.status(400).json({ success: false, message: 'studentId and grade required', code: 'MISSING_FIELDS' });

    if (!courseId && !certificationId)
        return res.status(400).json({ success: false, message: 'Either courseId or certificationId required', code: 'MISSING_SUBJECT' });

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

// GET /trainer/complaints
async function getMarkComplaintsHandler(req, res) {
    const [sql, params] = getMarkComplaints(req.trainer.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// PUT /trainer/complaints/:id
async function reviewMarkComplaintHandler(req, res) {
    const { id } = req.params;
    const { response } = req.body;

    if (!response)
        return res.status(400).json({ success: false, message: 'response required', code: 'MISSING_FIELDS' });

    const [sql, params] = reviewMarkComplaint(id, response);
    const result = await pool.query(sql, params);

    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Complaint not found', code: 'NOT_FOUND' });

    return res.json({ success: true, data: result.rows[0] });
}

// GET /trainer/availability/active-week - Get active week for availability
async function getActiveWeekForAvailability(req, res) {
    const dept = await pool.query(
        `SELECT d.id FROM departments d 
         JOIN users u ON d.hod_user_id = u.id 
         WHERE u.department = (SELECT department FROM users WHERE id = $1)
         LIMIT 1`, [req.user.userId]
    );

    if (!dept.rows.length)
        return res.json({ success: true, data: null });

    const [sql, params] = getActiveAcademicWeek(dept.rows[0].id);
    const result = await pool.query(sql, params);

    return res.json({ success: true, data: result.rows[0] || null });
}

// GET /trainer/availability - Updated with week support
async function getAvailabilityHandler(req, res) {
    const { weekId } = req.query;
    const [sql, params] = getMyAvailability(req.trainer.id, weekId);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// POST /trainer/availability - Updated with week
async function submitAvailabilityHandler(req, res) {
    const { dayOfWeek, timeStart, timeEnd, weekId } = req.body;

    if (!dayOfWeek || !timeStart || !timeEnd)
        return res.status(400).json({ success: false, message: 'dayOfWeek, timeStart, timeEnd required', code: 'MISSING_FIELDS' });

    // Check lock
    const [lockSql, lockParams] = getAvailabilityLock(req.user.userId, weekId);
    const lockResult = await pool.query(lockSql, lockParams);
    if (lockResult.rows.length && lockResult.rows[0].is_locked)
        return res.status(403).json({ success: false, message: 'Availability submission is currently locked', code: 'AVAILABILITY_LOCKED' });

    const [sql, params] = submitAvailability(req.trainer.id, weekId, dayOfWeek, timeStart, timeEnd);
    const result = await pool.query(sql, params);

    return res.status(201).json({ success: true, data: result.rows[0] });
}

// DELETE /trainer/availability/:id
async function deleteAvailabilityHandler(req, res) {
    const { id } = req.params;
    const [sql, params] = deleteAvailability(id, req.trainer.id);
    const result = await pool.query(sql, params);

    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Availability slot not found', code: 'NOT_FOUND' });

    return res.json({ success: true, data: { deleted: true } });
}

// GET /trainer/timetable/weeks - Get all weeks trainer has timetable for
async function getTrainerWeeksHandler(req, res) {
    const [sql, params] = getAllWeeks(req.trainer.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// GET /trainer/timetable - Updated with week filter
async function getTimetableHandler(req, res) {
    const { weekId } = req.query;
    const [sql, params] = getTrainerTimetable(req.trainer.id, weekId);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

module.exports = {
    getTrainer,
    getActiveWeekForAvailability,
    getCoursesHandler,
    getCertificationsHandler,
    getCourseStudentsHandler,
    getCertificationStudentsHandler,
    submitGradesHandler,
    getMarkComplaintsHandler,
    reviewMarkComplaintHandler,
    getTimetableHandler,
    getTrainerWeeksHandler,
    submitAvailabilityHandler,
    getAvailabilityHandler,
    deleteAvailabilityHandler,
};