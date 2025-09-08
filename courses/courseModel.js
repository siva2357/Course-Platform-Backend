const mongoose = require("mongoose");

const contentItemSchema = new mongoose.Schema({
     type: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: function () { return this.type !== 'text'; } },
    value: { type: String }
});

const lectureSchema = new mongoose.Schema({
  lectureTitle: { type: String },
  lectureDescription: { type: String },
  lectureDuration: { type: String, default: "0m" }, 
  lectureContent: [{type:String}],
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
  refPath: 'userRole' // ✅ dynamic reference based on userRole
},
userRole: {
  type: String,
  required: true,
  enum: ['instructor', 'student', 'admin'] // ✅ must match your model names
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
  },


}, { timestamps: true });

module.exports = mongoose.model("Course", courseSchema);
