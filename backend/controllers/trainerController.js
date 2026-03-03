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
} = require('../queries/trainers');
const { gradeToLetter } = require('../helpers/gpa');

async function getTrainer(req, res, next) {
    const [sql, params] = getTrainerByUserId(req.user.userId);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Trainer profile not found', code: 'NOT_FOUND' });
    req.trainer = result.rows[0];
    next();
}

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
    const { courseId } = req.params;
    const [sql, params] = getCourseStudents(courseId);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function getCertificationStudentsHandler(req, res) {
    const { certId } = req.params;
    const [sql, params] = getCertificationStudents(certId);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function submitGradesHandler(req, res) {
    const { grades, type, subjectId, academicYearId } = req.body;
    // grades: [{ studentId, grade }]; type: 'course' | 'certification'
    if (!grades || !Array.isArray(grades) || !type || !subjectId)
        return res.status(400).json({ success: false, message: 'grades array, type, subjectId required', code: 'MISSING_FIELDS' });

    const results = [];
    for (const g of grades) {
        const gradeLetter = gradeToLetter(g.grade);
        if (type === 'course') {
            const [sql, params] = submitGradeForCourse(g.studentId, subjectId, req.trainer.id, g.grade, gradeLetter, academicYearId);
            const result = await pool.query(sql, params);
            results.push(result.rows[0]);
        } else {
            const [sql, params] = submitGradeForCertification(g.studentId, subjectId, req.trainer.id, g.grade, gradeLetter, academicYearId);
            const result = await pool.query(sql, params);
            results.push(result.rows[0]);
        }
    }
    return res.json({ success: true, data: results });
}

async function getMarkComplaintsHandler(req, res) {
    const [sql, params] = getMarkComplaints(req.trainer.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

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

async function getTimetableHandler(req, res) {
    const [sql, params] = getMyTimetable(req.trainer.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function submitAvailabilityHandler(req, res) {
    // Check lock before allowing submission
    const [lockSql, lockParams] = getAvailabilityLock(req.user.userId);
    const lockResult = await pool.query(lockSql, lockParams);
    if (lockResult.rows.length && lockResult.rows[0].is_locked)
        return res.status(403).json({ success: false, message: 'Availability submission is currently locked', code: 'AVAILABILITY_LOCKED' });

    const { dayOfWeek, timeStart, timeEnd } = req.body;
    if (!dayOfWeek || !timeStart || !timeEnd)
        return res.status(400).json({ success: false, message: 'dayOfWeek, timeStart, timeEnd required', code: 'MISSING_FIELDS' });

    const [sql, params] = submitAvailability(req.trainer.id, dayOfWeek, timeStart, timeEnd);
    const result = await pool.query(sql, params);
    return res.status(201).json({ success: true, data: result.rows[0] });
}

async function getAvailabilityHandler(req, res) {
    const [sql, params] = getMyAvailability(req.trainer.id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function deleteAvailabilityHandler(req, res) {
    const { id } = req.params;
    const [sql, params] = deleteAvailability(id, req.trainer.id);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Availability slot not found', code: 'NOT_FOUND' });
    return res.json({ success: true, data: { deleted: true } });
}

module.exports = {
    getTrainer,
    getCoursesHandler,
    getCertificationsHandler,
    getCourseStudentsHandler,
    getCertificationStudentsHandler,
    submitGradesHandler,
    getMarkComplaintsHandler,
    reviewMarkComplaintHandler,
    getTimetableHandler,
    submitAvailabilityHandler,
    getAvailabilityHandler,
    deleteAvailabilityHandler,
};