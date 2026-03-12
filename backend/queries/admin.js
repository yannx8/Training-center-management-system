// FILE: /backend/queries/admin.js
// Admin queries for users, departments, programs, courses, rooms, etc.

// ============================================================
// USERS
// ============================================================

function getAllUsers() {
    const sql = `
        SELECT u.*, 
               ARRAY_AGG(DISTINCT r.name) as roles,
               d.name as department_name
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        LEFT JOIN departments d ON u.department = d.name
        GROUP BY u.id, d.name
        ORDER BY u.created_at DESC
    `;
    return [sql, []];
}

function getUsersByRole(roleName) {
    const sql = `
        SELECT u.*, d.name as department_name
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        LEFT JOIN departments d ON u.department = d.name
        WHERE r.name = $1
        ORDER BY u.full_name
    `;
    return [sql, [roleName]];
}

function createUser(fullName, email, passwordHash, phone, department, status = 'active') {
    const sql = `
        INSERT INTO users (full_name, email, password_hash, phone, department, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `;
    return [sql, [fullName, email, passwordHash, phone, department, status]];
}

function checkEmailExists(email) {
    const sql = `SELECT id, email FROM users WHERE email = $1`;
    return [sql, [email]];
}

function assignRoleToUser(userId, roleId) {
    const sql = `
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        RETURNING *
    `;
    return [sql, [userId, roleId]];
}

function removeRoleFromUser(userId, roleId) {
    const sql = `
        DELETE FROM user_roles 
        WHERE user_id = $1 AND role_id = $2
        RETURNING *
    `;
    return [sql, [userId, roleId]];
}

function getRoleByName(roleName) {
    const sql = `SELECT * FROM roles WHERE name = $1`;
    return [sql, [roleName]];
}

function getAllRoles() {
    const sql = `SELECT * FROM roles ORDER BY id`;
    return [sql, []];
}

function updateUser(userId, data) {
    const fields = [];
    const values = [userId];
    let paramCount = 2;
    
    Object.keys(data).forEach(key => {
        if (data[key] !== undefined && key !== 'password') {
            fields.push(`${key} = $${paramCount}`);
            values.push(data[key]);
            paramCount++;
        }
    });
    
    if (fields.length === 0) return [`SELECT * FROM users WHERE id = $1`, [userId]];
    
    const sql = `
        UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
    `;
    return [sql, values];
}

function deleteUser(userId) {
    const sql = `DELETE FROM users WHERE id = $1 RETURNING *`;
    return [sql, [userId]];
}

// ============================================================
// DEPARTMENTS
// ============================================================

function getAllDepartments() {
    const sql = `
        SELECT d.*, u.full_name as hod_user_name
        FROM departments d
        LEFT JOIN users u ON d.hod_user_id = u.id
        ORDER BY d.name
    `;
    return [sql, []];
}

function createDepartment(name, code, hodUserId = null) {
    const sql = `
        INSERT INTO departments (name, code, hod_user_id, status)
        VALUES ($1, $2, $3, 'active')
        RETURNING *
    `;
    return [sql, [name, code, hodUserId]];
}

function updateDepartment(deptId, data) {
    const fields = [];
    const values = [deptId];
    let paramCount = 2;
    
    Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
            fields.push(`${key} = $${paramCount}`);
            values.push(data[key]);
            paramCount++;
        }
    });
    
    if (fields.length === 0) return [`SELECT * FROM departments WHERE id = $1`, [deptId]];
    
    const sql = `
        UPDATE departments SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
    `;
    return [sql, values];
}

function deleteDepartment(deptId) {
    const sql = `DELETE FROM departments WHERE id = $1 RETURNING *`;
    return [sql, [deptId]];
}

// ============================================================
// PROGRAMS
// ============================================================

function getAllPrograms() {
    const sql = `
        SELECT p.*, d.name as department_name, d.code as department_code
        FROM programs p
        LEFT JOIN departments d ON p.department_id = d.id
        ORDER BY p.name
    `;
    return [sql, []];
}

function getProgramsByDepartment(deptId) {
    const sql = `
        SELECT p.*, d.name as department_name
        FROM programs p
        LEFT JOIN departments d ON p.department_id = d.id
        WHERE p.department_id = $1
        ORDER BY p.name
    `;
    return [sql, [deptId]];
}

