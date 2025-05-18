const express = require('express');
const router = express.Router();

// Controllers
const instructorController = require("./instructorController");



router.post('/auth/instructor/signup', instructorController.signup);


module.exports = router;
