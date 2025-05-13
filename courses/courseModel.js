// models/Course.js
const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  courseTitle: { type: String, required: true },
  courseCategory: { type: String, required: true },
  courseDescription: { type: String, required: true },
  courseThumbnail: { type: String, required: true },
  coursePreview: { type: String, required: true },

  learningObjectives: [{ type: String, required: true }],
  courseRequirements: [{ type: String, required: true }],
  courseLevel: { type: String, required: true },

  curriculum: [
    {
      sections: [
        {
          sectionTitle: { type: String, required: true },
          lectures: [
            {
              lectureTitle: { type: String, required: true },
              lectureDescription: { type: String, required: true },
              lectureContent: { type: String, required: true },
              lectureResources: { type: String, required: true },
            },
          ],
        },
      ],
    },
  ],
  
  price: { type: String, required: true },
  discountPrice: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Published", "Rejected"], default: "Pending" }
},
{ timestamps: true } // Adds `createdAt` and `updatedAt` automatically

);

module.exports = mongoose.model("Course", courseSchema);
