const express = require('express');
const router = express.Router();
const wishlistController = require('./wishlistController');
const { identifier } = require('../Middleware/identification');

// 🔒 Protect all routes with student identification
router.post('/wishlist/add', identifier, wishlistController.addToWishlist);
router.get('/wishlist', identifier, wishlistController.getWishlist);
router.delete('/wishlist/delete/:id', identifier, wishlistController.removeFromWishlist);

module.exports = router;
