const Equipment = require('../models/Equipment');
const BorrowRequest = require('../models/BorrowRequest');

const EDITABLE = ['itemCode', 'name', 'category', 'imageUrl', 'description'];
const pick = (src, keys) => Object.fromEntries(keys.filter((k) => src[k] !== undefined).map((k) => [k, src[k]]));
const str = (v) => (typeof v === 'string' ? v : undefined); // กัน query เป็น object ({"$ne":..})

// GET /api/equipment?search=&category=&status=&page=&limit=
exports.getAll = async (req, res, next) => {
  try {
    const search = str(req.query.search);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const filter = {};
    if (str(req.query.category)) filter.category = req.query.category;
    if (str(req.query.status)) filter.status = req.query.status;
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { itemCode: rx }, { description: rx }];
    }
    const [items, total] = await Promise.all([
      Equipment.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit),
      Equipment.countDocuments(filter)
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const item = await Equipment.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Equipment not found' });
    res.json(item);
  } catch (err) { next(err); }
};

// POST /api/equipment
exports.create = async (req, res, next) => {
  try {
    const totalQuantity = Number(req.body.totalQuantity);
    const item = await Equipment.create({
      ...pick(req.body, EDITABLE), totalQuantity, availableQuantity: totalQuantity
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
};

// PUT /api/equipment/:id — แก้ได้เฉพาะ field ทั่วไป + totalQuantity (ปรับ available ตามส่วนต่าง)
// เดิม Object.assign(rest) ทำให้แก้ damagedQuantity/lostQuantity ตรงๆ ได้
exports.update = async (req, res, next) => {
  try {
    const item = await Equipment.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Equipment not found' });

    item.set(pick(req.body, EDITABLE));
    if (req.body.totalQuantity !== undefined) {
      const total = Number(req.body.totalQuantity);
      const delta = total - item.totalQuantity;
      if (item.availableQuantity + delta < 0)
        return res.status(400).json({ message: 'totalQuantity is less than quantity currently borrowed/unavailable' });
      item.totalQuantity = total;
      item.availableQuantity += delta;
    }
    await item.save(); // pre-save คำนวณ status ให้เอง
    res.json(item);
  } catch (err) { next(err); }
};

// DELETE /api/equipment/:id — ห้ามลบถ้ายังมีคำขอยืมที่ค้างอยู่
exports.remove = async (req, res, next) => {
  try {
    const inUse = await BorrowRequest.exists({
      status: { $in: ['pending', 'approved'] }, 'items.equipment': req.params.id
    });
    if (inUse) return res.status(400).json({ message: 'Equipment has active borrow requests' });
    const item = await Equipment.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Equipment not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};
