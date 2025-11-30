module.exports = {
  requireLogin: (req, res, next) => {
    if (req.session && req.session.user && req.session.user.id) {
      next();
    } else {
      req.flash('error', 'Please login first');
      res.redirect('/login');
    }
  }
}
