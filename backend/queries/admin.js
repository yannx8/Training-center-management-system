// FILE: /backend/queries/admin.js

function getDashboardStats() {
    const sql = `
    SELECT
      (SELECT COUNT(*) FROM users u JOIN user_roles ur ON u.id=ur.user_id JOIN roles r ON ur.role_id=r.id WHERE r.name != 'admin') AS total_users,
      (SELECT COUNT(*) FROM departments) AS total_departments,
      (SELECT COUNT(*) FROM programs WHERE status='active') AS active_programs,
      (SELECT COUNT(*) FROM rooms WHERE status='available') AS available_rooms,
      (SELECT COUNT(*) FROM complaints WHERE status='pending') AS pending_complaints,
      (SELECT COUNT(*) FROM complaints WHERE priority='high' AND status='pending') AS high_priority_complaints
  `;
    return [sql, []];
}

function getAllDepartments() {
    const sql = `
    SELECT d.*, 
      (SELECT COUNT(s.id) FROM students s WHERE s.program_id IN 
        (SELECT id FROM programs WHERE department_id=d.id)) AS student_count
    FROM departments d
    ORDER BY d.name
  `;
    return [sql, []];
}

function createDepartment(name, code, hodName, hodUserId, status) {
    const sql = `
    INSERT INTO departments (name, code, hod_name, hod_user_id, status)
    VALUES ($1,$2,$3,$4,$5) RETURNING *
  `;
    return [sql, [name, code, hodName, hodUserId || null, status]];
}

function updateDepartment(id, name, code, hodName, hodUserId, status) {
    const sql = `
    UPDATE departments SET name=$1, code=$2, hod_name=$3, hod_user_id=$4, status=$5
    WHERE id=$6 RETURNING *
  `;
    return [sql, [name, code, hodName, hodUserId || null, status, id]];
}

function deleteDepartment(id) {
    return [`DELETE FROM departments WHERE id=$1 RETURNING id`, [id]];
}

function getAllPrograms() {
    const sql = `
    SELECT p.*, d.name AS department_name
    FROM programs p
    LEFT JOIN departments d ON p.department_id = d.id
    ORDER BY p.name
  `;
    return [sql, []];
}

function createProgram(name, code, departmentId, durationYears, status) {
    const sql = `
    INSERT INTO programs (name, code, department_id, duration_years, status)
    VALUES ($1,$2,$3,$4,$5) RETURNING *
  `;
    return [sql, [name, code, departmentId, durationYears, status]];
}

function updateProgram(id, name, code, departmentId, durationYears, status) {
    const sql = `
    UPDATE programs SET name=$1, code=$2, department_id=$3, duration_years=$4, status=$5
    WHERE id=$6 RETURNING *
  `;
    return [sql, [name, code, departmentId, durationYears, status, id]];
}

function deleteProgram(id) {
    return [`DELETE FROM programs WHERE id=$1 RETURNING id`, [id]];
}

function getAllAcademicYears() {
    const sql = `
    SELECT ay.*, p.name AS program_name, c.name AS certification_name
    FROM academic_years ay
    LEFT JOIN programs p ON ay.program_id = p.id
    LEFT JOIN certifications c ON ay.certification_id = c.id
    ORDER BY ay.start_date DESC
  `;
    return [sql, []];
}

function createAcademicYear(name, startDate, endDate, isActive, programId, certificationId) {
    const sql = `
    INSERT INTO academic_years (name, start_date, end_date, is_active, program_id, certification_id)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
  `;
    return [sql, [name, startDate, endDate, isActive, programId || null, certificationId || null]];
}

function updateAcademicYear(id, name, startDate, endDate, isActive) {
    const sql = `
    UPDATE academic_years SET name=$1, start_date=$2, end_date=$3, is_active=$4
    WHERE id=$5 RETURNING *
  `;
    return [sql, [name, startDate, endDate, isActive, id]];
}

function getAllRooms() {
    return [`SELECT * FROM rooms ORDER BY name`, []];
}

function createRoom(name, code, building, capacity, roomType, status) {
    const sql = `
    INSERT INTO rooms (name, code, building, capacity, room_type, status)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
  `;
    return [sql, [name, code, building, capacity, roomType, status]];
}

function updateRoom(id, name, code, building, capacity, roomType, status) {
    const sql = `
    UPDATE rooms SET name=$1, code=$2, building=$3, capacity=$4, room_type=$5, status=$6
    WHERE id=$7 RETURNING *
  `;
    return [sql, [name, code, building, capacity, roomType, status, id]];
}

function deleteRoom(id) {
    return [`DELETE FROM rooms WHERE id=$1 RETURNING id`, [id]];
}

function getDepartmentOverview() {
    const sql = `
    SELECT d.name, d.code,
      COUNT(DISTINCT s.id) AS student_count
    FROM departments d
    LEFT JOIN programs p ON p.department_id = d.id
    LEFT JOIN students s ON s.program_id = p.id
    GROUP BY d.id, d.name, d.code
    ORDER BY student_count DESC
  `;
    return [sql, []];
}

module.exports = {
    getDashboardStats,
    getAllDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getAllPrograms,
    createProgram,
    updateProgram,
    deleteProgram,
    getAllAcademicYears,
    createAcademicYear,
    updateAcademicYear,
    getAllRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    getDepartmentOverview,
};