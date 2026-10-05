const router = require('express').Router();
const c = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/summary', authorize('admin'), c.summary);
router.get('/monthly', authorize('admin', 'teacher'), c.monthly);
router.get('/top-items', authorize('admin'), c.topItems);
router.get('/teacher', authorize('teacher'), c.teacherOverview);

module.exports = router;
