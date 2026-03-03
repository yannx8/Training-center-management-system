const db = require('../config/db');

const createEntity = (table) => async(req, res) => {
    const keys = Object.keys(req.body);
    const values = Object.values(req.body);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.join(', ');

    try {
        const result = await db.query(
            `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
            values
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getEntities = (table) => async(req, res) => {
    try {
        const result = await db.query(`SELECT * FROM ${table}`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    createEntity,
    getEntities
};