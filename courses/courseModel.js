const mongoose = require("mongoose");

const lectureSchema = new mongoose.Schema({
  lectureTitle: { type: String },
  lectureDescription: { type: String },
  lectureDuration: { type: String, default: "0m" }, 
  lectureContent: [{ type: String }],
});

const sectionSchema = new mongoose.Schema({
  sectionTitle: { type: String },
  sectionDuration: { type: String, default: "0m" }, // sum of lecture durations
  lectures: [lectureSchema]
});

const courseSchema = new mongoose.Schema({
  createdById: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Instructor',  // ✅ now strictly tied to Instructor model
  },

  // 🔒 No need for dynamic role anymore, force instructor only
  userRole: {
    type: String,
    default: "instructor",
    enum: ["instructor"],
    required: true
  },

  landingPage: {
    courseTitle: { type: String },
    courseCategory: { type: String },
    courseDescription: { type: String },
    courseThumbnail: { type: String },
    coursePreview: { type: String }
  },

  coursePlan: {
    learningObjectives: [{ type: String }],
    courseRequirements: [{ type: String }],
    courseLevel: [{ type: String }] 
  },

  curriculum: {
    sections: [sectionSchema]
  },

  price: {
    currency: { type: String },
    pricingTier: { type: String },
    amount: { type: Number }
  },

  status: {
    type: String,
    enum: ["Pending", "Published", "Rejected", "Draft"],
    default: "Draft"
  },

  createdByName: {
    type: String,
    required: true
  },

  totalDuration: {
    type: String,
    default: "0m"
  }

}, { timestamps: true });

module.exports = mongoose.model("Course", courseSchema);
