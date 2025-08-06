// routes/chat.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/', ensureAuthenticated, chatController.getChatPage);

module.exports = router;
