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
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ message: 'Only students can initiate payment' });
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
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ message: 'Only students can validate payment' });
  }

  const {
    razorpay_signature,
    razorpay_payment_id,
    original_order_id,
    courseId,
    courseTitle,
    amount
  } = req.body.payload;

  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${original_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const isPaymentVerified = generated_signature === razorpay_signature;

  if (!isPaymentVerified) {
    return res.status(400).json({ data: { isPaymentVerified: false } });
  }

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
  purchasedAt: new Date(),
  purchasedById: req.user.userId, // ✅ FIXED HERE
  userRole: req.user.role
});


    res.status(200).json({ data: { isPaymentVerified: true } });
  } catch (err) {
    console.error("❌ Error saving purchase:", err);
    res.status(500).json({ error: "Failed to save purchase" });
  }
};

// 📌 Store Purchase manually (used optionally) - Students only
exports.storePurchase = async (req, res) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ message: 'Only students can store purchase' });
  }

  try {
    const payload = req.body;
    payload.purchasedById = req.user._id;
    payload.userRole = req.user.role;
    payload.purchasedAt = new Date();

    const newPurchase = new Purchase(payload);
    await newPurchase.save();

    res.status(201).json({ success: true, data: newPurchase });
  } catch (err) {
    console.error('Error saving purchase:', err);
    res.status(500).json({ success: false, message: 'Failed to save purchase' });
  }
};

// 📌 Refund - Students only
exports.refundPurchase = async (req, res) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ message: 'Only students can request refund' });
  }

  const { purchaseId } = req.params;

  try {
    const purchase = await Purchase.findById(purchaseId);

    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    const isOwner = purchase.purchasedById.toString() === req.user._id.toString();

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
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ message: 'Only students can request refund' });
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




