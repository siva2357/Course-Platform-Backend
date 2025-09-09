const Notification = require("../Notifications/notificationModel");

exports.sendNotification = async ({ userId, userType, title, message, link = "" }) => {
  try {
    const notification = new Notification({
      userId,
      userType,
      title,
      message,
      link,
    });
    await notification.save();
    return true;
  } catch (error) {
    console.error("Error sending notification:", error);
    return false;
  }
};
