const crypto = require('crypto');
const Purchase = require('./purchaseModel');
const Course = require('./courseModel');

exports.handleWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];

  try {
    // req.body is a Buffer here because of express.raw
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(req.body) // ✅ req.body is Buffer
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).send('Invalid signature');
    }

    // Now safely parse after verification
    const event = JSON.parse(req.body.toString());

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const courseId = payment.notes?.courseId;

      if (!courseId) return res.status(400).send('Course ID missing');

      const newPurchase = new Purchase({
        courseId,
        orderId: payment.order_id,
        paymentId: payment.id,
        amount: payment.amount / 100,
        status: 'purchased',
      });

      await newPurchase.save();
    }

    if (event.event === 'refund.processed') {
      const refund = event.payload.refund.entity;
      await Purchase.findOneAndUpdate(
        { paymentId: refund.payment_id },
        { status: 'refunded' }
      );
    }

    res.send({ received: true });
  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(500).send('Webhook handling failed');
  }
};



exports.getPurchaseByOrderId = async (req, res) => {
  const { orderId } = req.params;
  const purchase = await Purchase.findOne({ orderId });
  if (!purchase) return res.status(404).send({ message: 'Not found' });
  res.send(purchase);
};

exports.getAllPurchasesByCourse = async (req, res) => {
  const { courseId } = req.params;
  const purchases = await Purchase.find({ courseId });
  res.send(purchases);
};



exports.getPurchaseSummaryGroupedByCourse = async (req, res) => {
  try {
    const summary = await Purchase.aggregate([
      {
        $match: { status: 'purchased' } // Only successful purchases
      },
      {
        $group: {
          _id: '$courseId',
          totalPurchases: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
          orderIds: { $addToSet: '$orderId' },
          paymentIds: { $addToSet: '$paymentId' }
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
          totalPurchases: 1,
          totalRevenue: 1,
          orderIds: 1,
          paymentIds: 1
        }
      }
    ]);

    res.json(summary);
  } catch (error) {
    console.error('Error getting purchase summary:', error);
    res.status(500).json({ error: 'Server error' });
  }
};