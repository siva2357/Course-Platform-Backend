const express = require('express');
const router = express.Router();
const cartController = require('./cartController');
const { identifier } = require('../Middleware/identification');

router.post('/cart/add', identifier, cartController.addToCart);
router.get('/cart', identifier, cartController.getCart);
router.delete('/cart/delete/:id', identifier, cartController.removeFromCart);

module.exports = router;
