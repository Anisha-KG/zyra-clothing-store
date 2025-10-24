const User=require('../../models/userScema')
const nodemailer = require("nodemailer");
const bcrypt=require('bcrypt');


const securePassword=async(password)=>{
  try{
    const hashedPassword=await bcrypt.hash(password,10)
    return hashedPassword
  }catch(error){
    console.log("Error while hashing:",error)
  }
}

function generateOtp(){
  return Math.floor(100000+Math.random()*900000).toString()
}

async function sendVarificationMail(email,otp){
  try{
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS:true,
      auth: {
        user: process.env.NODEMAILER_GMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const info = await transporter.sendMail({
      from:process.env.NODEMAILER_GMAIL,
      to: email,
      subject: "Verify your account",
      text: `your otp is ${otp}`,
      html: `<b>your otp :${otp}</b>`,

    })
    console.log("Message sent:", info.messageId);
    return true

  }catch(error){
    console.error("Error for sending email",error)
    return false
  }
}

const loadforgotPasswordPage=async(req,res)=>{
    try{
        res.render('forgotPassword')
    }catch(error){
        console.log(error)
        res.redirect('/pageNotFound')
    }
}

const forgotPassword=async(req,res)=>{
    console.log('controller hit')
    try{
        const {email}=req.body
        if(!email){
          return res.render('forgotPassword',{message:'Email is required'})
        }

        const isExist=await User.findOne({email:email})
        if(!isExist){
           return res.render('forgotPassword',{message:'User with this email doesnot exist. Please signup'})
        }

        const otp=generateOtp()
        
    

    const emailsend= await sendVarificationMail(email,otp)
    if(!emailsend){

      return res.render('forgotPassword',{message:'Cannot send email'})
    }

    req.session.userData = { email };   
req.session.userotp = otp;
console.log('otp stored in the session:', otp);
res.render('verifyOtp-changePassword');

    }catch(error){
        console.log(error)
        res.redirect('/pageNotFound')
    }
}
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (otp === req.session.userotp) {
    
      return res.json({
        success: true,
        message: "OTP verified successfully",
        redirectUrl: "/changePassword" 
      });
    } else {
      return res.json({
        success: false,
        message: "Invalid OTP. Please try again."
      });
    }
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: "Something went wrong. Please try again."
    });
  }
};

const resend_otp = async (req, res) => {
  try {

    const sessionData = req.session.userData;
    const email = sessionData ? sessionData.email : null;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email not found in session' });
    }

    const otp = generateOtp();
    console.log('otp:', otp);


    req.session.userotp = otp;


    const sendResult = await sendVarificationMail(email, otp);

    if (sendResult) {
      return res.status(200).json({ success: true, message: 'OTP resent successfully' });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to resend OTP. Please try again.' });
    }

  } catch (error) {
    console.error('Error Resending OTP', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error. Please try again.' });
  }
};

const loadChangePassword=async(req,res)=>{
    try{
        res.render('changePassword')
    }catch(error){
        res.redirect('/pageNotFound')
    }
}

const changePassword=async(req,res)=>{
    try{
        const{currentPassword,newPassword,confirmPassword}=req.body
        const sessionData = req.session.userData;
    if (!sessionData || !sessionData.email) {
      return res.render('changePassword', {
        message: 'Session expired or invalid. Please verify your email again.'
      });
    }
        const email=sessionData.email

        const user=await User.findOne({email:email})
        if(!user){
            return res.json({success:false,message:'User doesnot exist. Please signup'})
        }
        const isMatch=await bcrypt.compare(currentPassword,user.password)
            if(!isMatch){
              return res.json({success:false,message:'Current password is wrong'})
            }

        if(newPassword!==confirmPassword){
            return res.json({success:false,message:'Password doesnot match'})
        }
        const hashedPassword= await securePassword(newPassword)

        const update=await User.findOneAndUpdate({email:email},{$set:{password:hashedPassword}},{new:true})
        if(!update){
           return res.json({success:false,message:'cannot Change password'})
        }

        res.json({ success: true, message: 'Password changed successfully' });
req.session.destroy();


    }catch(error){
        console.log(error)
        res.redirect('/pageNotFound')
    }
}


module.exports={
    loadforgotPasswordPage,
    forgotPassword,
    verifyOtp,
    loadChangePassword,
    resend_otp,
    changePassword
}