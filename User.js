const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName:   { type: String, required: true, trim: true },
  userCode:   { type: String, required: true, unique: true, trim: true }, // รหัสนักศึกษา/บุคลากร
  department: { type: String, required: true, trim: true },               // สาขา/สังกัด
  phone:      { type: String, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true, minlength: 6, select: false },
  role:       { type: String, enum: ['admin', 'teacher', 'student'], default: 'student' },
  advisor:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // อาจารย์ที่ดูแล (นักศึกษา)
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);
