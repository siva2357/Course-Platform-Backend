const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Instructor = require('../Authentication/instructorModel');
// const Student = require('../models/studentModel');
// const Admin = require('../models/adminModel');
const InstructorProfile = require('../ProfileDetails/instructorProfileModel');
// const StudentProfile = require("../profile-details/studentProfileModel");

require('dotenv').config(); // Load environment variables

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required!" });
    }

    const findUser = async (model, role) => {
      const user = await model.findOne({ 'registrationDetails.email': email })
        .select('+registrationDetails.password +registrationDetails.verified');
      if (user) {
        const isValidPassword = await bcrypt.compare(password, user.registrationDetails.password);
        if (!isValidPassword) {
          return null;
        }
        if (!user.registrationDetails.verified) {
          return { unverified: true };
        }
        return { user, role };
      }
      return null;
    };

    let userData = await findUser(Instructor, 'instructor')
      || await findUser(Student, 'student')
      || await findUser(Admin, 'admin');

    if (!userData) {
      return res.status(401).json({ success: false, message: "Invalid email or password!" });
    }

if (userData.unverified) {
  return res.status(403).json({ success: false, message: "Email not verified. Please verify your email before logging in." });
}

const { user, role } = userData;
    const token = jwt.sign({
      userId: user._id,
      email: user.registrationDetails.email,
      role: role,
      userName: user.registrationDetails.userName,
      verified: user.registrationDetails.verified,
    }, process.env.TOKEN_SECRET, { expiresIn: "8h" });
    user.lastLoginAt = new Date();
    user.status = "active";
    await user.save();

    // Default profileComplete to true; for instructors, check if profile exists and is complete
    let profileComplete = true;
    if (role === "instructor") {
      const instructorProfile = await InstructorProfile.findOne({ instructorId: user._id });
      profileComplete = isInstructorProfileComplete(instructorProfile);
    }

    if (role === "student") {
      const studentProfile = await StudentProfile.findOne({ studentId: user._id });
      profileComplete = isStudentProfileComplete(studentProfile);
    }

    // Send response with token, profileComplete flag, and config array
    res.cookie('Authorization', 'Bearer ' + token, {
      expires: new Date(Date.now() + 8 * 3600000),
      httpOnly: true,
      secure: false,
    }).json({
      success: true,
      token,
      role,
      verified: user.registrationDetails.verified,
      userId: user._id,
      profileComplete,
      message: 'Logged in successfully',
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "An error occurred during login. Please try again." });
  }
};

// Profile completion check functions
function isInstructorProfileComplete(profile) {
  if (!profile) return false;
  const profileData = profile.profileDetails;
  return !!profileData;
}

function isStudentProfileComplete(profile) {
  if (!profile) return false;
  const profileData = profile.profileDetails;
  return !!profileData;
}

// Logout Controller
exports.logout = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized request" });
    }

    const { userId, role } = req.user;

    let model;
    if (role === "instructor") model = Instructor;
    else if (role === "student") model = Student;
    else if (role === "admin") model = Admin;
    else return res.status(400).json({ success: false, message: "Invalid role" });

    const user = await model.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await model.findByIdAndUpdate(userId, {
      lastLogoutAt: new Date(),
      status: "inactive"
    });

    res.clearCookie("Authorization");

    res.json({ success: true, message: "Logged out successfully" });

  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ success: false, message: "An error occurred during logout." });
  }
};