// 📌 Student purchase history
exports.getStudentPurchaseHistory = async (req, res) => {
  try {
    const studentId = req.user?.userId;
    const role = req.user?.role;

    if (!studentId || !role) {
      return res.status(401).json({ message: "Unauthorized: missing user data" });
    }

    if (role.toLowerCase() !== "student") {
      return res.status(403).json({ message: "Access denied: only students allowed" });
    }

    const purchases = await Purchase.find({
      purchasedById: studentId,
      userRole: "student"
    }).populate({
      path: 'courseId',
      select: 'landingPage.courseTitle landingPage.courseThumbnail landingPage.courseCategory status createdByName createdAt'
    });

    const result = purchases.map(p => {
      const isRefunded = p.status === 'refunded';
      const isNonRefundable = p.status === 'non-refundable';
      const isEligibleForRefund = p.refundableUntil && new Date() <= new Date(p.refundableUntil);

      const course = p.courseId;

      return {
        purchaseId: p._id,
        status: p.status,
        statusLabel: isRefunded
          ? 'Refunded'
          : isNonRefundable
            ? 'Non-Refundable'
            : isEligibleForRefund
              ? 'Eligible for Refund'
              : 'Not Eligible for Refund',
        amount: p.amount,
        purchasedAt: p.purchasedAt,

        // 👇 Flattened course fields
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



// 📌 Refund by student
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

    const refundRes = await instance.payments.refund(purchase.paymentId, {
      amount: purchase.amount * 100,
      speed: 'optimum',
      notes: { reason: 'Student refund', courseTitle: purchase.courseTitle }
    });

    purchase.status = 'refunded';
    await purchase.save();

    res.status(200).json({ message: 'Refund successful', refundDetails: refundRes });
  } catch (err) {
    res.status(500).json({ message: "Refund failed", error: err.message });
  }
};

// 📌 Instructor revenue summary
exports.getInstructorRevenue = async (req, res) => {
  const instructorId = req.user?.userId;
  const role = req.user?.role;

  if (!instructorId || role !== 'instructor') {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24 hours

    // Base aggregation pipeline
    const basePipeline = [
      {
        $match: {
          status: { $in: ['purchased', 'refunded'] },
          purchasedAt: { $gte: since }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      {
        $match: {
          'course.createdById': new mongoose.Types.ObjectId(instructorId)
        }
      },
      {
        $lookup: {
          from: 'students', // adjust if your student collection has a different name
          localField: 'purchasedById',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          studentName: { $ifNull: ['$student.registrationDetails.fullName', 'Unknown'] },
          studentEmail: { $ifNull: ['$student.registrationDetails.email', 'Unknown'] },
          courseTitle: '$course.landingPage.courseTitle',
          amount: { $subtract: ['$amount', '$platformFee'] }, // revenue for instructor
          purchasedAt: 1,
          status: {
            $cond: [{ $eq: ['$status', 'refunded'] }, 'Refunded', 'Paid']
          }
        }
      },
      { $sort: { purchasedAt: -1 } }
    ];

    // Fetch recent purchases
    let recent = await Purchase.aggregate([...basePipeline]);
    let isFallback = false;

    // Fallback if no recent purchases
    if (recent.length === 0) {
      isFallback = true;

      const fallbackPipeline = [
        ...basePipeline.map(stage => ({ ...stage })), // deep copy to avoid mutation
      ];

      // Remove the 24hr filter from the first $match
      fallbackPipeline[0].$match = {
        status: { $in: ['purchased', 'refunded'] }
      };

      // Limit to latest 5
      fallbackPipeline.push({ $limit: 5 });

      recent = await Purchase.aggregate(fallbackPipeline);
    }

    return res.status(200).json({
      purchases: recent,
      isFallback,
      message: isFallback
        ? "No recent purchases in last 24 hours. Showing latest overall."
        : "Recent purchases from last 24 hours."
    });

  } catch (err) {
    console.error("Recent purchase error:", err.message);
    res.status(500).json({ error: "Failed to fetch recent purchases" });
  }
};



exports.getAdminPurchaseSummary = async (req, res) => {
  try {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({ message: "Unauthorized: missing user role" });
    }

    if (userRole.toLowerCase() !== "admin") {
      return res.status(403).json({ message: "Access denied: only admins allowed" });
    }

    const purchases = await Purchase.find()
      .populate({
        path: 'courseId',
        select: 'landingPage.courseTitle landingPage.courseThumbnail landingPage.courseCategory status createdById createdByName createdAt',
        populate: {
          path: 'createdById',            // populate instructor for email
          select: 'registrationDetails'   // only get registrationDetails (fullName & email)
        }
      })
      .populate({
        path: 'purchasedById',
        select: 'registrationDetails'
      });

    const result = purchases.map(p => {
      const isRefunded = p.status === 'refunded';
      const isNonRefundable = p.status === 'non-refundable';
      const isEligibleForRefund = p.refundableUntil && new Date() <= new Date(p.refundableUntil);

      const course = p.courseId;
      const student = p.purchasedById;
      const instructor = course?.createdById;

      return {
        purchaseId: p._id,
        status: p.status,
        statusLabel: isRefunded
          ? 'Refunded'
          : isNonRefundable
            ? 'Non-Refundable'
            : isEligibleForRefund
              ? 'Eligible for Refund'
              : 'Not Eligible for Refund',
        amount: p.amount,
        purchasedAt: p.purchasedAt,

        // Course info
        courseId: course?._id || '',
        courseTitle: course?.landingPage?.courseTitle || '',
        courseThumbnail: course?.landingPage?.courseThumbnail || '',
        courseCategory: course?.landingPage?.courseCategory || '',
        courseInstructorName: instructor?.registrationDetails?.fullName || course?.createdByName || '',
        courseInstructorEmail: instructor?.registrationDetails?.email || '',

        // Student info
        studentId: student?._id || '',
        studentName: student?.registrationDetails?.fullName || '',
        studentEmail: student?.registrationDetails?.email || ''
      };
    });

    res.status(200).json({ success: true, total: result.length, data: result });

  } catch (err) {
    console.error("❌ Error fetching admin purchase history:", err);
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
