const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

cartSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('Cart', cartSchema);
