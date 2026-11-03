const jwt = require('jsonwebtoken');
const ownerModel = require('../models/owners-model');

module.exports = async function isOwnerLoggedIn(req, res, next) {
  try {
    const token = req.cookies.ownerToken;
    if (!token) {
      req.flash('error', 'Please login as admin first.');
      return res.redirect('/owners/login');
    }
    if (!process.env.JWT_KEY) throw new Error('JWT_KEY is missing from .env');
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const owner = await ownerModel.findById(decoded.ownerId).select('-password');
    if (!owner) {
      res.clearCookie('ownerToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
      req.flash('error', 'Admin account not found. Please login again.');
      return res.redirect('/owners/login');
    }
    req.owner = owner;
    return next();
  } catch (err) {
    res.clearCookie('ownerToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
    req.flash('error', 'Your admin login expired or is invalid. Please login again.');
    return res.redirect('/owners/login');
  }
};
