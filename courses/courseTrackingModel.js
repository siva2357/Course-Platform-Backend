// courseTrackingModel.js
const mongoose = require("mongoose");

// Content tracking
const contentStatusSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId },
  title: String,
  type: String,
  url: String,
  value: String,
  status: { type: String, enum: ["In Progress","Pending", "Completed"], default: "In Progress" }
}, { _id: false });

// Lecture tracking
const lectureStatusSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId },
  lectureTitle: String,
  lectureDescription: String,
  lectureDuration: String,
  status: { type: String, enum: ["In Progress","Pending", "Completed"], default: "In Progress" },
  contents: [contentStatusSchema]
}, { _id: false });

// Section tracking
const sectionStatusSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId },
  sectionTitle: String,
  sectionDuration: String,
  status: { type: String, enum: ["In Progress", "Pending", "Completed"], default: "In Progress" },
  lectures: [lectureStatusSchema]
}, { _id: false });

// Main tracking
const courseTrackingSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  curriculum: [sectionStatusSchema],
  progressPercentage: { type: Number, default: 0 },
  isCourseCompleted: { type: Boolean, default: false },
  certificateIssued: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("CourseTracking", courseTrackingSchema);