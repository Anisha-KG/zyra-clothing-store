const user=require('../../models/userScema')
const nodemailer = require("nodemailer");
const bcrypt=require('bcrypt');

require('dotenv').config()

const loadsignup=async(req,res)=>{
    try{
       return  res.render('signup',{ user: null })
    }catch(error){
        console.log("home page is not loading",error)
        res.status(500).send('server eror')
    }
}
const loadLogin=async(req,res)=>{
    try{
        if(!req.session.user){
            return res.render('login')
        }else{
            res.redirect('/')
        }
        
    }catch(error){
        console.log('login page is not loading:',error)
        res.status(500).send('server error')
    }
}
const pageNotFound=async(req,res)=>{
    try{
        res.render('page404')
    }catch(error){
        res.redirect('/pageNotFound')
    }
}
const loadHomepage=async(req,res)=>{
    try{
        const userId=req.session.user
        if(!userId){
           return res.render('homepage',{ user: null })
        }
        const userData=await user.findOne({_id:userId})

       if(!userData.isBlocked){
         return res.render('homepage',{user:userData})
       }else{
        return res.redirect('/login')
       }
    }catch(error){
        console.log('error while loading homepage')
        res.status(500).send('server error')
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

const signup=async(req,res)=>{
    try{
        let {name,phone,email,password,cpassword}=req.body 

    email=email.trim().toLowerCase()//to avoid duplicates
    if(password!==cpassword){
        return res.render('signup',{message:"Password does not match"})
    }
    const findUser=await user.findOne({email:email})
    if(findUser){
        return res.render('signup',{message:"User already exist"})
    }

    const otp=generateOtp()
    console.log("OTP Send",otp);
    

    const emailsend= await sendVarificationMail(email,otp)
    if(!emailsend){
        
        return res.json('Email-error')
    }

    req.session.userotp=otp
    console.log('otp stored in the session:',otp)
    req.session.userData={name,phone,email,password,cpassword}
    res.render('verify-otp')
    //res.json("email send")
    
    }catch(error){
        console.error('signup error',error)
        res.redirect('/pagenotfound')
    }


}

const securePassword=async(password)=>{
    try{
        const hashedPassword=await bcrypt.hash(password,10)
        return hashedPassword
    }catch(error){
        console.log("Error while hashing:",error)
    }
}


const verify_otp=async(req,res)=>{
    try{
        const {otp}=req.body
        console.log('otp from frontend:',otp)

    if(otp===req.session.userotp){
        const newUser=req.session.userData
        const hashedPassword= await securePassword(newUser.password)
        const saveUserData= new user({
            name:newUser.name,
            email:newUser.email,
            phone:newUser.phone,
            password:hashedPassword
        })
        await saveUserData.save()
        req.session.user=saveUserData._id
        req.session.userotp=null
        res.json({success:true,redirectUrl:'/home'})
        
    }else{
        res.status(400).json({success:false,message:'Invalid OTP, Please enter again'})
    }
        }catch(error){
            console.log("Error while verifying otp:",error)
            res.status(500).json({success:false,message:'Somerthing went wrong'})
        }
    }

    const resend_otp=async(req,res)=>{
        try{
            const {email}=req.session.userData 
        if(!email){
            return res.status(400).json({success:false,message:'Email not found'})
        }

        const otp=generateOtp()
        console.log('otp:',otp)

        req.session.userotp=otp

        const sendemail=sendVarificationMail(email,otp)

        if(sendemail){
            return res.status(200).json({success:true,message:'OTP resend successfully'})
        }else{
            return res.status(500).json({success:false,message:'Failed to resend otp .Please try again'})
        }


        }catch(error){
            console.error('Error Resending OTP',error)
            res.status(500).json({success:false,message:'INternal Server Error, Please try again'})
        }
    }

    const loginUser=async(req,res)=>{
        try{
            const{email,password}=req.body

        if(!email){
            return res.render('login',{message:'Email is required'})
        }
        if(!password){
           return res.render('login',{message:'Password is required'})
        }

        const User=await user.findOne({isAdmin:0,email:email})
        if(!User){
           return res.render('login',{message:'Invalid email or password'})
        }
        if(User.isBlocked){
            return res.render('login',{message:'User is blocked by admin'})
        }

        const isMatch=await bcrypt.compare(password,User.password)
        if(!isMatch){
            return res.render('login',{message:'Invalid Password'})
        }
        req.session.user=User._id
       return res.redirect('/home')
        }catch(error){
            console.log('Error while login:',error)
            res.render('login',{message:'Login Failed Try again', user: null})
        }

    }

    const logout=async(req,res)=>{
        try{
            req.session.destroy((err)=>{
            if(err){
                console.log('Session destruction error:',err)
                res.redirect('/pagenotfound')
            }
            res.redirect('/login')
        })
        }catch(error){
            console.log('Logout error:',error)
            res.redirect('/pagenotfound')
        }
    }

module.exports={
    loadHomepage,
    pageNotFound,
    loadsignup,
    signup,
    verify_otp,
    resend_otp,
    loadLogin,
    loginUser,
    logout
}