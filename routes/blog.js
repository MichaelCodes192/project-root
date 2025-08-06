// routes/blog.js
const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/authMiddleware');
const blogController = require('../controllers/blogController');

router.get('/', blogController.getAllPosts);
router.get('/new', isLoggedIn, blogController.getNewPostForm);
router.post('/', isLoggedIn, blogController.createPost);
router.get('/:id', blogController.getSinglePost);
router.get('/:id/edit', isLoggedIn, blogController.getEditPostForm);
router.post('/:id/edit', isLoggedIn, blogController.updatePost);
router.post('/:id/delete', isLoggedIn, blogController.deletePost);

module.exports = router;
