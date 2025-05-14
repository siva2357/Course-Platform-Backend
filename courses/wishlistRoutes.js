const express = require('express');
const router = express.Router();
const wishlistController = require('./wishlistController');


// Add course to wishlist
router.post('/wishlist/add/:courseId', wishlistController.addToWishlist);

// Get all items in the wishlist
router.get('/wishlist', wishlistController.getWishlist);

// Remove course from wishlist
router.delete('/wishlist/delete/:id', wishlistController.removeFromWishlist);

module.exports = router;
