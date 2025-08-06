// controllers/chatController.js
const Message = require('../models/Message');

exports.getChatPage = async (req, res) => {
  const messages = await Message.find().populate('sender', 'username avatar').sort({ createdAt: 1 });
  res.render('chat', { user: req.session.user, messages });
};
