class Room {
    constructor(db) {
        this.db = db;
    }

    async create({ name, code, building, capacity, type }) {
        const result = await this.db.query(
            `INSERT INTO rooms (name, code, building, capacity, type, status)
       VALUES ($1, $2, $3, $4, $5, 'available')
       RETURNING *`, [name, code, building, capacity, type]
        );
        return result.rows[0];
    }

    async findAll() {
        const result = await this.db.query(
            'SELECT * FROM rooms ORDER BY name'
        );
        return result.rows;
    }

    async findById(id) {
        const result = await this.db.query(
            'SELECT * FROM rooms WHERE id = $1', [id]
        );
        return result.rows[0];
    }

    async findByCode(code) {
        const result = await this.db.query(
            'SELECT * FROM rooms WHERE code = $1', [code]
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
            `UPDATE rooms SET ${fields.join(', ')}
       WHERE id = $1
       RETURNING *`,
            values
        );
        return result.rows[0];
    }

    async delete(id) {
        const result = await this.db.query(
            'DELETE FROM rooms WHERE id = $1 RETURNING id', [id]
        );
        return result.rows[0];
    }

    async count() {
        const result = await this.db.query('SELECT COUNT(*) as count FROM rooms');
        return parseInt(result.rows[0].count);
    }

    async countByStatus(status) {
        const result = await this.db.query(
            'SELECT COUNT(*) as count FROM rooms WHERE status = $1', [status]
        );
        return parseInt(result.rows[0].count);
    }
}

module.exports = Room;