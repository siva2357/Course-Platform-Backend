// controllers/adminStatsController.js
const Instructor = require("../Authentication/instructorModel");
const Student = require("../Authentication/studentModel");
const Course = require("../courses/courseModel");
const Purchase = require("../Payment/purchaseModel");

exports.getAdminDashboardStats = async (req, res) => {
  try {
    // 1️⃣ Total registered instructors
    const totalInstructors = await Instructor.countDocuments();

    // 2️⃣ Total registered students
    const totalStudents = await Student.countDocuments();

    // 3️⃣ Total courses
    const totalCourses = await Course.countDocuments();

    // 4️⃣ Course stats by status
    const courseStatusAgg = await Course.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    const courseStatus = { Draft: 0, Pending: 0, Published: 0, Rejected: 0 };
    courseStatusAgg.forEach((item) => {
      courseStatus[item._id] = item.count;
    });

    // 5️⃣ Total purchases

    const totalPurchases = await Purchase.countDocuments({ status: "purchased" });


    // 6️⃣ Revenue, Refund, Tax stats (net course price only)
    const revenueAgg = await Purchase.aggregate([
      {
        $group: {
          _id: null,

          // ✅ Total sales = sum of course price only (exclude tax), only non-refunded
          totalRevenue: {
            $sum: {
              $cond: [
                { $ne: ["$status", "refunded"] },
                { $subtract: ["$amount", "$taxCharges"] },
                0
              ]
            }
          },

          // ✅ Instructor earnings (non-refunded only)
          totalInstructorEarnings: {
            $sum: {
              $cond: [{ $ne: ["$status", "refunded"] }, "$revenueForInstructor", 0]
            }
          },

          // ✅ Admin earnings (non-refunded only)
          totalAdminEarnings: {
            $sum: {
              $cond: [{ $ne: ["$status", "refunded"] }, "$revenueForAdmin", 0]
            }
          },

          // ✅ Total refund charges kept by admin
          totalRefundCharges: { $sum: "$refundCharges" },

          // ✅ Refunded gross amounts (course price only, exclude tax)
          totalRefundedAmount: {
            $sum: {
              $cond: [
                { $eq: ["$status", "refunded"] },
                { $subtract: ["$amount", "$taxCharges"] },
                0
              ]
            }
          },

          // ✅ Total tax collected (for reporting only)
          totalTaxCollected: { $sum: "$taxCharges" }
        },
      },
    ]);

    const stats = revenueAgg[0] || {};

    const revenueStats = {
      totalSales: stats.totalRevenue || 0, // net sales excl. tax
      totalInstructorEarnings: stats.totalInstructorEarnings || 0,
      totalRefundCharges: stats.totalRefundCharges || 0,
      totalRefundedAmount: stats.totalRefundedAmount || 0,
      totalTaxCollected: stats.totalTaxCollected || 0, // reporting only
      totalRevenueForAdmin:
        (stats.totalAdminEarnings || 0) + (stats.totalRefundCharges || 0),
    };

    // 7️⃣ Top 5 selling courses (non-refunded, net sales excl. tax)
    const topCourses = await Purchase.aggregate([
      { $match: { status: { $ne: "refunded" } } },
      {
        $group: {
          _id: "$courseId",
          courseTitle: { $first: "$courseTitle" },
          purchaseCount: { $sum: 1 },
          revenue: { $sum: { $subtract: ["$amount", "$taxCharges"] } }, // exclude tax
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
        courseStatus,
        totalPurchases,
        revenueStats,
        topCourses,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
