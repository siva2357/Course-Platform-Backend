const express = require("express");
const router = express.Router();
const controller = require("./purchaseController");
const { identifier } = require("../Middleware/identification");

// Payment
router.post("/createPaymentOrder", identifier, controller.createPaymentOrder);
router.post("/validatePayment", identifier, controller.validatePayment);
router.post("/purchase/store", identifier, controller.storePurchase);
router.patch("/purchase/:purchaseId/refund", identifier, controller.refundPurchase);
router.get('/purchase/order/:orderId', identifier, controller.getPurchaseByOrderId);

// Student
router.get("/student/purchase-history", identifier, controller.getStudentPurchaseHistory);
router.patch("/purchase/student/:purchaseId/refund", identifier, controller.studentRefundPurchase);

// Instructor
router.get("/instructor/revenue", identifier, controller.getInstructorRevenue);
// Admin
router.get("/admin/purchases", identifier, controller.getAdminPurchaseSummary);


router.post('/check-access',identifier, controller.hasAccessToCourse); // POST /api/purchase/check-access


module.exports = router;
