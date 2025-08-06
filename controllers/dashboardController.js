// controllers/dashboardController.js
exports.getDashboard = (req, res) => {
  const user = req.session.user;
  res.render('dashboard/index', { user });
};