function createProgram(name, code, departmentId, durationYears = 3) {
    const sql = `
        INSERT INTO programs (name, code, department_id, duration_years)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
    return [sql, [name, code, departmentId, durationYears]];
}

function updateProgram(programId, data) {
    const fields = [];
    const values = [programId];
    let paramCount = 2;
    
    Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
            fields.push(`${key} = $${paramCount}`);
            values.push(data[key]);
            paramCount++;
        }
    });
    
    if (fields.length === 0) return [`SELECT * FROM programs WHERE id = $1`, [programId]];
    
    const sql = `
        UPDATE programs SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
    `;
    return [sql, values];
}

function deleteProgram(programId) {
    const sql = `DELETE FROM programs WHERE id = $1 RETURNING *`;
    return [sql, [programId]];
}

// ============================================================
// ACADEMIC LEVELS
// ============================================================

function getLevelsByProgram(programId) {
    const sql = `
        SELECT * FROM academic_levels
        WHERE program_id = $1
        ORDER BY level_order
    `;
    return [sql, [programId]];
}

function createAcademicLevel(name, programId, levelOrder) {
    const sql = `
        INSERT INTO academic_levels (name, program_id, level_order)
        VALUES ($1, $2, $3)
        RETURNING *
    `;
    return [sql, [name, programId, levelOrder]];
}

// ============================================================
// SEMESTERS
// ============================================================

function getAllSemesters() {
    const sql = `SELECT * FROM semesters ORDER BY semester_order`;
    return [sql, []];
}

function createSemester(name, semesterOrder) {
    const sql = `
        INSERT INTO semesters (name, semester_order)
        VALUES ($1, $2)
        RETURNING *
    `;
    return [sql, [name, semesterOrder]];
}

// ============================================================
// COURSES
// ============================================================

function getAllCourses() {
    const sql = `
        SELECT c.*, s.name as session_name, ay.name as year_name,
               p.name as program_name, al.name as level_name, sem.name as semester_name
        FROM courses c
        LEFT JOIN sessions s ON c.session_id = s.id
        LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
        LEFT JOIN programs p ON s.program_id = p.id
        LEFT JOIN academic_levels al ON s.academic_level_id = al.id
        LEFT JOIN semesters sem ON s.semester_id = sem.id
        ORDER BY c.name
    `;
    return [sql, []];
}

function getCoursesByProgram(programId) {
    const sql = `
        SELECT c.*, s.name as session_name, ay.name as year_name,
               al.name as level_name, sem.name as semester_name,
               p.name as program_name
        FROM courses c
        LEFT JOIN sessions s ON c.session_id = s.id
        LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
        LEFT JOIN academic_levels al ON s.academic_level_id = al.id
        LEFT JOIN semesters sem ON s.semester_id = sem.id
        LEFT JOIN programs p ON s.program_id = p.id
        WHERE s.program_id = $1
        ORDER BY al.level_order, sem.semester_order, c.name
    `;
    return [sql, [programId]];
}

function getCoursesBySession(sessionId) {
    const sql = `
        SELECT c.*, s.name as session_name,
               COUNT(DISTINCT tc.trainer_id) as trainer_count
        FROM courses c
        LEFT JOIN sessions s ON c.session_id = s.id
        LEFT JOIN trainer_courses tc ON tc.course_id = c.id
        WHERE c.session_id = $1
        GROUP BY c.id, s.name
        ORDER BY c.name
    `;
    return [sql, [sessionId]];
}

function getCourseById(courseId) {
    const sql = `
        SELECT c.*, s.name as session_name, ay.name as year_name,
               p.name as program_name, p.id as program_id,
               al.name as level_name, sem.name as semester_name
        FROM courses c
        LEFT JOIN sessions s ON c.session_id = s.id
        LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
        LEFT JOIN programs p ON s.program_id = p.id
        LEFT JOIN academic_levels al ON s.academic_level_id = al.id
        LEFT JOIN semesters sem ON s.semester_id = sem.id
        WHERE c.id = $1
    `;
    return [sql, [courseId]];
}

function createCourse(name, code, sessionId, credits = 3, hoursPerWeek = 2) {
    const sql = `
        INSERT INTO courses (name, code, session_id, credits, hours_per_week)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    return [sql, [name, code, sessionId, credits, hoursPerWeek]];
}

function updateCourse(courseId, data) {
    const fields = [];
    const values = [courseId];
    let paramCount = 2;
    
    Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
            fields.push(`${key} = $${paramCount}`);
            values.push(data[key]);
            paramCount++;
        }
    });
    
    if (fields.length === 0) return [`SELECT * FROM courses WHERE id = $1`, [courseId]];
    
    const sql = `
        UPDATE courses SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
    `;
    return [sql, values];
}

function deleteCourse(courseId) {
    const sql = `DELETE FROM courses WHERE id = $1 RETURNING *`;
    return [sql, [courseId]];
}

// ============================================================
// CERTIFICATIONS
// ============================================================

function getAllCertifications() {
    const sql = `
        SELECT c.*, d.name as department_name,
               COUNT(DISTINCT tc.trainer_id) as trainer_count,
               COUNT(DISTINCT e.student_id) as student_count
        FROM certifications c
        LEFT JOIN departments d ON c.department_id = d.id
        LEFT JOIN trainer_courses tc ON tc.certification_id = c.id
        LEFT JOIN enrollments e ON e.certification_id = c.id AND e.status = 'active'
        GROUP BY c.id, d.name
        ORDER BY c.name
    `;
    return [sql, []];
}

function getCertificationsByDepartment(deptId) {
    const sql = `
        SELECT c.*, d.name as department_name
        FROM certifications c
        LEFT JOIN departments d ON c.department_id = d.id
        WHERE c.department_id = $1
        ORDER BY c.name
    `;
    return [sql, [deptId]];
}

