const express = require('express');
const router = express.Router();
const studentProfileController = require('../ProfileDetails/studentProfileController');
const { identifier } = require('../Middleware/identification');

// ✅ Use consistent param name: :instructorId everywhere
router.post('/student/profile-details', identifier, studentProfileController.createStudentProfile);
router.put('/student/:studentId/profile-details', identifier, studentProfileController.updateStudentProfile);
router.get('/student/:studentId/profile-details', identifier, studentProfileController.getStudentProfile);
router.get('/student/:id/profile-settings', identifier, studentProfileController.getStudentById);
router.get('/student/:id/profile', identifier, studentProfileController.getStudentHeaderInfo);

router.get('/student/:studentId/profile/basic-details', identifier, studentProfileController.getStudentBasicDetails);
router.put('/student/:studentId/profile/basic-details', identifier, studentProfileController.updateBasicDetails);

router.get('/student/:studentId/profile/picture', identifier, studentProfileController.getStudentProfilePicture);
router.put('/student/:studentId/profile/picture', identifier, studentProfileController.updateProfilePicture);

router.get('/student/:studentId/profile/social-media', identifier, studentProfileController.getStudentSocialMedia);
router.put('/student/:studentId/profile/social-media', identifier, studentProfileController.updateSocialMedia);

router.delete('/auth/student/:id/delete', identifier, studentProfileController.deleteStudentById);



module.exports = router;
