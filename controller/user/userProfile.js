const User=require('../../models/userScema')
const Address=require('../../models/addressSchema')
const httpStatus=require('../../Constants/httpStatuscode')
const nodemailer = require("nodemailer");
const bcrypt=require('bcrypt')



function generateOtp() {
  const digits = '123456789';
  let otp = '';
  for (let i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 9)];
  }
  return otp;
}

async function sendVarificationMail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_GMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
      tls: { rejectUnauthorized: false }
    });

    await transporter.sendMail({
      from: process.env.NODEMAILER_GMAIL,
      to: email,
      subject: "Verify your account",
      html: `<b>Your OTP is: ${otp}</b>`,
    });

    return true;

  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

async function hashPassword(password){
  try{
    const hashedPasword=await bcrypt.hash(password,10)
    return hashedPasword
  }catch(error){
    console.log(error)
  }
}

const getUserprofile=async(req,res,next)=>{
    try{
        
        const userId=req.session.user
        let user=null
        
        if(userId){
            user=await User.findById(userId)
        }
        const userAddresses=await Address.findOne({userId}).lean()
        const addresses=userAddresses.address?userAddresses.address:[]
        const defaultAddress=userAddresses.address.find((addr)=>addr.isDefault==true)||null
        

        res.render('userProfile',{
            
            user,
            defaultAddress,
            addresses,
            
        })


    }catch(error){
        next(error)
    }
}

const updateProfile=async(req,res,next)=>{
    try{
        

        const{name,email,phone,addressId}=req.body 

        if(!name||!email||!phone||!addressId){
            return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'All fields are required'})
        }

        const userId=req.session.user 
        const user=await User.findById(userId) || null

        if(user.email!=email){
            const otp=generateOtp()
            req.session.otp=otp 
            req.session.data={name,email,phone,addressId}
            console.log(otp)

            const mailSend=sendVarificationMail(email,otp)
            if(!mailSend){
                return res.json({success:false,message:'cannot send verification mail'})
            }

           return res.json({otpVerification:true})
        }

       const updated=await User.findByIdAndUpdate(userId,{$set:{name:name,email:email,phone:phone}},{new:true})
       if(!updated){
        return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Cannot update data'})
       }
       


        const userAddressDoc=await Address.findOne({userId})
        userAddressDoc.address.forEach((addr)=>addr.isDefault=false)

        const address=userAddressDoc.address.id(addressId)
       

        
        address.phone=phone
        address.isDefault=true

        await userAddressDoc.save()
        

        res.status(httpStatus.OK).json({success:true,message:'Profile updated successfully'})

    }catch(error){
        next(error)
    }
}

const verifyOtp=async(req,res,next)=>{
    try{
        const {otp}=req.body 

        if(!otp||otp!==req.session.otp){
            return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Invalid OTP, please enter again' })
        }

        const{name,email,phone,addressId}=req.session.data 
        const userId=req.session.user

        const updated=await User.findByIdAndUpdate(userId,{$set:{name:name,email:email,phone,phone}},{new:true})
        if(!updated){
             return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Cannot update user details'})
        }

        const userAddressDoc=await Address.findOne({userId})
        userAddressDoc.address.forEach((addr)=>addr.isDefault=false)

        const address=userAddressDoc.address.id(addressId)
       

        
        address.phone=phone
        address.isDefault=true

        await userAddressDoc.save()

        req.session.otp=null
        req.session.data=null
        

        res.status(httpStatus.OK).json({success:true,message:'Profile updated successfully'})

        
    }catch(error){
        next(error)
    }
}
const resendOtp = async (req, res) => {
  try {
    const email = req.session.data?.email;
    if (!email) return res.status(400).json({ success: false, message: 'Email not found in session' });

    const otp = generateOtp();
    req.session.otp = otp;

    console.log(otp)

    const emailSent = await sendVarificationMail(email, otp);

    if (emailSent) return res.status(200).json({ success: true, message: 'OTP resent successfully' });
    return res.status(500).json({ success: false, message: 'Failed to resend OTP' });

  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getChangePassword=async(req,res,next)=>{
    try{
        const userId=req.session.user 
        const user=await User.findById(userId)||null
        res.render('profile-ChangePassword',{user})
    }catch(error){
        next(error)
    }
}

const changePassword=async(req,res,next)=>{
  try{
    const{currentPassword,newPassword,confirmPassword}=req.body 
    const userId=req.session.user 
    const user=await User.findById(userId)
    
    const isMatch=await bcrypt.compare(currentPassword,user.password)
    if(!isMatch){
      return res.status(httpStatus.BAD_REQUEST).json({sucess:false,message:'Current password is wrong'})
    }

    if(newPassword!==confirmPassword){
      return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Password does not match'})
    }
    const hashedPassword= await hashPassword(newPassword)
    
    const update=await User.findByIdAndUpdate(userId,{$set:{password:hashedPassword}},{new:true})
    if(!update){
      return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Cannot change password'})
    }
    await user.save()

    return res.status(httpStatus.BAD_REQUEST).json({success:true,message:'Pasword changed successfully'}) 
    
  }catch(error){
    next(error)
  }
}

const sendEmailOtp=async(req,res,next)=>{
  try{
    const {email}=req.body 

    const userId=req.session.user 
    const user=await User.findById(userId)

    if(email!==user.email){
      return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Invalid email'})
    }

    const otp=generateOtp() 
    req.session.otp=otp
    req.session.data={email}
    console.log(otp)
    const emailSend=await sendVarificationMail(email,otp)
    if(!emailSend){
      return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Cannot send Email'})
    }

    res.status(httpStatus.OK).json({success:true,message:'Otp is successfully send to your email'})
  }catch(error){
    next(error)
  }
}


const updatePassword=async(req,res,next)=>{
  try{
    const{newPassword,confirmPassword}=req.body 
    const userId=req.session.user 
    const user=await User.findById(userId)

    if(newPassword!==confirmPassword){
      return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Password does not match'})
    }
    const hashedPassword= await hashPassword(newPassword)
    
    const update=await User.findByIdAndUpdate(userId,{$set:{password:hashedPassword}},{new:true})
    if(!update){
      return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Cannot change password'})
    }
    

    return res.status(httpStatus.OK).json({success:true,message:'Pasword changed successfully'}) 
    
  }catch(error){
    next(error)
  }
}

const validateOtp=async(req,res,next)=>{
  try{
    const {otp}=req.body 

    if(otp!=req.session.otp){
      return res.json({success:false,message:'Invalid Otp'})
    }
    req.session.otp=null 
    req.session.data=null
    res.json({success:true,message:'Email verifies successfully'})


  }catch(error){
    next(error)
  }
    
  
}


module.exports={
    getUserprofile,
    updateProfile,
    verifyOtp,
    resendOtp,
    getChangePassword,
    changePassword,
    sendEmailOtp,
    validateOtp,
    updatePassword
}