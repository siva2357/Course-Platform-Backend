const Course = require("../courses/courseModel");
const { sendNotification } = require("../middleware/notificationHelper");

// ✅ Get all courses (for admin review / listing)
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate({
        path: 'createdById',   // 🔹 fixed (was instructorId)
        select: 'registrationDetails.fullName registrationDetails.email companyDetails',
      })
      .sort({ createdAt: -1 });

    const formatted = courses.map(course => ({
      _id: course._id,
      courseTitle: course.landingPage?.courseTitle,
      courseCategory: course.landingPage?.courseCategory,
      courseDescription: course.landingPage?.courseDescription,
      courseThumbnail: course.landingPage?.courseThumbnail,
      coursePreview: course.landingPage?.coursePreview,

      createdBy: course.createdById
        ? {
            name: course.createdById.registrationDetails?.fullName || course.createdByName,
            email: course.createdById.registrationDetails?.email || "Unknown",
          }
        : { name: course.createdByName, email: "Unknown" },

      status: course.status,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }));

    res.status(200).json({ success: true, courses: formatted });
  } catch (err) {
    console.error("Error in getAllCourses:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get single course by ID
exports.getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId)
      .populate({
        path: 'createdById',
        select: 'registrationDetails.fullName registrationDetails.email',
      });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const createdBy = course.createdById
      ? {
          fullName: course.createdById.registrationDetails?.fullName || course.createdByName,
          email: course.createdById.registrationDetails?.email || "Unknown",
        }
      : { fullName: course.createdByName, email: "Unknown" };

    // Convert to plain object
    const courseDetails = course.toObject();

    // Remove createdById
    delete courseDetails.createdById;

    // Recursively remove all `_id` fields from nested objects
    const removeIds = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(removeIds);
      } else if (obj !== null && typeof obj === "object") {
        const newObj = {};
        for (const key in obj) {
          if (key !== "_id") {
            newObj[key] = removeIds(obj[key]);
          }
        }
        return newObj;
      }
      return obj;
    };

    const cleanedCourseDetails = removeIds(courseDetails);

    // Attach createdBy properly
    cleanedCourseDetails.createdBy = createdBy;

    res.status(200).json({ success: true, courseDetails: cleanedCourseDetails });
  } catch (err) {
    console.error("Error in getCourseById:", err);
    res.status(500).json({ success: false, message: "Error fetching course" });
  }
};


// ✅ Approve course (set status → Published)
exports.approveCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const updatedCourse = await Course.findOneAndUpdate(
      { _id: courseId, status: "Pending" },
      {
        status: "Published",
        updatedAt: new Date(),
      },
      { new: true }
    ).populate("createdById", "registrationDetails.fullName registrationDetails.email");

    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found or already reviewed" });
    }

    const adminName = req.user?.registrationDetails?.fullName || "Admin";

    // 🔔 Notify instructor
    await sendNotification({
      userId: updatedCourse.createdById._id,
      userType: "Instructor",
      title: "Course Approved",
      message: `${adminName} has approved your course "${updatedCourse.landingPage.courseTitle}".`,
    });

    res.status(200).json({
      message: "Course approved and status set to Published",
      course: updatedCourse,
    });
  } catch (err) {
    console.error("Error in approveCourse:", err);
    res.status(500).json({ message: "Error approving course", error: err });
  }
};

// ✅ Reject course (set status → Rejected)
exports.rejectCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const updatedCourse = await Course.findOneAndUpdate(
      { _id: courseId, status: "Pending" },
      {
        status: "Rejected",
        updatedAt: new Date(),
      },
      { new: true }
    ).populate("createdById", "registrationDetails.fullName registrationDetails.email");

    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found or already reviewed" });
    }

    const adminName = req.user?.registrationDetails?.fullName || "Admin";

    // 🔔 Notify instructor
    await sendNotification({
      userId: updatedCourse.createdById._id,
      userType: "Instructor",
      title: "Course Rejected",
      message: `${adminName} has rejected your course "${updatedCourse.landingPage.courseTitle}".`,
    });

    res.status(200).json({
      message: "Course rejected",
      course: updatedCourse,
    });
  } catch (err) {
    console.error("Error in rejectCourse:", err);
    res.status(500).json({ message: "Error rejecting course", error: err });
  }
};
