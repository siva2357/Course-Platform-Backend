const Instructor = require('../Authentication/instructorModel');
const InstructorProfile = require('../ProfileDetails/instructorProfileModel');
const Student = require('../Authentication/studentModel');
const StudentProfile = require('../ProfileDetails/studentProfileModel');
const Course = require('../courses/courseModel');
const Purchase = require('../Payment/purchaseModel');
const CourseTracking = require('../courses/courseTrackingModel');
/** ---------------- INSTRUCTORS ---------------- */

/** Get all verified instructors */
exports.getAllVerifiedInstructors = async (req, res) => {
  try {
    const instructors = await Instructor.find({
      role: 'instructor',
      'registrationDetails.verified': true
    }).select(
      '-registrationDetails.password ' +
      '-registrationDetails.verificationCode ' +
      '-registrationDetails.verificationCodeValidation ' +
      '-registrationDetails.forgotPasswordCode ' +
      '-registrationDetails.forgotPasswordCodeValidation'
    );

    res.status(200).json({
      totalInstructors: instructors.length,
      instructors
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching verified instructors',
      error: err.message
    });
  }
};

exports.getInstructorProfileById = async (req, res) => {
  try {
    const { instructorId } = req.params;

    // Fetch instructor profile
    const profile = await InstructorProfile.findOne({ instructorId })
      .select('-__v') // exclude version key
      .lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Instructor profile not found'
      });
    }

    // Fetch all courses posted by this instructor
    const courses = await Course.find({ 
      createdById: instructorId, 
      userRole: 'instructor' 
    })
    .select('landingPage price status totalDuration createdAt') // ✅ only required fields
    .lean();

    // Add revenue and totalSales
    const coursesFlat = await Promise.all(courses.map(async (course) => {
      const purchases = await Purchase.find({ courseId: course._id, status: 'purchased' })
        .select('revenueForInstructor amount')
        .lean();

      const revenue = purchases.reduce((sum, p) => sum + (p.revenueForInstructor || 0), 0);
      const totalSales = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);

      return {
        landingPage: course.landingPage,
        price: course.price,
        status: course.status,
        totalDuration: course.totalDuration,
        createdAt: course.createdAt,
        revenue,
        totalSales
      };
    }));

    // Return clean response
    res.status(200).json({
      success: true,
      profile: {
        profileDetails: profile,
        courses: coursesFlat
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching instructor profile',
      error: err.message
    });
  }
};


/** ---------------- STUDENTS ---------------- */

/** Get all verified students */
exports.getAllVerifiedStudents = async (req, res) => {
  try {
    const students = await Student.find({
      role: 'student',
      'registrationDetails.verified': true
    }).select(
      '-registrationDetails.password ' +
      '-registrationDetails.verificationCode ' +
      '-registrationDetails.verificationCodeValidation ' +
      '-registrationDetails.forgotPasswordCode ' +
      '-registrationDetails.forgotPasswordCodeValidation'
    );

    res.status(200).json({
      totalStudents: students.length,
      students
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching verified students',
      error: err.message
    });
  }
};

/** Get student profile by ID */

exports.getStudentProfileById = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Fetch student profile
    const profile = await StudentProfile.findOne({ studentId })
      .select('-__v')
      .lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Fetch all purchases made by student
    const purchases = await Purchase.find({ purchasedById: studentId, userRole: 'student' })
      .select('-_id courseId courseTitle amount status purchasedAt refundableUntil')
      .lean();

    // Enrich each purchased course with tracking info
    const coursesWithTracking = await Promise.all(purchases.map(async (purchase) => {
      const course = await Course.findById(purchase.courseId)
        .select('-_id landingPage  price status totalDuration courseTitle createdAt')
        .lean();

      const tracking = await CourseTracking.findOne({ studentId, courseId: purchase.courseId })
        .select('-_id progressPercentage isCourseCompleted certificateIssued')
        .lean();

      return {
        ...course,
        purchaseDetails: purchase,
        tracking: tracking || null
      };
    }));

    res.status(200).json({
      success: true,
      profile: {
        profileDetails: profile,
        courses: coursesWithTracking
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching student profile',
      error: err.message
    });
  }
};