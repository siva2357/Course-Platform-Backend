const express = require('express');
const router = express.Router();
const { identifier } = require('../Middleware/identification');
const { signout,getAdminById,getAdminProfileById} = require('./adminController');
const userProfileController = require('../Admin/userProfileController'); // path as needed
const coursesController = require('../Admin/coursesController'); // path as needed
const purchaseController = require("../Payment/purchaseController");
router.get('/admin/instructors', identifier, userProfileController.getAllVerifiedInstructors);
router.get('/admin/instructor/:instructorId/profile-details', identifier, userProfileController.getInstructorProfileById);


router.get('/admin/students', identifier, userProfileController.getAllVerifiedStudents);
router.get('/admin/student/:studentId/profile-details', identifier, userProfileController.getStudentProfileById);

// DYNAMIC ROUTES LAST
// Admin
router.get("/admin/purchases", identifier, purchaseController.getAdminPurchaseSummary);

router.get('/admin/all-courses', identifier, coursesController.getAllCourses);
router.get('/admin/course/:courseId/course-details', identifier, coursesController.getCourseById);
router.patch('/admin/courses/:courseId/approve', identifier, coursesController.approveCourse);
router.patch('/admin/courses/:courseId/reject', identifier, coursesController.rejectCourse);



router.post('/auth/admin/signout', identifier, signout);
router.get('/admin/:id', identifier, getAdminById);
router.get('/admin/:id/profile', identifier, getAdminProfileById);

module.exports = router;
