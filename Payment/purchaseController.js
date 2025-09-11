const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Purchase = require("./purchaseModel");
const Course = require("../courses/courseModel");
const utility = require("./utlity");

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});





// 📌 Create payment order - Students only
exports.createPaymentOrder = (req, res) => {

  const studentId = req.user.userId;

if (!studentId || req.user.role !== 'student') {
  return res.status(403).json({ message: 'Only students can ...' });
}

  const amountInRupees = req.body.payload?.amount?.amount;

  if (!amountInRupees || isNaN(amountInRupees)) {
    return res.status(400).json({
      status: 400,
      data: { message: "Invalid or missing amount" }
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
    if (err) return res.status(500).json({ status: 500, data: err });
    res.status(200).json({ status: 200, data: order });
  });
};

// 📌 Validate payment & store purchase - Students only
exports.validatePayment = async (req, res) => {

const studentId = req.user.userId;

if (!studentId || req.user.role !== 'student') {
  return res.status(403).json({ message: 'Only students can ...' });
}

  const {
    razorpay_signature,
    razorpay_payment_id,
    original_order_id,
    courseId,
    courseTitle,
    amount: coursePrice
  } = req.body.payload;

  // verify payment
  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${original_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generated_signature !== razorpay_signature) {
    return res.status(400).json({ data: { isPaymentVerified: false } });
  }

  try {
    const existing = await Purchase.findOne({ orderId: original_order_id });
    if (existing) {
      return res.status(200).json({ message: "Purchase already recorded" });
    }

    // Compute breakdown
    const taxCharges = coursePrice * 0.10;       // 10% tax
    const platformFee = coursePrice * 0.10;      // 10% platform fee
    const revenueForInstructor = coursePrice - taxCharges - platformFee;
    const revenueForAdmin = taxCharges + platformFee;
    const totalPaid = coursePrice + taxCharges;  // total amount student paid

    await Purchase.create({
      courseId,
      courseTitle,
      orderId: original_order_id,
      paymentId: razorpay_payment_id,
      amount: totalPaid,
      taxCharges,
      platformFee,
      revenueForInstructor,
      revenueForAdmin,
      purchasedById: studentId,
      userRole: req.user.role,
      purchasedAt: new Date()
    });

    res.status(200).json({ data: { isPaymentVerified: true, totalPaid, taxCharges, platformFee, revenueForInstructor } });
  } catch (err) {
    console.error("❌ Error saving purchase:", err);
    res.status(500).json({ error: "Failed to save purchase" });
  }
};

exports.storePurchase = async (req, res) => {
  const studentId = req.user.userId;

if (!studentId || req.user.role !== 'student') {
  return res.status(403).json({ message: 'Only students can ...' });
}

  try {
    const { courseId, courseTitle, amount: coursePrice } = req.body;

    // Compute breakdown
    const taxCharges = coursePrice * 0.10;
    const platformFee = coursePrice * 0.10;
    const revenueForInstructor = coursePrice - taxCharges - platformFee;
    const revenueForAdmin = taxCharges + platformFee;
    const totalPaid = coursePrice + taxCharges;

    const newPurchase = new Purchase({
      courseId,
      courseTitle,
      amount: totalPaid,
      taxCharges,
      platformFee,
      revenueForInstructor,
      revenueForAdmin,
      purchasedById: studentId,
      userRole: req.user.role,
      purchasedAt: new Date()
    });

    await newPurchase.save();

    res.status(201).json({ success: true, data: newPurchase });
  } catch (err) {
    console.error('Error saving purchase:', err);
    res.status(500).json({ success: false, message: 'Failed to save purchase' });
  }
};


// 📌 Refund - Students only
exports.refundPurchase = async (req, res) => {
  const studentId = req.user.userId;

if (!studentId || req.user.role !== 'student') {
  return res.status(403).json({ message: 'Only students can ...' });
}

  const { purchaseId } = req.params;

  try {
    const purchase = await Purchase.findById(purchaseId);

    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    const isOwner = purchase.purchasedById.toString() === studentId;


    if (!isOwner) {
      return res.status(403).json({
        message: 'Unauthorized: Only the purchasing student can refund'
      });
    }

    if (purchase.status === 'refunded') {
      return res.status(400).json({ message: 'Already refunded' });
    }

    const diffMinutes = (new Date() - new Date(purchase.purchasedAt)) / 1000 / 60;

    if (diffMinutes > 5) {
      purchase.status = 'non-refundable';
      await purchase.save();
      return res.status(403).json({ message: 'Refund window expired' });
    }

    const refundResponse = await instance.payments.refund(purchase.paymentId, {
      amount: purchase.amount * 100,
      speed: 'optimum',
      notes: {
        reason: 'Refund within 5-minute window',
        courseTitle: purchase.courseTitle
      }
    });

    purchase.status = 'refunded';
    await purchase.save();

    res.status(200).json({
      message: 'Refund successful',
      refundDetails: refundResponse,
      purchase
    });
  } catch (error) {
    console.error('❌ Refund failed:', error);
    res.status(500).json({
      message: 'Refund failed',
      error: error?.error?.description || 'Server error'
    });
  }
};


exports.getPurchaseByOrderId = async (req, res) => {
  const studentId = req.user.userId;
if (!studentId || req.user.role !== 'student') {
  return res.status(403).json({ message: 'Only students can ...' });
}

  try {
    const { orderId } = req.params;
    const purchase = await Purchase.findOne({ orderId });

    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    if (purchase.purchasedById.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(purchase);
  } catch (err) {
    console.error('Error fetching purchase:', err);
    res.status(500).json({ message: 'Server error' });
  }
};




exports.getStudentPurchaseHistory = async (req, res) => {
  try {
    const studentId = req.user?.userId;

    const purchases = await Purchase.find({ purchasedById: studentId })
      .populate({
        path: 'courseId',
        select: 'landingPage.courseTitle landingPage.courseThumbnail landingPage.courseCategory createdByName createdAt'
      });

    const result = purchases.map(p => {
      const isRefunded = p.status === 'refunded';
      const isNonRefundable = p.status === 'non-refundable';
      const isEligibleForRefund = p.refundableUntil && new Date() <= new Date(p.refundableUntil);

      const course = p.courseId;

      return {
        purchaseId: p._id,
        status: p.status,
        statusLabel: isRefunded ? 'Refunded' : isNonRefundable ? 'Non-Refundable' : isEligibleForRefund ? 'Eligible for Refund' : 'Not Eligible for Refund',
        coursePrice: p.amount - p.taxCharges, // base course price
        taxCharges: p.taxCharges,
        totalPaid: p.amount,
        purchasedAt: p.purchasedAt,
        refundCharges: p.refundCharges || 0,
        refundedAmount: p.status === 'refunded' ? (p.amount - p.taxCharges - p.refundCharges) : 0,
        courseId: course?._id || '',
        courseTitle: course?.landingPage?.courseTitle || '',
        courseThumbnail: course?.landingPage?.courseThumbnail || '',
        courseCategory: course?.landingPage?.courseCategory || '',
        courseInstructor: course?.createdByName || ''
      };
    });

    res.status(200).json({ success: true, total: result.length, data: result });

  } catch (err) {
    console.error("❌ Error fetching purchase history:", err);
    res.status(500).json({ message: "Failed to load purchases", error: err.message });
  }
};

exports.studentRefundPurchase = async (req, res) => {
  const { purchaseId } = req.params;
  const studentId = req.user.userId;

  try {
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) return res.status(404).json({ message: 'Purchase not found' });

    if (purchase.purchasedById.toString() !== studentId || purchase.userRole !== 'student') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (purchase.status === 'refunded') {
      return res.status(400).json({ message: 'Already refunded' });
    }

    const diffMinutes = (Date.now() - new Date(purchase.purchasedAt)) / 60000;
    if (diffMinutes > 5) {
      purchase.status = 'non-refundable';
      await purchase.save();
      return res.status(403).json({ message: 'Refund window expired' });
    }

    // Refund logic: only course price, not tax
    const refundChargePercent = 0.10;          // 10% deduction
    const refundableAmount = purchase.amount - purchase.taxCharges; // course price
    const refundCharge = refundableAmount * refundChargePercent;
    const refundAmount = refundableAmount - refundCharge;

    // Refund via Razorpay
    const refundRes = await instance.payments.refund(purchase.paymentId, {
      amount: refundAmount * 100, // Razorpay in paise
      speed: 'optimum',
      notes: {
        reason: 'Student refund (course price only, 10% deduction)',
        courseTitle: purchase.courseTitle,
        refundCharge,
        refundedAmount: refundAmount
      }
    });

    // Update purchase
    purchase.status = 'refunded';
    purchase.refundCharges = refundCharge;
    await purchase.save();

    res.status(200).json({
      message: 'Refund successful',
      refundedAmount: refundAmount,
      refundCharge,
      taxNotRefunded: purchase.taxCharges,
      refundDetails: refundRes
    });

  } catch (err) {
    console.error('❌ Refund failed:', err);
    res.status(500).json({ message: "Refund failed", error: err.message });
  }
};


// 📌 Instructor revenue summary
exports.getInstructorRevenue = async (req, res) => {
  const instructorId = req.user?.userId;
  if (!instructorId || req.user?.role !== 'instructor') return res.status(403).json({ error: "Unauthorized" });

  try {
    const purchases = await Purchase.find()
      .populate({
        path: 'courseId',
        match: { createdById: instructorId },
        select: 'landingPage.courseTitle createdByName'
      });

    const result = purchases
      .filter(p => p.courseId) // only instructor's courses
      .map(p => ({
        purchaseId: p._id,
        courseTitle: p.courseId.landingPage.courseTitle,
        sellingPrice: p.amount - p.taxCharges,
        taxCharges: p.taxCharges,
        platformFee: p.platformFee,
        revenueForInstructor: p.revenueForInstructor,
        revenueForInstructor: p.status === 'refunded'? p.revenueForInstructor - p.refundCharges: p.revenueForInstructor,
        purchasedAt: p.purchasedAt,
        status: p.status
      }));

    res.status(200).json({ success: true, total: result.length, data: result });
  } catch (err) {
    console.error('Instructor revenue error:', err);
    res.status(500).json({ error: 'Failed to fetch instructor revenue' });
  }
};




exports.getAdminPurchaseSummary = async (req, res) => {
  if (req.user?.role?.toLowerCase() !== 'admin') return res.status(403).json({ message: "Access denied" });

  try {
    const purchases = await Purchase.find()
      .populate({
        path: 'courseId',
        select: 'landingPage.courseTitle landingPage.courseThumbnail landingPage.courseCategory createdByName createdById',
        populate: { path: 'createdById', select: 'registrationDetails' }
      })
      .populate({ path: 'purchasedById', select: 'registrationDetails' });

    const result = purchases.map(p => ({
      purchaseId: p._id,
      studentPaid: p.amount,
      coursePrice: p.amount - p.taxCharges,
      taxCharges: p.taxCharges,
      platformFee: p.platformFee,
      revenueForInstructor: p.revenueForInstructor,
      revenueForAdmin: p.revenueForAdmin,
      refundedAmount: p.status === 'refunded' ? (p.amount - p.taxCharges - p.refundCharges) : 0,
      refundCharges: p.refundCharges || 0,
      purchasedAt: p.purchasedAt,
      status: p.status,
      courseTitle: p.courseId?.landingPage?.courseTitle || '',
      courseThumbnail: p.courseId?.landingPage?.courseThumbnail || '',
      courseCategory: p.courseId?.landingPage?.courseCategory || '',
      studentName: p.purchasedById?.registrationDetails?.fullName || '',
      studentEmail: p.purchasedById?.registrationDetails?.email || '',
      instructorName: p.courseId?.createdById?.registrationDetails?.fullName || p.courseId?.createdByName || '',
      instructorEmail: p.courseId?.createdById?.registrationDetails?.email ||''
    }));

    res.status(200).json({ success: true, total: result.length, data: result });
  } catch (err) {
    console.error("Admin purchase summary error:", err);
    res.status(500).json({ message: "Failed to load purchases", error: err.message });
  }
};





exports.hasAccessToCourse = async (req, res) => {
  const { courseId } = req.body;
  const studentId = req.user?.userId; // 👈 should come from auth middleware

  if (!courseId || !studentId) {
    return res.status(400).json({ error: 'Course ID and user ID are required' });
  }

  try {
    const purchase = await Purchase.findOne({
      courseId,
      purchasedById: studentId,
      status: 'purchased'
    });

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
