const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  avatar: {
    type: String,
    default: '/images/default-avatar.png',
  },
  bio: {
    type: String,
    maxlength: 200,
    default: '',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: String, // TOTP secret (for apps like Google Authenticator)

  isAdmin: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  activity: {
  lastLogin: { type: Date },
  loginCount: { type: Number, default: 0 },
  blogPosts: { type: Number, default: 0 },
  messagesSent: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
},

});

notifications: [
  {
    message: String,
    createdAt: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
  }
],




module.exports = mongoose.model('User', userSchema);

