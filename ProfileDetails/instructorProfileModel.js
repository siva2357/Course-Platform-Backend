const mongoose = require("mongoose");

const instructorProfileSchema = mongoose.Schema(
  {
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor" },
    profileDetails: {
      profilePicture: {
        fileName: { type: String, required: true },
        url: { type: String, required: true }
      },
      fullName: { type: String, required: true },
      userName: { type: String, required: true },
      email: { type: String, required: true },
      gender: { type: String, required: true },
      bioDescription: { type: String, required: true },
      socialMedia: [
        {
          platform: { type: String, required: true },
          url: { type: String, required: true }
        }
      ]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("InstructorProfile", instructorProfileSchema);
