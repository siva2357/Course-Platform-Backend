const Notification = require("./notificationModel");

exports.getUserNotifications = async (req, res) => {
  const { userType, userId } = req.params;
  try {
    const notifications = await Notification.find({ userType, userId })
      .sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Error fetching notifications" });
  }
};


exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.status(200).json({ message: "Notification marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update notification" });
  }
};


exports.markAllAsRead = async (req, res) => {
  const { userId, userType } = req.params;
  try {
    await Notification.updateMany({ userId, userType, read: false }, { read: true });
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update notifications" });
  }
};



exports.deleteNotification = async (req, res) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Notification not found" });

    res.status(200).json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete notification" });
  }
};


exports.clearUserNotifications = async (req, res) => {
  const { userId, userType } = req.params;
  try {
    const result = await Notification.deleteMany({ userId, userType });
    res.status(200).json({ message: `Deleted ${result.deletedCount} notifications` });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear notifications" });
  }
};
