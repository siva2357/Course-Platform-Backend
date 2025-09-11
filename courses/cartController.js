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
      return res.status(403).json({ message: 'Only students can view their cart' });
    }

    const studentId = req.user.userId;

    // Fetch all purchases for this student
    const studentPurchases = await Purchase.find({
      purchasedById: studentId
    }).select('courseId status').lean();

    const purchasedCourseIds = studentPurchases.map(p => String(p.courseId));

    // Fetch cart items for this student
    let cartItems = await Cart.find({ studentId }).populate({
      path: 'courseId',
      select: 'landingPage.courseTitle landingPage.courseCategory landingPage.courseThumbnail landingPage.courseDescription price.amount'
    });

    // ✅ Remove cart items that have already been purchased or deleted
    cartItems = cartItems.filter(item => {
      const courseExists = item.courseId; // not null
      const notPurchased = !purchasedCourseIds.includes(String(item.courseId?._id));
      return courseExists && notPurchased;
    });

    // Optional: Clean up DB automatically
    const cartItemIdsToRemove = await Cart.find({
      studentId,
      $or: [
        { courseId: null },
        { courseId: { $in: purchasedCourseIds } }
      ]
    }).select('_id');
    if (cartItemIdsToRemove.length) {
      await Cart.deleteMany({ _id: { $in: cartItemIdsToRemove.map(c => c._id) } });
    }

    // Prepare flattened cart items for response
const flattenedItems = cartItems.map(item => {
  const course = item.courseId;
  return {
    _id: item._id,
    courseId: course?._id || null,   // ✅ include courseId
    addedAt: item.addedAt,
    courseTitle: course?.landingPage?.courseTitle || 'Course not found',
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
