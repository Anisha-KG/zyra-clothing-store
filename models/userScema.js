const mongoose=require('mongoose')
const{Schema}=mongoose

const userSchema=new Schema({
  name:{
    type:String,
    required: true,

  },
  profileImage: {
  type: String,
  default: null
},

  email:{
    type:String,
    required:true,
    unique:true
  },
  phone:{
    type:String,
    required:false,
    unique:false,
    sparse:true,//?
    default:null
  },
   gender:{
    type:String,
    required:true,
    unique:false,
    default:'Female'
  },
  googleId:{
    type:String,
    unique:true,
    sparse:true
  },
  password:{
    type:String,
    required:false
  },
  isBlocked:{
    type:Boolean,
    default:false
  },
  isAdmin:{
    type:Boolean,
    default:false
  },
  cart:[{
    type:Schema.Types.ObjectId,
    ref:'cart'
  }],
  wishlist:[{
    type:Schema.Types.ObjectId,
    ref:'wishlist'
  }],
  orderdetails:[{
    type:Schema.Types.ObjectId,
    ref:'order'
  }],
  createdOn:{
    type:Date,
    default:Date.now
  },
  referralcode:{
    type:String,

  },redeemed:{
    type:String
  },
  redeemedUsers:[{
    type:Schema.Types.ObjectId,
    ref:'User'
  }],

  referralCoupons:[{
    couponCode:{
      type:String,
      required:true
    },
    discount:{
      type:Number
    },
    createdAt:{
      type:Date
    },
    isUsed:{
      type:Boolean,
      default:false
    }

}],
  searchHistory:[{
    category:{
      type:Schema.Types.ObjectId,
      ref:'category'
    },
    brand:{
      type:String
    },
    searchOn:{
      type:Date,
      default:Date.now
    }
  }]
})

const User=mongoose.model('User',userSchema)

module.exports=User