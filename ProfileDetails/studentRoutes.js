// university.routes.js (Routes)
const express = require('express');
const router = express.Router();
const studentProfileController = require('./studentProfileController');
const { identifier } = require('../Middleware/identification');

// ✅ Use consistent param name: :instructorId everywhere
router.post('/student/profile-details', identifier, studentProfileController.createStudentProfile);
router.put('/student/:studentId/profile-details', identifier, studentProfileController.updateStudentProfile);
router.get('/student/:studentId/profile-details', identifier, studentProfileController.getStudentProfile);
router.get('/student/:id', identifier, studentProfileController.getInstructorById);
router.delete('/auth/student/:id/delete', identifier, studentProfileController.deleteStudentById);
module.exports = router;
