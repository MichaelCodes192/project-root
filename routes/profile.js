const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/authMiddleware');
const profileController = require('../controllers/profileController');

router.get('/edit', isLoggedIn, profileController.getEditProfile);
router.post('/edit', isLoggedIn, profileController.postEditProfile);
router.post('/delete', isLoggedIn, profileController.postDeleteAccount);

module.exports = router;
