const user = require('../../models/userScema');
const nodemailer = require("nodemailer");
const bcrypt = require('bcrypt');
const Product = require('../../models/productSchema');
const Variant = require('../../models/variantSchema');

require('dotenv').config();




const generateReferralCode = (name) => {
    return (
        name.substring(0, 4).toUpperCase() +
        Math.random().toString(36).substring(2, 7).toUpperCase()
    );
};

const loadsignup = async (req, res) => {
  try {
    res.render('signup', { user: null, message: null });
  } catch (error) {
    res.redirect('/pageNotFound');
  }
};

const loadLogin = async (req, res) => {
  try {
    res.render('login', { message: null });
  } catch (error) {
    res.redirect('/pageNotFound');
  }
};

const pageNotFound = async (req, res) => {
  try {
    res.render('page404');
  } catch (error) {
    res.redirect('/pageNotFound');
  }
};

const loadHomepage = async (req, res) => {
  try {
    const userId = req.session.user;

    const [newArrivals, topTrends, productVariant] = await Promise.all([
      Product.find({ isBlocked: false }).populate('category').populate('subcategory').sort({ createdAt: -1 }).limit(8).lean(),
      Product.find({ isBlocked: false }).populate('category').populate('subcategory').limit(8).lean(),
      Variant.find({ isListed: true }).populate('product').lean()
    ]);

    if (!userId) {
      return res.render('homepage', { user: null, newArrivals, topTrends, productVariant });
    }

    const userData = await user.findById(userId).lean();
    if (!userData || userData.isBlocked) return res.render('homepage',{user:null,newArrivals, topTrends, productVariant});

    res.render('homepage', { user: userData, newArrivals, topTrends, productVariant });

  } catch (error) {
    res.redirect('/pageNotFound');
  }
};

// ---------- OTP & EMAIL ----------

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

// ---------- SIGNUP ----------

const signup = async (req, res) => {
  console.log(req.body)
  try {
    let { name, phone, email, password, cpassword,referralCode,deviceId } = req.body;
    email = email.trim().toLowerCase();

    if (password !== cpassword) return res.render('signup', { message: "Passwords do not match" });

    const existingUser = await user.findOne({ email });
    if (existingUser) return res.render('signup', { message: "User already exists" });

    const otp = generateOtp();
    console.log(otp)
    const emailSent = await sendVarificationMail(email, otp);

    if (!emailSent) return res.render('signup', { message: "Failed to send OTP. Try again." });

    // Store temporary signup info in session
    req.session.userData = { name, phone, email, password,referralCode,deviceId };
    req.session.userotp = otp;

    res.render('verify-otp', { message: null });

  } catch (error) {
    console.error('Signup error:', error);
    res.redirect('/pageNotFound');
  }
};



const securePassword = async (password) => {
  return await bcrypt.hash(password, 10);
};



const verify_otp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp || otp !== req.session.userotp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP, please enter again' });
    }

    const newUser = req.session.userData;
    const hashedPassword = await securePassword(newUser.password);
    const referralCode=generateReferralCode(newUser.name)
    let couponforNewUser=null

    if(newUser.referralCode){
      const referrer=await user.findOne({referralcode:newUser.referralCode})

      if(referrer){
        let fraudDetected = false
        if (process.env.NODE_ENV === "production") {
        const existingUser = await user.findOne({ signupDeviceId: newUser.deviceId });
        if (existingUser) fraudDetected = true
}

        if(!fraudDetected){
           const couponforReferrer = {
                couponCode: "REF-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
                discount: 100, 
                createdAt: new Date()
            }
            referrer.referralCoupons.push(couponforReferrer)
            await referrer.save()

          couponforNewUser={
            couponCode: "REF-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
            discount: 50, 
            createdAt: new Date()
          }

        }
      }
    }

    const saveUser = new user({
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      password: hashedPassword,
      signupDeviceId: newUser.deviceId,
      referralcode:referralCode,
      redeemed:newUser.referralCode,
      referralCoupons: []
      
    });

    if (couponforNewUser) {
      saveUser.referralCoupons.push(couponforNewUser);
    }

    await saveUser.save();

    req.session.userData = null;
    req.session.userotp = null;

    res.json({ success: true, redirectUrl: '/login' });

  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

// ---------- RESEND OTP ----------

const resend_otp = async (req, res) => {
  try {
    const email = req.session.userData?.email;
    if (!email) return res.status(400).json({ success: false, message: 'Email not found in session' });

    const otp = generateOtp();
    req.session.userotp = otp;
    console.log(otp)

    const emailSent = await sendVarificationMail(email, otp);

    if (emailSent) return res.status(200).json({ success: true, message: 'OTP resent successfully' });
    return res.status(500).json({ success: false, message: 'Failed to resend OTP' });

  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ---------- LOGIN ----------

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) return res.render('login', { message: 'Email is required' });
    if (!password) return res.render('login', { message: 'Password is required' });

    const existingUser = await user.findOne({ email, isAdmin: 0 });
    if (!existingUser) return res.render('login', { message: 'Invalid email or password' });
    if (existingUser.isBlocked) return res.render('login', { message: 'User is blocked by admin' });

    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) return res.render('login', { message: 'Invalid password' });

    // Set session after successful login
    req.session.user =existingUser._id

    res.redirect('/');

  } catch (error) {
    console.log('Login error:', error);
    res.render('login', { message: 'Login failed, try again' });
  }
};

// ---------- LOGOUT ----------

const logout = async (req, res) => {
  try {
    if (req.session.user) {
      delete req.session.user;
    }

    return res.redirect('/login');

  } catch (error) {
    console.log('Logout error:', error);
    return res.redirect('/pageNotFound');
  }
};



const loadHome = async (req, res) => {
  try {
    res.render('dummyhome');
  } catch (error) {
    res.redirect('/pageNotFound');
  }
};

module.exports = {
  loadHomepage,
  pageNotFound,
  loadsignup,
  signup,
  verify_otp,
  resend_otp,
  loadLogin,
  loginUser,
  logout,
  loadHome
};
