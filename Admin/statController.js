// controllers/adminStatsController.js
const Instructor = require("../Authentication/instructorModel"); // actually Instructor
const Student = require("../Authentication/studentModel"); // actually Student
const Course = require("../courses/courseModel"); // actually Course
const Purchase = require("../Payment/purchaseModel"); // purchases/payments

exports.getAdminDashboardStats = async (req, res) => {
  try {
    // 1️⃣ Total registered instructors
    const totalInstructors = await Instructor.countDocuments();

    // 2️⃣ Total registered students
    const totalStudents = await Student.countDocuments();

    // 3️⃣ Total courses
    const totalCourses = await Course.countDocuments();

    // 4️⃣ Course stats by status (Draft, Pending, Published, Rejected)
    const courseStatusAgg = await Course.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
    const courseStatus = {
      Draft: 0,
      Pending: 0,
      Published: 0,
      Rejected: 0,
    };
    courseStatusAgg.forEach((item) => {
      courseStatus[item._id] = item.count;
    });

    // 5️⃣ Total purchases
    const totalPurchases = await Purchase.countDocuments();

    // 6️⃣ Revenue stats
    const revenueAgg = await Purchase.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },               // gross sales
          totalPlatformFee: { $sum: "$platformFee" },      // platform cut
          totalInstructorEarnings: { $sum: "$revenueForInstructor" }, // instructors share
        },
      },
    ]);

    const revenueStats = {
      totalSales: revenueAgg[0]?.totalRevenue || 0,
      totalInstructorEarnings: revenueAgg[0]?.totalInstructorEarnings || 0,
      totalRevenueForAdmin : (revenueAgg[0]?.totalRevenue || 0) - (revenueAgg[0]?.totalInstructorEarnings || 0),

    };

    // 7️⃣ Top 5 selling courses (by purchases)
    const topCourses = await Purchase.aggregate([
      {
        $group: {
          _id: "$courseId",
          courseTitle: { $first: "$courseTitle" },
          purchaseCount: { $sum: 1 },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { purchaseCount: -1 } },
      { $limit: 5 },
    ]);

    // ✅ Response
    return res.status(200).json({
      success: true,
      data: {
        totalInstructors,
        totalStudents,
        totalCourses,
        courseStatus, // Published, Draft, etc.
        totalPurchases,
        revenueStats, // gross, platform fee, instructor earnings
        topCourses,   // top 5 courses by sales
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
