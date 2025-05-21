// university.routes.js (Routes)
const express = require('express');
const router = express.Router();
const instructorProfileController = require('../ProfileDetails/instructorProfileController');
const { identifier } = require('../Middleware/identification');

// ✅ Use consistent param name: :instructorId everywhere
router.post('/instructor/:instructorId/profile-details', identifier, instructorProfileController.createInstructorProfile);
router.put('/instructor/:instructorId/profile-details', identifier, instructorProfileController.updateInstructorProfile);
router.get('/instructor/:instructorId/profile-details', identifier, instructorProfileController.getInstructorProfile);
router.get('/instructor/:id', identifier, instructorProfileController.getInstructorById);
router.delete('/auth/instructor/:id/delete', identifier, instructorProfileController.deleteInstructorById);
module.exports = router;
