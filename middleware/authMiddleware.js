// middleware/authMiddleware.js
module.exports = {
  isLoggedIn: (req, res, next) => {
    if (req.session.user) return next();
    req.flash('error', 'Please log in first.');
    return res.redirect('/login');
  },
  isLoggedOut: (req, res, next) => {
    if (!req.session.user) return next();
    return res.redirect('/dashboard');
  }
};
