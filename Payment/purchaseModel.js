const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  courseTitle: { type: String, required: true },

  purchasedById: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userRole' // ✅ dynamic reference based on userRole
  },
  userRole: {
    type: String,
    required: true,
    enum: ['instructor', 'student', 'admin'] // ✅ must match your model names
  },
  
  paymentId: { type: String, unique: true, sparse: true },
  orderId: { type: String, unique: true, sparse: true },
  amount: { type: Number, required: true },
  platformFee: { type: Number, default: 0 },
  revenueForInstructor: { type: Number, default: 0 },
  purchasedAt: { type: Date, default: Date.now },
  refundableUntil: { type: Date },
  status: {
    type: String,
    enum: ['purchased', 'refunded', 'non-refundable'],
    default: 'purchased'
  }
}, { timestamps: true });

module.exports = mongoose.model("Purchase", purchaseSchema);
