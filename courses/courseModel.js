const mongoose = require("mongoose");

const lectureSchema = new mongoose.Schema({
  lectureTitle: { type: String},
  lectureDescription: { type: String},
  lectureContent: { type: String},
   lectureResources: { type: String },
}, { _id: false });

const sectionSchema = new mongoose.Schema({
  sectionTitle: { type: String},
  lectures: [lectureSchema]
}, { _id: false });

const courseSchema = new mongoose.Schema({
  landingPage: {
    courseTitle: { type: String },
    courseCategory: { type: String},
    courseDescription: { type: String},
    courseThumbnail: { type: String},
    coursePreview: { type: String}
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
    amount: { type: Number}
  },

  status: {
    type: String,
    enum: ["Pending", "Published", "Rejected", "Draft"],
    default: "Draft"
  }

}, { timestamps: true });

module.exports = mongoose.model("Course", courseSchema);
