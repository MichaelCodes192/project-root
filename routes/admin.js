// routes/admin.js
const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');

router.get('/', isLoggedIn, isAdmin, adminController.dashboard);
router.get('/users', isLoggedIn, isAdmin, adminController.listUsers);
router.post('/users/:id/delete', isLoggedIn, isAdmin, adminController.deleteUser);
router.get('/posts', isLoggedIn, isAdmin, adminController.listPosts);
router.post('/posts/:id/delete', isLoggedIn, isAdmin, adminController.deletePost);
router.get('/contacts', isLoggedIn, isAdmin, adminController.viewContacts);

module.exports = router;
