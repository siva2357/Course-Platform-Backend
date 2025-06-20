const express = require("express");
const router = express.Router();
const trackingController = require("./courseTrackingController");

router.get("/course/track/progress/:courseId", trackingController.getCourseProgress);
router.post("/course/track/complete", trackingController.markLectureCompleted);
router.get("/course/certificate/:courseId", trackingController.getCertificateStatus);

module.exports = router;
