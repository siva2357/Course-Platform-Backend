const { signupSchema} = require("../Middleware/validator");
const student = require('./studentModel')
const bcrypt = require('bcryptjs');

exports.signup = async (req, res) => {
  const { registrationDetails, role } = req.body;
  const { fullName,userName, email, password } = registrationDetails;

  try {
      const { error } = signupSchema.validate(req.body);
      if (error) {
          return res.status(400).json({ success: false, message: error.details[0].message });
      }

      const existingStudent = await student.findOne({ 'registrationDetails.email': email });
      if (existingStudent) {
          return res.status(400).json({ success: false, message: "Student already exists!" });
      }

      const saltRounds = 12;
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newStudent = new instructor({
          registrationDetails: {
             fullName,
              userName,
              email,
              password: hashedPassword
          },
          role: role || 'student',
      });

      const result = await newStudent.save();

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


