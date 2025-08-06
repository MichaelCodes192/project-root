const User = require('../models/User');

async function addNotification(userId, message) {
  await User.findByIdAndUpdate(userId, {
    $push: { notifications: { message } }
  });
}

async function getUnreadCount(userId) {
  const user = await User.findById(userId);
  if (!user) return 0;
  return user.notifications.filter(n => !n.read).length;
}

async function markAllRead(userId) {
  await User.findByIdAndUpdate(userId, {
    $set: { 'notifications.$[].read': true }
  });
}

module.exports = { addNotification, getUnreadCount, markAllRead };
