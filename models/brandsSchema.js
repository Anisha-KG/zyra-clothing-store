const mongoose = require('mongoose');
const { Schema } = mongoose;

const brandSchema = new Schema({
  brandName: {
    type: String,
    required: true,
    trim: true,
  },
  brandLogo: {
    type: String, // Use String if you want only one image
    required: true,
  },
  isListed: {
    type: Boolean,
    default: true,
  },
  brandOffer: {
    type: Number, // Discount percentage, e.g. 10 for 10% off
    default: null,
    min: 0,
    max: 100,
  },
  startDate: {
    type: Date,
    default:null,
  },
  endDate: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isDeleted: {
    type: Boolean,
    default: false
  }

});

// Optional: Index brandName for faster search
// brandSchema.index({ brandName: 1 });

const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand;
