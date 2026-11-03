const express = require('express');
const router = express.Router();
const upload = require('../config/multer-config');
const productModel = require('../models/product-model');
const isOwnerLoggedIn = require('../middlewares/isOwnerLoggedIn');

router.post('/create', isOwnerLoggedIn, upload.single('image'), async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const price = Number(req.body.price);
    const discount = req.body.discount === '' || req.body.discount == null ? 0 : Number(req.body.discount);
    if (!req.file) {
      req.flash('error', 'Please choose a product image.');
      return res.redirect('/owners/admin');
    }
    if (!name || !Number.isFinite(price) || price <= 0 || !Number.isFinite(discount) || discount < 0 || discount > price) {
      req.flash('error', 'Enter a product name, valid price, and discount between 0 and the product price.');
      return res.redirect('/owners/admin');
    }
    await productModel.create({
      image: req.file.buffer, name, price, discount,
      bgcolor: req.body.bgcolor || '#f3f4f6',
      panelcolor: req.body.panelcolor || '#111827',
      textcolor: req.body.textcolor || '#ffffff'
    });
    req.flash('success', 'Product created successfully.');
    return res.redirect('/owners/admin');
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
