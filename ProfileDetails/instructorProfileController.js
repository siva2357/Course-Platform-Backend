// 📦 Import Required Models
const InstructorProfile = require('../ProfileDetails/instructorProfileModel');
const Instructor = require('../Authentication/instructorModel');


// 🆕 Create Instructor Profile
exports.createInstructorProfile = async (req, res) => {
  try {
    // ✅ Ensure the instructor is authenticated
    if (!req.instructorId) {
      return res.status(401).json({ message: "Unauthorized: Instructor ID is missing" });
    }

    // ✅ Find the instructor by ID
    const instructor = await Instructor.findById(req.instructorId);
    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found" });
    }

    // ❌ Check if profile already exists
    const existingProfile = await InstructorProfile.findOne({ instructorId: req.instructorId });
    if (existingProfile) {
      return res.status(400).json({ message: "Profile already exists for this instructor" });
    }

    // ✅ Get email from registration details if available
    const { registrationDetails } = instructor;
    const { email } = registrationDetails || {};

    // 🧾 Build the profileDetails object
    const profileDetails = {
      profilePicture: req.body.profileDetails.profilePicture || {},
      firstName: req.body.profileDetails.firstName,
      lastName: req.body.profileDetails.lastName,
      userName: req.body.profileDetails.userName,
      email: email || req.body.profileDetails.email || "",
      gender: req.body.profileDetails.gender,
      dateOfBirth: req.body.profileDetails.dateOfBirth,
      phoneNumber: req.body.profileDetails.phoneNumber,
      city: req.body.profileDetails.city,
      state: req.body.profileDetails.state,
      country: req.body.profileDetails.country,
      pincode: req.body.profileDetails.pincode,
      bioDescription: req.body.profileDetails.bioDescription,
    };

    // 📦 Create and save new instructor profile
    const newInstructorProfile = new InstructorProfile({
      instructorId: req.instructorId,
      profileDetails,
    });

    await newInstructorProfile.save();

    return res.status(201).json({
      message: "Instructor profile created successfully",
      instructorProfile: newInstructorProfile,
    });
  } catch (error) {
    console.error("Error creating instructor profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// 📄 Get Instructor Profile
exports.getInstructorProfile = async (req, res) => {
  try {
    const instructorId = req.params.instructorId;

    // ❌ Missing ID check
    if (!instructorId) {
      return res.status(401).json({ message: "Unauthorized: Instructor ID is missing" });
    }

    // 🔍 Find instructor and profile
    const instructor = await Instructor.findById(instructorId);
    const instructorProfile = await InstructorProfile.findOne({ instructorId });

    if (!instructor || !instructorProfile) {
      return res.status(404).json({ message: "Instructor profile not found" });
    }

    // ✅ Sync email with registration details
    instructorProfile.profileDetails.email = instructor.registrationDetails.email;

    // 📤 Send back the profile
    res.status(200).json(instructorProfile);
  } catch (error) {
    console.error("Error fetching instructor profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// 🔄 Update Instructor Profile
exports.updateInstructorProfile = async (req, res) => {
  try {
    // ✅ Ensure the instructor is authenticated
    if (!req.instructorId) {
      return res.status(401).json({ message: "Unauthorized: Instructor ID is missing" });
    }

    // 🔍 Find the instructor and profile
    const instructor = await Instructor.findById(req.instructorId);
    let instructorProfile = await InstructorProfile.findOne({ instructorId: req.instructorId });

    // ❌ Handle not found cases
    if (!instructor || !instructorProfile) {
      return res.status(404).json({ message: "Instructor profile not found" });
    }

    // ✅ Extract updated profile details
    const { profileDetails } = req.body;
    if (!profileDetails) {
      return res.status(400).json({ message: "Profile details are required" });
    }

    // ❌ Prevent email updates for security
    if (profileDetails.email) delete profileDetails.email;

    // 💾 Save instructor if necessary (currently placeholder)
    await instructor.save();

    // 🔁 Merge new details with existing profile
    instructorProfile.profileDetails = {
      ...instructorProfile.profileDetails,
      ...profileDetails,
    };

    // 🖼️ Update profile picture if explicitly provided
    if (profileDetails.profilePicture) {
      instructorProfile.profileDetails.profilePicture = profileDetails.profilePicture;
    }

    // 💾 Save updated profile
    await instructorProfile.save();

    // ✅ Respond with updated data
    res.status(200).json(instructorProfile);
  } catch (error) {
    console.error("Error updating instructor profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
