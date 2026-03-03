// FILE: /backend/queries/users.js
// Every function returns [sql, params] — the controller executes the query.
// This pattern keeps SQL centralized and testable independently of HTTP.

function findUserByEmail(email) {
    const sql = `SELECT * FROM users WHERE email = $1 LIMIT 1`;
    return [sql, [email]];
}

function findUserById(id) {
    const sql = `SELECT id, full_name, email, phone, department, status, password_changed FROM users WHERE id = $1`;
    return [sql, [id]];
}

// Returns all roles for a user — used to populate the role selection screen
function getUserRoles(userId) {
    const sql = `
    SELECT r.id AS role_id, r.name AS role_name
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = $1
  `;
    return [sql, [userId]];
}

function createUser(fullName, email, passwordHash, phone, department, status) {
    const sql = `
    INSERT INTO users (full_name, email, password_hash, phone, department, status, password_changed)
    VALUES ($1, $2, $3, $4, $5, $6, false)
    RETURNING id, full_name, email, phone, department, status
  `;
    return [sql, [fullName, email, passwordHash, phone, department, status]];
}

function assignRoleToUser(userId, roleId) {
    const sql = `
    INSERT INTO user_roles (user_id, role_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, role_id) DO NOTHING
    RETURNING *
  `;
    return [sql, [userId, roleId]];
}

function getAllUsers() {
    const sql = `
    SELECT u.id, u.full_name, u.email, u.phone, u.department, u.status,
           STRING_AGG(r.name, ',') AS roles
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE r.name != 'admin' OR r.name IS NULL
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `;
    return [sql, []];
}

function updateUser(id, fullName, email, phone, department, status) {
    const sql = `
    UPDATE users SET full_name=$1, email=$2, phone=$3, department=$4, status=$5
    WHERE id=$6
    RETURNING id, full_name, email, phone, department, status
  `;
    return [sql, [fullName, email, phone, department, status, id]];
}

function deleteUser(id) {
    const sql = `DELETE FROM users WHERE id=$1 RETURNING id`;
    return [sql, [id]];
}

// Used before createUser to prevent duplicate emails
function checkEmailExists(email) {
    const sql = `SELECT id FROM users WHERE email=$1 LIMIT 1`;
    return [sql, [email]];
}

function markPasswordChanged(userId) {
    const sql = `UPDATE users SET password_changed=true WHERE id=$1`;
    return [sql, [userId]];
}

function getRoleByName(name) {
    const sql = `SELECT id, name FROM roles WHERE name=$1 LIMIT 1`;
    return [sql, [name]];
}

function removeUserRole(userId, roleId) {
    const sql = `DELETE FROM user_roles WHERE user_id=$1 AND role_id=$2`;
    return [sql, [userId, roleId]];
}

function removeAllUserRoles(userId) {
    const sql = `DELETE FROM user_roles WHERE user_id=$1`;
    return [sql, [userId]];
}

module.exports = {
    findUserByEmail,
    findUserById,
    getUserRoles,
    createUser,
    assignRoleToUser,
    getAllUsers,
    updateUser,
    deleteUser,
    checkEmailExists,
    markPasswordChanged,
    getRoleByName,
    removeUserRole,
    removeAllUserRoles,
};