// FILE: /backend/controllers/adminController.js
// Admin controller for user management, departments, programs, courses, certifications, rooms

const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const {
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
    getAllDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getAllPrograms,
    getProgramsByDepartment,
    createProgram,
    updateProgram,
    deleteProgram,
    getLevelsByProgram,
    createAcademicLevel,
    getAllSemesters,
    getAllCourses,
    getCoursesByProgram,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    getAllCertifications,
    getCertificationsByDepartment,
    getCertificationById,
    createCertification,
    updateCertification,
    deleteCertification,
    getAllRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    getAllAcademicYears,
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    getDashboardStats,
} = require('../queries/admin');

// ============================================================
// DASHBOARD
// ============================================================

async function getDashboard(req, res) {
    const [sql] = getDashboardStats();
    const result = await pool.query(sql);
    return res.json({ success: true, data: result.rows[0] });
}

// ============================================================
// USERS
// ============================================================

async function getUsers(req, res) {
    const { role } = req.query;
    let result;
    if (role) {
        const [sql, params] = getUsersByRole(role);
        result = await pool.query(sql, params);
    } else {
        const [sql] = getAllUsers();
        result = await pool.query(sql);
    }
    return res.json({ success: true, data: result.rows });
}

async function createUserHandler(req, res) {
    const { fullName, email, phone, department, roles, password } = req.body;
    
    if (!fullName || !email || !roles || !roles.length) {
        return res.status(400).json({ success: false, message: 'fullName, email, and roles required' });
    }
    
    // Check email exists
    const [checkSql, checkParams] = checkEmailExists(email);
    const existing = await pool.query(checkSql, checkParams);
    if (existing.rows.length) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    
    // Default password is phone number
    const defaultPassword = password || phone || 'password123';
    const hash = await bcrypt.hash(defaultPassword, parseInt(process.env.SALT_ROUNDS) || 12);
    
    // Create user
    const [userSql, userParams] = createUser(fullName, email, hash, phone, department, 'active');
    const userResult = await pool.query(userSql, userParams);
    const newUser = userResult.rows[0];
    
    // Assign roles
    for (const roleName of roles) {
        const [roleSql, roleParams] = getRoleByName(roleName);
        const roleResult = await pool.query(roleSql, roleParams);
        if (roleResult.rows.length) {
            const [assignSql, assignParams] = assignRoleToUser(newUser.id, roleResult.rows[0].id);
            await pool.query(assignSql, assignParams);
        }
    }
    
    return res.status(201).json({ success: true, data: newUser });
}

async function updateUserHandler(req, res) {
    const { id } = req.params;
    const updateData = req.body;
    
    // If password provided, hash it
    if (updateData.password) {
        updateData.password_hash = await bcrypt.hash(updateData.password, parseInt(process.env.SALT_ROUNDS) || 12);
        delete updateData.password;
    }
    
    const [sql, params] = updateUser(id, updateData);
    const result = await pool.query(sql, params);
    
    if (!result.rows.length) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    return res.json({ success: true, data: result.rows[0] });
}

async function deleteUserHandler(req, res) {
    const { id } = req.params;
    const [sql, params] = deleteUser(id);
    const result = await pool.query(sql, params);
    
    if (!result.rows.length) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    return res.json({ success: true, data: { deleted: true } });
}

async function getRoles(req, res) {
    const [sql] = getAllRoles();
    const result = await pool.query(sql);
    return res.json({ success: true, data: result.rows });
}

// ============================================================
// DEPARTMENTS
// ============================================================

async function getDepartments(req, res) {
    const [sql] = getAllDepartments();
    const result = await pool.query(sql);
    return res.json({ success: true, data: result.rows });
}

async function createDepartmentHandler(req, res) {
    const { name, code, hodUserId } = req.body;
    
    if (!name || !code) {
        return res.status(400).json({ success: false, message: 'name and code required' });
    }
    
    const [sql, params] = createDepartment(name, code, hodUserId);
    const result = await pool.query(sql, params);
    
    return res.status(201).json({ success: true, data: result.rows[0] });
}

async function updateDepartmentHandler(req, res) {
    const { id } = req.params;
    const updateData = req.body;
    
    const [sql, params] = updateDepartment(id, updateData);
    const result = await pool.query(sql, params);
    
    if (!result.rows.length) {
        return res.status(404).json({ success: false, message: 'Department not found' });
    }
    
    return res.json({ success: true, data: result.rows[0] });
}

async function deleteDepartmentHandler(req, res) {
    const { id } = req.params;
    const [sql, params] = deleteDepartment(id);
    const result = await pool.query(sql, params);
    
    if (!result.rows.length) {
        return res.status(404).json({ success: false, message: 'Department not found' });
    }
    
    return res.json({ success: true, data: { deleted: true } });
}

