const StudentProfile = require('./studentProfileModel');
const Student = require('../Authentication/studentModel');


exports.createStudentProfile = async (req, res) => {
  try {
    if (!req.studentId) {
      return res.status(401).json({ message: "Unauthorized: Instructor ID is missing" });
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
    const { email } = registrationDetails || {};
    const profileDetails = {
      profilePicture: req.body.profileDetails.profilePicture || {},
      fullName: fullName||req.body.profileDetails.fullName,
      userName: userName||req.body.profileDetails.userName,
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
    console.error("Error creating instructor profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getStudentProfile = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized:Student ID is missing" });
    }
    const student = await Student.findById(studentId);
    const studentProfile = await StudentProfile.findOne({ studentId });

    if (!student || !studentProfile) {
      return res.status(404).json({ message: "Student profile not found" });
    }
    studentProfile.profileDetails.email = student.registrationDetails.email;
    res.status(200).json(studentProfile);
  } catch (error) {
    console.error("Error fetching student profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

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

    await student.save();

    studentProfile.profileDetails = {
      ...studentProfile.profileDetails,
      ...profileDetails,
    };

    if (profileDetails.profilePicture) {
      studentProfile.profileDetails.profilePicture = profileDetails.profilePicture;
    }

    await studentProfile.save();

    res.status(200).json(studentProfile);
  } catch (error) {
    console.error("Error updating student profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


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
        const foundStudent = await Student.findById(studentId);
        if (!foundStudent) {
            return res.status(404).json({ message: "Student not found" });
        }
        // await JobPost.deleteMany({ instructorId });
        await StudentProfile.deleteMany({ studentId });

        await Student.findByIdAndDelete(studentId);

        res.status(200).json({ message: "Student and related data deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};