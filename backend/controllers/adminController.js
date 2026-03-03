// FILE: /backend/controllers/adminController.js
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const {
    getAllUsers,
    createUser,
    assignRoleToUser,
    updateUser,
    deleteUser,
    checkEmailExists,
    getRoleByName
} = require('../queries/users');
const {
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
    getDepartmentOverview
} = require('../queries/admin');
const { getAllComplaints, updateComplaintStatus } = require('../queries/complaints');

async function getDashboard(req, res) {
    const [statsSql, statsParams] = getDashboardStats();
    const statsResult = await pool.query(statsSql, statsParams);

    const [deptSql, deptParams] = getDepartmentOverview();
    const deptResult = await pool.query(deptSql, deptParams);

    const [complaintsSql, complaintsParams] = getAllComplaints();
    const complaintsResult = await pool.query(complaintsSql, complaintsParams);

    const pending = complaintsResult.rows.filter(c => c.status === 'pending');
    const highPriority = complaintsResult.rows.filter(c => c.priority === 'high' && c.status === 'pending');

    return res.json({
        success: true,
        data: {
            stats: statsResult.rows[0],
            departmentOverview: deptResult.rows,
            pendingComplaints: pending.slice(0, 5),
            highPriorityIssues: highPriority.slice(0, 5),
        },
    });
}

async function getUsers(req, res) {
    const [sql, params] = getAllUsers();
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function createUserHandler(req, res) {
    const { fullName, email, roleName, department, phone, status } = req.body;
    if (!fullName || !email || !roleName || !phone)
        return res.status(400).json({ success: false, message: 'fullName, email, roleName, phone required', code: 'MISSING_FIELDS' });

    const [checkSql, checkParams] = checkEmailExists(email);
    const existing = await pool.query(checkSql, checkParams);
    if (existing.rows.length)
        return res.status(409).json({ success: false, message: 'Email already in use', code: 'EMAIL_EXISTS' });

    const [roleSql, roleParams] = getRoleByName(roleName);
    const roleResult = await pool.query(roleSql, roleParams);
    if (!roleResult.rows.length)
        return res.status(400).json({ success: false, message: 'Invalid role name', code: 'INVALID_ROLE' });

    // Default password = phone number
    let hash;
    try {
        hash = await bcrypt.hash(phone, parseInt(process.env.SALT_ROUNDS) || 12);
    } catch {
        return res.status(500).json({ success: false, message: 'Password hashing failed', code: 'HASH_ERROR' });
    }

    const [createSql, createParams] = createUser(fullName, email, hash, phone, department || null, status || 'active');
    const newUser = await pool.query(createSql, createParams);

    const [assignSql, assignParams] = assignRoleToUser(newUser.rows[0].id, roleResult.rows[0].id);
    await pool.query(assignSql, assignParams);

    // If trainer role, create trainer record
    if (roleName === 'trainer') {
        await pool.query('INSERT INTO trainers (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [newUser.rows[0].id]);
    }

    return res.status(201).json({ success: true, data: {...newUser.rows[0], roleName } });
}

async function updateUserHandler(req, res) {
    const { id } = req.params;
    const { fullName, email, phone, department, status, roles } = req.body;
    if (!fullName || !email)
        return res.status(400).json({ success: false, message: 'fullName and email required', code: 'MISSING_FIELDS' });

    const [sql, params] = updateUser(id, fullName, email, phone, department, status);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'User not found', code: 'NOT_FOUND' });

    // Handle multiple roles assignment
    if (roles !== undefined) {
        // Remove all existing roles for the user
        const [removeSql, removeParams] = removeAllUserRoles(id);
        await pool.query(removeSql, removeParams);

        // Assign each role in the array
        for (const roleName of roles) {
            const [roleSql, roleParams] = getRoleByName(roleName);
            const roleResult = await pool.query(roleSql, roleParams);
            if (roleResult.rows.length) {
                const [assignSql, assignParams] = assignRoleToUser(id, roleResult.rows[0].id);
                await pool.query(assignSql, assignParams);
            }
        }
    }

    return res.json({ success: true, data: result.rows[0] });
}

async function deleteUserHandler(req, res) {
    const { id } = req.params;
    const [sql, params] = deleteUser(id);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'User not found', code: 'NOT_FOUND' });
    return res.json({ success: true, data: { deleted: true } });
}

