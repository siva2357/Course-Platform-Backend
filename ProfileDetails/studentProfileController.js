const StudentProfile = require('../ProfileDetails/studentProfileModel');
const Student = require('../Authentication/studentModel');
const Purchase = require('../Payment/purchaseModel');
const CourseTracking = require('../courses/courseTrackingModel');
const Cart = require("../courses/cartModel");
const Wishlist = require("../courses/wishlistModel");
const mongoose = require("mongoose");


exports.createStudentProfile = async (req, res) => {
  try {
    if (!req.studentId) {
      return res.status(401).json({ message: "Unauthorized: Student ID is missing" });
    }

    const student = await Student.findById(req.studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const existingProfile = await StudentProfile.findOne({ studentId: req.studentId });
    if (existingProfile) {
      return res.status(400).json({ message: "Profile already exists for this student" });
    }

    const { registrationDetails } = student;
    const { email, fullName, userName } = registrationDetails || {};

    const profileDetails = {
      profilePicture: req.body.profileDetails.profilePicture || {},
      fullName: fullName || req.body.profileDetails.fullName || "",
      userName: userName || req.body.profileDetails.userName || "",
      email: email || req.body.profileDetails.email || "",
      gender: req.body.profileDetails.gender,
      bioDescription: req.body.profileDetails.bioDescription,
      socialMedia: req.body.profileDetails.socialMedia || [],
    };

    const newStudentProfile = new StudentProfile({
      studentId: req.studentId,
      profileDetails,
    });

    await newStudentProfile.save();

    return res.status(201).json({
      message: "Student profile created successfully",
      studentProfile: newStudentProfile,
    });
  } catch (error) {
    console.error("Error creating student profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getStudentProfile = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    const student = await Student.findById(studentId);
    const studentProfile = await StudentProfile.findOne({ studentId });

    if (!student || !studentProfile) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    studentProfile.profileDetails.email = student.registrationDetails.email;
    studentProfile.profileDetails.fullName = student.registrationDetails.fullName;
    studentProfile.profileDetails.userName = student.registrationDetails.userName;


        // 2. Get purchases
        const purchases = await Purchase.find({
          purchasedById: new mongoose.Types.ObjectId(studentId),
        })
          .populate({
            path: "courseId",
            select: "landingPage.courseTitle landingPage.courseThumbnail",
          })
          .select("courseId amount status purchasedAt")
          .lean();


              // 3. Attach tracking (minimal)
              const coursesWithTracking = await Promise.all(
                purchases.map(async (purchase) => {
                  const tracking = await CourseTracking.findOne({
                    studentId: new mongoose.Types.ObjectId(studentId),
                    courseId: purchase.courseId?._id,
                  })
                    .select("progressPercentage isCourseCompleted certificateIssued")
                    .lean();
          
                  return {
                    courseId: purchase.courseId?._id,
                    courseTitle: purchase.courseId?.landingPage?.courseTitle || null,
                    courseThumbnail: purchase.courseId?.landingPage?.courseThumbnail || null,
                    purchaseAmount: purchase.amount,
                    purchaseStatus: purchase.status,
                    purchasedAt: purchase.purchasedAt,
                    progressPercentage: tracking?.progressPercentage || 0,
                    isCourseCompleted: tracking?.isCourseCompleted || false,
                    certificateIssued: tracking?.certificateIssued || false,
                  };
                })
              );

        res.status(200).json({
      success: true,
      profile: {
        profileDetails: studentProfile,
        courses: coursesWithTracking,
      },
    });
  } catch (error) {
    console.error("Error fetching student profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// UPDATE
exports.updateStudentProfile = async (req, res) => {
  try {
    if (!req.studentId) {
      return res.status(401).json({ message: "Unauthorized: Student ID is missing" });
    }
    const student = await Student.findById(req.studentId);
    let studentProfile = await StudentProfile.findOne({ studentId: req.studentId });
    if (!student || !studentProfile) {
      return res.status(404).json({ message: "Student profile not found" });
    }
    const { profileDetails } = req.body;
    if (!profileDetails) {
      return res.status(400).json({ message: "Profile details are required" });
    }

    if (profileDetails.email) delete profileDetails.email;
    if (profileDetails.fullName) delete profileDetails.fullName;
    if (profileDetails.userName) delete profileDetails.userName;

    studentProfile.profileDetails = {
      ...studentProfile.profileDetails,
      ...profileDetails,
    };

    if (profileDetails.profilePicture) {
      studentProfile.profileDetails.profilePicture = profileDetails.profilePicture;
    }

    if (profileDetails.socialMedia) {
      studentProfile.profileDetails.socialMedia = profileDetails.socialMedia;
    }

    await studentProfile.save();
    res.status(200).json(studentProfile);
  } catch (error) {
    console.error("Error updating student profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET STUDENT BASIC INFO
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.deleteStudentById = async (req, res) => {
  try {
    const studentId = req.params.id;

    // 🔍 Find student
    const foundStudent = await Student.findById(studentId);
    if (!foundStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 1️⃣ Delete profile(s)
    await StudentProfile.deleteMany({ studentId });

    // 2️⃣ Delete purchases
    await Purchase.deleteMany({ purchasedById: studentId });

    // 3️⃣ Delete course tracking
    await CourseTracking.deleteMany({ studentId });

    // 4️⃣ Delete cart entries
    await Cart.deleteMany({ studentId });

    // 5️⃣ Delete wishlist entries
    await Wishlist.deleteMany({ studentId });

    // 6️⃣ Finally, delete the student record
    await Student.findByIdAndDelete(studentId);

    res.status(200).json({
      message: "Student and all related data (profile, purchases, tracking, cart, wishlist) deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Header Profile
exports.getStudentHeaderInfo = async (req, res) => {
  try {
    const studentId = req.params.id;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    const student = await Student.findById(studentId);
    const studentProfile = await StudentProfile.findOne({ studentId });

    if (!student || !studentProfile) {
      return res.status(404).json({ message: "Student or profile not found" });
    }

    const headerInfo = {
        fullName: student.registrationDetails.fullName,
         userName: studentProfile.profileDetails.userName,
        profilePicture: {
          fileName: studentProfile.profileDetails.profilePicture?.fileName || null,
          url: studentProfile.profileDetails.profilePicture?.url || null
        }
    };

    return res.status(200).json(headerInfo);
  } catch (error) {
    console.error("Error fetching header info:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getStudentBasicDetails = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    const student = await Student.findById(studentId);
    const profile = await StudentProfile.findOne({ studentId });

    if (!student || !profile) {
      return res.status(404).json({ message: "Student or profile not found" });
    }

    const basicDetails = {
      fullName: student.registrationDetails.fullName,
      userName: student.registrationDetails.userName,
      email: student.registrationDetails.email,
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
    const studentId = req.params.studentId;
    const { userName, gender, bioDescription } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    const student = await Student.findById(studentId);
    const profile = await StudentProfile.findOne({ studentId });

    if (!student || !profile) {
      return res.status(404).json({ message: "Student or profile not found" });
    }

    if (userName) {
      student.registrationDetails.userName = userName;
      await student.save();
    }

    if (gender) profile.profileDetails.gender = gender;
    if (bioDescription) profile.profileDetails.bioDescription = bioDescription;

    await profile.save();

    res.status(200).json({ message: "Basic details updated successfully" });
  } catch (error) {
    console.error("Error updating basic details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getStudentSocialMedia = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    const profile = await StudentProfile.findOne(
      { studentId },
      { 'profileDetails.socialMedia': 1, _id: 0 }
    );

    if (!profile) {
      return res.status(404).json({ message: "Student profile not found" });
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

    const profile = await StudentProfile.findOne({ studentId: req.studentId });
    if (!profile) {
      return res.status(404).json({ message: "Student profile not found" });
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

exports.getStudentProfilePicture = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    const profile = await StudentProfile.findOne(
      { studentId },
      { 'profileDetails.profilePicture': 1, _id: 0 }
    );

    if (!profile) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    res.status(200).json({ profilePicture: profile.profileDetails.profilePicture });
  } catch (error) {
    console.error("Error fetching profile picture:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateProfilePicture = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const { profilePicture } = req.body;

    if (!profilePicture?.fileName || !profilePicture?.url) {
      return res.status(400).json({ message: "Invalid profile picture" });
    }

    const profile = await StudentProfile.findOne({ studentId });
    if (!profile) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    profile.profileDetails.profilePicture = profilePicture;
    await profile.save();

    res.status(200).json({ message: "Profile picture updated", profilePicture });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
