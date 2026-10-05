const router = require('express').Router();
const c = require('../controllers/borrowController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.post('/', authorize('student'), c.createRequest);
router.get('/', c.getRequests);
router.get('/overdue', authorize('admin', 'teacher'), c.getOverdue); // ต้องอยู่ก่อน /:id
router.get('/:id', c.getOne);
router.patch('/:id/approve', authorize('admin'), c.approveRequest);
router.patch('/:id/reject', authorize('admin'), c.rejectRequest);
router.patch('/:id/return', authorize('admin'), c.returnItems);

module.exports = router;
