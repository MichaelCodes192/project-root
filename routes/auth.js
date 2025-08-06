// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isLoggedIn, isLoggedOut } = require('../middleware/authMiddleware');

// Register
router.get('/register', isLoggedOut, authController.getRegister);
router.post('/register', isLoggedOut, authController.postRegister);

// Email verify
router.get('/verify-email/:token', authController.verifyEmail);

// Login
router.get('/login', isLoggedOut, authController.getLogin);
router.post('/login', isLoggedOut, authController.postLogin);

// Logout
router.post('/logout', isLoggedIn, authController.logout);

// 2FA setup and verification routes (optional)
router.get('/2fa/setup', isLoggedIn, authController.get2FASetup);
router.post('/2fa/verify', isLoggedIn, authController.post2FAVerify);

// Password reset
router.get('/forgot-password', isLoggedOut, authController.getForgotPassword);
router.post('/forgot-password', isLoggedOut, authController.postForgotPassword);
router.get('/reset-password/:token', isLoggedOut, authController.getResetPassword);
router.post('/reset-password/:token', isLoggedOut, authController.postResetPassword);

module.exports = router;
