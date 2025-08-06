// controllers/adminController.js
const User = require('../models/User');
const BlogPost = require('../models/BlogPost');
const Contact = require('../models/Contact'); // coming later with contact form

exports.dashboard = async (req, res) => {
  const userCount = await User.countDocuments();
  const postCount = await BlogPost.countDocuments();
  res.render('admin/dashboard', { user: req.session.user, userCount, postCount });
};

exports.listUsers = async (req, res) => {
  const users = await User.find();
  res.render('admin/users', { users, user: req.session.user });
};

exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.redirect('/admin/users');
};

exports.listPosts = async (req, res) => {
  const posts = await BlogPost.find();
  res.render('admin/posts', { posts, user: req.session.user });
};

exports.deletePost = async (req, res) => {
  await BlogPost.findByIdAndDelete(req.params.id);
  res.redirect('/admin/posts');
};

exports.viewContacts = async (req, res) => {
  const contacts = await Contact.find().sort({ createdAt: -1 });
  res.render('admin/contacts', { contacts, user: req.session.user });
};
