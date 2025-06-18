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
        userName: userName || 'Student',
      });
    } else if (!tracking.completedLectures.includes(lectureId)) {
      tracking.completedLectures.push(lectureId);
    }

    // Update progress
    calculateProgress(course, tracking);
    await tracking.save();

    // ✅ Trigger certificate generation if eligible
    if (tracking.isCourseCompleted && !tracking.certificateIssued) {
      const data = {
        studentName: tracking.userName || 'Student',
        courseTitle: course.title,
        issueDate: new Date().toLocaleDateString()
      };

      const fileName = `certificate-${data.studentName.replace(/\s+/g, '_')}-${Date.now()}.pdf`;
      const outputPath = path.resolve(`../Certificates/${fileName}`);

      console.log('🎓 Generating certificate:', {
        studentName: data.studentName,
        courseTitle: data.courseTitle,
        outputPath
      });

      await generateCertificatePDF(data, outputPath);

      tracking.certificatePath = `../Certificates/${fileName}`;
      tracking.certificateIssued = true;
      await tracking.save();

      console.log('✅ Certificate saved to tracking record');
    }

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

    if (!tracking.certificatePath) {
      return res.status(500).json({ message: 'Certificate not generated yet' });
    }

    console.log('📄 Certificate path:', tracking.certificatePath);

    return res.status(200).json({
      eligible: true,
      message: 'Certificate available',
      certificateUrl: tracking.certificatePath
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

    if (!tracking) {
      return res.status(404).json({ message: 'No tracking data' });
    }

    res.status(200).json(tracking);

  } catch (err) {
    console.error('❌ Error fetching progress:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// ✅ Export all handlers
module.exports = {
  calculateProgress,
  markLectureCompleted,
  getCertificateStatus,
  getCourseProgress
};
