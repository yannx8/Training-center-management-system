const router = require('express').Router();
const c = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login',          c.login);
router.post('/select-role',    c.selectRole);
router.put('/change-password', authenticate, c.changePassword);
router.get('/me',              authenticate, c.getMe);
router.put('/profile',         authenticate, c.updateProfile);

module.exports = router;
