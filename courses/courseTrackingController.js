const Course = require("../courses/courseModel");
const CourseTracking = require("./courseTrackingModel");

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
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    let tracking = await CourseTracking.findOne({ courseId });

    if (!tracking) {
      // 📌 Init tracking with same curriculum structure
      const curriculum = course.curriculum.sections.map(section => ({
        _id: section._id,
        sectionTitle: section.sectionTitle,
        status: 'Pending',
        lectures: section.lectures.map(lecture => ({
          _id: lecture._id,
          lectureTitle: lecture.lectureTitle,
          status: 'Pending'
        }))
      }));

      tracking = new CourseTracking({
        courseId,
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

// ✅ Mark a lecture as completed
exports.markLectureCompleted = async (req, res) => {
  try {
    const { courseId, lectureId } = req.body;

    const tracking = await CourseTracking.findOne({ courseId });
    if (!tracking) return res.status(404).json({ message: "Tracking not found" });

    let lectureFound = false;

    tracking.curriculum.forEach(section => {
      section.lectures.forEach(lecture => {
        if (lecture._id.toString() === lectureId) {
          lecture.status = 'Completed';
          lectureFound = true;
        }
      });
    });

    if (!lectureFound) return res.status(404).json({ message: "Lecture not found in tracking" });

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

    const tracking = await CourseTracking.findOne({ courseId });
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
