const loginController = require('./loginController');
const express = require('express');
const router = express.Router();
const { identifier } = require('../Middleware/identification');

router.post('/auth/login/user', loginController.login);
router.post('/auth/logout/user',  identifier,loginController.logout);


module.exports = router;
