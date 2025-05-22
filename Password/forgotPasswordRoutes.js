const express = require('express');
const router = express.Router();
const forgotPasswordController = require('./forgotPasswordController')
const { identifier } = require('../middleware/identification');

router.patch('/auth/forgot-password-code', forgotPasswordController.sendForgotPasswordCode);
router.patch('/auth/verify-forgotPassword-code', forgotPasswordController.verifyForgotPasswordCode);
router.patch('/auth/reset-password', forgotPasswordController.resetPassword);

module.exports = router;