// ============================================================
// PROGRAMS
// ============================================================

async function getPrograms(req, res) {
    const { departmentId } = req.query;
    let result;
    
    if (departmentId) {
        const [sql, params] = getProgramsByDepartment(departmentId);
        result = await pool.query(sql, params);
    } else {
        const [sql] = getAllPrograms();
        result = await pool.query(sql);
    }
    
    return res.json({ success: true, data: result.rows });
}

async function createProgramHandler(req, res) {
    const { name, code, departmentId, durationYears } = req.body;
    
    if (!name || !code || !departmentId) {
        return res.status(400).json({ success: false, message: 'name, code, and departmentId required' });
    }
    
    const [sql, params] = createProgram(name, code, departmentId, durationYears || 3);
    const result = await pool.query(sql, params);
    
    // Create academic levels for the program
    const newProgram = result.rows[0];
    const duration = durationYears || 3;
    for (let i = 1; i <= duration; i++) {
        const [levelSql, levelParams] = createAcademicLevel(`Year ${i}`, newProgram.id, i);
        await pool.query(levelSql, levelParams);
    }
    
    return res.status(201).json({ success: true, data: newProgram });
}

async function updateProgramHandler(req, res) {
    const { id } = req.params;
    const updateData = req.body;
    
    const [sql, params] = updateProgram(id, updateData);
    const result = await pool.query(sql, params);
    
    if (!result.rows.length) {
        return res.status(404).json({ success: false, message: 'Program not found' });
    }
    
    return res.json({ success: true, data: result.rows[0] });
}

async function deleteProgramHandler(req, res) {
    const { id } = req.params;
    const [sql, params] = deleteProgram(id);
    const result = await pool.query(sql, params);
    
    if (!result.rows.length) {
        return res.status(404).json({ success: false, message: 'Program not found' });
    }
    
    return res.json({ success: true, data: { deleted: true } });
}

// ============================================================
// COURSES
// ============================================================

async function getCourses(req, res) {
    const { programId, sessionId } = req.query;
    let result;
    
    if (programId) {
        const [sql, params] = getCoursesByProgram(programId);
        result = await pool.query(sql, params);
    } else {
        const [sql] = getAllCourses();
        result = await pool.query(sql);
    }
    
    return res.json({ success: true, data: result.rows });
}

