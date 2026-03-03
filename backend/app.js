// FILE: /backend/app.js
// NOTE: server.js is the real entry point (runs app.listen).
// This file just configures and exports the Express app,
// useful for testing. It must NOT call app.listen here.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/secretary', require('./routes/secretary'));
app.use('/api/hod', require('./routes/hod'));
app.use('/api/trainer', require('./routes/trainer'));
app.use('/api/student', require('./routes/student'));
app.use('/api/parent', require('./routes/parent'));

app.use(errorHandler);

module.exports = app;