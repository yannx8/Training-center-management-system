// models/Complaint.js
class Complaint {
    constructor(db) {
        this.db = db;
    }

    async create({ title, description, priority, user_id }) {
        const result = await this.db.query(
            `INSERT INTO complaints (title, description, priority, user_id, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`, [title, description, priority, user_id]
        );
        return result.rows[0];
    }

    async findAll() {
        const result = await this.db.query(
            `SELECT c.*, u.full_name as reporter_name
       FROM complaints c
       LEFT JOIN users u ON c.user_id = u.id
       ORDER BY 
         CASE c.priority 
           WHEN 'high' THEN 1 
           WHEN 'medium' THEN 2 
           WHEN 'low' THEN 3 
         END,
         c.created_at DESC`
        );
        return result.rows;
    }

    async findPending() {
        const result = await this.db.query(
            `SELECT c.*, u.full_name as reporter_name
       FROM complaints c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.status = 'pending'
       ORDER BY 
         CASE c.priority 
           WHEN 'high' THEN 1 
           WHEN 'medium' THEN 2 
           WHEN 'low' THEN 3 
         END`, []
        );
        return result.rows;
    }

    async findHighPriority() {
        const result = await this.db.query(
            `SELECT c.*, u.full_name as reporter_name
       FROM complaints c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.priority = 'high'
       ORDER BY c.created_at DESC`
        );
        return result.rows;
    }

    async findById(id) {
        const result = await this.db.query(
            `SELECT c.*, u.full_name as reporter_name
       FROM complaints c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`, [id]
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
            `UPDATE complaints SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
            values
        );
        return result.rows[0];
    }

    async delete(id) {
        const result = await this.db.query(
            'DELETE FROM complaints WHERE id = $1 RETURNING id', [id]
        );
        return result.rows[0];
    }

    async count() {
        const result = await this.db.query('SELECT COUNT(*) as count FROM complaints');
        return parseInt(result.rows[0].count);
    }

    async countByStatus(status) {
        const result = await this.db.query(
            'SELECT COUNT(*) as count FROM complaints WHERE status = $1', [status]
        );
        return parseInt(result.rows[0].count);
    }

    async countByPriority(priority) {
        const result = await this.db.query(
            'SELECT COUNT(*) as count FROM complaints WHERE priority = $1', [priority]
        );
        return parseInt(result.rows[0].count);
    }
}

module.exports = Complaint;