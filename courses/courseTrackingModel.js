const mongoose = require("mongoose");

const lectureStatusSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId },
  lectureTitle: String,
  status: {
    type: String,
    enum: ["Pending", "Completed"],
    default: "Pending"
  }
}, { _id: false });

const sectionStatusSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId },
  sectionTitle: String,
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed"],
    default: "Pending"
  },
  lectures: [lectureStatusSchema]
}, { _id: false });

const courseTrackingSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  curriculum: [sectionStatusSchema],
  progressPercentage: { type: Number, default: 0 },
  isCourseCompleted: { type: Boolean, default: false },
  certificateIssued: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("CourseTracking", courseTrackingSchema);
