const Cart = require('./cartModel');

// ✅ Add to Cart
exports.addToCart = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can add to cart' });
    }

    const { courseId } = req.body;
    const studentId = req.user.userId;

    const exists = await Cart.findOne({ courseId, studentId });
    if (exists) {
      return res.status(400).json({ message: 'Course already in cart' });
    }

    const item = await Cart.create({ courseId, studentId });
    res.status(201).json(item);
  } catch (err) {
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

    const cartItems = await Cart.find({ studentId }).populate([
      {
        path: 'courseId',
        select: 'landingPage.courseTitle landingPage.courseCategory landingPage.courseThumbnail landingPage.courseDescription price.amount'
      },
      {
        path: 'studentId',
        select: 'firstName lastName email'
      }
    ]);

    const flattenedItems = cartItems.map(item => {
      const course = item.courseId;
      const student = item.studentId;

      return {
        _id: item._id,
        addedAt: item.addedAt,
        courseTitle: course?.landingPage?.courseTitle || '',
        courseCategory: course?.landingPage?.courseCategory || '',
        courseThumbnail: course?.landingPage?.courseThumbnail || '',
        courseDescription: course?.landingPage?.courseDescription || '',
        amount: course?.price?.amount || 0,
        studentName: `${student?.firstName || ''} ${student?.lastName || ''}`,
        studentEmail: student?.email || ''
      };
    });

    res.status(200).json({
      totalItems: flattenedItems.length,
      items: flattenedItems
    });
  } catch (err) {
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
