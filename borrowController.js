const BorrowRequest = require('../models/BorrowRequest');
const Equipment = require('../models/Equipment');
const User = require('../models/User');

const populateOpts = [
  { path: 'borrower', select: 'fullName userCode department phone email' },
  { path: 'items.equipment', select: 'name itemCode category imageUrl' },
  { path: 'approvedBy', select: 'fullName' }
];

// เปลี่ยนสถานะแบบ atomic (from → set) กันสองคนกดอนุมัติ/คืนพร้อมกันแล้วตัด stock ซ้ำ
const transition = (id, from, set) =>
  BorrowRequest.findOneAndUpdate({ _id: id, status: from }, { $set: set }, { new: true });

// ไม่พบ (404) หรือสถานะไม่ตรง (400)
const failTransition = async (res, id, message) => {
  const exists = await BorrowRequest.exists({ _id: id });
  return res.status(exists ? 400 : 404).json({ message: exists ? message : 'Not found' });
};

const log = (id, action, by, note) =>
  BorrowRequest.updateOne({ _id: id }, { $push: { history: { action, by, note } } });

// POST /api/borrow — Student ส่งคำขอ (ยังไม่ตัด stock)
exports.createRequest = async (req, res, next) => {
  try {
    const { project, purpose, borrowDate, dueDate, items } = req.body;
    if (!Array.isArray(items) || !items.length)
      return res.status(400).json({ message: 'items is required' });
    if (!(new Date(dueDate) > new Date(borrowDate)))
      return res.status(400).json({ message: 'dueDate must be a valid date after borrowDate' });
    if (!items.every((i) => Number.isInteger(i.quantity) && i.quantity > 0))
      return res.status(400).json({ message: 'quantity must be a positive integer' });

    const ids = items.map((i) => String(i.equipment));
    if (new Set(ids).size !== ids.length)
      return res.status(400).json({ message: 'Duplicate equipment in items' });
    if ((await Equipment.countDocuments({ _id: { $in: ids } })) !== ids.length)
      return res.status(400).json({ message: 'Some equipment not found' });

    const request = await BorrowRequest.create({
      borrower: req.user._id, project, purpose, borrowDate, dueDate,
      items: items.map((i) => ({ equipment: i.equipment, quantity: i.quantity })),
      history: [{ action: 'created', by: req.user._id }]
    });
    res.status(201).json(request);
  } catch (err) { next(err); }
};

// ตามสิทธิ์: student เห็นของตัวเอง, teacher เห็นของนักศึกษาในที่ปรึกษา, admin เห็นทั้งหมด
const listRequests = async (req, res, next, overdue) => {
  try {
    const filter = {};
    if (typeof req.query.status === 'string') filter.status = req.query.status;
    if (overdue) { filter.status = 'approved'; filter.dueDate = { $lt: new Date() }; }

    if (req.user.role === 'student') filter.borrower = req.user._id;
    if (req.user.role === 'teacher') {
      const students = await User.find({ advisor: req.user._id }).select('_id');
      filter.borrower = { $in: students.map((s) => s._id) };
    }
    res.json(await BorrowRequest.find(filter).sort('-createdAt').populate(populateOpts));
  } catch (err) { next(err); }
};

// GET /api/borrow?status=&overdue=true
exports.getRequests = (req, res, next) => listRequests(req, res, next, req.query.overdue === 'true');
// GET /api/borrow/overdue — Admin / Teacher
exports.getOverdue = (req, res, next) => listRequests(req, res, next, true);

// GET /api/borrow/:id (รวม history log)
exports.getOne = async (req, res, next) => {
  try {
    const r = await BorrowRequest.findById(req.params.id)
      .populate(populateOpts).populate('history.by', 'fullName role');
    if (!r) return res.status(404).json({ message: 'Not found' });

    const borrowerId = r.borrower?._id;
    if (req.user.role === 'student' && String(borrowerId) !== String(req.user._id))
      return res.status(403).json({ message: 'Forbidden' });
    if (req.user.role === 'teacher' && !(await User.exists({ _id: borrowerId, advisor: req.user._id })))
      return res.status(403).json({ message: 'Forbidden' });
    res.json(r);
  } catch (err) { next(err); }
};

// PATCH /api/borrow/:id/approve — Admin: จอง status ก่อน แล้วตัด stock แบบ atomic
exports.approveRequest = async (req, res, next) => {
  try {
    const request = await transition(req.params.id, 'pending',
      { status: 'approved', approvedBy: req.user._id, approvedAt: new Date() });
    if (!request) return failTransition(res, req.params.id, 'Request is not pending');

    const reserved = [];
    for (const item of request.items) {
      // $gte กัน stock ติดลบ
      const updated = await Equipment.adjust(
        { _id: item.equipment, availableQuantity: { $gte: item.quantity } },
        { availableQuantity: -item.quantity });
      if (!updated) {
        // คืน stock ที่ตัดไปแล้ว และย้อนสถานะกลับเป็น pending
        await Promise.all(reserved.map((r) =>
          Equipment.adjust({ _id: r.equipment }, { availableQuantity: r.quantity })));
        await BorrowRequest.updateOne({ _id: request._id },
          { status: 'pending', $unset: { approvedBy: 1, approvedAt: 1 } });
        return res.status(400).json({ message: 'Insufficient stock', equipment: item.equipment });
      }
      reserved.push(item);
    }
    await log(request._id, 'approved', req.user._id);
    res.json(await BorrowRequest.findById(request._id));
  } catch (err) { next(err); }
};

// PATCH /api/borrow/:id/reject — Admin
exports.rejectRequest = async (req, res, next) => {
  try {
    const request = await transition(req.params.id, 'pending',
      { status: 'rejected', rejectReason: req.body.reason });
    if (!request) return failTransition(res, req.params.id, 'Request is not pending');
    await log(request._id, 'rejected', req.user._id, req.body.reason);
    res.json(await BorrowRequest.findById(request._id));
  } catch (err) { next(err); }
};

// PATCH /api/borrow/:id/return — Admin
// body: { items: [{ equipment, condition: 'good'|'damaged'|'lost', note }], note }
exports.returnItems = async (req, res, next) => {
  try {
    // จองสถานะ returned ก่อน กัน return ซ้ำ/พร้อมกันแล้ว stock บวกสองรอบ
    const request = await transition(req.params.id, 'approved',
      { status: 'returned', returnedAt: new Date() });
    if (!request) return failTransition(res, req.params.id, 'Only approved requests can be returned');

    const inputs = req.body.items || [];
    for (const item of request.items) {
      const r = inputs.find((i) => String(i.equipment) === String(item.equipment)) || {};
      const condition = ['good', 'damaged', 'lost'].includes(r.condition) ? r.condition : 'good';
      item.returnCondition = condition;
      item.returnNote = r.note;

      const eq = await Equipment.findById(item.equipment).select('category');
      if (!eq) continue;
      // good: ครุภัณฑ์คืนเข้า stock / วัสดุสิ้นเปลือง (consumable) ถือว่าใช้หมด ลดจำนวนรวม
      const inc = condition === 'good'
        ? (eq.category === 'equipment' ? { availableQuantity: item.quantity } : { totalQuantity: -item.quantity })
        : condition === 'damaged' ? { damagedQuantity: item.quantity } : { lostQuantity: item.quantity };
      await Equipment.adjust({ _id: eq._id }, inc);
    }
    request.history.push({ action: 'returned', by: req.user._id, note: req.body.note });
    await request.save();
    res.json(request);
  } catch (err) { next(err); }
};
