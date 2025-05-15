const express = require('express');
const router = express.Router();
const courseController = require('./courseController');

// Create a new course
router.post('/course', courseController.createCourse);

// Get all courses
router.get('/courses', courseController.getAllCourses);

// Get a single course by ID
router.get('/course/:id', courseController.getCourseById);

// Update a course by ID
router.put('/course/:id', courseController.updateCourse);

// Delete a course by ID
router.delete('/course/:id', courseController.deleteCourse);


// Admin verify course
router.patch('/course/verify/:id', courseController.verifyCourse);

// Admin reject course
router.patch('/course/reject/:id', courseController.rejectCourse);



module.exports = router;
