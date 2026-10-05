const Equipment = require('../models/Equipment');
const BorrowRequest = require('../models/BorrowRequest');
const User = require('../models/User');

// GET /api/dashboard/summary — Admin
exports.summary = async (req, res, next) => {
  try {
    const [t] = await Equipment.aggregate([{
      $group: {
        _id: null,
        types: { $sum: 1 },
        total: { $sum: '$totalQuantity' },
        available: { $sum: '$availableQuantity' },
        damaged: { $sum: '$damagedQuantity' },
        lost: { $sum: '$lostQuantity' }
      }
    }]);
    const s = t || { types: 0, total: 0, available: 0, damaged: 0, lost: 0 };
    const [pending, active, overdue] = await Promise.all([
      BorrowRequest.countDocuments({ status: 'pending' }),
      BorrowRequest.countDocuments({ status: 'approved' }),
      BorrowRequest.countDocuments({ status: 'approved', dueDate: { $lt: new Date() } })
    ]);
    res.json({
      itemTypes: s.types,
      total: s.total,
      available: s.available,
      borrowed: s.total - s.available - s.damaged - s.lost,
      damaged: s.damaged,
      lost: s.lost,
      requests: { pending, active, overdue }
    });
  } catch (err) { next(err); }
};

// GET /api/dashboard/monthly?year=2026 — Admin / Teacher
exports.monthly = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const match = {
      status: { $in: ['approved', 'returned'] },
      borrowDate: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) }
    };
    if (req.user.role === 'teacher') {
      const students = await User.find({ advisor: req.user._id }).select('_id');
      match.borrower = { $in: students.map(s => s._id) };
    }
    const rows = await BorrowRequest.aggregate([
      { $match: match },
      // ไม่ต้อง $unwind/$addToSet: นับคำขอ 1 ต่อเอกสาร และรวมจำนวนจาก items ในเอกสารเดียว
      { $group: {
          _id: { $month: '$borrowDate' },
          requests: { $sum: 1 },
          quantity: { $sum: { $sum: '$items.quantity' } }
      } }
    ]);
    // เติมเดือนที่ไม่มีข้อมูลให้ครบ 12 เดือน
    const data = Array.from({ length: 12 }, (_, i) => {
      const r = rows.find(x => x._id === i + 1);
      return { month: i + 1, requests: r ? r.requests : 0, quantity: r ? r.quantity : 0 };
    });
    res.json({ year, data });
  } catch (err) { next(err); }
};

// GET /api/dashboard/top-items — Admin: อุปกรณ์ที่ถูกยืมบ่อยสุด
exports.topItems = async (req, res, next) => {
  try {
    const rows = await BorrowRequest.aggregate([
      { $match: { status: { $in: ['approved', 'returned'] } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.equipment', count: { $sum: 1 }, quantity: { $sum: '$items.quantity' } } },
      { $sort: { count: -1 } }, { $limit: 10 },
      { $lookup: { from: Equipment.collection.name, localField: '_id', foreignField: '_id', as: 'equipment' } },
      { $unwind: '$equipment' },
      { $project: { _id: 0, name: '$equipment.name', itemCode: '$equipment.itemCode', count: 1, quantity: 1 } }
    ]);
    res.json(rows);
  } catch (err) { next(err); }
};

// GET /api/dashboard/teacher — Teacher: ภาพรวมโปรเจกต์/นักศึกษาที่ดูแล
exports.teacherOverview = async (req, res, next) => {
  try {
    const students = await User.find({ advisor: req.user._id }).select('fullName');
    const requests = await BorrowRequest.find({ borrower: { $in: students.map(s => s._id) } })
      .populate('borrower', 'fullName');

    // Map แทน object กันชื่อโปรเจกต์ชนกับ key พิเศษ (เช่น __proto__)
    const projects = new Map();
    for (const r of requests) {
      if (!projects.has(r.project))
        projects.set(r.project, { project: r.project, students: new Set(), requests: 0, active: 0, overdue: 0 });
      const p = projects.get(r.project);
      if (r.borrower) p.students.add(r.borrower.fullName);
      p.requests++;
      if (r.status === 'approved') p.active++;
      if (r.isOverdue) p.overdue++;
    }
    res.json({
      studentCount: students.length,
      totals: {
        requests: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        active: requests.filter(r => r.status === 'approved').length,
        overdue: requests.filter(r => r.isOverdue).length
      },
      projects: [...projects.values()].map(p => ({ ...p, students: [...p.students] }))
    });
  } catch (err) { next(err); }
};
