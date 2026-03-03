// models/Parent.js
class Parent {
    constructor(db) {
        this.db = db;
    }

    async create({ full_name, email, phone, address }) {
        const result = await this.db.query(
            `INSERT INTO parents (full_name, email, phone, address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`, [full_name, email, phone, address]
        );
        return result.rows[0];
    }

    async findAll() {
        const result = await this.db.query(
            `SELECT p.*, COUNT(s.id) as children_count
       FROM parents p
       LEFT JOIN students s ON p.id = s.parent_id
       GROUP BY p.id
       ORDER BY p.created_at DESC`
        );
        return result.rows;
    }

    async findById(id) {
        const result = await this.db.query(
            `SELECT p.*, 
              json_agg(json_build_object('id', s.id, 'name', s.first_name || ' ' || s.last_name, 'program', s.program)) as children
       FROM parents p
       LEFT JOIN students s ON p.id = s.parent_id
       WHERE p.id = $1
       GROUP BY p.id`, [id]
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
            `UPDATE parents SET ${fields.join(', ')}
       WHERE id = $1
       RETURNING *`,
            values
        );
        return result.rows[0];
    }

    async delete(id) {
        const result = await this.db.query(
            'DELETE FROM parents WHERE id = $1 RETURNING id', [id]
        );
        return result.rows[0];
    }

    async count() {
        const result = await this.db.query('SELECT COUNT(*) as count FROM parents');
        return parseInt(result.rows[0].count);
    }
}

module.exports = Parent;