const InstructorProfile = require('../ProfileDetails/instructorProfileModel');
const Instructor = require('../Authentication/instructorModel');

// CREATE
exports.createInstructorProfile = async (req, res) => {
  try {
    if (!req.instructorId) {
      return res.status(401).json({ message: "Unauthorized: Instructor ID is missing" });
    }

    const instructor = await Instructor.findById(req.instructorId);
    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found" });
    }

    const existingProfile = await InstructorProfile.findOne({ instructorId: req.instructorId });
    if (existingProfile) {
      return res.status(400).json({ message: "Profile already exists for this instructor" });
    }

    const { registrationDetails } = instructor;
    const { email, fullName, userName } = registrationDetails || {};

    const profileDetails = {
      profilePicture: req.body.profileDetails.profilePicture || {},
      fullName: fullName||req.body.profileDetails.fullName || "",
      userName: userName||req.body.profileDetails.userName || "",
      email: email || req.body.profileDetails.email || "",
      gender: req.body.profileDetails.gender,
      bioDescription: req.body.profileDetails.bioDescription,
      socialMedia: req.body.profileDetails.socialMedia || [],
    };

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

// GET PROFILE BY INSTRUCTOR ID
exports.getInstructorProfile = async (req, res) => {
  try {
    const instructorId = req.params.instructorId;

    if (!instructorId) {
      return res.status(400).json({ message: "Instructor ID is required" });
    }

    const instructor = await Instructor.findById(instructorId);
    const instructorProfile = await InstructorProfile.findOne({ instructorId });

    if (!instructor || !instructorProfile) {
      return res.status(404).json({ message: "Instructor profile not found" });
    }

    instructorProfile.profileDetails.email = instructor.registrationDetails.email;
    instructorProfile.profileDetails.fullName = instructor.registrationDetails.fullName;
    instructorProfile.profileDetails.userName = instructor.registrationDetails.userName;

    res.status(200).json(instructorProfile);
  } catch (error) {
    console.error("Error fetching instructor profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// UPDATE
exports.updateInstructorProfile = async (req, res) => {
  try {
    if (!req.instructorId) {
      return res.status(401).json({ message: "Unauthorized: Instructor ID is missing" });
    }
    const instructor = await Instructor.findById(req.instructorId);
    let instructorProfile = await InstructorProfile.findOne({ instructorId: req.instructorId });
    if (!instructor || !instructorProfile) {
      return res.status(404).json({ message: "Instructor profile not found" });
    }
    const { profileDetails } = req.body;
    if (!profileDetails) {
      return res.status(400).json({ message: "Profile details are required" });
    }
    // Email comes from registrationDetails only
    if (profileDetails.email) delete profileDetails.email;
    if (profileDetails.fullName) delete profileDetails.fullName;
    if (profileDetails.userName) delete profileDetails.userName;

    instructorProfile.profileDetails = {
      ...instructorProfile.profileDetails,
      ...profileDetails,
    };

    if (profileDetails.profilePicture) {
      instructorProfile.profileDetails.profilePicture = profileDetails.profilePicture;
    }

    if (profileDetails.socialMedia) {
      instructorProfile.profileDetails.socialMedia = profileDetails.socialMedia;
    }

    await instructorProfile.save();
    res.status(200).json(instructorProfile);
  } catch (error) {
    console.error("Error updating instructor profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET INSTRUCTOR BASIC INFO
exports.getInstructorById = async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id);
    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }
    res.status(200).json(instructor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE INSTRUCTOR + PROFILE
exports.deleteInstructorById = async (req, res) => {
  try {
    const instructorId = req.params.id;

    const foundInstructor = await Instructor.findById(instructorId);
    if (!foundInstructor) {
      return res.status(404).json({ message: "Instructor not found" });
    }

    await InstructorProfile.deleteMany({ instructorId });
    await Instructor.findByIdAndDelete(instructorId);

    res.status(200).json({ message: "Instructor and related profile deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
