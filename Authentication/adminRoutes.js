const express = require('express');
const router = express.Router();
const { identifier } = require('../Middleware/identification');
const { signout,getAdminById,getAdminProfileById} = require('./adminController');




router.post('/auth/admin/signout', identifier, signout);

// DYNAMIC ROUTES LAST
router.get('/admin/:id', identifier, getAdminById);
router.get('/admin/:id/profile', identifier, getAdminProfileById);

module.exports = router;
