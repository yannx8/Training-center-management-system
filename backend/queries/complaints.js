// FILE: /backend/queries/complaints.js

function createComplaint(parentId, studentId, subject, description, priority) {
    const sql = `
    INSERT INTO complaints (parent_id, student_id, subject, description, priority)
    VALUES ($1,$2,$3,$4,$5) RETURNING *
  `;
    return [sql, [parentId, studentId, subject, description, priority]];
}

function getAllComplaints() {
    const sql = `
    SELECT co.*, pu.full_name AS parent_name, su.full_name AS student_name, s.matricule
    FROM complaints co
    JOIN parents p ON co.parent_id = p.id
    JOIN users pu ON p.user_id = pu.id
    JOIN students s ON co.student_id = s.id
    JOIN users su ON s.user_id = su.id
    ORDER BY co.created_at DESC
  `;
    return [sql, []];
}

function updateComplaintStatus(id, status, adminResponse) {
    const sql = `
    UPDATE complaints SET status=$2, admin_response=$3, updated_at=NOW()
    WHERE id=$1 RETURNING *
  `;
    return [sql, [id, status, adminResponse]];
}

function createMarkComplaint(studentId, trainerId, courseId, certificationId, subject, description) {
    const sql = `
    INSERT INTO mark_complaints (student_id, trainer_id, course_id, certification_id, subject, description)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
  `;
    return [sql, [studentId, trainerId, courseId || null, certificationId || null, subject, description]];
}

function getMarkComplaintsByTrainer(trainerId) {
    const sql = `
    SELECT mc.*, su.full_name AS student_name, s.matricule,
           c.name AS course_name, cert.name AS certification_name
    FROM mark_complaints mc
    JOIN students s ON mc.student_id = s.id
    JOIN users su ON s.user_id = su.id
    LEFT JOIN courses c ON mc.course_id = c.id
    LEFT JOIN certifications cert ON mc.certification_id = cert.id
    WHERE mc.trainer_id=$1
    ORDER BY mc.created_at DESC
  `;
    return [sql, [trainerId]];
}

module.exports = { createComplaint, getAllComplaints, updateComplaintStatus, createMarkComplaint, getMarkComplaintsByTrainer };