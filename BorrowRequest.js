const mongoose = require('mongoose');

const borrowSchema = new mongoose.Schema({
  borrower:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  project:    { type: String, required: true, trim: true }, // โปรเจกต์/วิชา
  purpose:    { type: String, required: true, trim: true },
  borrowDate: { type: Date, required: true },
  dueDate:    { type: Date, required: true },
  items: [{
    equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
    quantity:  { type: Number, required: true, min: 1 },
    returnCondition: { type: String, enum: ['good', 'damaged', 'lost'] },
    returnNote: String
  }],
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'returned'], default: 'pending', index: true },
  approvedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:   Date,
  rejectReason: String,
  returnedAt:   Date,
  history: [{ // Borrow History Log
    action: String,
    by:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: String,
    at:   { type: Date, default: Date.now }
  }]
}, { timestamps: true });

borrowSchema.virtual('isOverdue').get(function () {
  return this.status === 'approved' && this.dueDate < new Date();
});
borrowSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('BorrowRequest', borrowSchema);
