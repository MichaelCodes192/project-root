// controllers/blogController.js
const BlogPost = require('../models/BlogPost');

exports.getAllPosts = async (req, res) => {
  const posts = await BlogPost.find().sort({ createdAt: -1 });
  res.render('blog/index', { posts, user: req.session.user });
};

exports.getSinglePost = async (req, res) => {
  const post = await BlogPost.findById(req.params.id);
  if (!post) return res.redirect('/blog');
  res.render('blog/view', { post, user: req.session.user });
};

exports.getNewPostForm = (req, res) => {
  res.render('blog/new', { user: req.session.user });
};

exports.createPost = async (req, res) => {
  const { title, body } = req.body;
  const post = new BlogPost({
    title,
    body,
    author: {
      id: req.session.user.id,
      username: req.session.user.username,
    },
  });
  await post.save();
  res.redirect('/blog');
};

exports.getEditPostForm = async (req, res) => {
  const post = await BlogPost.findById(req.params.id);
  if (!post || post.author.id.toString() !== req.session.user.id) return res.redirect('/blog');
  res.render('blog/edit', { post, user: req.session.user });
};

exports.updatePost = async (req, res) => {
  const post = await BlogPost.findById(req.params.id);
  if (!post || post.author.id.toString() !== req.session.user.id) return res.redirect('/blog');

  post.title = req.body.title;
  post.body = req.body.body;
  await post.save();
  res.redirect(`/blog/${post.id}`);
};

exports.deletePost = async (req, res) => {
  const post = await BlogPost.findById(req.params.id);
  if (!post || post.author.id.toString() !== req.session.user.id) return res.redirect('/blog');
  await post.remove();
  res.redirect('/blog');
};
