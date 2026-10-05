const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const userPayload = (u) => ({
  _id: u._id, fullName: u.fullName, userCode: u.userCode, department: u.department,
  phone: u.phone, email: u.email, role: u.role, advisor: u.advisor
});

// POST /api/auth/register — สมัครด้วยตัวเอง (บังคับเป็น student)
exports.register = async (req, res, next) => {
  try {
    const { fullName, userCode, department, phone, email, password, advisor } = req.body;
    // เดิมใส่ advisor เป็น id อะไรก็ได้ → ต้องเป็นอาจารย์จริงเท่านั้น
    if (advisor && !(await User.exists({ _id: advisor, role: 'teacher' })))
      return res.status(400).json({ message: 'Advisor must be an existing teacher' });
    const user = await User.create({ fullName, userCode, department, phone, email, password, advisor, role: 'student' });
    res.status(201).json({ token: signToken(user._id), user: userPayload(user) });
  } catch (err) { next(err); }
};

// POST /api/auth/users — Admin สร้างผู้ใช้ทุกบทบาท
exports.createUser = async (req, res, next) => {
  try {
    res.status(201).json(userPayload(await User.create(req.body)));
  } catch (err) { next(err); }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // typeof กัน body เป็น object (NoSQL injection) และ .toLowerCase() พังตอนไม่ใช่ string
    if (typeof email !== 'string' || typeof password !== 'string')
      return res.status(400).json({ message: 'Email and password required' });
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });
    res.json({ token: signToken(user._id), user: userPayload(user) });
  } catch (err) { next(err); }
};

// GET /api/auth/me
exports.me = (req, res) => res.json(userPayload(req.user));

// GET /api/auth/users?role= — Admin / Teacher
exports.listUsers = async (req, res, next) => {
  try {
    const filter = {};
    if (typeof req.query.role === 'string') filter.role = req.query.role;
    if (req.user.role === 'teacher') { filter.role = 'student'; filter.advisor = req.user._id; }
    res.json(await User.find(filter).sort('fullName'));
  } catch (err) { next(err); }
};

// PUT /api/auth/users/:id — Admin
exports.updateUser = async (req, res, next) => {
  try {
    const { password, _id, ...rest } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.set(rest);
    if (password) user.password = password; // ส่งว่าง = ไม่เปลี่ยนรหัส
    await user.save();
    res.json(userPayload(user));
  } catch (err) { next(err); }
};
