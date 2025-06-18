const Purchase = require('./purchaseModel');
const Razorpay = require("razorpay");
const crypto = require("crypto");
const utility = require('./utlity');
const Course = require('../courses/courseModel')

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createPaymentOrder = (req, res) => {
  const amountInRupees = req.body.payload?.amount?.amount;  // nested amount

  if (!amountInRupees || isNaN(amountInRupees)) {
    return res.status(400).send({
      status: 400,
      data: { message: "Invalid or missing amount in request payload" }
    });
  }

  const amountInPaise = utility.rupeesToPaise(amountInRupees);

  const options = {
    amount: amountInPaise,
    currency: "INR",
    receipt: `receipt_order_${Date.now()}`,
    notes: req.body.payload.notes || {}
  };

  instance.orders.create(options, (err, order) => {
    if (err) return res.status(500).send({ status: 500, data: err });
    return res.status(200).send({ status: 200, data: order });
  });
};


exports.validatePayment = async (req, res) => {
  const { razorpay_signature, razorpay_payment_id, original_order_id, courseId, courseTitle, amount } = req.body.payload;

  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(original_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  const isPaymentVerified = generated_signature === razorpay_signature;

  if (isPaymentVerified) {
    try {
      const existing = await Purchase.findOne({ orderId: original_order_id });
      if (existing) {
        return res.status(200).json({ message: "Purchase already recorded" });
      }

      await Purchase.create({
        courseId,
        courseTitle,
        orderId: original_order_id,
        paymentId: razorpay_payment_id,
        amount,
        status: 'purchased',
        purchasedAt: new Date()
      });
    } catch (err) {
      console.error("❌ Error saving purchase:", err);
      return res.status(500).json({ error: "Failed to save purchase" });
    }
  }

  res.status(isPaymentVerified ? 200 : 400).send({
    data: { isPaymentVerified }
  });
};



exports.getPurchaseByOrderId = async (req, res) => {
  const { orderId } = req.params;
  const purchase = await Purchase.findOne({ orderId });
  if (!purchase) return res.status(404).send({ message: 'Not found' });
  res.send(purchase);
};

exports.getAllPurchasesByCourse = async (req, res) => {
  const { courseId } = req.params;
  const purchases = await Purchase.find({ courseId }).select('-__v');
  res.json(purchases);
};

exports.getAllPurchasedCourses = async (req, res) => {
  try {
    const purchases = await Purchase.find().select('-__v');

    res.json({
      total: purchases.length,
      items: purchases
    });
  } catch (err) {
    console.error("Error fetching purchased courses:", err);
    res.status(500).json({ message: "Failed to fetch purchased courses" });
  }
};



exports.storePurchase = async (req, res) => {
  try {
    const payload = req.body;
    payload.purchasedAt = new Date();
    const newPurchase = new Purchase(payload);
    await newPurchase.save();
    res.status(201).json({ success: true, data: newPurchase });
  } catch (err) {
    console.error('Error saving purchase:', err);
    res.status(500).json({ success: false, message: 'Failed to save purchase' });
  }
};



exports.getPurchaseSummaryGroupedByCourse = async (req, res) => {
  try {
    const summary = await Purchase.aggregate([
      {
        $match: {
          status: { $in: ['purchased', 'refunded'] }
        }
      },
      {
        $group: {
          _id: '$courseId',
          totalPurchasedAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'purchased'] }, '$amount', 0]
            }
          },
          totalRefundedAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'refunded'] }, '$amount', 0]
            }
          },
          purchasedCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'purchased'] }, 1, 0]
            }
          },
          refundedCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0]
            }
          },
          purchases: {
            $push: {
              orderId: '$orderId',
              paymentId: '$paymentId',
              amount: '$amount',
              status: '$status',
              purchasedAt: '$purchasedAt'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      {
        $unwind: '$courseInfo'
      },
      {
        $project: {
          _id: 0,
          courseId: '$courseInfo._id',
          courseTitle: '$courseInfo.landingPage.courseTitle',
          totalPurchasedAmount: 1,
          totalRefundedAmount: 1,
          purchasedCount: 1,
          refundedCount: 1,
          totalPurchases: {
            $add: ['$purchasedCount', '$refundedCount']
          },
          purchases: 1
        }
      }
    ]);

    res.json({
      totalLength: summary.length,
      data: summary
    });
  } catch (error) {
    console.error('Error getting purchase summary:', error);
    res.status(500).json({ error: 'Server error' });
  }
};



exports.refundPurchase = async (req, res) => {
  const { purchaseId } = req.params;

  try {
    const purchase = await Purchase.findById(purchaseId);

    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    // ✅ Already refunded check
    if (purchase.status === 'refunded') {
      return res.status(400).json({ message: 'Purchase already refunded' });
    }

    // ✅ Refund time window check (5 minutes)
    const purchaseTime = new Date(purchase.purchasedAt);
    const now = new Date();
    const diffMinutes = (now - purchaseTime) / 1000 / 60;

    if (diffMinutes > 5) {
      // ❌ Outside refund window → mark as non-refundable
      purchase.status = 'non-refundable';
      await purchase.save();

      return res.status(403).json({ message: 'Refund window expired. Purchase is now non-refundable.' });
    }

    // ✅ Initiate refund with Razorpay
    const refundResponse = await instance.payments.refund(purchase.paymentId, {
      amount: purchase.amount * 100, // Razorpay expects amount in paise
      speed: 'optimum',
      notes: {
        reason: 'User refund within 5 min window',
        courseTitle: purchase.courseTitle
      }
    });

    // ✅ Update DB if refund succeeds
    purchase.status = 'refunded';
    await purchase.save();

    res.status(200).json({
      message: 'Refund successful',
      refundDetails: refundResponse,
      purchase
    });
  } catch (error) {
    console.error('❌ Razorpay refund failed:', error);

    res.status(500).json({
      message: 'Refund failed',
      error: error?.error?.description || 'Server error'
    });
  }
};



// courseAccess.controller.js

exports.hasAccessToCourse = async (req, res) => {
  const { courseId } = req.body;

  if (!courseId) return res.status(400).json({ error: 'Course ID required' });

  try {
    const purchase = await Purchase.findOne({ courseId, status: 'purchased' });

    if (purchase) {
      return res.json({ access: true });
    } else {
      return res.json({ access: false });
    }
  } catch (err) {
    console.error('Access check error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
