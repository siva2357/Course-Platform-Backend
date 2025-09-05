const express = require('express');
const router = express.Router();
const changePasswordController = require('./changePasswordController')
const { identifier } = require('../Middleware/identification');

router.patch('/auth/instructor/:id/change-password', identifier, changePasswordController.changePassword);
router.patch('/auth/student/:id/change-password', identifier, changePasswordController.changePassword);

module.exports = router;
