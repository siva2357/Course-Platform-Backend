const express = require("express");
const router = express.Router();
const trackingController = require("./courseTrackingController");
const { identifier } = require('../Middleware/identification');

router.get("/course/track/progress/:courseId", identifier, trackingController.getCourseProgress);
router.post("/course/track/complete", identifier, trackingController.markLectureCompleted);
router.post("/course/track/content", identifier, trackingController.markContentCompleted); // ✅ New
router.get("/course/certificate/all", identifier, trackingController.getAllCoursesWithCertificate);

router.get("/course/certificate/:courseId", identifier, trackingController.getCertificateStatus);
router.get("/course/certificate/details/:courseId", identifier, trackingController.getCertifiedCourseDetails);

module.exports = router;