async function getDepartmentsHandler(req, res) {
    const [sql, params] = getAllDepartments();
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function createDepartmentHandler(req, res) {
    const { name, code, hodUserId, status } = req.body;
    if (!name || !code)
        return res.status(400).json({ success: false, message: 'name and code required', code: 'MISSING_FIELDS' });
    
    // Get the user info for the HOD
    let hodName = '';
    if (hodUserId) {
        const [userSql, userParams] = findUserById(hodUserId);
        const userResult = await pool.query(userSql, userParams);
        if (userResult.rows.length) {
            hodName = userResult.rows[0].full_name;
            
            // Assign HOD role to the user if they don't already have it
            const [roleSql, roleParams] = getRoleByName('hod');
            const roleResult = await pool.query(roleSql, roleParams);
            if (roleResult.rows.length) {
                const [assignSql, assignParams] = assignRoleToUser(hodUserId, roleResult.rows[0].id);
                await pool.query(assignSql, assignParams);
            }
        }
    }
    
    const [sql, params] = createDepartment(name, code, hodName, hodUserId, status || 'active');
    const result = await pool.query(sql, params);
    return res.status(201).json({ success: true, data: result.rows[0] });
}

async function updateDepartmentHandler(req, res) {
    const { id } = req.params;
    const { name, code, hodName, hodUserId, status } = req.body;
    const [sql, params] = updateDepartment(id, name, code, hodName, hodUserId, status);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Department not found', code: 'NOT_FOUND' });
    return res.json({ success: true, data: result.rows[0] });
}

async function deleteDepartmentHandler(req, res) {
    const { id } = req.params;
    const [sql, params] = deleteDepartment(id);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Department not found', code: 'NOT_FOUND' });
    return res.json({ success: true, data: { deleted: true } });
}

async function getProgramsHandler(req, res) {
    const [sql, params] = getAllPrograms();
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function createProgramHandler(req, res) {
    const { name, code, departmentId, durationYears, status } = req.body;
    if (!name || !code)
        return res.status(400).json({ success: false, message: 'name and code required', code: 'MISSING_FIELDS' });
    const [sql, params] = createProgram(name, code, departmentId, durationYears || 3, status || 'active');
    const result = await pool.query(sql, params);
    return res.status(201).json({ success: true, data: result.rows[0] });
}

async function updateProgramHandler(req, res) {
    const { id } = req.params;
    const { name, code, departmentId, durationYears, status } = req.body;
    const [sql, params] = updateProgram(id, name, code, departmentId, durationYears, status);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Program not found', code: 'NOT_FOUND' });
    return res.json({ success: true, data: result.rows[0] });
}

async function deleteProgramHandler(req, res) {
    const { id } = req.params;
    const [sql, params] = deleteProgram(id);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Program not found', code: 'NOT_FOUND' });
    return res.json({ success: true, data: { deleted: true } });
}

async function getAcademicYearsHandler(req, res) {
    const [sql, params] = getAllAcademicYears();
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function createAcademicYearHandler(req, res) {
    const { name, startDate, endDate, isActive, programId, certificationId } = req.body;
    if (!name || !startDate || !endDate)
        return res.status(400).json({ success: false, message: 'name, startDate, endDate required', code: 'MISSING_FIELDS' });
    const [sql, params] = createAcademicYear(name, startDate, endDate, isActive || false, programId, certificationId);
    const result = await pool.query(sql, params);
    return res.status(201).json({ success: true, data: result.rows[0] });
}

async function updateAcademicYearHandler(req, res) {
    const { id } = req.params;
    const { name, startDate, endDate, isActive } = req.body;
    const [sql, params] = updateAcademicYear(id, name, startDate, endDate, isActive);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Academic year not found', code: 'NOT_FOUND' });
    return res.json({ success: true, data: result.rows[0] });
}

async function getRoomsHandler(req, res) {
    const [sql, params] = getAllRooms();
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function createRoomHandler(req, res) {
    const { name, code, building, capacity, roomType, status } = req.body;
    if (!name || !code)
        return res.status(400).json({ success: false, message: 'name and code required', code: 'MISSING_FIELDS' });
    const [sql, params] = createRoom(name, code, building, capacity || 30, roomType || 'Classroom', status || 'available');
    const result = await pool.query(sql, params);
    return res.status(201).json({ success: true, data: result.rows[0] });
}

async function updateRoomHandler(req, res) {
    const { id } = req.params;
    const { name, code, building, capacity, roomType, status } = req.body;
    const [sql, params] = updateRoom(id, name, code, building, capacity, roomType, status);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Room not found', code: 'NOT_FOUND' });
    return res.json({ success: true, data: result.rows[0] });
}

async function deleteRoomHandler(req, res) {
    const { id } = req.params;
    const [sql, params] = deleteRoom(id);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Room not found', code: 'NOT_FOUND' });
    return res.json({ success: true, data: { deleted: true } });
}

async function getComplaintsHandler(req, res) {
    const [sql, params] = getAllComplaints();
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function updateComplaintHandler(req, res) {
    const { id } = req.params;
    const { status, adminResponse } = req.body;
    if (!status)
        return res.status(400).json({ success: false, message: 'status required', code: 'MISSING_FIELDS' });
    const [sql, params] = updateComplaintStatus(id, status, adminResponse);
    const result = await pool.query(sql, params);
    if (!result.rows.length)
        return res.status(404).json({ success: false, message: 'Complaint not found', code: 'NOT_FOUND' });
    return res.json({ success: true, data: result.rows[0] });
}

module.exports = {
    getDashboard,
    getUsers,
    createUserHandler,
    updateUserHandler,
    deleteUserHandler,
    getDepartmentsHandler,
    createDepartmentHandler,
    updateDepartmentHandler,
    deleteDepartmentHandler,
    getProgramsHandler,
    createProgramHandler,
    updateProgramHandler,
    deleteProgramHandler,
    getAcademicYearsHandler,
    createAcademicYearHandler,
    updateAcademicYearHandler,
    getRoomsHandler,
    createRoomHandler,
    updateRoomHandler,
    deleteRoomHandler,
    getComplaintsHandler,
    updateComplaintHandler,
};