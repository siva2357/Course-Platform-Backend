const express = require("express");
const router = express.Router();
const courseTrackingController = require("../courses/courseTrackingController");

// POST - Mark lecture completed
router.post("/course/track/complete", courseTrackingController.markLectureCompleted);

// GET - Get progress by course ID
router.get("/course/track/progress/:courseId", courseTrackingController.getCourseProgress);
router.get("/course/certificate/:courseId", courseTrackingController.getCertificateStatus);

module.exports = router;
