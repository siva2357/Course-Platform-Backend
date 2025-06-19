const mongoose = require("mongoose");

const courseTrackingSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  completedLectures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lecture" }],
  completedSections: [{ type: mongoose.Schema.Types.ObjectId, ref: "Section" }],
  progressPercentage: { type: Number, default: 0 },
  isCourseCompleted: { type: Boolean, default: false },
   certificateIssued: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("CourseTracking", courseTrackingSchema);
