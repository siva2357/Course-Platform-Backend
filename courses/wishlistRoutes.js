const express = require('express');
const router = express.Router();
const wishlistController = require('./wishlistController');

router.post('/wishlist/add', wishlistController.addToWishlist);
router.get('/wishlist', wishlistController.getWishlist);
router.delete('/wishlist/delete/:id', wishlistController.removeFromWishlist);

module.exports = router;
