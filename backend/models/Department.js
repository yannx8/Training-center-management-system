// models/Department.js
class Department {
    constructor(db) {
        this.db = db;
    }

    async create({ name, code, head_id }) {
        const result = await this.db.query(
            `INSERT INTO departments (name, code, head_id, student_count, status)
       VALUES ($1, $2, $3, 0, 'active')
       RETURNING *`, [name, code, head_id]
        );
        return result.rows[0];
    }

    async findAll() {
        const result = await this.db.query(
            `SELECT d.*, u.full_name as head_name
       FROM departments d
       LEFT JOIN users u ON d.head_id = u.id
       ORDER BY d.name`
        );
        return result.rows;
    }

    async findById(id) {
        const result = await this.db.query(
            `SELECT d.*, u.full_name as head_name
       FROM departments d
       LEFT JOIN users u ON d.head_id = u.id
       WHERE d.id = $1`, [id]
        );
        return result.rows[0];
    }

    async findByCode(code) {
        const result = await this.db.query(
            'SELECT * FROM departments WHERE code = $1', [code]
        );
        return result.rows[0];
    }

    async update(id, data) {
        const fields = [];
        const values = [id];
        let paramCount = 2;

        Object.keys(data).forEach(key => {
            if (data[key] !== undefined) {
                fields.push(`${key} = $${paramCount}`);
                values.push(data[key]);
                paramCount++;
            }
        });

        if (fields.length === 0) return this.findById(id);

        const result = await this.db.query(
            `UPDATE departments SET ${fields.join(', ')}
       WHERE id = $1
       RETURNING *`,
            values
        );
        return result.rows[0];
    }

    async delete(id) {
        const result = await this.db.query(
            'DELETE FROM departments WHERE id = $1 RETURNING id', [id]
        );
        return result.rows[0];
    }

    async count() {
        const result = await this.db.query('SELECT COUNT(*) as count FROM departments');
        return parseInt(result.rows[0].count);
    }

    async getStudentCounts() {
        const result = await this.db.query(
            `SELECT d.id, d.name, d.code, COUNT(s.id) as student_count
       FROM departments d
       LEFT JOIN students s ON d.id = s.department_id
       GROUP BY d.id
       ORDER BY d.name`
        );
        return result.rows;
    }
}

module.exports = Department;