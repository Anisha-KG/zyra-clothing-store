const mongoose=require('mongoose')
const {Schema}=mongoose

const subcategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String, // store filename or full image path
    required: true,
    trim: true
  },
  offer: {
    type: Number, // percentage (e.g., 10 for 10% off)
    min: 0,
    max: 100,
    default: 0
  },
  isListed: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  offerId:{
    type: Schema.Types.ObjectId,
      ref: 'Offer'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  categoryId:{
    type:Schema.Types.ObjectId,
    ref:'Category',
    required:true
  }

});
subcategorySchema.index({ name: 1 }, { unique: true });//to create unique index

const subcategory=mongoose.model('subcategories',subcategorySchema)
module.exports=subcategory