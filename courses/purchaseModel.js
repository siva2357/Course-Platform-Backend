const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, unique:true },
  paymentId: { type: String },
  orderId: { type: String },
  amount: { type: Number },
  status: {
    type: String,
    enum: ['purchased', 'refunded', 'non-refundable'],
    default: 'purchased'
  },
  purchasedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Purchase", purchaseSchema);
