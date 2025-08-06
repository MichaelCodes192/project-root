const User = require('../models/User');

exports.getEditProfile = async (req, res) => {
  const user = await User.findById(req.session.user.id);
  res.render('profile/edit', { user });
};

exports.postEditProfile = async (req, res) => {
  const { username, bio } = req.body;
  try {
    const user = await User.findById(req.session.user.id);

    user.username = username || user.username;
    user.bio = bio || user.bio;
    await user.save();

    req.session.user.username = user.username; // update session username
    req.flash('success', 'Profile updated');
    res.redirect('/profile/edit');
  } catch (err) {
    req.flash('error', 'Failed to update profile');
    res.redirect('/profile/edit');
  }
};

exports.postDeleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.session.user.id);
    req.session.destroy();
    res.redirect('/');
  } catch {
    req.flash('error', 'Failed to delete account');
    res.redirect('/profile/edit');
  }
};
