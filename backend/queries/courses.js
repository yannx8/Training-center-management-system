function getAllCourses() {
    const sql = `
    SELECT c.id, c.name, c.code, c.credits, c.hours_per_week,
           p.name AS program_name, al.name AS level_name, sem.name AS semester_name
    FROM courses c
    LEFT JOIN sessions s ON c.session_id = s.id
    LEFT JOIN programs p ON s.program_id = p.id
    LEFT JOIN academic_levels al ON s.academic_level_id = al.id
    LEFT JOIN semesters sem ON s.semester_id = sem.id
    ORDER BY c.name
  `;
    return [sql, []];
}

function getCourseById(id) {
    const sql = `SELECT * FROM courses WHERE id=$1`;
    return [sql, [id]];
}

function getCoursesByProgram(programId) {
    const sql = `
    SELECT c.id, c.name, c.code, c.credits, c.hours_per_week,
           al.name AS level_name
    FROM courses c
    JOIN sessions s ON c.session_id = s.id
    WHERE s.program_id=$1
    ORDER BY al.level_order, c.name
  `;
    return [sql, [programId]];
}

function createCourse(name, code, sessionId, credits, hoursPerWeek) {
    const sql = `
    INSERT INTO courses (name, code, session_id, credits, hours_per_week)
    VALUES ($1,$2,$3,$4,$5) RETURNING *
  `;
    return [sql, [name, code, sessionId, credits, hoursPerWeek]];
}

function updateCourse(id, name, code, credits, hoursPerWeek) {
    const sql = `
    UPDATE courses SET name=$1, code=$2, credits=$3, hours_per_week=$4
    WHERE id=$5 RETURNING *
  `;
    return [sql, [name, code, credits, hoursPerWeek, id]];
}

function deleteCourse(id) {
    return [`DELETE FROM courses WHERE id=$1 RETURNING id`, [id]];
}

module.exports = { getAllCourses, getCourseById, getCoursesByProgram, createCourse, updateCourse, deleteCourse };