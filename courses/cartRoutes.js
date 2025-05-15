const express = require('express');
const router = express.Router();
const cartController = require('./cartController');

// Route to add course to cart (Course ID passed in body)
router.post('/cart/add', cartController.addToCart);

// Route to get all items in the cart
router.get('/cart', cartController.getCart);

// Route to remove item from cart (Item ID passed in the URL)
router.delete('/cart/delete/:id', cartController.removeFromCart);

module.exports = router;
