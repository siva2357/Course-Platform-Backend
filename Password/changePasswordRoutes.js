const express = require('express');
const router = express.Router();
const changePasswordController = require('./changePasswordController')
const { identifier } = require('../middleware/identification');

router.patch('/auth/instructor/:id/change-password', identifier, changePasswordController.changePassword);

module.exports = router;
