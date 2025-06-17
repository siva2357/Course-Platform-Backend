const express = require('express');
const router = express.Router();
const paymentController = require('./purchaseController');

router.post('/payment/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);


// Fetch purchase by Razorpay Order ID
router.get('/purchase/order/:orderId', paymentController.getPurchaseByOrderId);

// Fetch all purchases for a course (admin)
router.get('/admin/purchases/course/:courseId', paymentController.getAllPurchasesByCourse);

router.get('/admin/summary', paymentController.getPurchaseSummaryGroupedByCourse);


module.exports = router;
