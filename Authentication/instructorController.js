const { signupSchema} = require("../Middleware/validator");
const instructor = require('./instructorModel')
const bcrypt = require('bcryptjs');

exports.signup = async (req, res) => {
  const { registrationDetails, role } = req.body;
  const { email, password } = registrationDetails;

  try {
      const { error } = signupSchema.validate(req.body);
      if (error) {
          return res.status(400).json({ success: false, message: error.details[0].message });
      }

      const existingInstructor = await instructor.findOne({ 'registrationDetails.email': email });
      if (existingInstructor) {
          return res.status(400).json({ success: false, message: "Instructor already exists!" });
      }

      const saltRounds = 12;
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newInstructor = new instructor({
          registrationDetails: {
              email,
              password: hashedPassword
          },
          role: role || 'instructor',
      });

      const result = await newInstructor.save();

      res.status(201).json({
          success: true,
          message: "Your account has been registered successfully",
          result: { email: result.registrationDetails.email, role: result.role }
      });
      
  } catch (error) {
      console.error("Signup Error:", error);
      if (error.code === 11000) {
          return res.status(400).json({ success: false, message: "Email already exists!" });
      }
      res.status(500).json({ success: false, message: "An error occurred during registration. Please try again." });
  }
};


