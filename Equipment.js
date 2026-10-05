const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  itemCode:  { type: String, required: true, unique: true, trim: true },
  name:      { type: String, required: true, trim: true },
  category:  { type: String, enum: ['equipment', 'consumable'], required: true }, // ครุภัณฑ์ / วัสดุสิ้นเปลือง
  totalQuantity:     { type: Number, required: true, min: 0 },
  availableQuantity: { type: Number, required: true, min: 0 },
  damagedQuantity:   { type: Number, default: 0, min: 0 },
  lostQuantity:      { type: Number, default: 0, min: 0 },
  imageUrl:    String,
  description: String,
  status: { type: String, enum: ['available', 'borrowed', 'damaged', 'lost'], default: 'available' }
}, { timestamps: true });

const borrowedOf = (e) => e.totalQuantity - e.availableQuantity - e.damagedQuantity - e.lostQuantity;

const deriveStatus = (e) => {
  if (e.availableQuantity > 0) return 'available';
  if (borrowedOf(e) > 0) return 'borrowed';
  if (e.damagedQuantity > 0) return 'damaged';
  if (e.lostQuantity > 0) return 'lost';
  return 'available';
};

equipmentSchema.virtual('borrowedQuantity').get(function () { return borrowedOf(this); });
equipmentSchema.set('toJSON', { virtuals: true });

// status คำนวณจากจำนวนเสมอ (ทุกทางที่ใช้ save())
equipmentSchema.pre('save', function () { this.status = deriveStatus(this); });

// ปรับ stock แบบ atomic แล้วอัปเดต status ในที่เดียว (แทน refreshStatus ที่ต้อง query เพิ่ม)
// filter ใส่เงื่อนไขกัน stock ติดลบได้ เช่น { availableQuantity: { $gte: n } }
equipmentSchema.statics.adjust = async function (filter, inc) {
  const e = await this.findOneAndUpdate(filter, { $inc: inc }, { new: true });
  if (e) {
    const status = deriveStatus(e);
    if (status !== e.status) {
      await this.updateOne({ _id: e._id }, { status });
      e.status = status;
    }
  }
  return e;
};

module.exports = mongoose.model('Equipment', equipmentSchema);