function getCertificationById(certId) {
    const sql = `
        SELECT c.*, d.name as department_name
        FROM certifications c
        LEFT JOIN departments d ON c.department_id = d.id
        WHERE c.id = $1
    `;
    return [sql, [certId]];
}

function createCertification(name, code, description, durationHours, departmentId) {
    const sql = `
        INSERT INTO certifications (name, code, description, duration_hours, department_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    return [sql, [name, code, description, durationHours, departmentId]];
}

function updateCertification(certId, data) {
    const fields = [];
    const values = [certId];
    let paramCount = 2;
    
    Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
            fields.push(`${key} = $${paramCount}`);
            values.push(data[key]);
            paramCount++;
        }
    });
    
    if (fields.length === 0) return [`SELECT * FROM certifications WHERE id = $1`, [certId]];
    
    const sql = `
        UPDATE certifications SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
    `;
    return [sql, values];
}

function deleteCertification(certId) {
    const sql = `DELETE FROM certifications WHERE id = $1 RETURNING *`;
    return [sql, [certId]];
}

// ============================================================
// ROOMS
// ============================================================

function getAllRooms() {
    const sql = `SELECT * FROM rooms ORDER BY name`;
    return [sql, []];
}

function createRoom(name, code, building, capacity, roomType) {
    const sql = `
        INSERT INTO rooms (name, code, building, capacity, room_type)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    return [sql, [name, code, building, capacity, roomType]];
}

function updateRoom(roomId, data) {
    const fields = [];
    const values = [roomId];
    let paramCount = 2;
    
    Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
            fields.push(`${key} = $${paramCount}`);
            values.push(data[key]);
            paramCount++;
        }
    });
    
    if (fields.length === 0) return [`SELECT * FROM rooms WHERE id = $1`, [roomId]];
    
    const sql = `
        UPDATE rooms SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
    `;
    return [sql, values];
}

function deleteRoom(roomId) {
    const sql = `DELETE FROM rooms WHERE id = $1 RETURNING *`;
    return [sql, [roomId]];
}

// ============================================================
// ACADEMIC YEARS
// ============================================================

function getAllAcademicYears() {
    const sql = `SELECT * FROM academic_years ORDER BY start_date DESC`;
    return [sql, []];
}

function createAcademicYear(name, startDate, endDate, isActive = false) {
    const sql = `
        INSERT INTO academic_years (name, start_date, end_date, is_active)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
    return [sql, [name, startDate, endDate, isActive]];
}

function updateAcademicYear(yearId, data) {
    const fields = [];
    const values = [yearId];
    let paramCount = 2;
    
    Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
            fields.push(`${key} = $${paramCount}`);
            values.push(data[key]);
            paramCount++;
        }
    });
    
    if (fields.length === 0) return [`SELECT * FROM academic_years WHERE id = $1`, [yearId]];
    
    const sql = `
        UPDATE academic_years SET ${fields.join(', ')}
        WHERE id = $1
        RETURNING *
    `;
    return [sql, values];
}

function deleteAcademicYear(yearId) {
    const sql = `DELETE FROM academic_years WHERE id = $1 RETURNING *`;
    return [sql, [yearId]];
}

// ============================================================
// DASHBOARD STATS
// ============================================================

function getDashboardStats() {
    const sql = `
        SELECT 
            (SELECT COUNT(*) FROM users WHERE status = 'active') as total_users,
            (SELECT COUNT(*) FROM students) as total_students,
            (SELECT COUNT(*) FROM trainers) as total_trainers,
            (SELECT COUNT(*) FROM departments WHERE status = 'active') as total_departments,
            (SELECT COUNT(*) FROM programs WHERE status = 'active') as total_programs,
            (SELECT COUNT(*) FROM courses) as total_courses,
            (SELECT COUNT(*) FROM certifications WHERE status = 'active') as total_certifications,
            (SELECT COUNT(*) FROM rooms WHERE status = 'available') as total_rooms
    `;
    return [sql, []];
}

module.exports = {
    // Users
    getAllUsers,
    getUsersByRole,
    createUser,
    checkEmailExists,
    assignRoleToUser,
    removeRoleFromUser,
    getRoleByName,
    getAllRoles,
    updateUser,
    deleteUser,
    
    // Departments
    getAllDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    
    // Programs
    getAllPrograms,
    getProgramsByDepartment,
    createProgram,
    updateProgram,
    deleteProgram,
    
    // Academic Levels
    getLevelsByProgram,
    createAcademicLevel,
    
    // Semesters
    getAllSemesters,
    createSemester,
    
    // Courses
    getAllCourses,
    getCoursesByProgram,
    getCoursesBySession,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    
    // Certifications
    getAllCertifications,
    getCertificationsByDepartment,
    getCertificationById,
    createCertification,
    updateCertification,
    deleteCertification,
    
    // Rooms
    getAllRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    
    // Academic Years
    getAllAcademicYears,
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    
    // Stats
    getDashboardStats,
};