async function getCourseHandler(req, res) {
    const { id } = req.params;
    const [sql, params] = getCourseById(id);
    const result = await pool.query(sql, params);
    
    if (!result.rows.length) {
        return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    return res.json({ success: true, data: result.rows[0] });
}

async function createCourseHandler(req, res) {
    const { name, code, sessionId, credits, hoursPerWeek } = req.body;
    
    if (!name || !code || !sessionId) {
        return res.status(400).json({ success: false, message: 'name, code, and sessionId required' });
    }
    
    const [sql, params] = createCourse(name, code, sessionId, credits || 3, hoursPerWeek || 2);
    const result = await pool.query(sql, params);
    
    return res.status(201).json({ success: true, data: result.rows[0] });
}

async function updateCourseHandler(req, res) {
    const { id } = req.params;
    const updateData = req.body;
    
    const [sql, params] = updateCourse(id, updateData);
    const result = await pool.query(sql, params);
    
    if (!result.rows.length) {
        return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    return res.json({ success: true, data: result.rows[0] });
}

async function deleteCourseHandler(req, res) {
    const { id } = req.params;
    const [sql, params] = deleteCourse(id);
    const result = await pool.query(sql, params);
    
    if (!result.rows.length) {
        return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    return res.json({ success: true, data: { deleted: true } });
}

// ============================================================
// CERTIFICATIONS
// ============================================================

async function getCertifications(req, res) {
    const { departmentId } = req.query;
    let result;
    
    if (departmentId) {
        const [sql, params] = getCertificationsByDepartment(departmentId);
        result = await pool.query(sql, params);
    } else {
        const [sql] = getAllCertifications();
        result = await pool.query(sql);
    }
    
    return res.json({ success: true, data: result.rows });
}

async function getCertificationHandler(req, res) {
    const { id } = req.params;
    const [sql, params] = getCertificationById(id);
    const result = await pool.query(sql, params);
    
    if (!result.rows.length) {
        return res.status(404).json({ success: false, message: 'Certification not found' });
    }
    
    return res.json({ success: true, data: result.rows[0] });
}

async function createCertificationHandler(req, res) {
    const { name, code, description, durationHours, departmentId } = req.body;
    
    if (!name || !code) {
        return res.status(400).json({ success: false, message: 'name and code required' });
    }
    
    const [sql, params] = createCertification(name, code, description, durationHours || 40, departmentId);
    const result = await pool.query(sql, params);
    
    return res.status(201).json({ success: true, data: result.rows[0] });
}

async function updateCertificationHandler(req, res) {
    const { id } = req.params;
    const updateData = req.body;
    
    const [sql, params] = updateCertification(id, updateData);
    const result = await pool.query(sql, params);
    
    if (!result.rows.length) {
        return res.status(404).json({ success: false, message: 'Certification not found' });
    }
    
    return res.json({ success: true, data: result.rows[0] });
}

async function deleteCertificationHandler(req, res) {
    const { id } = req.params;
    const [sql, params] = deleteCertification(id);
    const result = await pool.query(sql, params);
    
    if (!result.rows.length) {
        return res.status(404).json({ success: false, message: 'Certification not found' });
    }
    
    return res.json({ success: true, data: { deleted: true } });
}

// ============================================================
// ROOMS
// ============================================================

async function getRooms(req, res) {
    const [sql] = getAllRooms();
    const result = await pool.query(sql);
    return res.json({ success: true, data: result.rows });
}

async function createRoomHandler(req, res) {
    const { name, code, building, capacity, roomType } = req.body;
    
    if (!name || !code) {
        return res.status(400).json({ success: false, message: 'name and code required' });
    }
    
    const [sql, params] = createRoom(name, code, building, capacity || 30, roomType || 'Classroom');
    const result = await pool.query(sql, params);
    
    return res.status(201).json({ success: true, data: result.rows[0] });
}

async function updateRoomHandler(req, res) {
    const { id } = req.params;
    const updateData = req.body;
    
    const [sql, params] = updateRoom(id, updateData);
    const result = await pool.query(sql, params);
    
    if (!result.rows.length) {
        return res.status(404).json({ success: false, message: 'Room not found' });
    }
    
    return res.json({ success: true, data: result.rows[0] });
}

async function deleteRoomHandler(req, res) {
    const { id } = req.params;
    const [sql, params] = deleteRoom(id);
    const result = await pool.query(sql, params);
    
    if (!result.rows.length) {
        return res.status(404).json({ success: false, message: 'Room not found' });
    }
    
    return res.json({ success: true, data: { deleted: true } });
}

// ============================================================
// ACADEMIC YEARS
// ============================================================

async function getAcademicYears(req, res) {
    const [sql] = getAllAcademicYears();
    const result = await pool.query(sql);
    return res.json({ success: true, data: result.rows });
}

async function createAcademicYearHandler(req, res) {
    const { name, startDate, endDate, isActive } = req.body;
    
    if (!name || !startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'name, startDate, and endDate required' });
    }
    
    const [sql, params] = createAcademicYear(name, startDate, endDate, isActive || false);
    const result = await pool.query(sql, params);
    
    return res.status(201).json({ success: true, data: result.rows[0] });
}

async function updateAcademicYearHandler(req, res) {
    const { id } = req.params;
    const updateData = req.body;
    
    const [sql, params] = updateAcademicYear(id, updateData);
    const result = await pool.query(sql, params);
    
    if (!result.rows.length) {
        return res.status(404).json({ success: false, message: 'Academic year not found' });
    }
    
    return res.json({ success: true, data: result.rows[0] });
}

async function deleteAcademicYearHandler(req, res) {
    const { id } = req.params;
    const [sql, params] = deleteAcademicYear(id);
    const result = await pool.query(sql, params);
    
    if (!result.rows.length) {
        return res.status(404).json({ success: false, message: 'Academic year not found' });
    }
    
    return res.json({ success: true, data: { deleted: true } });
}

module.exports = {
    // Dashboard
    getDashboard,
    
    // Users
    getUsers,
    createUserHandler,
    updateUserHandler,
    deleteUserHandler,
    getRoles,
    
    // Departments
    getDepartments,
    createDepartmentHandler,
    updateDepartmentHandler,
    deleteDepartmentHandler,
    
    // Programs
    getPrograms,
    createProgramHandler,
    updateProgramHandler,
    deleteProgramHandler,
    
    // Courses
    getCourses,
    getCourseHandler,
    createCourseHandler,
    updateCourseHandler,
    deleteCourseHandler,
    
    // Certifications
    getCertifications,
    getCertificationHandler,
    createCertificationHandler,
    updateCertificationHandler,
    deleteCertificationHandler,
    
    // Rooms
    getRooms,
    createRoomHandler,
    updateRoomHandler,
    deleteRoomHandler,
    
    // Academic Years
    getAcademicYears,
    createAcademicYearHandler,
    updateAcademicYearHandler,
    deleteAcademicYearHandler,
};