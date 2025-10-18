const mongoose=require('mongoose')
const {Schema}=mongoose

const variantSchema = new Schema({
  color: { type: String, required: true },
  size: { type: String, required: true, default: 'M' },
  quantity: { type: Number, required: true, min: 0 },
  images: [{
    type: String ,
    required :true,

  }],
  product:{
    type:Schema.Types.ObjectId,
    ref:'Product',
    required:true
  },
  createdAt:{
    type:Date,
    default:Date.now()
  },
  isListed:{
    type:Boolean,
    default:true
  }
});

const variant=mongoose.model('variant',variantSchema)
module.exports=variant
