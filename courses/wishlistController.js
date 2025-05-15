  const Wishlist = require('./wishlistModel');  // Assuming Wishlist model is defined in courseModel.js

  // Add course to wishlist
  exports.addToWishlist = async (req, res) => {
    try {
      const { courseId } = req.params;  // Get courseId from route parameter
      const item = await Wishlist.create({ courseId });  // Add to wishlist
      res.status(201).json(item);
    } catch (err) {
      res.status(500).json({ error: 'Failed to add to wishlist' });
    }
  };
  
  // Get all courses in the wishlist
  exports.getWishlist = async (req, res) => {
    try {
      const items = await Wishlist.find().populate('courseId');  // Fetch all items and populate courseId with course details
      res.status(200).json(items);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
  };
  
  // Remove course from wishlist
  exports.removeFromWishlist = async (req, res) => {
    try {
      const { id } = req.params;  // Get item ID from route parameter
      await Wishlist.findByIdAndDelete(id);  // Remove from wishlist
      res.status(200).json({ message: 'Item removed from wishlist' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to remove item from wishlist' });
    }
  };
  