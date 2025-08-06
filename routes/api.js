const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/authMiddleware');
const User = require('../models/User');

router.get('/notifications/count', isLoggedIn, async (req, res) => {
  const user = await User.findById(req.session.user.id);
  const count = user.notifications.filter(n => !n.read).length;
  res.json({ count });
});

module.exports = router;
