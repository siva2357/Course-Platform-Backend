const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  courseTitle: { type: String, required: true }, // store course title at time of purchase
  paymentId: { type: String, unique: true, sparse: true },  // Prevents duplicate payment IDs
  orderId: { type: String, unique: true, sparse: true },  
  amount: { type: Number },
  status: {
    type: String,
    enum: ['purchased', 'refunded', 'non-refundable'],
    default: 'purchased'
  },
  purchasedAt: { type: Date, default: Date.now },
  refundableUntil: { type: Date } // NEW FIELD
});

module.exports = mongoose.model("Purchase", purchaseSchema);
