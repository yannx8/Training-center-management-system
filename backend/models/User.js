const bcrypt = require('bcryptjs');

class User {
    constructor(db) {
        this.db = db;
    }

    async create({ full_name, email, password, role, department_id, phone }) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await this.db.query(
            `INSERT INTO users (full_name, email, password, role, department_id, phone, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active')
       RETURNING id, full_name, email, role, department_id, phone, status, created_at`, [full_name, email, hashedPassword, role, department_id, phone]
        );
        return result.rows[0];
    }

    async findByEmail(email) {
        const result = await this.db.query(
            'SELECT * FROM users WHERE email = $1', [email]
        );
        return result.rows[0];
    }

    async findById(id) {
        const result = await this.db.query(
            `SELECT u.id, u.full_name, u.email, u.role, u.phone, u.status, u.created_at,
              d.name as department_name, d.code as department_code
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`, [id]
        );
        return result.rows[0];
    }

    async findAll() {
        const result = await this.db.query(
            `SELECT u.id, u.full_name, u.email, u.role, u.phone, u.status, u.created_at,
              d.name as department_name, d.code as department_code
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       ORDER BY u.created_at DESC`
        );
        return result.rows;
    }

    async findByRole(role) {
        const result = await this.db.query(
            `SELECT u.id, u.full_name, u.email, u.role, u.phone, u.status,
              d.name as department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.role = $1`, [role]
        );
        return result.rows;
    }

    async update(id, data) {
        const fields = [];
        const values = [id];
        let paramCount = 2;

        Object.keys(data).forEach(key => {
            if (data[key] !== undefined && key !== 'password') {
                fields.push(`${key} = $${paramCount}`);
                values.push(data[key]);
                paramCount++;
            }
        });

        if (fields.length === 0) return this.findById(id);

        const result = await this.db.query(
            `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, full_name, email, role, phone, status`,
            values
        );
        return result.rows[0];
    }

    async delete(id) {
        const result = await this.db.query(
            'DELETE FROM users WHERE id = $1 RETURNING id', [id]
        );
        return result.rows[0];
    }

    async validatePassword(user, password) {
        return bcrypt.compare(password, user.password);
    }

    async count() {
        const result = await this.db.query('SELECT COUNT(*) as count FROM users');
        return parseInt(result.rows[0].count);
    }

    async countByRole(role) {
        const result = await this.db.query(
            'SELECT COUNT(*) as count FROM users WHERE role = $1', [role]
        );
        return parseInt(result.rows[0].count);
    }
}

module.exports = User;