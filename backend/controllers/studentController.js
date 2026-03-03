// FILE: /backend/controllers/studentController.js
const pool = require('../config/db');
const { findStudentByUserId } = require('../queries/students');
const { getStudentTimetable } = require('../queries/timetables');
const { createMarkComplaint } = require('../queries/complaints');
const { getTrainerByUserId } = require('../queries/trainers');

async function getProfile(req, res) {
    const [sql, params] = findStudentByUserId(req.user.userId);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Student profile not found', code: 'NOT_FOUND' });
    return res.json({ success: true, data: result.rows[0] });
}

async function getTimetable(req, res) {
    const [profileSql, profileParams] = findStudentByUserId(req.user.userId);
    const profileResult = await pool.query(profileSql, profileParams);
    if (!profileResult.rows.length)
        return res.status(404).json({ success: false, message: 'Student not found', code: 'NOT_FOUND' });

    const [sql, params] = getStudentTimetable(profileResult.rows[0].id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function getGrades(req, res) {
    const [profileSql, profileParams] = findStudentByUserId(req.user.userId);
    const profileResult = await pool.query(profileSql, profileParams);
    if (!profileResult.rows.length)
        return res.status(404).json({ success: false, message: 'Student not found', code: 'NOT_FOUND' });

    const studentId = profileResult.rows[0].id;
    const result = await pool.query(`
    SELECT g.*, c.name AS course_name, c.code AS course_code,
           cert.name AS certification_name, cert.code AS certification_code,
           u.full_name AS trainer_name, ay.name AS academic_year
    FROM grades g
    LEFT JOIN courses c ON g.course_id = c.id
    LEFT JOIN certifications cert ON g.certification_id = cert.id
    LEFT JOIN trainers t ON g.trainer_id = t.id
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN academic_years ay ON g.academic_year_id = ay.id
    WHERE g.student_id=$1
    ORDER BY g.submitted_at DESC
  `, [studentId]);

    return res.json({ success: true, data: result.rows });
}

async function submitMarkComplaint(req, res) {
    const { trainerId, courseId, certificationId, subject, description } = req.body;
    if (!trainerId || !subject)
        return res.status(400).json({ success: false, message: 'trainerId and subject required', code: 'MISSING_FIELDS' });

    const [profileSql, profileParams] = findStudentByUserId(req.user.userId);
    const profileResult = await pool.query(profileSql, profileParams);
    if (!profileResult.rows.length)
        return res.status(404).json({ success: false, message: 'Student not found', code: 'NOT_FOUND' });

    const [sql, params] = createMarkComplaint(
        profileResult.rows[0].id, trainerId, courseId || null, certificationId || null, subject, description
    );
    const result = await pool.query(sql, params);
    return res.status(201).json({ success: true, data: result.rows[0] });
}

module.exports = { getProfile, getTimetable, getGrades, submitMarkComplaint };