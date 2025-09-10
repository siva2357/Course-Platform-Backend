const mongoose = require('mongoose'); // ✅ Required for ObjectId and schema types
const Course = require('./courseModel');
const Purchase = require('../Payment/purchaseModel');
const CourseTracking = require('./courseTrackingModel');


async function verifyInstructorOwnership(courseId, req, res) {
  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404).json({ message: 'Course not found' });
    return null;
  }

  if (
    req.user.role !== 'instructor' ||
course.createdById.toString() !== req.user.userId.toString()
  ) {
    res.status(403).json({ message: 'Access denied: Only the instructor who created the course can access this' });
    return null;
  }

  return course;
}


// Create course
exports.createCourse = async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Only instructors can create courses' });
    }

    const newCourse = new Course({
      createdById: req.user.userId,          // from decoded token
      userRole: req.user.role,               // safe from token
      createdByName: req.user.fullName,      // safe from token
      landingPage: {
        courseTitle: '', courseCategory: '', courseDescription: '',
        courseThumbnail: '', coursePreview: ''
      },
      coursePlan: {
        learningObjectives: [], courseRequirements: [], courseLevel: []
      },
      curriculum: { sections: [] },
      price: { currency: '', pricingTier: '', amount: 0 },
      status: "Draft"
    });

    const savedCourse = await newCourse.save();
    res.status(201).json(savedCourse);
  } catch (err) {
    res.status(500).json({ message: 'Error creating course', error: err.message });
  }
};



exports.getCourse = async (req, res) => {
  try {
    const courseId = req.params.id; // ✅ Corrected

    const course = await Course.findById(courseId); // ✅ Fetch full course

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({
      success: true,
      course,
    });

  } catch (err) {
    console.error("Error fetching course:", err);
    res.status(500).json({ message: "Server error" });
  }
};




exports.getInstructorCourses = async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Only instructors can access their courses' });
    }

    const instructorId = req.user.userId; // Ensure this is coming from decoded token

    // Optional status filter
    const statusFilter = req.query.status ? { status: req.query.status } : {};

    const courses = await Course.find({
      createdById: instructorId,
      ...statusFilter
    });

    const result = courses.map(course => ({
      _id: course._id,
      landingPage: course.landingPage,
      status: course.status,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }));

    res.json({ total: result.length, courses: result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch instructor courses', error: err.message });
  }
};


// Delete course
exports.deleteCourse = async (req, res) => {
  try {
    const course = await verifyInstructorOwnership(req.params.id, req, res);
    if (!course || res.headersSent) return;

    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting course', error: err.message });
  }
};

