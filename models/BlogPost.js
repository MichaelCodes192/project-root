// models/BlogPost.js
const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  body: {
    type: String,
    required: true,
  },
  author: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('BlogPost', blogPostSchema);
