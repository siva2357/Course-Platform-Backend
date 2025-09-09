const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Instructor = require('../Authentication/instructorModel');
const InstructorProfile = require('../ProfileDetails/instructorProfileModel');
const Student = require('../Authentication/studentModel');
const StudentProfile = require('../ProfileDetails/studentProfileModel');
const Admin = require('../Authentication/adminModel')

require('dotenv').config();


exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required!" });
    }

    const findUser = async (model, profileModel, role) => {
      const user = await model.findOne({ 'registrationDetails.email': email })
        .select('+registrationDetails.password +registrationDetails.verified');
      if (!user) return null;

      const isValidPassword = await bcrypt.compare(password, user.registrationDetails.password);
      if (!isValidPassword) return null;

      if (!user.registrationDetails.verified) return { unverified: true };

      let profile = null;
      if (role === 'admin') {
        // Admin has no separate profile model
        profile = null;
      } else if (role === 'instructor') {
        profile = await profileModel.findOne({ instructorId: user._id });
      } else if (role === 'student') {
        profile = await profileModel.findOne({ studentId: user._id });
      }

      return { user, profile, role };
    };

    // Search for admin first, then instructor, then student
    let userData = await findUser(Admin, null, 'admin') ||
                   await findUser(Instructor, InstructorProfile, 'instructor') ||
                   await findUser(Student, StudentProfile, 'student');

    if (!userData) {
      return res.status(401).json({ success: false, message: "Invalid email or password!" });
    }

    if (userData.unverified) {
      return res.status(403).json({ success: false, message: "Email not verified." });
    }

    const { user, profile, role } = userData;
    const fullName = user.registrationDetails.fullName;

    const token = jwt.sign({
      userId: user._id,
      role,
      fullName,
      verified: user.registrationDetails.verified,
    }, process.env.TOKEN_SECRET, { expiresIn: "8h" });

    user.lastLoginAt = new Date();
    user.status = "active";
    await user.save();

    // Profile completion check (admins are always complete)
    let profileComplete = true;
    if (role === "instructor" || role === "student") {
      profileComplete = !!(profile && profile.profileDetails);
    }

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
      fullName,
      profileComplete,
      message: 'Logged in successfully',
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "An error occurred during login." });
  }
};



exports.logout = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized request" });
    }

    const { userId, role } = req.user;

    let model;
    if (role === "admin") model = Admin;
    else if (role === "instructor") model = Instructor;
    else if (role === "student") model = Student;
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
