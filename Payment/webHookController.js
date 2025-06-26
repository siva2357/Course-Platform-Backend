const crypto = require('crypto');
const Purchase = require('./purchaseModel');
const Course = require('../courses/courseModel');
const CourseTracking = require('../courses/courseTrackingModel'); // update path as needed

module.exports = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body; // ensure raw body is not parsed JSON

  try {
    // ✅ Step 1: Verify Signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.log('❌ Signature mismatch!');
      return res.status(400).send('Invalid signature');
    }

    const event = JSON.parse(rawBody.toString());

    // ✅ Step 2: Handle "payment.captured"
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const courseId = payment.notes?.courseId;
      const userId = payment.notes?.userId;
      const userRole = payment.notes?.userRole;

      if (!courseId || !userId || !userRole) {
        return res.status(400).send('Missing courseId, userId, or userRole in payment notes');
      }

      const courseData = await Course.findById(courseId);
      if (!courseData) return res.status(404).send('Course not found');

      // ✅ Save Purchase
      const newPurchase = new Purchase({
        courseId,
        courseTitle: courseData.landingPage?.courseTitle || 'Untitled Course',
        orderId: payment.order_id,
        paymentId: payment.id,
        amount: payment.amount / 100,
        status: 'purchased',
        purchasedAt: new Date(),
        purchasedById: userId,
        userRole: userRole
      });

      await newPurchase.save();

      // ✅ Build initial progress tracking
      const trackingCurriculum = buildInitialTrackingFrom(courseData.curriculum?.sections || []);

      const newTracking = new CourseTracking({
        studentId: userId,
        courseId,
        curriculum: trackingCurriculum,
        progressPercentage: 0,
        isCourseCompleted: false,
        certificateIssued: false
      });

      await newTracking.save();
    }

    // ✅ Step 3: Handle "payment.refunded"
    if (event.event === 'payment.refunded') {
      const payment = event.payload.payment.entity;
      await Purchase.findOneAndUpdate(
        { paymentId: payment.id },
        { status: 'refunded' }
      );
    }

    res.status(200).send({ received: true });
  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(500).send('Webhook handling failed');
  }
};

// ✅ Helper function to initialize tracking structure
function buildInitialTrackingFrom(sections = []) {
  return sections.map(section => ({
    _id: section._id,
    sectionTitle: section.sectionTitle,
    status: 'Pending',
    lectures: section.lectures.map(lecture => ({
      _id: lecture._id,
      lectureTitle: lecture.lectureTitle,
      status: 'Pending',
      contents: lecture.lectureContent.map(content => ({
        _id: content._id,
        title: content.title,
        status: 'Pending'
      }))
    }))
  }));
}
