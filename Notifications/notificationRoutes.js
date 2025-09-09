const express = require("express");
const router = express.Router();
const notificationController = require("./notificationController");
const { identifier } = require('../Middleware/identification');

router.get("/notification/:userType/:userId", identifier, notificationController.getUserNotifications);
router.patch("/notification/:id/read", identifier, notificationController.markAsRead);
router.patch("/notification/:userType/:userId/read-all", identifier, notificationController.markAllAsRead);
router.delete("/notification/:id", identifier, notificationController.deleteNotification);
router.delete("/notification/clear/:userType/:userId", identifier, notificationController.clearUserNotifications);

module.exports = router;