// Landing Page
exports.getLanding = async (req, res) => {
  try {
    const course = await verifyInstructorOwnership(req.params.id, req, res);
    if (!course || res.headersSent) return;
    res.json(course.landingPage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateLanding = async (req, res) => {
  try {
    const course = await verifyInstructorOwnership(req.params.id, req, res);
    if (!course || res.headersSent) return;

    course.landingPage = { ...req.body };
    await course.save();
    res.json(course.landingPage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Course Plan
exports.getPlan = async (req, res) => {
  try {
    const course = await verifyInstructorOwnership(req.params.id, req, res);
    if (!course || res.headersSent) return;
    res.json(course.coursePlan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const course = await verifyInstructorOwnership(req.params.id, req, res);
    if (!course || res.headersSent) return;

    course.coursePlan = { ...req.body };
    await course.save();
    res.json(course.coursePlan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Curriculum
exports.getCurriculum = async (req, res) => {
  try {
    const course = await verifyInstructorOwnership(req.params.id, req, res);
    if (!course || res.headersSent) return;
    res.json(course.curriculum);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCurriculum = async (req, res) => {
  try {
    const course = await verifyInstructorOwnership(req.params.id, req, res);
    if (!course || res.headersSent) return;

    course.curriculum = req.body;
    await course.save();
    res.json(course.curriculum);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Price
exports.getPrice = async (req, res) => {
  try {
    const course = await verifyInstructorOwnership(req.params.id, req, res);
    if (!course || res.headersSent) return;
    res.json(course.price);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePrice = async (req, res) => {
  try {
    const course = await verifyInstructorOwnership(req.params.id, req, res);
    if (!course || res.headersSent) return;

    course.price = { ...req.body };
    await course.save();
    res.json(course.price);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Submit for review
exports.submitForReview = async (req, res) => {
  try {
    const course = await verifyInstructorOwnership(req.params.id, req, res);
    if (!course || res.headersSent) return;

    if (course.status === 'Published') {
      return res.status(400).json({ message: 'Course is already published' });
    }
    if (course.status !== 'Draft') {
      return res.status(400).json({ message: 'Course must be in draft to submit for review' });
    }

    course.status = 'Pending';
    await course.save();
    res.json({ message: 'Course submitted for review', status: course.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



exports.verifyCourse = async (req, res) => {
  try {
    if (req.user.userRole !== 'Admin') {
      return res.status(403).json({ message: 'Only admins can publish courses' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.status !== 'Pending') {
      return res.status(400).json({ message: 'Course must be pending review to be published' });
    }

    course.status = 'Published';
    await course.save();

    res.json({ message: 'Course published successfully', status: course.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.rejectCourse = async (req, res) => {
  try {
    if (req.user.userRole !== 'Admin') {
      return res.status(403).json({ message: 'Only admins can reject courses' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // ✅ Fix: course must be in 'Pending' to reject
    if (course.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending courses can be rejected' });
    }

    course.status = 'Rejected';
    await course.save();

    res.json({ message: 'Course rejected successfully', status: course.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



exports.getPublishedCoursesForStudents = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can access published courses' });
    }

    const studentId = req.user.userId;

    // Fetch all published courses
    const courses = await Course.find({ status: 'Published' });

    // Fetch all purchased courses for this student
    const purchasedCourses = await Purchase.find({ purchasedById: studentId, status: 'purchased' })
      .select('courseId')
      .lean();
    const purchasedCourseIds = purchasedCourses.map(p => String(p.courseId));

    const categorized = {};
    for (const course of courses) {
      const category = course.landingPage.courseCategory || 'Uncategorized';
      if (!categorized[category]) categorized[category] = [];

      categorized[category].push({
        _id: course._id,
        title: course.landingPage.courseTitle,
        description: course.landingPage.courseDescription,
        thumbnail: course.landingPage.courseThumbnail,
        preview: course.landingPage.coursePreview,
        createdByName: course.createdByName,
        createdAt: course.createdAt,
        purchased: purchasedCourseIds.includes(String(course._id)) // ✅ true if student already purchased
      });
    }

    res.json({ success: true, categorizedCourses: categorized });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load published courses', error: err.message });
  }
};





exports.getMyCoursesForStudent = async (req, res) => {
  try {
    const studentId = req.params.studentId || req.user?.userId;

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    // Get purchased courses
    const purchases = await Purchase.find({ purchasedById: studentId, status: 'purchased' })
      .populate({
        path: 'courseId',
        select: 'landingPage courseCategory createdByName createdAt status',
        match: { status: 'Published' }
      });

    const courseIds = purchases.map(p => p.courseId?._id).filter(Boolean);

    // Get tracking records
    const trackingRecords = await CourseTracking.find({
      studentId,
      courseId: { $in: courseIds }
    });

    const trackingMap = new Map();
    trackingRecords.forEach(track => {
      trackingMap.set(track.courseId.toString(), {
        progressPercentage: track.progressPercentage,
        isCourseCompleted: track.isCourseCompleted,
        certificateIssued: track.certificateIssued
      });
    });

    const myCourses = purchases
      .filter(p => p.courseId)
      .map(p => {
        const track = trackingMap.get(p.courseId._id.toString()) || {};
        return {
          purchaseId: p._id,
          courseId: p.courseId._id,
          title: p.courseId.landingPage?.courseTitle || '',
          description: p.courseId.landingPage?.courseDescription || '',
          thumbnail: p.courseId.landingPage?.courseThumbnail || '',
          preview: p.courseId.landingPage?.coursePreview || '',
          category: p.courseId.landingPage?.courseCategory || '',
          instructor: p.courseId.createdByName || '',
          purchasedAt: p.purchasedAt,
          progressPercentage: track.progressPercentage || 0,
          isCourseCompleted: track.isCourseCompleted || false,
          certificateIssued: track.certificateIssued || false
        };
      });

    res.status(200).json({
      success: true,
      total: myCourses.length,
      myCourses
    });

  } catch (err) {
    console.error('❌ Error fetching student purchased courses with tracking:', err);
    res.status(500).json({ message: 'Failed to fetch purchased courses', error: err.message });
  }
};




exports.getInstructorCourseLearnersReport = async (req, res) => {
  const instructorId = req.user?.userId;
  const role = req.user?.role;

  if (!instructorId || role !== 'instructor') {
    return res.status(403).json({ error: "Unauthorized: Instructor access only" });
  }

  try {
    // 1. Get all courses created by this instructor
    const courses = await Course.find({ createdById: instructorId }).select('_id landingPage.courseTitle');
    const courseMap = new Map();

    courses.forEach(course => {
      const title = course.landingPage?.courseTitle || 'Untitled Course';
      courseMap.set(course._id.toString(), {
        courseTitle: title,
        totalLearners: 0,
        learners: []
      });
    });

    // 2. Get course tracking for all these courses
const trackingRecords = await CourseTracking.find({
  courseId: { $in: [...courseMap.keys()] }
})
.populate('studentId', 'registrationDetails.fullName registrationDetails.email')
.populate('courseId', 'landingPage.courseTitle');



    // 3. Append learners based on course tracking
trackingRecords.forEach(record => {
  const courseIdStr = record.courseId?._id?.toString();
  if (!courseIdStr || !courseMap.has(courseIdStr)) return;

  const courseEntry = courseMap.get(courseIdStr);

  const status = record.certificateIssued
    ? 'Certified'
    : record.isCourseCompleted
    ? 'Completed'
    : 'In Progress';

  courseEntry.learners.push({
    studentName: record.studentId?.registrationDetails?.fullName || 'Unknown',
    studentEmail: record.studentId?.registrationDetails?.email || 'Unknown',
    status,
    startedOn: record.createdAt,
    completedOn: record.isCourseCompleted ? record.updatedAt : null
  });

  courseEntry.totalLearners = courseEntry.learners.length;
});


    const report = Array.from(courseMap.values());

    return res.status(200).json({ success: true, report });

  } catch (error) {
    console.error('Report generation error:', error.message);
    return res.status(500).json({ error: "Failed to generate learner report" });
  }
};




exports.getInstructorRecentPurchases = async (req, res) => {
  const instructorId = req.user?.userId;
  const role = req.user?.role;

  if (!instructorId || role !== "instructor") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h

    const baseMatch = { status: { $in: ["purchased", "refunded"] } };

    const recent = await Purchase.aggregate([
      // Join with courses
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course"
        }
      },
      { $unwind: "$course" },
      // Join with students
      {
        $lookup: {
          from: "students", // adjust if your student collection has a different name
          localField: "purchasedById",
          foreignField: "_id",
          as: "student"
        }
      },
      { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
      // Match instructor + recent 24h + status
      {
        $match: {
          "course.createdById": new mongoose.Types.ObjectId(instructorId),
          purchasedAt: { $gte: since },
          ...baseMatch
        }
      },
      {
        $project: {
          studentId: "$purchasedById",
          studentName: { $ifNull: ["$student.registrationDetails.fullName", "Unknown"] },
          studentEmail: { $ifNull: ["$student.registrationDetails.email", "Unknown"] },
          courseTitle: "$courseTitle",
          amount: { $subtract: ["$amount", "$platformFee"] },
          purchasedAt: 1,
          status: { $cond: [{ $eq: ["$status", "refunded"] }, "Refunded", "Paid"] }
        }
      },
      { $sort: { purchasedAt: -1 } },
      { $limit: 5 }
    ]);

    let isFallback = false;

    if (recent.length === 0) {
      isFallback = true;

      const fallback = await Purchase.aggregate([
        {
          $lookup: {
            from: "courses",
            localField: "courseId",
            foreignField: "_id",
            as: "course"
          }
        },
        { $unwind: "$course" },
        {
          $lookup: {
            from: "students",
            localField: "purchasedById",
            foreignField: "_id",
            as: "student"
          }
        },
        { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
        {
          $match: {
            "course.createdById": new mongoose.Types.ObjectId(instructorId),
            ...baseMatch
          }
        },
        {
          $project: {
            studentId: "$purchasedById",
            studentName: { $ifNull: ["$student.registrationDetails.fullName", "Unknown"] },
            studentEmail: { $ifNull: ["$student.registrationDetails.email", "Unknown"] },
            courseTitle: "$courseTitle",
            amount: { $subtract: ["$amount", "$platformFee"] },
            purchasedAt: 1,
            status: { $cond: [{ $eq: ["$status", "refunded"] }, "Refunded", "Paid"] }
          }
        },
        { $sort: { purchasedAt: -1 } },
        { $limit: 5 }
      ]);

      return res.status(200).json({
        purchases: fallback,
        isFallback: true,
        message: "No recent purchases in last 24 hours. Showing latest overall."
      });
    }

    return res.status(200).json({
      purchases: recent,
      isFallback: false,
      message: "Recent purchases from last 24 hours."
    });

  } catch (err) {
    console.error("Recent purchase error:", err.message);
    res.status(500).json({ error: "Failed to fetch recent purchases" });
  }
};

exports.getInstructorChartAnalytics = async (req, res) => {
  const instructorId = req.user?.userId;
  const role = req.user?.role;

  if (!instructorId || role !== 'instructor') {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    // CATEGORY STATS
    const categoryStats = await Course.aggregate([
      { $match: { createdById: new mongoose.Types.ObjectId(instructorId) } },
      {
        $lookup: {
          from: 'purchases',
          localField: '_id',
          foreignField: 'courseId',
          as: 'purchases'
        }
      },
      { $project: { category: "$landingPage.courseCategory", courseId: "$_id", purchases: 1 } },
      { $unwind: { path: "$purchases", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$category",
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$purchases.status", "purchased"] },
                { $subtract: ["$purchases.amount", "$purchases.platformFee"] },
                0
              ]
            }
          },
          totalStudents: {
            $addToSet: {
              $cond: [{ $eq: ["$purchases.status", "purchased"] }, "$purchases.purchasedById", null]
            }
          },
          totalCourses: { $addToSet: "$courseId" }
        }
      },
      {
        $project: {
          category: "$_id",
          totalRevenue: 1,
          totalStudents: { $size: { $filter: { input: "$totalStudents", as: "s", cond: { $ne: ["$$s", null] } } } },
          totalCourses: { $size: "$totalCourses" },
          _id: 0
        }
      }
    ]);

    // PERFORMANCE STATS
    const performanceStats = await Course.aggregate([
      { $match: { createdById: new mongoose.Types.ObjectId(instructorId) } },
      {
        $lookup: {
          from: 'purchases',
          localField: '_id',
          foreignField: 'courseId',
          as: 'purchases'
        }
      },
      { $project: { title: "$landingPage.courseTitle", purchases: 1 } },
      {
        $addFields: {
          revenue: {
            $sum: {
              $map: {
                input: "$purchases",
                as: "p",
                in: { $cond: [{ $eq: ["$$p.status", "purchased"] }, { $subtract: ["$$p.amount", "$$p.platformFee"] }, 0] }
              }
            }
          },
          students: { $size: { $filter: { input: "$purchases", as: "p", cond: { $eq: ["$$p.status", "purchased"] } } } }
        }
      },
      { $project: { title: 1, revenue: 1, students: 1 } }
    ]);

    return res.json({ categoryStats, performanceStats });

  } catch (error) {
    console.error("Chart analytics error:", error.message);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
};

exports.getInstructorSummaryAnalytics = async (req, res) => {
  const instructorId = req.user?.userId;
  const role = req.user?.role;

  if (!instructorId || role !== 'instructor') {
    return res.status(403).json({ error: "Unauthorized: Instructor only" });
  }

  try {
    const now = new Date();
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const matchBase = { status: { $in: ['purchased', 'refunded'] } };

    const [all, week, month, year] = await Promise.all([
      // All time
      Purchase.aggregate([
        { $match: matchBase },
        { $lookup: { from: "courses", localField: "courseId", foreignField: "_id", as: "course" } },
        { $unwind: "$course" },
        { $match: { "course.createdById": new mongoose.Types.ObjectId(instructorId) } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $cond: [{ $eq: ["$status", "purchased"] }, { $subtract: ["$amount", "$platformFee"] }, 0] } },
            totalRefunds: { $sum: { $cond: [{ $eq: ["$status", "refunded"] }, { $subtract: ["$amount", "$platformFee"] }, 0] } },
            totalOrders: { $sum: 1 },
            studentSet: { $addToSet: "$purchasedById" }
          }
        }
      ]),

      // Weekly
      Purchase.aggregate([
        { $match: { ...matchBase, purchasedAt: { $gte: startOfWeek } } },
        { $lookup: { from: "courses", localField: "courseId", foreignField: "_id", as: "course" } },
        { $unwind: "$course" },
        { $match: { "course.createdById": new mongoose.Types.ObjectId(instructorId) } },
        {
          $group: {
            _id: null,
            revenue: { $sum: { $cond: [{ $eq: ["$status", "purchased"] }, { $subtract: ["$amount", "$platformFee"] }, 0] } },
            refunds: { $sum: { $cond: [{ $eq: ["$status", "refunded"] }, { $subtract: ["$amount", "$platformFee"] }, 0] } },
            orders: { $sum: 1 },
            studentSet: { $addToSet: "$purchasedById" }
          }
        }
      ]),

      // Monthly
      Purchase.aggregate([
        { $match: { ...matchBase, purchasedAt: { $gte: startOfMonth } } },
        { $lookup: { from: "courses", localField: "courseId", foreignField: "_id", as: "course" } },
        { $unwind: "$course" },
        { $match: { "course.createdById": new mongoose.Types.ObjectId(instructorId) } },
        {
          $group: {
            _id: null,
            revenue: { $sum: { $cond: [{ $eq: ["$status", "purchased"] }, { $subtract: ["$amount", "$platformFee"] }, 0] } },
            refunds: { $sum: { $cond: [{ $eq: ["$status", "refunded"] }, { $subtract: ["$amount", "$platformFee"] }, 0] } },
            orders: { $sum: 1 },
            studentSet: { $addToSet: "$purchasedById" }
          }
        }
      ]),

      // Yearly
      Purchase.aggregate([
        { $match: { ...matchBase, purchasedAt: { $gte: startOfYear } } },
        { $lookup: { from: "courses", localField: "courseId", foreignField: "_id", as: "course" } },
        { $unwind: "$course" },
        { $match: { "course.createdById": new mongoose.Types.ObjectId(instructorId) } },
        {
          $group: {
            _id: null,
            revenue: { $sum: { $cond: [{ $eq: ["$status", "purchased"] }, { $subtract: ["$amount", "$platformFee"] }, 0] } },
            refunds: { $sum: { $cond: [{ $eq: ["$status", "refunded"] }, { $subtract: ["$amount", "$platformFee"] }, 0] } },
            orders: { $sum: 1 },
            studentSet: { $addToSet: "$purchasedById" }
          }
        }
      ])
    ]);

    res.status(200).json({
      totalRevenue: all[0]?.totalRevenue || 0,
      totalRefunds: all[0]?.totalRefunds || 0,
      totalOrders: all[0]?.totalOrders || 0,
      totalStudents: all[0]?.studentSet?.length || 0,
      weekly: {
        revenue: week[0]?.revenue || 0,
        refunds: week[0]?.refunds || 0,
        orders: week[0]?.orders || 0,
        students: week[0]?.studentSet?.length || 0
      },
      monthly: {
        revenue: month[0]?.revenue || 0,
        refunds: month[0]?.refunds || 0,
        orders: month[0]?.orders || 0,
        students: month[0]?.studentSet?.length || 0
      },
      yearly: {
        revenue: year[0]?.revenue || 0,
        refunds: year[0]?.refunds || 0,
        orders: year[0]?.orders || 0,
        students: year[0]?.studentSet?.length || 0
      }
    });

  } catch (err) {
    console.error('Summary Error:', err.message);
    res.status(500).json({ error: "Summary failed" });
  }
};
