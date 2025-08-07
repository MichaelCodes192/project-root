require('dotenv').config();
const User = require('../models/User');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { addNotification } = require('../utils/notifications');
const { validationResult } = require('express-validator');

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper to send email
async function sendEmail(to, subject, html) {
  await transporter.sendMail({
    from: `"SecureApp" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

function generateEmailToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
}

function verifyEmailToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

// ========== CONTROLLERS ==========

exports.getRegister = (req, res) => {
  res.render('auth/register');
};

exports.postRegister = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      req.flash('error', 'All fields are required');
      return res.redirect('/register');
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      req.flash('error', 'Email or username already exists');
      return res.redirect('/register');
    }

    const user = new User({ username, email, password });
    await user.save();

    const token = generateEmailToken(user);
    const url = `${req.protocol}://${req.get('host')}/verify-email/${token}`;

    await sendEmail(
      user.email,
      'Verify your email',
      `<p>Click to verify your email: <a href="${url}">${url}</a></p>`
    );

    req.flash('success', 'Registration successful! Check your email.');
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Registration failed');
    res.redirect('/register');
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = verifyEmailToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      req.flash('error', 'Invalid token');
      return res.redirect('/login');
    }

    user.isVerified = true;
    await user.save();

    req.flash('success', 'Email verified!');
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Verification failed');
    res.redirect('/login');
  }
};

exports.getLogin = (req, res) => {
  res.render('auth/login');
};

exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }

    if (!user.isVerified) {
      req.flash('error', 'Verify your email first');
      return res.redirect('/login');
    }

    user.activity.lastLogin = new Date();
    user.activity.loginCount = (user.activity.loginCount || 0) + 1;
    await user.save();
    await addNotification(user._id, 'You logged in successfully!');

    if (user.twoFA.enabled) {
      req.session.tmpUserId = user._id;
      return res.redirect('/2fa/setup');
    }

    req.session.user = { id: user._id, username: user.username };
    req.flash('success', 'Logged in!');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Login error');
    res.redirect('/login');
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};

exports.get2FASetup = async (req, res) => {
  const userId = req.session.user?.id || req.session.tmpUserId;
  const user = await User.findById(userId);
  if (!user) {
    req.flash('error', 'Unauthorized');
    return res.redirect('/login');
  }

  if (!user.twoFA.enabled) {
    const secret = speakeasy.generateSecret({
      name: `SecureApp (${user.email})`,
    });
    req.session.twoFASecret = secret.base32;
    const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);
    return res.render('auth/2fa-setup', { qrDataUrl });
  }

  res.render('auth/2fa-verify');
};

exports.post2FAVerify = async (req, res) => {
  const { token } = req.body;
  const userId = req.session.user?.id || req.session.tmpUserId;
  const user = await User.findById(userId);
  if (!user) {
    req.flash('error', 'User not found');
    return res.redirect('/login');
  }

  const secret = user.twoFA.enabled ? user.twoFA.secret : req.session.twoFASecret;
  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1,
  });

  if (!verified) {
    req.flash('error', 'Invalid code');
    return res.redirect('/2fa/setup');
  }

  if (!user.twoFA.enabled) {
    user.twoFA = { secret: req.session.twoFASecret, enabled: true };
    await user.save();
    delete req.session.twoFASecret;
  }

  req.session.user = { id: user._id, username: user.username };
  delete req.session.tmpUserId;
  req.flash('success', '2FA successful!');
  res.redirect('/dashboard');
};

exports.getForgotPassword = (req, res) => {
  res.render('auth/forgot-password');
};

exports.postForgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    req.flash('error', 'No user with that email');
    return res.redirect('/forgot-password');
  }

  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000;
  await user.save();

  const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${token}`;
  await sendEmail(
    user.email,
    'Password Reset',
    `<p>Click to reset: <a href="${resetURL}">${resetURL}</a></p>`
  );

  req.flash('success', 'Reset email sent');
  res.redirect('/login');
};

exports.getResetPassword = async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    req.flash('error', 'Invalid or expired token');
    return res.redirect('/forgot-password');
  }

  res.render('auth/reset-password', { token });
};

exports.postResetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, password2 } = req.body;

  if (!password || password !== password2) {
    req.flash('error', 'Passwords do not match');
    return res.redirect(`/reset-password/${token}`);
  }

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    req.flash('error', 'Invalid or expired token');
    return res.redirect('/forgot-password');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  req.flash('success', 'Password reset successful!');
  res.redirect('/login');
};

