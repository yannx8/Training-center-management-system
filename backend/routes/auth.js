// FILE: backend/routes/auth.js
const router = require('express').Router();
const { login, selectRole, changePassword, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login',         login);
router.post('/select-role',   selectRole);
router.put('/change-password', authenticate, changePassword);
router.get('/me',             authenticate, getMe);

module.exports = router;
