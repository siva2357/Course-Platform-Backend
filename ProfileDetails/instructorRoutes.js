// university.routes.js (Routes)
const express = require('express');
const router = express.Router();
const instructorProfileController = require('../ProfileDetails/instructorProfileController');
const { identifier } = require('../Middleware/identification');

// ✅ Use consistent param name: :instructorId everywhere
router.post('/instructor/profile-details', identifier, instructorProfileController.createInstructorProfile);
router.put('/instructor/:instructorId/profile-details', identifier, instructorProfileController.updateInstructorProfile);
router.get('/instructor/:instructorId/profile-details', identifier, instructorProfileController.getInstructorProfile);
router.get('/instructor/:id/profile-settings', identifier, instructorProfileController.getInstructorById);
router.get('/instructor/:id/profile', identifier, instructorProfileController.getInstructorHeaderInfo);




router.get('/instructor/:instructorId/profile/basic-details', identifier, instructorProfileController.getInstructorBasicDetails);
router.put('/instructor/:instructorId/profile/basic-details', identifier, instructorProfileController.updateBasicDetails);


router.get('/instructor/:instructorId/profile/picture', identifier, instructorProfileController.getInstructorProfilePicture);
router.put('/instructor/:instructorId/profile/picture', identifier, instructorProfileController.updateProfilePicture);


router.get('/instructor/:instructorId/profile/social-media', identifier, instructorProfileController.getInstructorSocialMedia);
router.put('/instructor/:instructorId/profile/social-media', identifier, instructorProfileController.updateSocialMedia);



router.delete('/auth/instructor/:id/delete', identifier, instructorProfileController.deleteInstructorById);
module.exports = router;
