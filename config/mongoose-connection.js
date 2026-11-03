const mongoose = require('mongoose');
const config = require('config');


const dbgr = require('debug')("development: mongoose")

mongoose.connect(`${process.env.MONGODB_URI}/scatch-ecommerce`)
    .then(() => {
        console.log("MongoDB Atlas Connected Successfully");
    })
    .catch((err) => {
        console.log("MongoDB Connection Error:", err.message);
    });

module.exports = mongoose.connection;