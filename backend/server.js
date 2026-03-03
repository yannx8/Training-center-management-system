// FILE: /backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/secretary', require('./routes/secretary'));
app.use('/api/hod', require('./routes/hod'));
app.use('/api/trainer', require('./routes/trainer'));
app.use('/api/student', require('./routes/student'));
app.use('/api/parent', require('./routes/parent'));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));