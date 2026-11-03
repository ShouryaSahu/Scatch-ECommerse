const mongoose = require('mongoose');
const ownerSchema = new mongoose.Schema({
  fullname: {
    type: String,
    minlength: 3,
    trim: true,
    required: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  products: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Product',
    default: []
  },
  picture: String,
  gstin: String
}, { timestamps: true });
module.exports = mongoose.model('Owner', ownerSchema);
