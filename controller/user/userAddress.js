const Address=require('../../models/addressSchema')
const User=require('../../models/userScema')
const httpStatus=require('../../Constants/httpStatuscode')

const viewAddresses=async(req,res,next)=>{
    try{
        const userId=req.session.user 
    let user=null 
    if(userId){
        user=await User.findById(userId)
    }

    const userAddress=await Address.findOne({userId})
    const addresses=userAddress?userAddress.address:[]
    let limit=1

    res.render('userAddress',{
        user,
        addresses,
        limit
    })
    }catch(error){
        next(error)
    }
}

const addAddress=async(req,res,next)=>{
    try{

        
        const{name,phone,altphone,addressName,city,state,landmark,addressType,pincode}=req.body
        let isDefault=req.body.isDefault
        isDefault=(isDefault==='true')

        const userId=req.session.user

        let userAddress=await Address.findOne({userId:userId})
        

        if(isDefault&&userAddress){
            userAddress.address.forEach((a)=>a.isDefault=false)
        }
        
        if(!userAddress){
            const newAddress=await Address({
                userId:req.session.user ,
                address:[{addressType,name,addressName,city,landmark,state,pincode,phone,altphone,isDefault:true}]
            })
            await newAddress.save()

        }else if(userAddress.address.length==0){
            userAddress.address.push({addressType,name,addressName,city,landmark,state,pincode,phone,altphone,isDefault:true})
            await userAddress.save()

        }else{
            userAddress.address.push({addressType,name,addressName,city,landmark,state,pincode,phone,altphone,isDefault})
            await userAddress.save()
        }
        
        res.status(httpStatus.OK).json({success:true,message:'Address added succesfully'})
    }catch(error){
        next(error)
    }
}

const editAddress=async(req,res,next)=>{
    console.log('controller hit')
    try{
       
        const{name,phone,altphone,addressName,city,state,landmark,addressType,pincode,id}=req.body 
        let isDefault=req.body.isDefault 
        isDefault=(isDefault==='true')||(isDefault===true)
        

        const userAddress=await Address.findOne({userId:req.session.user})
        

        if(!userAddress){
           return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Address document not found'})
        }

        if(isDefault){
            userAddress.address.forEach((a)=>a.isDefault=false)
        }
        const addr=userAddress.address.id(id)
        if(!addr){
            return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Address not found'})
        }

        addr.name=name
        addr.phone=phone
        addr.altphone=altphone
        addr.addressName=addressName
        addr.city=city
        addr.state=state
        addr.landmark=landmark
        addr.addressType=addressType
        addr.pincode=pincode 
        addr.isDefault=isDefault

        await userAddress.save()

        

        return res.status(httpStatus.OK).json({success:true,message:'Address updated successfully'})

    }catch(error){
        next(error)
    }
}

const deleteAddress=async(req,res,next)=>{
    try{
        const {id}=req.body 

        const userAddress=await Address.findOne({'address._id':id})
        if(!userAddress){
            return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Address not found'})
        }

        const deleteAddress=await Address.updateOne({'address._id':id},{$pull:{address:{_id:id}}},{new:true})
        if(!deleteAddress){
            return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Cannot delete address'})
        }

        return res.status(httpStatus.OK).json({success:true,message:'Address deleted successfully'})
    }catch(error){
        next(error)
    }
}

module.exports={
    viewAddresses,
    addAddress,
    editAddress,
    deleteAddress
}