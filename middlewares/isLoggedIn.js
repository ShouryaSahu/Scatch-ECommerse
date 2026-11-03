const jwt = require('jsonwebtoken');
const userModel = require('../models/user-model');

module.exports = async function isLoggedIn(req, res, next) {
  try {
    const token = req.cookies.token;
    if (!token) {
      req.flash('error', 'You need to login first.');
      return res.redirect('/');
    }
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const user = decoded.id
      ? await userModel.findById(decoded.id).select('-password')
      : await userModel.findOne({ email: decoded.email }).select('-password');
    if (!user) {
      res.clearCookie('token', { path: '/' });
      req.flash('error', 'Please login again.');
      return res.redirect('/');
    }
    req.user = user;
    return next();
  } catch (err) {
    res.clearCookie('token', { path: '/' });
    req.flash('error', 'Your login expired or is invalid. Please login again.');
    return res.redirect('/');
  }
};
