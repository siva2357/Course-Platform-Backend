const mongoose = require("mongoose");

// 🔹 Track each content item inside a lecture
const contentStatusSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId }, // Content ID from course
  title: String,
  type: String,         // video, text, etc.
  url: String,          // Video or file URL
  value: String,        // Text value (if type === 'text')
  status: {
    type: String,
    enum: ["Pending", "Completed"],
    default: "Pending"
  }
}, { _id: false });

// 🔹 Lecture tracking includes duration and description
const lectureStatusSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId },
  lectureTitle: String,
  lectureDescription: String,
  lectureDuration: String,
  status: {
    type: String,
    enum: ["Pending", "Completed"],
    default: "Pending"
  },
  contents: [contentStatusSchema]
}, { _id: false });

// 🔹 Section tracking includes duration
const sectionStatusSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId },
  sectionTitle: String,
  sectionDuration: String,
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed"],
    default: "Pending"
  },
  lectures: [lectureStatusSchema]
}, { _id: false });

// 🔹 Course tracking per student
const courseTrackingSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },
  curriculum: [sectionStatusSchema],
  progressPercentage: { type: Number, default: 0 },
  isCourseCompleted: { type: Boolean, default: false },
  certificateIssued: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("CourseTracking", courseTrackingSchema);
