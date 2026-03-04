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
    submitAvailability,
    getMyAvailability,
    deleteAvailability,
    getAvailabilityLock,
} = require('../queries/trainers');
const {
    getActiveAcademicWeek,
    getTrainerTimetable,
    getAllTrainerWeeks,
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

// GET /trainer/availability/active-week — latest week registered by HOD for trainer's department
async function getActiveWeekForAvailability(req, res) {
    // Resolve trainer's department then find its department_id
    const deptRes = await pool.query(
        `SELECT d.id FROM departments d
         JOIN users u ON u.department = d.name
         WHERE u.id = $1
         LIMIT 1`, [req.user.userId]
    );

    if (!deptRes.rows.length)
        return res.json({ success: true, data: null });

    const [sql, params] = getActiveAcademicWeek(deptRes.rows[0].id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows[0] || null });
}

// GET /trainer/availability
async function getAvailabilityHandler(req, res) {
    const { weekId } = req.query;
    const [sql, params] = getMyAvailability(req.trainer.id, weekId || null);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// POST /trainer/availability
async function submitAvailabilityHandler(req, res) {
    const { dayOfWeek, timeStart, timeEnd, weekId } = req.body;

    if (!dayOfWeek || !timeStart || !timeEnd || !weekId)
        return res.status(400).json({ success: false, message: 'dayOfWeek, timeStart, timeEnd, weekId required', code: 'MISSING_FIELDS' });

    // Check HOD lock
    const hodRes = await pool.query(
        `SELECT d.hod_user_id FROM departments d
         JOIN users u ON u.department = d.name
         WHERE u.id = $1 LIMIT 1`, [req.user.userId]
    );
    if (hodRes.rows.length && hodRes.rows[0].hod_user_id) {
        const [lockSql, lockParams] = getAvailabilityLock(hodRes.rows[0].hod_user_id, weekId);
        const lockResult = await pool.query(lockSql, lockParams);
        if (lockResult.rows.length && lockResult.rows[0].is_locked)
            return res.status(403).json({ success: false, message: 'Availability submission is currently locked by HOD', code: 'AVAILABILITY_LOCKED' });
    }

    const [sql, params] = submitAvailability(req.trainer.id, weekId, dayOfWeek, timeStart, timeEnd);
    const result = await pool.query(sql, params);
    return res.status(201).json({ success: true, data: result.rows[0] || { message: 'Slot already exists' } });
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

// GET /trainer/timetable/weeks
async function getTrainerWeeksHandler(req, res) {
    const [sql, params] = getAllTrainerWeeks(req.trainer.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// GET /trainer/timetable
async function getTimetableHandler(req, res) {
    const { weekId } = req.query;
    const [sql, params] = getTrainerTimetable(req.trainer.id, weekId || null);
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
