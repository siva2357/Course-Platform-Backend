const express = require('express');
const router = express.Router();
const paymentController = require('./purchaseController');


router.post("/createPaymentOrder", paymentController.createPaymentOrder);
router.post("/validatePayment", paymentController.validatePayment);
// Fetch purchase by Razorpay Order ID
router.get('/purchase/order/:orderId', paymentController.getPurchaseByOrderId);

// Fetch all purchases for a course (admin)
router.get('/admin/purchases/course/:courseId', paymentController.getAllPurchasesByCourse);

router.get('/admin/purchases', paymentController.getPurchaseSummaryGroupedByCourse);
router.post('/purchase/store', paymentController.storePurchase);

router.patch('/purchase/:purchaseId/refund', paymentController.refundPurchase);
router.get('/purchases/courses', paymentController.getAllPurchasedCourses);
router.post('/check-access', paymentController.hasAccessToCourse); // POST /api/purchase/check-access

module.exports = router;
