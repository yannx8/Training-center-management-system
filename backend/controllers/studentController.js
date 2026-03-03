// FILE: /backend/controllers/studentController.js
const pool = require('../config/db');
const { findStudentByUserId } = require('../queries/students');
const {
    getStudentTimetable,
    getAllStudentWeeks,
    getStudentGradesByPeriod,
    getStudentGradePeriods,
    getStudentCoursesWithGrades,
    getCourseWithTrainer,
    getStudentMarkComplaints,
    checkExistingMarkComplaint,
} = require('../queries/timetables');
const { createMarkComplaint } = require('../queries/complaints');

async function getProfile(req, res) {
    const [sql, params] = findStudentByUserId(req.user.userId);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Student profile not found', code: 'NOT_FOUND' });
    return res.json({ success: true, data: result.rows[0] });
}

// GET /student/timetable/weeks
async function getStudentWeeksHandler(req, res) {
    const [profileSql, profileParams] = findStudentByUserId(req.user.userId);
    const profileResult = await pool.query(profileSql, profileParams);
    if (!profileResult.rows.length)
        return res.status(404).json({ success: false, message: 'Student not found', code: 'NOT_FOUND' });

    const [sql, params] = getAllStudentWeeks(profileResult.rows[0].id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// GET /student/timetable
async function getTimetable(req, res) {
    const [profileSql, profileParams] = findStudentByUserId(req.user.userId);
    const profileResult = await pool.query(profileSql, profileParams);
    if (!profileResult.rows.length)
        return res.status(404).json({ success: false, message: 'Student not found', code: 'NOT_FOUND' });

    const { weekId } = req.query;
    const [sql, params] = getStudentTimetable(profileResult.rows[0].id, weekId || null);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// GET /student/grades/periods — school periods available for this student's program
async function getGradePeriodsHandler(req, res) {
    const [profileSql, profileParams] = findStudentByUserId(req.user.userId);
    const profileResult = await pool.query(profileSql, profileParams);
    if (!profileResult.rows.length)
        return res.status(404).json({ success: false, message: 'Student not found', code: 'NOT_FOUND' });

    const [sql, params] = getStudentGradePeriods(profileResult.rows[0].id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// GET /student/grades
async function getGrades(req, res) {
    const [profileSql, profileParams] = findStudentByUserId(req.user.userId);
    const profileResult = await pool.query(profileSql, profileParams);
    if (!profileResult.rows.length)
        return res.status(404).json({ success: false, message: 'Student not found', code: 'NOT_FOUND' });

    const { periodId } = req.query;
    const [sql, params] = getStudentGradesByPeriod(profileResult.rows[0].id, periodId || null);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// GET /student/grade-appeal/courses — courses with grades (for complaint dropdown)
async function getAppealCoursesHandler(req, res) {
    const [profileSql, profileParams] = findStudentByUserId(req.user.userId);
    const profileResult = await pool.query(profileSql, profileParams);
    if (!profileResult.rows.length)
        return res.status(404).json({ success: false, message: 'Student not found', code: 'NOT_FOUND' });

    const [sql, params] = getStudentCoursesWithGrades(profileResult.rows[0].id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

// GET /student/grade-appeal/course/:courseId — auto-fill trainer + school period
async function getCourseDetailsHandler(req, res) {
    const { courseId } = req.params;
    const [sql, params] = getCourseWithTrainer(courseId);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Course not found', code: 'NOT_FOUND' });
    return res.json({ success: true, data: result.rows[0] });
}

// POST /student/complaints
async function submitMarkComplaint(req, res) {
    const { courseId, subject, description } = req.body;

    if (!courseId || !subject)
        return res.status(400).json({ success: false, message: 'courseId and subject required', code: 'MISSING_FIELDS' });

    const [profileSql, profileParams] = findStudentByUserId(req.user.userId);
    const profileResult = await pool.query(profileSql, profileParams);
    if (!profileResult.rows.length)
        return res.status(404).json({ success: false, message: 'Student not found', code: 'NOT_FOUND' });

    const studentId = profileResult.rows[0].id;

    // One complaint per course per student
    const [checkSql, checkParams] = checkExistingMarkComplaint(studentId, courseId);
    const existing = await pool.query(checkSql, checkParams);
    if (existing.rows.length)
        return res.status(409).json({
            success: false,
            message: 'You have already submitted a complaint for this course',
            code: 'DUPLICATE_COMPLAINT',
        });

    // Auto-resolve trainer from course assignment
    const [courseSql, courseParams] = getCourseWithTrainer(courseId);
    const courseResult = await pool.query(courseSql, courseParams);
    if (!courseResult.rows.length || !courseResult.rows[0].trainer_id)
        return res.status(400).json({ success: false, message: 'No trainer assigned to this course', code: 'NO_TRAINER' });

    const [sql, params] = createMarkComplaint(
        studentId,
        courseResult.rows[0].trainer_id,
        courseId,
        null,
        subject,
        description
    );
    const result = await pool.query(sql, params);
    return res.status(201).json({ success: true, data: result.rows[0] });
}

// GET /student/complaints/history
async function getMarkComplaintsHistory(req, res) {
    const [profileSql, profileParams] = findStudentByUserId(req.user.userId);
    const profileResult = await pool.query(profileSql, profileParams);
    if (!profileResult.rows.length)
        return res.status(404).json({ success: false, message: 'Student not found', code: 'NOT_FOUND' });

    const [sql, params] = getStudentMarkComplaints(profileResult.rows[0].id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

module.exports = {
    getProfile,
    getTimetable,
    getGrades,
    submitMarkComplaint,
    getStudentWeeksHandler,
    getGradePeriodsHandler,
    getAppealCoursesHandler,
    getCourseDetailsHandler,
    getMarkComplaintsHistory,
};