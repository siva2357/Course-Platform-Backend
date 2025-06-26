const Course = require("../courses/courseModel");
const CourseTracking = require("./courseTrackingModel");
const StudentProfile = require("../ProfileDetails/studentProfileModel"); // replace with your actual student model

function calculateProgress(tracking) {
  const totalSections = tracking.curriculum.length;
  let completedSections = 0;

  tracking.curriculum.forEach(section => {
    const completedLectures = section.lectures.filter(lec => lec.status === 'Completed').length;
    const totalLectures = section.lectures.length;

    if (completedLectures === totalLectures) {
      section.status = 'Completed';
      completedSections++;
    } else if (completedLectures > 0) {
      section.status = 'In Progress';
    } else {
      section.status = 'Pending';
    }
  });

  const percentage = Math.round((completedSections / totalSections) * 100);
  tracking.progressPercentage = percentage;
  tracking.isCourseCompleted = percentage === 100;

  if (tracking.isCourseCompleted && !tracking.certificateIssued) {
    tracking.certificateIssued = true;
  }

  return tracking;
}

// 🔁 Init or fetch tracking
exports.getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.userId;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    let tracking = await CourseTracking.findOne({ courseId, studentId });

    // Initialize tracking if not found
    if (!tracking) {
      const curriculum = course.curriculum.sections.map(section => ({
        _id: section._id,
        sectionTitle: section.sectionTitle,
        sectionDuration: section.sectionDuration || '0m',
        status: 'Pending',
        lectures: section.lectures.map(lecture => ({
          _id: lecture._id,
          lectureTitle: lecture.lectureTitle,
          lectureDescription: lecture.lectureDescription || '',
          lectureDuration: lecture.lectureDuration || '0m',
          status: 'Pending',
          contents: lecture.lectureContent.map(content => ({
            _id: content._id,
            title: content.title,
            type: content.type || '',
            url: content.url || '',
            value: content.value || '',
            status: 'Pending'
          }))
        }))
      }));

      tracking = new CourseTracking({
        courseId,
        studentId,
        curriculum
      });

      calculateProgress(tracking);
      await tracking.save();
    }

    res.status(200).json({
      courseTitle: course.landingPage.courseTitle,
      progressPercentage: tracking.progressPercentage,
      isCourseCompleted: tracking.isCourseCompleted,
      certificateIssued: tracking.certificateIssued,
      curriculum: tracking.curriculum
    });

  } catch (err) {
    console.error("Error fetching course progress:", err);
    res.status(500).json({ message: "Server error" });
  }
};



