const mongoose = require('mongoose');
const offerSchema = new mongoose.Schema({
  offerName: {
    type: String,
    required: true,   
    trim: true
  },
  discount: {
    type: Number,
    required: true,   
    min: 1,
    max: 100
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

module.exports = mongoose.model('Offer', offerSchema);
