const express=require('express')
const router=express.Router()
const userController=require('../controller/user/userController')
const passport = require('../config/passport');
const auth=require('../middleware/auth')
const checkBlockedUser=require('../middleware/checkUserBlocked')
const shopPageController=require('../controller/user/shopPage')
const forgotPasswordController=require('../controller/user/forgotPasswordManagement')
const profileController=require('../controller/user/userProfile')
const addressController=require('../controller/user/userAddress')
const cartController=require('../controller/user/cartController')

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

router.get('/shop',shopPageController.shopPage)

router.get('/product/:productId',auth.checkSession,shopPageController.productDetails)

router.get('/profile',auth.checkSession,profileController.getUserprofile)
router.patch('/profile/update',auth.checkSession,profileController.updateProfile)
router.post('/profile/verifyOtp',auth.checkSession,profileController.verifyOtp)
router.post('/profile/resendOtp',auth.checkSession,profileController.resendOtp)
router.get('/profile/changePassword',auth.checkSession,profileController.getChangePassword)
router.post('/profile/changePassword',auth.checkSession,profileController.changePassword)
router.post('/profile/forgot-password',auth.checkSession,profileController.sendEmailOtp)
router.post('/profile/validateOtp',auth.checkSession,profileController.validateOtp)
router.post('/profile/updatePassword',auth.checkSession,profileController.updatePassword)


router.get('/address',auth.checkSession,addressController.viewAddresses)
router.post('/addAddress',auth.checkSession,addressController.addAddress)
router.patch('/editAddress',auth.checkSession,addressController.editAddress)
router.delete('/deleteAddress',auth.checkSession,addressController.deleteAddress)

router.get('/getCart',auth.checkSession,cartController.viewCart)
router.post('/cart/addProduct',auth.checkSession,cartController.addToCart)
router.post('/cart/incrementQuantity',auth.checkSession,cartController.increment)
router.post('/cart/decrementQuantity',auth.checkSession,cartController.decrement)
router.delete('/cart/removeItem',auth.checkSession,cartController.removeItem)





module.exports=router