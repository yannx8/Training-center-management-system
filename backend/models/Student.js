// models/Student.js
class Student {
    constructor(db) {
        this.db = db;
    }

    async create({ first_name, last_name, matricule, date_of_birth, program, parent_id, department_id }) {
        const result = await this.db.query(
            `INSERT INTO students (first_name, last_name, matricule, date_of_birth, program, parent_id, department_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
       RETURNING *`, [first_name, last_name, matricule, date_of_birth, program, parent_id, department_id]
        );

        // Update department student count
        await this.db.query(
            'UPDATE departments SET student_count = student_count + 1 WHERE id = $1', [department_id]
        );

        return result.rows[0];
    }

    async findAll(filters = {}) {
        let query = `
      SELECT s.*, p.full_name as parent_name, d.name as department_name, d.code as department_code
      FROM students s
      LEFT JOIN parents p ON s.parent_id = p.id
      LEFT JOIN departments d ON s.department_id = d.id
    `;
        const conditions = [];
        const values = [];

        if (filters.search) {
            conditions.push(`(s.first_name ILIKE $${values.length + 1} OR s.last_name ILIKE $${values.length + 1} OR s.matricule ILIKE $${values.length + 1})`);
            values.push(`%${filters.search}%`);
        }

        if (filters.program) {
            conditions.push(`s.program = $${values.length + 1}`);
            values.push(filters.program);
        }

        if (filters.department_id) {
            conditions.push(`s.department_id = $${values.length + 1}`);
            values.push(filters.department_id);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY s.created_at DESC';

        const result = await this.db.query(query, values);
        return result.rows;
    }

    async findById(id) {
        const result = await this.db.query(
            `SELECT s.*, p.full_name as parent_name, p.email as parent_email, p.phone as parent_phone,
              d.name as department_name
       FROM students s
       LEFT JOIN parents p ON s.parent_id = p.id
       LEFT JOIN departments d ON s.department_id = d.id
       WHERE s.id = $1`, [id]
        );
        return result.rows[0];
    }

    async findByMatricule(matricule) {
        const result = await this.db.query(
            'SELECT * FROM students WHERE matricule = $1', [matricule]
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
            `UPDATE students SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
            values
        );
        return result.rows[0];
    }

    async delete(id) {
        const student = await this.findById(id);
        if (student && student.department_id) {
            await this.db.query(
                'UPDATE departments SET student_count = GREATEST(student_count - 1, 0) WHERE id = $1', [student.department_id]
            );
        }
        const result = await this.db.query(
            'DELETE FROM students WHERE id = $1 RETURNING id', [id]
        );
        return result.rows[0];
    }

    async count() {
        const result = await this.db.query('SELECT COUNT(*) as count FROM students');
        return parseInt(result.rows[0].count);
    }

    async countByDepartment(department_id) {
        const result = await this.db.query(
            'SELECT COUNT(*) as count FROM students WHERE department_id = $1', [department_id]
        );
        return parseInt(result.rows[0].count);
    }
}

module.exports = Student;