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



// Get Header Profile
exports.getInstructorHeaderInfo = async (req, res) => {
  try {
    const instructorId = req.params.id; // match route param

    if (!instructorId) {
      return res.status(400).json({ message: "Instructor ID is required" });
    }

    const instructor = await Instructor.findById(instructorId);
    const instructorProfile = await InstructorProfile.findOne({ instructorId });

    if (!instructor || !instructorProfile) {
      return res.status(404).json({ message: "Instructor or profile not found" });
    }

    const headerInfo = {
        fullName: instructor.registrationDetails.fullName,
        userName: instructorProfile.profileDetails.userName,
        profilePicture: {
          fileName: instructorProfile.profileDetails.profilePicture?.fileName || null,
          url: instructorProfile.profileDetails.profilePicture?.url || null
        }
    };

    return res.status(200).json(headerInfo);
  } catch (error) {
    console.error("Error fetching header info:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};




exports.getInstructorBasicDetails = async (req, res) => {
  try {
    const instructorId = req.params.instructorId;

    if (!instructorId) {
      return res.status(400).json({ message: "Instructor ID is required" });
    }

    const instructor = await Instructor.findById(instructorId);
    const profile = await InstructorProfile.findOne({ instructorId });

    if (!instructor || !profile) {
      return res.status(404).json({ message: "Instructor or profile not found" });
    }

    const basicDetails = {
      fullName: instructor.registrationDetails.fullName,
      userName: instructor.registrationDetails.userName,
      email: instructor.registrationDetails.email,
      gender: profile.profileDetails.gender,
      bioDescription: profile.profileDetails.bioDescription,
    };

    res.status(200).json(basicDetails);
  } catch (error) {
    console.error("Error fetching basic details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateBasicDetails = async (req, res) => {
  try {
    const instructorId = req.params.instructorId;
    const { userName, gender, bioDescription } = req.body;

    if (!instructorId) {
      return res.status(400).json({ message: "Instructor ID is required" });
    }

    const instructor = await Instructor.findById(instructorId);
    const profile = await InstructorProfile.findOne({ instructorId });

    if (!instructor || !profile) {
      return res.status(404).json({ message: "Instructor or profile not found" });
    }

    // Update userName in Instructor model
    if (userName) {
      instructor.registrationDetails.userName = userName;
      await instructor.save();
    }

    // Update profile details
    if (gender) profile.profileDetails.gender = gender;
    if (bioDescription) profile.profileDetails.bioDescription = bioDescription;

    await profile.save();

    res.status(200).json({ message: "Basic details updated successfully" });
  } catch (error) {
    console.error("Error updating basic details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



exports.getInstructorSocialMedia = async (req, res) => {
  try {
    const instructorId = req.params.instructorId;

    const profile = await InstructorProfile.findOne(
      { instructorId },
      { 'profileDetails.socialMedia': 1, _id: 0 }
    );

    if (!profile) {
      return res.status(404).json({ message: "Instructor profile not found" });
    }

    res.status(200).json({
      message: "Social media received",
      socialMedia: profile.profileDetails.socialMedia
    });
  } catch (error) {
    console.error("Error fetching social media:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateSocialMedia = async (req, res) => {
  try {
    const { socialMedia } = req.body;
    if (!Array.isArray(socialMedia)) {
      return res.status(400).json({ message: "Invalid socialMedia format" });
    }

    const profile = await InstructorProfile.findOne({ instructorId: req.instructorId });
    if (!profile) {
      return res.status(404).json({ message: "Instructor profile not found" });
    }

    profile.profileDetails.socialMedia = socialMedia;
    await profile.save();

    res.status(200).json({
      message: "Social media updated",
      socialMedia: profile.profileDetails.socialMedia
    });
  } catch (error) {
    console.error("Error updating social media:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



exports.getInstructorProfilePicture = async (req, res) => {
  try {
    const instructorId = req.params.instructorId;

    const profile = await InstructorProfile.findOne(
      { instructorId },
      { 'profileDetails.profilePicture': 1, _id: 0 }
    );

    if (!profile) {
      return res.status(404).json({ message: "Instructor profile not found" });
    }

    res.status(200).json({ profilePicture: profile.profileDetails.profilePicture });
  } catch (error) {
    console.error("Error fetching profile picture:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateProfilePicture = async (req, res) => {
  try {
    const instructorId = req.params.instructorId;
    const { profilePicture } = req.body;

    if (!profilePicture?.fileName || !profilePicture?.url) {
      return res.status(400).json({ message: "Invalid profile picture" });
    }

    const profile = await InstructorProfile.findOne({ instructorId });
    if (!profile) {
      return res.status(404).json({ message: "Instructor profile not found" });
    }

    profile.profileDetails.profilePicture = profilePicture;
    await profile.save();

    res.status(200).json({ message: "Profile picture updated", profilePicture });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};




