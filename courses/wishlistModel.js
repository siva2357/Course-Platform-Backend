const mongoose = require('mongoose');


const wishlistSchema = new mongoose.Schema({
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
  
  module.exports = mongoose.model('Wishlist', wishlistSchema);
  