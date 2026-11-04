
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const ownerModel = require('../models/owners-model');
const productModel = require('../models/product-model');
const isOwnerLoggedIn = require('../middlewares/isOwnerLoggedIn');

// Cookie configuration
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 2 * 60 * 60 * 1000,
    path: '/'
};

// Admin Login Page
router.get('/login', (req, res) => {
    res.render('owner-login', {
        error: req.flash('error'),
        success: req.flash('success')
    });
});

// Admin Login
router.post('/login', async (req, res, next) => {
    try {
        const email = String(req.body.email || '')
            .trim()
            .toLowerCase();

        const password = String(req.body.password || '');

        const owner = await ownerModel.findOne({ email });

        if (
            !owner ||
            !owner.password ||
            !(await bcrypt.compare(password, owner.password))
        ) {
            req.flash('error', 'Invalid admin email or password.');
            return res.redirect('/owners/login');
        }

        if (!process.env.JWT_KEY) {
            return next(new Error('JWT_KEY is missing from environment variables.'));
        }

        const token = jwt.sign(
            { ownerId: owner._id.toString() },
            process.env.JWT_KEY,
            { expiresIn: '2h' }
        );

        res.cookie('ownerToken', token, cookieOptions);

        req.flash('success', 'Admin login successful.');
        return res.redirect('/owners/admin');

    } catch (err) {
        return next(err);
    }
});

// First Admin Setup (Development Only)
if (process.env.NODE_ENV === 'development') {

    router.get('/setup', async (req, res, next) => {
        try {
            if (await ownerModel.exists({})) {
                req.flash('error', 'An admin account already exists. Please login.');
                return res.redirect('/owners/login');
            }

            return res.render('owner-setup', {
                error: req.flash('error')
            });

        } catch (err) {
            return next(err);
        }
    });

    router.post('/setup', async (req, res, next) => {
        try {
            if (await ownerModel.exists({})) {
                req.flash('error', 'An admin account already exists.');
                return res.redirect('/owners/login');
            }

            const fullname = String(req.body.fullname || '').trim();
            const email = String(req.body.email || '')
                .trim()
                .toLowerCase();

            const password = String(req.body.password || '');

            if (fullname.length < 3 || !email || password.length < 8) {
                req.flash(
                    'error',
                    'Enter a name (at least 3 characters), valid email, and password (at least 8 characters).'
                );

                return res.redirect('/owners/setup');
            }

            const hashedPassword = await bcrypt.hash(password, 12);

            await ownerModel.create({
                fullname,
                email,
                password: hashedPassword
            });

            req.flash('success', 'Admin created. Please login.');
            return res.redirect('/owners/login');

        } catch (err) {
            return next(err);
        }
    });
}

// Admin Dashboard
router.get('/admin', isOwnerLoggedIn, (req, res) => {
    res.render('createproducts', {
        success: req.flash('success'),
        error: req.flash('error'),
        owner: req.owner
    });
});

// All Products (Admin)

router.get('/products', isOwnerLoggedIn, async (req, res, next) => {
    try {
        const products = await productModel.find().sort({ _id: -1 });

        return res.render('admin', {
            products,
            owner: req.owner,
            success: req.flash('success'),
            error: req.flash('error')
        });

    } catch (err) {
        return next(err);
    }
});



// Delete Product
router.post('/products/:id/delete', isOwnerLoggedIn, async (req, res, next) => {
    try {
        const deletedProduct = await productModel.findByIdAndDelete(req.params.id);

        if (!deletedProduct) {
            req.flash('error', 'Product not found.');
        } else {
            req.flash('success', 'Product deleted successfully.');
        }

        return res.redirect('/owners/products');

    } catch (err) {
        return next(err);
    }
});



// Admin Logout
router.post('/logout', isOwnerLoggedIn, (req, res) => {

    res.clearCookie('ownerToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    });

    req.flash('success', 'Logged out successfully.');
    return res.redirect('/owners/login');
});

module.exports = router;
