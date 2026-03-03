// FILE: /backend/config/db.js
// Why: Single shared pg Pool — creating a new Pool per request would exhaust connections.
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'tcms',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20, // maximum pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Verify connection on startup — try/catch used here because
// this is a DB connection failure scenario (one of the four allowed cases)
pool.connect((err, client, release) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1);
    }
    release();
    console.log('Database connected successfully');
});

module.exports = pool;