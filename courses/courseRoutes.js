const express = require('express');
const router = express.Router();
const courseController = require('./courseController');

// Base
router.post('/course', courseController.createCourse);
router.get('/course/:id', courseController.getCourse);
router.get('/courses', courseController.getAllCourses);

router.delete('/course/:id/delete', courseController.deleteCourse);

// Landing Page
router.get('/course/:id/landing', courseController.getLanding);
router.put('/course/:id/landing', courseController.updateLanding);
router.patch('/course/:id/landing', courseController.updateLanding);

// Plan
router.get('/course/:id/plan', courseController.getPlan);
router.put('/course/:id/plan', courseController.updatePlan);
router.patch('/course/:id/plan', courseController.updatePlan);

// Curriculum
router.get('/course/:id/curriculum', courseController.getCurriculum);
router.put('/course/:id/curriculum', courseController.updateCurriculum);
router.patch('/course/:id/curriculum', courseController.updateCurriculum);

// Price
router.get('/course/:id/price', courseController.getPrice);
router.put('/course/:id/price', courseController.updatePrice);
router.patch('/course/:id/price', courseController.updatePrice);

router.patch('/course/:id/submit', courseController.submitForReview);

// Admin verify course
router.patch('/course/:id/verify', courseController.verifyCourse);

// Admin reject course
router.patch('/course/:id/reject', courseController.rejectCourse);



module.exports = router;
