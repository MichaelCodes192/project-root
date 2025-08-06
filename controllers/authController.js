// controllers/authController.js
require('dotenv').config();
const User = require('../models/User');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { addNotification } = require('../utils/notifications');

// After user authenticated and session set:
await addNotification(user._id, 'You logged in successfully!');

const { validationResult } = require('express-validator');

// Setup nodemailer transporter (Gmail SMTP)
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

// Generate JWT token for email verification
function generateEmailToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
}

// Verify JWT token
function verifyEmailToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

// Registration page
exports.getRegister = (req, res) => {
  res.render('auth/register');
};

// Handle registration
exports.postRegister = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      req.flash('error', 'All fields are required');
      return res.redirect('/register');
    }

    // Check if user/email exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      req.flash('error', 'Email or username already exists');
      return res.redirect('/register');
    }

    // Create user
    const user = new User({ username, email, password });
    await user.save();

    // Generate email verification token
    const token = generateEmailToken(user);

    // Send verification email
    const url = `${req.protocol}://${req.get('host')}/verify-email/${token}`;
    await sendEmail(
      user.email,
      'Verify your email',
      `<p>Click to verify your email: <a href="${url}">${url}</a></p>`
    );

    req.flash('success', 'Registration successful! Check your email to verify.');
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong');
    res.redirect('/register');
  }
};

// Email verification
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

    req.flash('success', 'Email verified! You can now log in.');
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Email verification failed or expired.');
    res.redirect('/login');
  }
};

// Login page
exports.getLogin = (req, res) => {
  res.render('auth/login');
};

// Handle login
exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    if (!user.isVerified) {
      req.flash('error', 'Please verify your email before logging in');
      return res.redirect('/login');
    }

    // Check password
    const valid = await user.comparePassword(password);
    if (!valid) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    // Check if 2FA enabled
    if (user.twoFA.enabled) {
      // Store userId in session and ask for 2FA code
      req.session.tmpUserId = user._id;
      return res.redirect('/2fa/setup');
    }

    // Log user in
    req.session.user = { id: user._id, username: user.username };
    req.flash('success', 'Logged in successfully');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Login failed');
    res.redirect('/login');
  }
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};

// 2FA Setup page: show QR code to scan
exports.get2FASetup = async (req, res) => {
  if (!req.session.tmpUserId && !req.session.user) {
    req.flash('error', 'Unauthorized');
    return res.redirect('/login');
  }

  // Get user (if logged in or temp)
  const userId = req.session.user ? req.session.user.id : req.session.tmpUserId;
  const user = await User.findById(userId);
  if (!user) {
    req.flash('error', 'User not found');
    return res.redirect('/login');
  }

  // If 2FA not enabled, generate secret & QR code
  if (!user.twoFA.enabled) {
    const secret = speakeasy.generateSecret({
      name: `SecureApp (${user.email})`
    });

    // Save secret temporarily in session
    req.session.twoFASecret = secret.base32;

    // Generate QR code
    const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);
    return res.render('auth/2fa-setup', { qrDataUrl });
  } else {
    // 2FA enabled, show verify page
    return res.render('auth/2fa-verify');
  }
};

// 2FA Verify (enable or login)
exports.post2FAVerify = async (req, res) => {
  const { token } = req.body;
  const userId = req.session.user ? req.session.user.id : req.session.tmpUserId;
  const user = await User.findById(userId);
  if (!user) {
    req.flash('error', 'User not found');
    return res.redirect('/login');
  }

  // Secret to verify against
  const secret = user.twoFA.enabled ? user.twoFA.secret : req.session.twoFASecret;

  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1
  });

  if (!verified) {
    req.flash('error', 'Invalid authentication code');
    return res.redirect('/2fa/setup');
  }

  if (!user.twoFA.enabled) {
    // Enable 2FA and save secret
    user.twoFA = {
      secret: req.session.twoFASecret,
      enabled: true
    };
    await user.save();

    // Clear temp session secret
    delete req.session.twoFASecret;

    // Log user in
    req.session.user = { id: user._id, username: user.username };
    delete req.session.tmpUserId;

    req.flash('success', '2FA enabled and logged in!');
    return res.redirect('/dashboard');
  }

  // If 2FA enabled (login flow), log in user
  req.session.user = { id: user._id, username: user.username };
  delete req.session.tmpUserId;
  req.flash('success', 'Logged in with 2FA!');
  res.redirect('/dashboard');
};

// Forgot password page
exports.getForgotPassword = (req, res) => {
  res.render('auth/forgot-password');
};

// Handle forgot password
exports.postForgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    req.flash('error', 'No user with that email');
    return res.redirect('/forgot-password');
  }

  // Generate reset token
  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  // Send reset email
  const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${token}`;
  await sendEmail(
    user.email,
    'Password Reset',
    `<p>Click to reset your password: <a href="${resetURL}">${resetURL}</a></p>`
  );

  req.flash('success', 'Password reset link sent to your email');
  res.redirect('/login');
};

// Reset password page
exports.getResetPassword = async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    req.flash('error', 'Password reset token is invalid or expired');
    return res.redirect('/forgot-password');
  }

  res.render('auth/reset-password', { token });
};

// Handle reset password form
exports.postResetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, password2 } = req.body;

  if (!password || password !== password2) {
    req.flash('error', 'Passwords do not match');
    return res.redirect(`/reset-password/${token}`);
  }

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    req.flash('error', 'Password reset token is invalid or expired');
    return res.redirect('/forgot-password');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  req.flash('success', 'Password reset successful! You can now log in.');
  res.redirect('/login');
};
