const express = require('express');
const router = express.Router();
const courseController = require('./courseController');
const {identifier }= require ( '../Middleware/identification')

// Base
router.post('/course', identifier, courseController.createCourse);
router.get('/course/:id',  courseController.getCourse);
// Instructor-only: Get their own created courses
router.get('/instructor/my-courses', identifier, courseController.getInstructorCourses);
router.get("/instructor/learners/report", identifier,courseController.getInstructorCourseLearnersReport);

router.delete('/course/:id/delete',identifier,  courseController.deleteCourse);

// Landing Page
router.get('/course/:id/landing', identifier, courseController.getLanding);
router.put('/course/:id/landing', identifier, courseController.updateLanding);
router.patch('/course/:id/landing', identifier, courseController.updateLanding);

// Plan
router.get('/course/:id/plan',identifier,  courseController.getPlan);
router.put('/course/:id/plan', identifier, courseController.updatePlan);
router.patch('/course/:id/plan', identifier, courseController.updatePlan);

// Curriculum
router.get('/course/:id/curriculum', identifier, courseController.getCurriculum);
router.put('/course/:id/curriculum', identifier, courseController.updateCurriculum);
router.patch('/course/:id/curriculum',identifier,  courseController.updateCurriculum);

// Price
router.get('/course/:id/price', identifier, courseController.getPrice);
router.put('/course/:id/price', identifier, courseController.updatePrice);
router.patch('/course/:id/price', identifier, courseController.updatePrice);

router.patch('/course/:id/submit', identifier, courseController.submitForReview);

// Admin verify course
router.patch('/course/:id/verify',identifier,  courseController.verifyCourse);

// Admin reject course
router.patch('/course/:id/reject', identifier, courseController.rejectCourse);


router.get('/student/courses', identifier, courseController.getPublishedCoursesForStudents);



// Example: GET /student/my-courses
router.get('/student/my-courses', identifier, courseController.getMyCoursesForStudent);



router.get('/analytics/summary', identifier, courseController.getInstructorSummaryAnalytics);
router.get('/analytics/charts', identifier,courseController.getInstructorChartAnalytics);
router.get('/analytics/recent-purchases', identifier, courseController.getInstructorRecentPurchases);


module.exports = router;
