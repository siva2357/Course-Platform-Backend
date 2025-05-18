const bcrypt = require('bcryptjs');
const Instructor = require('./instructorModel');

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const instructor = await Instructor.findOne({ 'registrationDetails.email': email })
      .select('+registrationDetails.password');

    if (!instructor) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const isPasswordValid = await bcrypt.compare(password, instructor.registrationDetails.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    instructor.lastLoginAt = new Date();
    instructor.status = "active";
    await instructor.save();

    res.json({
      success: true,
      message: "Logged in successfully",
      userId: instructor._id,
      role: 'instructor'
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Internal server error during login." });
  }
};

// LOGOUT
exports.logout = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID required to logout." });
    }

    const instructor = await Instructor.findById(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    instructor.lastLogoutAt = new Date();
    instructor.status = "inactive";
    await instructor.save();

    res.json({ success: true, message: "Logged out successfully." });

  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ success: false, message: "Internal server error during logout." });
  }
};
