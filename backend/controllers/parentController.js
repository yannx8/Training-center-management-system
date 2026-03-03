// FILE: /backend/controllers/parentController.js
const pool = require('../config/db');
const { createComplaint } = require('../queries/complaints');

async function getMyStudents(req, res) {
    const result = await pool.query(`
    SELECT s.id, s.matricule, u.full_name, u.email,
           p.name AS program_name, e.status AS enrollment_status
    FROM parent_student_links psl
    JOIN parents par ON psl.parent_id = par.id
    JOIN students s ON psl.student_id = s.id
    JOIN users u ON s.user_id = u.id
    LEFT JOIN programs p ON s.program_id = p.id
    LEFT JOIN enrollments e ON e.student_id = s.id
    WHERE par.user_id=$1
  `, [req.user.userId]);
    return res.json({ success: true, data: result.rows });
}

async function getStudentProfile(req, res) {
    const { id } = req.params;
    // Verify this parent is linked to this student
    const access = await pool.query(`
    SELECT psl.id FROM parent_student_links psl
    JOIN parents p ON psl.parent_id = p.id
    WHERE p.user_id=$1 AND psl.student_id=$2
  `, [req.user.userId, id]);
    if (!access.rows.length)
        return res.status(403).json({ success: false, message: 'Access denied', code: 'FORBIDDEN' });

    const result = await pool.query(`
    SELECT s.*, u.full_name, u.email, u.phone,
           p.name AS program_name, p.code AS program_code
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN programs p ON s.program_id = p.id
    WHERE s.id=$1
  `, [id]);
    return res.json({ success: true, data: result.rows[0] });
}

async function getStudentGrades(req, res) {
    const { id } = req.params;
    const access = await pool.query(`
    SELECT psl.id FROM parent_student_links psl
    JOIN parents p ON psl.parent_id = p.id
    WHERE p.user_id=$1 AND psl.student_id=$2
  `, [req.user.userId, id]);
    if (!access.rows.length)
        return res.status(403).json({ success: false, message: 'Access denied', code: 'FORBIDDEN' });

    const result = await pool.query(`
    SELECT g.*, c.name AS course_name, cert.name AS certification_name,
           u.full_name AS trainer_name, ay.name AS academic_year
    FROM grades g
    LEFT JOIN courses c ON g.course_id = c.id
    LEFT JOIN certifications cert ON g.certification_id = cert.id
    LEFT JOIN trainers t ON g.trainer_id = t.id
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN academic_years ay ON g.academic_year_id = ay.id
    WHERE g.student_id=$1
    ORDER BY g.submitted_at DESC
  `, [id]);
    return res.json({ success: true, data: result.rows });
}

async function getStudentTimetable(req, res) {
    const { id } = req.params;
    const access = await pool.query(`
    SELECT psl.id FROM parent_student_links psl
    JOIN parents p ON psl.parent_id = p.id
    WHERE p.user_id=$1 AND psl.student_id=$2
  `, [req.user.userId, id]);
    if (!access.rows.length)
        return res.status(403).json({ success: false, message: 'Access denied', code: 'FORBIDDEN' });

    const { getStudentTimetable } = require('../queries/timetables');
    const [sql, params] = getStudentTimetable(id);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function submitComplaint(req, res) {
    const { studentId, subject, description, priority } = req.body;
    if (!studentId || !subject)
        return res.status(400).json({ success: false, message: 'studentId and subject required', code: 'MISSING_FIELDS' });

    const parentResult = await pool.query('SELECT id FROM parents WHERE user_id=$1', [req.user.userId]);
    if (!parentResult.rows.length)
        return res.status(404).json({ success: false, message: 'Parent profile not found', code: 'NOT_FOUND' });

    const [sql, params] = createComplaint(parentResult.rows[0].id, studentId, subject, description, priority || 'medium');
    const result = await pool.query(sql, params);
    return res.status(201).json({ success: true, data: result.rows[0] });
}

module.exports = { getMyStudents, getStudentProfile, getStudentGrades, getStudentTimetable, submitComplaint };