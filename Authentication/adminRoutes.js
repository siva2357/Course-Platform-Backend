const express = require('express');
const router = express.Router();
const { identifier } = require('../Middleware/identification');
const { signout,getAdminById,getAdminProfileById} = require('./adminController');
const userProfileController = require('../Admin/userProfileController'); // path as needed


router.get('/admin/instructors', identifier, userProfileController.getAllVerifiedInstructors);
router.get('/admin/instructor/:instructorId/profile-details', identifier, userProfileController.getInstructorProfileById);


router.get('/admin/students', identifier, userProfileController.getAllVerifiedStudents);
router.get('/admin/student/:studentId/profile-details', identifier, userProfileController.getStudentProfileById);

// DYNAMIC ROUTES LAST

router.post('/auth/admin/signout', identifier, signout);
router.get('/admin/:id', identifier, getAdminById);
router.get('/admin/:id/profile', identifier, getAdminProfileById);

module.exports = router;