exports.markContentCompleted = async (req, res) => {
  try {
    const { courseId, lectureId, contentId } = req.body;
    const studentId = req.user.userId;

    const tracking = await CourseTracking.findOne({ courseId, studentId });
    if (!tracking) return res.status(404).json({ message: "Tracking not found" });

    let contentMarked = false;

    tracking.curriculum.forEach(section => {
      section.lectures.forEach(lecture => {
        if (lecture._id.toString() === lectureId) {
          lecture.contents.forEach(content => {
            if (content._id.toString() === contentId) {
              content.status = 'Completed';
              contentMarked = true;
            }
          });

          // ✅ Auto mark lecture complete if all contents done
          const allDone = lecture.contents.every(c => c.status === 'Completed');
          lecture.status = allDone ? 'Completed' : 'Pending';
        }
      });
    });

    if (!contentMarked) return res.status(404).json({ message: "Content not found" });

    calculateProgress(tracking);
    await tracking.save();

    res.status(200).json({ message: "Content marked completed", tracking });

  } catch (err) {
    console.error("Error marking content complete:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// ✅ Mark a lecture as completed
exports.markLectureCompleted = async (req, res) => {
  try {
    const { courseId, lectureId } = req.body;
    const studentId = req.user.userId;

    const tracking = await CourseTracking.findOne({ courseId, studentId });
    if (!tracking) return res.status(404).json({ message: "Tracking not found" });

    let lectureFound = false;

    tracking.curriculum.forEach(section => {
      section.lectures.forEach(lecture => {
        if (lecture._id.toString() === lectureId) {
          lecture.status = 'Completed';
          // ✅ Also mark all its contents as completed
          lecture.contents.forEach(c => c.status = 'Completed');
          lectureFound = true;
        }
      });
    });

    if (!lectureFound)
      return res.status(404).json({ message: "Lecture not found in tracking" });

    calculateProgress(tracking);
    await tracking.save();

    res.status(200).json({ message: "Lecture marked as completed", tracking });

  } catch (err) {
    console.error("Error marking lecture completed:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🧾 Check certificate status
exports.getCertificateStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.userId;

    const tracking = await CourseTracking.findOne({ courseId, studentId });
    if (!tracking) return res.status(404).json({ message: "Tracking not found" });

    if (!tracking.certificateIssued) {
      return res.status(403).json({ eligible: false, message: "Certificate not ready" });
    }

    res.status(200).json({ eligible: true, message: "Certificate is available" });
  } catch (err) {
    console.error("Certificate status error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// ✅ Get all completed courses with certificates for the logged-in student
exports.getAllCoursesWithCertificate = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const trackings = await CourseTracking.find({
      studentId,
      isCourseCompleted: true,
      certificateIssued: true
    }).populate({
      path: 'courseId',
      select: 'landingPage.courseTitle landingPage.courseThumbnail landingPage.courseCategory createdByName createdAt'
    });

    const result = trackings.map(tracking => ({
      courseId: tracking.courseId._id,
      title: tracking.courseId.landingPage.courseTitle,
      thumbnail: tracking.courseId.landingPage.courseThumbnail,
      category: tracking.courseId.landingPage.courseCategory,
      instructor: tracking.courseId.createdByName,
      createdAt: tracking.courseId.createdAt,
      progress: tracking.progressPercentage,
      isCompleted: tracking.isCourseCompleted,
      certificateIssued: tracking.certificateIssued
    }));

    res.status(200).json({ total: result.length, data: result });
  } catch (err) {
    console.error("Error fetching certified courses:", err);
    res.status(500).json({ message: "Server error" });
  }
};



exports.getCertifiedCourseDetails = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { courseId } = req.params;

    const [tracking, profileDoc, course] = await Promise.all([
      CourseTracking.findOne({ studentId, courseId }),
      StudentProfile.findOne({ studentId }),
      Course.findById(courseId).select("landingPage status curriculum createdByName createdAt coursePlan")
    ]);

    if (!tracking) return res.status(404).json({ message: "Course tracking not found" });
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!profileDoc) return res.status(404).json({ message: "Student profile not found" });

    const { profileDetails } = profileDoc;

    const result = {
      courseId: course._id,
      title: course.landingPage.courseTitle,
      thumbnail: course.landingPage.courseThumbnail,
      category: course.landingPage.courseCategory,
      instructor: course.createdByName,
      createdAt: course.createdAt,
      status: course.status,

      curriculum: tracking.curriculum,
      progress: tracking.progressPercentage,
      isCompleted: tracking.isCourseCompleted,
      certificateIssued: tracking.certificateIssued,

      learningObjectives: course.coursePlan?.learningObjectives || [],
      courseRequirements: course.coursePlan?.courseRequirements || [],
      courseLevel: course.coursePlan?.courseLevel || [],

      student: {
        id: profileDoc._id,
        fullName: profileDetails.fullName,
        email: profileDetails.email,
        userName: profileDetails.userName,
        profilePicture: profileDetails.profilePicture?.url || null,
        bio: profileDetails.bioDescription,
        gender: profileDetails.gender,
        socialMedia: profileDetails.socialMedia || []
      }
    };

    res.status(200).json({ success: true, data: result });

  } catch (err) {
    console.error("Error fetching certified course details:", err);
    res.status(500).json({ message: "Server error" });
  }
};
