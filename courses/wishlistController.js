const Wishlist = require('./wishlistModel');

exports.addToWishlist = async (req, res) => {
  try {
    const { courseId } = req.body;

    // Check if course already exists globally
    const existing = await Wishlist.findOne({ courseId });
    if (existing) {
      return res.status(409).json({ message: 'Course already in wishlist' });
    }

    const item = await Wishlist.create({ courseId });
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {  // Duplicate key error (unique violation)
      return res.status(409).json({ message: 'Course already in wishlist' });
    }
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
};

exports.getWishlist = async (req, res) => {
  try {
    const wishListItems = await Wishlist.find().populate({
      path: 'courseId',
      select: 'landingPage.courseTitle landingPage.courseCategory landingPage.courseThumbnail landingPage.courseDescription price.amount'
    });

    const flattenedItems = wishListItems.map(item => {
      const course = item.courseId;
      return {
        _id: item._id,
        addedAt: item.addedAt,
        courseTitle: course.landingPage.courseTitle || '',
        courseCategory: course.landingPage.courseCategory || '',
        courseThumbnail: course.landingPage.courseThumbnail || '',
        courseDescription: course.landingPage.courseDescription || '',
        amount: course.price.amount || 0
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

exports.removeFromWishlist = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Wishlist.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Wishlist item not found' });
    }

    res.status(200).json({ message: 'Item removed from wishlist' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove item from wishlist' });
  }
};
