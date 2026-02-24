const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  finalPrice: {
    type: Number,
    required: true,
  },
  baseFinalPrice: {type: Number},
  discount: {
    type: Number,
    default: 0
  },
  material: {
    type: String, // example: "Cotton", "Denim"

    default: "Cotton"
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subcategory: {
    type: Schema.Types.ObjectId,
    ref: 'subcategories',
    required: true

  },
  brand: {
    type: Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },

  isBlocked: {
    type: Boolean,
    default: false
  },

  ratings: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    createdOn: {
      type: Date,
      default: Date.now
    }
  }],

  offer: {
    type: Number,
    default : '' 
  },
  startDate: {
    type: Date,
    default:null,
  },

  offerValidUntil: {
    type: Date,
    default:null
  },
  offerId:{
    type: Schema.Types.ObjectId,
      ref: 'Offer'
  },
  status: {
    type: String,
    enum: ['available', 'out_of_stock', 'discontinued'],
    default: 'available'
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
},{timestamps: true});

const Product = mongoose.model('Product', productSchema);
module.exports = Product

