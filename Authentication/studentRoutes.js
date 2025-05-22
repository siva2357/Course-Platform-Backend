const express = require('express');
const router = express.Router();

const studentController = require("./studentController");

router.post('/auth/student/signup', studentController.signup);

module.exports = router;
