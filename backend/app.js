const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

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