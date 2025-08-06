const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/authMiddleware');
const User = require('../models/User');

router.get('/', isLoggedIn, async (req, res) => {
  const user = await User.findById(req.session.user.id);
  res.render('notifications', { notifications: user.notifications, user: req.session.user });
});

router.post('/mark-read', isLoggedIn, async (req, res) => {
  await User.findByIdAndUpdate(req.session.user.id, {
    $set: { 'notifications.$[].read': true }
  });
  res.json({ success: true });
});

module.exports = router;
