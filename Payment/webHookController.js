const crypto = require('crypto');
const Purchase = require('./purchaseModel');
const Course = require('../courses/courseModel');

module.exports = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body; // Make sure bodyParser doesn't parse this to JSON already

  try {
    // Step 1: Verify Signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.log('Signature mismatch!');
      return res.status(400).send('Invalid signature');
    }

    const event = JSON.parse(rawBody.toString());

    // Step 2: Payment Captured → Save Purchase
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const courseId = payment.notes?.courseId;

      if (!courseId) return res.status(400).send('Course ID missing');

      const courseData = await Course.findById(courseId);
      if (!courseData) return res.status(404).send('Course not found');

      const newPurchase = new Purchase({
        courseId,
        courseTitle: courseData.landingPage?.courseTitle || 'Untitled Course',
        orderId: payment.order_id,
        paymentId: payment.id,
        amount: payment.amount / 100,
        status: 'purchased',
        purchasedAt: new Date()
      });

      await newPurchase.save();
    }

    // Step 3: Payment Refunded → Update status
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
