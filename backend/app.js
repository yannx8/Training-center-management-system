// FILE: /backend/app.js
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Allow requests from the React dev server
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));

app.use(express.json());

// Health check — useful for verifying server is running
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/secretary', require('./routes/secretary'));
app.use('/api/hod', require('./routes/hod'));
app.use('/api/trainer', require('./routes/trainer'));
app.use('/api/student', require('./routes/student'));
app.use('/api/parent', require('./routes/parent'));

app.use(errorHandler);

module.exports = app;