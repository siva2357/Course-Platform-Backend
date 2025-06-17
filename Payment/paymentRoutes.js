const express = require("express");
const router = express.Router();
const paymentController = require("./paymentController");

router.post("/createPaymentOrder", paymentController.createPaymentOrder);
router.post("/validatePayment", paymentController.validatePayment);

module.exports = router;
