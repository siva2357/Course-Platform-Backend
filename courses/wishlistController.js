const Wishlist = require('./wishlistModel');

// ✅ Add to Wishlist
exports.addToWishlist = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can use wishlist' });
    }

    const { courseId } = req.body;
    const studentId = req.user.userId;

    const exists = await Wishlist.findOne({ studentId, courseId });
    if (exists) {
      return res.status(409).json({ message: 'Course already in wishlist' });
    }

    const item = await Wishlist.create({ studentId, courseId });
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Course already in wishlist' });
    }
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
};

// ✅ Get Wishlist
exports.getWishlist = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can view their wishlist' });
    }

    const studentId = req.user.userId;

    const wishListItems = await Wishlist.find({ studentId }).populate({
      path: 'courseId',
      select: 'landingPage price'
    });

    const flattenedItems = wishListItems.map(item => {
      const course = item.courseId;
      return {
        _id: item._id,
        courseId: course?._id, // ✅ required to match frontend interface
        addedAt: item.addedAt,
        courseTitle: course?.landingPage?.courseTitle || '',
        courseCategory: course?.landingPage?.courseCategory || '',
        courseThumbnail: course?.landingPage?.courseThumbnail || '',
        courseDescription: course?.landingPage?.courseDescription || '',
        amount: course?.price?.amount || 0
      };
    });

    res.status(200).json({
      totalItems: flattenedItems.length,
      items: flattenedItems
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
};


// ✅ Remove from Wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can remove from wishlist' });
    }

    const { id } = req.params;
    const studentId = req.user.userId;

    const deleted = await Wishlist.findOneAndDelete({ _id: id, studentId });

    if (!deleted) {
      return res.status(404).json({ message: 'Wishlist item not found or not yours' });
    }

    res.status(200).json({ message: 'Item removed from wishlist' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove item from wishlist' });
  }
};
