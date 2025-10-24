const mongoose=require('mongoose')
const{schema}=mongoose

const addressSchema=new schema({
  userId:{
    type:schema.Types.ObjectId,
    required:true
  },
  address:[{
    addressType:{
      type:String,
      required:true
    },
    name:{
      type:String,
      required:true
    },
    city:{
      type:String,
      required:true

    },
    landmark:{
      type:String,
      required:true
    },
    state:{
      type:String,
      required:true

    },
    pincode:{
      type:number,
      required:true
    },
    phone:{
      type:string,
      required:true
    },
    altphone:{
      type:string,
      required:true
    }
  }]
})

const Address=mongoose.model('Address',addressSchema)

module.exports=Address