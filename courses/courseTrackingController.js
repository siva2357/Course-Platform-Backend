const path = require('path');
const Course = require('../courses/courseModel');
const CourseTracking = require('../courses/courseTrackingModel');
const generateCertificatePDF = require('../Certificate/certificateGenerator');

// 🔧 Helper: Calculate and update progress
function calculateProgress(course, tracking) {
  const completedLectureIds = tracking.completedLectures.map(id => id.toString());
  const completedSectionIds = new Set(tracking.completedSections.map(id => id.toString()));
  const newCompletedSections = [];

  course.curriculum.sections.forEach(section => {
    const allLecturesCompleted = section.lectures.every(lecture =>
      completedLectureIds.includes(lecture._id.toString())
    );
    if (allLecturesCompleted && !completedSectionIds.has(section._id.toString())) {
      newCompletedSections.push(section._id);
    }
  });

  tracking.completedSections.push(...newCompletedSections);
  tracking.completedSections = [...new Set(tracking.completedSections.map(id => id.toString()))];

  const totalSections = course.curriculum.sections.length;
  const completedCount = tracking.completedSections.length;

  tracking.progressPercentage = Math.round((completedCount / totalSections) * 100);
  tracking.isCourseCompleted = tracking.progressPercentage === 100;
  

  console.log(`🧮 Progress updated: ${tracking.progressPercentage}%`);
  return tracking;
}

// ✅ Mark lecture complete and update progress
async function markLectureCompleted(req, res) {
  try {
    const { courseId, lectureId, userName } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    let tracking = await CourseTracking.findOne({ courseId });

    if (!tracking) {
      tracking = new CourseTracking({
        courseId,
        completedLectures: [lectureId],
      });
    } else if (!tracking.completedLectures.includes(lectureId)) {
      tracking.completedLectures.push(lectureId);
    }

    // Deduplicate
    tracking.completedLectures = [...new Set(tracking.completedLectures.map(id => id.toString()))];

    // Update progress
    calculateProgress(course, tracking);

    // Auto-issue certificate but DO NOT store path or user
    if (tracking.isCourseCompleted && !tracking.certificateIssued) {
      await generateCertificatePDF({
        studentName: userName, // Used only for certificate generation, not stored
        courseTitle: course.landingPage.courseTitle,
        date: new Date().toLocaleDateString()
      });

      tracking.certificateIssued = true; // ✅ Just mark it as issued
    }

    await tracking.save();

    res.status(200).json({ message: 'Lecture marked completed', tracking });

  } catch (err) {
    console.error('❌ Error marking lecture completed:', err);
    res.status(500).json({ error: 'Server error' });
  }
}


// 📄 Get certificate status
async function getCertificateStatus(req, res) {
  try {
    const { courseId } = req.params;
    const tracking = await CourseTracking.findOne({ courseId });

    if (!tracking) {
      return res.status(404).json({ message: 'Tracking data not found' });
    }

    if (!tracking.certificateIssued) {
      return res.status(403).json({ message: 'Certificate not eligible yet' });
    }

    return res.status(200).json({
      eligible: true,
      message: 'Certificate available',
    });

  } catch (err) {
    console.error('❌ Error fetching certificate status:', err);
    res.status(500).json({ error: 'Server error' });
  }
}


// 📊 Get course progress
async function getCourseProgress(req, res) {
  try {
    const { courseId } = req.params;

    const tracking = await CourseTracking.findOne({ courseId });
    if (!tracking) return res.status(404).json({ message: "No tracking data" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // 🧠 Map completed lecture & section titles
    const completedLectureTitles = [];
    const completedSectionTitles = [];

    course.curriculum.sections.forEach(section => {
      if (tracking.completedSections.includes(section._id.toString())) {
        completedSectionTitles.push(section.sectionTitle);
      }

      section.lectures.forEach(lecture => {
        if (tracking.completedLectures.includes(lecture._id.toString())) {
          completedLectureTitles.push(lecture.lectureTitle);
        }
      });
    });

res.status(200).json({
    courseTitle: course.landingPage.courseTitle, // ✅ include course title
    progressPercentage: tracking.progressPercentage,
    isCourseCompleted: tracking.isCourseCompleted,
    certificateIssued: tracking.certificateIssued,
    completedLectureTitles,
    completedSectionTitles
});



  } catch (err) {
    console.error('❌ Error fetching course progress:', err);
    res.status(500).json({ error: "Server error" });
  }
}



// ✅ Export all handlers
module.exports = {
  calculateProgress,
  markLectureCompleted,
  getCertificateStatus,
  getCourseProgress
};
