const express = require('express');
const router = express.Router();
const loginController = require('./loginController');

router.post('/auth/login/user', loginController.login);
router.post('/auth/logout/user', loginController.logout);


module.exports = router;
