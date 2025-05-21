const express = require('express');
const router = express.Router();
const passwordController = require('../Password/passwordController')
const { identifier } = require('../middleware/identification');

router.patch('/auth/instructor/:id/change-password', identifier, passwordController.changePassword);

module.exports = router;
