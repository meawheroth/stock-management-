const router = require('express').Router();
const c = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', c.register);
router.post('/login', c.login);
router.get('/me', protect, c.me);
router.get('/users', protect, authorize('admin', 'teacher'), c.listUsers);
router.post('/users', protect, authorize('admin'), c.createUser);
router.put('/users/:id', protect, authorize('admin'), c.updateUser);

module.exports = router;
