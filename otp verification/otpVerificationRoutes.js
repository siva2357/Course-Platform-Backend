const express = require('express');
const router = express.Router();
const otpController = require('../otp verification/otpVerificationController')
// ✅ Use consistent param name: :instructorId everywhere
router.patch('/auth/send-verification-code', otpController.sendVerificationCode);
router.patch('/auth/verify-verification-code', otpController.verifyCode);

module.exports = router;
