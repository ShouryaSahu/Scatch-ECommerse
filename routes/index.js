const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middlewares/isLoggedIn');
const productModel = require('../models/product-model');
const userModel = require('../models/user-model');

router.get('/', (req, res) => {
  return res.render('index', { error: req.flash('error'), loggedIn: Boolean(req.cookies.token) });
});

router.get('/shop', isLoggedIn, async (req, res, next) => {
  try {
    const products = await productModel.find().sort({ _id: -1 });
    return res.render('shop', { products, success: req.flash('success') });
  } catch (err) {
    return next(err);
  }
});

router.get('/cart', isLoggedIn, async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user._id).populate('cart');
    if (!user) {
      res.clearCookie('token');
      return res.redirect('/');
    }
    user.cart = user.cart.filter(Boolean);
    const subtotal = user.cart.reduce((sum, item) => sum + Math.max(0, Number(item.price || 0) - Number(item.discount || 0)), 0);
    const bill = subtotal + (user.cart.length ? 20 : 0);
    return res.render('cart', { user, bill, subtotal });
  } catch (err) {
    return next(err);
  }
});

router.get('/addtocart/:productid', isLoggedIn, async (req, res, next) => {
  try {
    if (!req.params.productid.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).send('Invalid product ID');
    const [user, product] = await Promise.all([
      userModel.findById(req.user._id), productModel.findById(req.params.productid)
    ]);
    if (!user) {
      res.clearCookie('token');
      return res.redirect('/');
    }
    if (!product) {
      req.flash('error', 'Product not found.');
      return res.redirect('/shop');
    }
    user.cart.push(product._id);
    await user.save();
    req.flash('success', 'Added to cart');
    return res.redirect('/shop');
  } catch (err) {
    return next(err);
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  return res.redirect('/');
});

module.exports = router;
