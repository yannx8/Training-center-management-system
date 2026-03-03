// FILE: /backend/queries/certifications.js

function getAllCertifications() {
    const sql = `SELECT * FROM certifications ORDER BY name`;
    return [sql, []];
}

function getCertificationById(id) {
    return [`SELECT * FROM certifications WHERE id=$1`, [id]];
}

function createCertification(name, code, description, durationHours) {
    const sql = `
    INSERT INTO certifications (name, code, description, duration_hours)
    VALUES ($1,$2,$3,$4) RETURNING *
  `;
    return [sql, [name, code, description, durationHours]];
}

function updateCertification(id, name, code, description, durationHours, status) {
    const sql = `
    UPDATE certifications SET name=$1, code=$2, description=$3, duration_hours=$4, status=$5
    WHERE id=$6 RETURNING *
  `;
    return [sql, [name, code, description, durationHours, status, id]];
}

function deleteCertification(id) {
    return [`DELETE FROM certifications WHERE id=$1 RETURNING id`, [id]];
}

module.exports = { getAllCertifications, getCertificationById, createCertification, updateCertification, deleteCertification };