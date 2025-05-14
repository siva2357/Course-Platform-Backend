  const Cart = require('./cartModel');

  exports.addToCart = async (req, res) => {
    try {
      const { courseId } = req.body; // Getting courseId from body
      const item = await Cart.create({ courseId });
      res.status(201).json(item);
    } catch (err) {
      res.status(500).json({ error: 'Failed to add to cart' });
    }
  };
  
  exports.getCart = async (req, res) => {
    try {
      const items = await Cart.find().populate('courseId'); // Populating course details
      res.status(200).json(items);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch cart' });
    }
  };
  
  exports.removeFromCart = async (req, res) => {
    try {
      const { id } = req.params; // Retrieving the item ID from the route parameter
      await Cart.findByIdAndDelete(id); // Deleting the item from the cart
      res.status(200).json({ message: 'Item removed from cart' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to remove item from cart' });
    }
  };