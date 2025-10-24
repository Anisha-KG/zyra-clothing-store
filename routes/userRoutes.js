const express=require('express')
const router=express.Router()
const userController=require('../controller/user/userController')
const passport = require('../config/passport');
const auth=require('../middleware/auth')
const checkBlockedUser=require('../middleware/checkUserBlocked')
const shopPageController=require('../controller/user/shopPage')
const forgotPasswordController=require('../controller/user/forgotPasswordManagement')

router.get('/pagenotfound',userController.pageNotFound)
router.get('/home',auth.checkSession,userController.loadHomepage)
router.get('/signup',auth.isLogin,userController.loadsignup)
router.post('/signup',userController.signup)
router.post('/verify-otp',userController.verify_otp)
router.post('/resend-otp',userController.resend_otp)
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/signup' }), async (req, res) => {
  try {
    req.session.user = req.user._id;
    res.redirect('/home');
  } catch (error) {
    console.log("Google login error:", error);
    res.redirect('/signup');
  }
});
router.get('/login',auth.isLogin,userController.loadLogin)
router.post('/login',userController.loginUser)
router.get('/logout',userController.logout)
router.get('/shopPage',shopPageController.shopPage)

router.get('/forgotPassword',auth.isLogin,forgotPasswordController.loadforgotPasswordPage)
router.post('/forgotPassword',forgotPasswordController.forgotPassword)
router.post('/verify-otp/changePassword',auth.isLogin,forgotPasswordController.verifyOtp)
router.post('/forgotPassword/resend-otp',forgotPasswordController.resend_otp)
router.get('/changePassword',auth.isLogin,forgotPasswordController.loadChangePassword)
router.post('/changePassword',forgotPasswordController.changePassword)

router.get('/shop',auth.checkSession,shopPageController.shopPage)




module.exports=router