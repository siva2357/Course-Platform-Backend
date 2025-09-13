const Cart = require('./cartModel');
const Purchase = require('../Payment/purchaseModel'); 
// ✅ Add to Cart
exports.addToCart = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can add to cart' });
    }

    const { courseId } = req.body;
    const studentId = req.user.userId;

    // Check if course already purchased by this student
    const alreadyPurchased = await Purchase.findOne({
      courseId,
      purchasedById: studentId,
      status: 'purchased'
    });
    if (alreadyPurchased) {
      return res.status(400).json({ message: 'You have already purchased this course' });
    }

    // Check if course already in cart
    const exists = await Cart.findOne({ courseId, studentId });
    if (exists) {
      return res.status(400).json({ message: 'Course already in cart' });
    }

    const item = await Cart.create({ courseId, studentId });
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
};


// ✅ Get Cart with Course + Student Info
exports.getCart = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can view cart' });
    }

    const studentId = req.user.userId;

    // Get cart items with course populated (basic)
    let cartItems = await Cart.find({ studentId }).populate('courseId');
    
    // Get purchased courses to mark purchased items
    const purchasedCourses = await Purchase.find({ purchasedById: studentId, status: 'purchased' }).select('courseId').lean();
    const purchasedCourseIds = purchasedCourses.map(p => String(p.courseId));

    // Flatten and keep only items still valid
    const flattenedItems = cartItems
      .filter(item => item.courseId && !purchasedCourseIds.includes(String(item.courseId._id)))
      .map(item => {
        const course = item.courseId;
        return {
          _id: item._id,
          courseId: course._id,
          addedAt: item.addedAt,
          courseTitle: course?.landingPage?.courseTitle || course?.title || 'Course not found',
          courseCategory: course?.landingPage?.courseCategory || '',
          courseThumbnail: course?.landingPage?.courseThumbnail || '',
          courseDescription: course?.landingPage?.courseDescription || '',
          amount: course?.price?.amount || 0,
          purchaseStatus: 'in-cart'
        };
      });

    res.status(200).json({
      totalItems: flattenedItems.length,
      items: flattenedItems
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
};




// ✅ Remove from Cart
exports.removeFromCart = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can remove items from cart' });
    }

    const { id } = req.params;
    const studentId = req.user.userId;

    const item = await Cart.findOne({ _id: id, studentId });
    if (!item) {
      return res.status(404).json({ message: 'Cart item not found or not yours' });
    }

    await Cart.findByIdAndDelete(id);
    res.status(200).json({ message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
};
