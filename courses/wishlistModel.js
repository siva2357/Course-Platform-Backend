const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
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

// Ensure a student cannot add the same course multiple times
wishlistSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
