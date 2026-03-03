// FILE: /backend/controllers/secretaryController.js
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { createUser, checkEmailExists, assignRoleToUser, getRoleByName } = require('../queries/users');
const {
    createStudent,
    createParent,
    linkParentToStudent,
    enrollStudent,
    getAllStudents,
    getAllParents,
    searchStudents,
    getActiveAcademicYearForProgram,
    getActiveAcademicYearForCertification,
    countStudents
} = require('../queries/students');
const { getAllPrograms } = require('../queries/admin');
const { getAllCertifications } = require('../queries/certifications');
const { generateMatricule } = require('../helpers/generateMatricule');

// Atomic transaction: createStudent + createParent(s) + linkParentToStudent(s) + enrollStudent
// Why transaction: if parent creation fails, we must not leave a dangling student record
async function registerStudent(req, res) {
    const { student, parents, enrollmentType, programId, certificationId } = req.body;
    // enrollmentType: 'program' or 'certification'

    if (!student || !student.firstName || !student.lastName || !student.dateOfBirth)
        return res.status(400).json({ success: false, message: 'Student firstName, lastName, dateOfBirth required', code: 'MISSING_FIELDS' });

    if (!enrollmentType || (enrollmentType === 'program' && !programId) || (enrollmentType === 'certification' && !certificationId))
        return res.status(400).json({ success: false, message: 'enrollmentType with corresponding id required', code: 'MISSING_FIELDS' });

    // Resolve active academic year BEFORE starting the transaction
    // so we can return a clean 400 without a partial DB state
    let activeYear;
    if (enrollmentType === 'program') {
        const [aySql, ayParams] = getActiveAcademicYearForProgram(programId);
        const ayResult = await pool.query(aySql, ayParams);
        if (!ayResult.rows.length)
            return res.status(400).json({ success: false, message: 'No active academic year found for this program', code: 'NO_ACTIVE_YEAR' });
        activeYear = ayResult.rows[0];
    } else {
        const [aySql, ayParams] = getActiveAcademicYearForCertification(certificationId);
        const ayResult = await pool.query(aySql, ayParams);
        if (!ayResult.rows.length)
            return res.status(400).json({ success: false, message: 'No active academic year found for this certification', code: 'NO_ACTIVE_YEAR' });
        activeYear = ayResult.rows[0];
    }

    // Generate matricule using count-based sequence
    const [countSql, countParams] = countStudents();
    const countResult = await pool.query(countSql, countParams);
    const seq = parseInt(countResult.rows[0].total) + 1;
    const programCode = enrollmentType === 'program' ? 'ST' : 'CERT';
    const matricule = student.matricule || generateMatricule(programCode, new Date().getFullYear(), seq);

    // BEGIN transaction — must use try/catch because BEGIN/COMMIT requires it
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Create user account for student
        const studentEmail = student.email || `${matricule.toLowerCase()}@student.center.com`;
        const [checkSql, checkParams] = checkEmailExists(studentEmail);
        const existingCheck = await client.query(checkSql, checkParams);
        if (existingCheck.rows.length) {
            await client.query('ROLLBACK');
            return res.status(409).json({ success: false, message: 'Student email already exists', code: 'EMAIL_EXISTS' });
        }

        const defaultPassword = student.phone || matricule;
        const hash = await bcrypt.hash(defaultPassword, parseInt(process.env.SALT_ROUNDS) || 12);
        const fullName = `${student.firstName} ${student.lastName}`;
        const [userSql, userParams] = createUser(fullName, studentEmail, hash, student.phone || null, null, 'active');
        const userResult = await client.query(userSql, userParams);
        const newUserId = userResult.rows[0].id;

        // Assign student role
        const [roleSql, roleParams] = getRoleByName('student');
        const roleResult = await client.query(roleSql, roleParams);
        const [assignSql, assignParams] = assignRoleToUser(newUserId, roleResult.rows[0].id);
        await client.query(assignSql, assignParams);

        // 2. Create student record
        const [studentSql, studentParams] = createStudent(newUserId, matricule, student.dateOfBirth, programId || null);
        const studentResult = await client.query(studentSql, studentParams);
        const newStudentId = studentResult.rows[0].id;

        // 3. Enroll student
        const [enrollSql, enrollParams] = enrollStudent(newStudentId, activeYear.id, programId || null, certificationId || null);
        await client.query(enrollSql, enrollParams);

        // 4. Create parent accounts and link them
        const createdParents = [];
        if (parents && parents.length) {
            for (const parent of parents) {
                if (!parent.firstName || !parent.email) continue;
                const parentFullName = `${parent.firstName} ${parent.lastName || ''}`.trim();
                const [pCheckSql, pCheckParams] = checkEmailExists(parent.email);
                const pExisting = await client.query(pCheckSql, pCheckParams);

                let parentUserId;
                if (pExisting.rows.length) {
                    // Parent user already exists — just link
                    parentUserId = pExisting.rows[0].id;
                } else {
                    const parentPassword = parent.phone || parent.email;
                    const parentHash = await bcrypt.hash(parentPassword, parseInt(process.env.SALT_ROUNDS) || 12);
                    const [pUserSql, pUserParams] = createUser(parentFullName, parent.email, parentHash, parent.phone || null, null, 'active');
                    const pUserResult = await client.query(pUserSql, pUserParams);
                    parentUserId = pUserResult.rows[0].id;

                    const [pRoleSql, pRoleParams] = getRoleByName('parent');
                    const pRoleResult = await client.query(pRoleSql, pRoleParams);
                    const [pAssignSql, pAssignParams] = assignRoleToUser(parentUserId, pRoleResult.rows[0].id);
                    await client.query(pAssignSql, pAssignParams);
                }

                const [parentSql, parentParams] = createParent(parentUserId, parent.relationship || 'Father');
                let parentRecord;
                try {
                    const parentResult = await client.query(parentSql, parentParams);
                    parentRecord = parentResult.rows[0];
                } catch {
                    // Parent record might already exist if user was already a parent
                    const existingParent = await client.query('SELECT * FROM parents WHERE user_id=$1', [parentUserId]);
                    parentRecord = existingParent.rows[0];
                }

                const [linkSql, linkParams] = linkParentToStudent(parentRecord.id, newStudentId);
                await client.query(linkSql, linkParams);
                createdParents.push(parentRecord);
            }
        }

        await client.query('COMMIT');

        return res.status(201).json({
            success: true,
            data: { studentId: newStudentId, matricule, parents: createdParents, activeYear: activeYear.name },
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Registration transaction failed:', err.message);
        return res.status(500).json({ success: false, message: 'Registration failed', code: 'REGISTRATION_FAILED' });
    } finally {
        client.release();
    }
}

async function getStudentsHandler(req, res) {
    const { search, programId } = req.query;
    if (search) {
        const [sql, params] = searchStudents(search);
        const result = await pool.query(sql, params);
        return res.json({ success: true, data: result.rows });
    }
    const [sql, params] = getAllStudents(programId || null);
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function getParentsHandler(req, res) {
    const [sql, params] = getAllParents();
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function getProgramsForSecretary(req, res) {
    const [sql, params] = getAllPrograms();
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

async function getCertificationsForSecretary(req, res) {
    const [sql, params] = getAllCertifications();
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows });
}

module.exports = { registerStudent, getStudentsHandler, getParentsHandler, getProgramsForSecretary, getCertificationsForSecretary };