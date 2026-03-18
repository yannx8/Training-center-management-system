// FILE: backend/app.js
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ─── CORS ─────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── HEALTH CHECK ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', version: '2.0.0' }));

// ─── ROUTES ───────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/secretary', require('./routes/secretary'));
app.use('/api/hod',       require('./routes/hod'));
app.use('/api/trainer',   require('./routes/trainer'));
app.use('/api/student',   require('./routes/student'));
app.use('/api/parent',    require('./routes/parent'));

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────
app.use(errorHandler);

module.exports = app;
