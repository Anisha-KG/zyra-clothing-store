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
const checkoutController=require('../controller/user/checkoutController')
const checkCart=require('../middleware/validateCart')
const orderController=require('../controller/user/orderController')
const orderManagement=require('../controller/user/orderManagementController')
const downloadInvoice=require('../controller/user/downloadInvoice')
const onlinePaymentController=require('../controller/user/onlinePayment')
const walletController=require('../controller/user/walletController')
const wishlistController=require('../controller/user/wishlistController')
const upload=require('../middleware/profileImage')
const uploadProfileImage=require('../controller/user/profileImageController')

router.get('/pagenotfound',userController.pageNotFound)
router.get('/',userController.loadHomepage)
router.get('/signup',auth.isLogin,userController.loadsignup)
router.post('/signup',userController.signup)
router.post('/verify-otp',userController.verify_otp)
router.post('/resend-otp',userController.resend_otp)
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/signup' }), async (req, res) => {
  try {
    req.session.user = req.user._id;
    res.redirect('/');
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
router.post('/reviews/add',auth.checkSession,shopPageController.addReview)


router.post("/upload-profile",auth.checkSession,upload.single("profileImage"),uploadProfileImage.uploadProfileImage);
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


router.get('/checkOut',auth.checkSession,checkCart.validateCart,checkoutController.viewCheckoutPage)
router.post('/checkout/selectAddress',auth.checkSession,checkCart.validateCart,checkoutController.selectedAddress)
router.get('/checkout/paymentmethod',auth.checkSession,checkCart.validateCart,checkoutController.selectPayment)
router.post('/checkout/paymentmethod',auth.checkSession,checkCart.validateCart,checkoutController.selectPaymentmethod)
router.get('/checkout/confirmationPage',auth.checkSession,checkCart.validateCart,checkoutController.getconfirmationPage)
router.post('/checkout/placeOrder',auth.checkSession,orderController.placeOrder)
router.get('/orderSuccessfull',auth.checkSession,orderController.orderSuccessfull)

router.get('/profile/orders',auth.checkSession,orderController.listOrder)
router.get('/profile/orders/:itemId',auth.checkSession,orderController.orderedProducts)
router.post('/order/cancel',auth.checkSession,orderController.CancelItem)
router.patch('/order/returnItem',auth.checkSession,orderManagement.requestReturn)
router.patch('/order/cancelOrder',auth.checkSession,orderManagement.cancelOrder)
router.patch('/order/returnOrder',auth.checkSession,orderManagement.returnOrder)
router.get("/download-invoice/:orderId",auth.checkSession, downloadInvoice.downloadInvoice);

router.get('/onlinePayment',auth.checkSession,onlinePaymentController.onlinePayment)
router.post('/payment/verify',auth.checkSession,onlinePaymentController.verifyRazorpayPayment)
router.get('/onlinepayment/orderfailed',auth.checkSession,onlinePaymentController.getFailurePage)
router.post('/retryPayment',auth.checkSession,onlinePaymentController.retryPayment)

router.get('/wallet',auth.checkSession,walletController.getWallet)
router.post('/wallet/addAmount',auth.checkSession,walletController.addAmount)
router.post('/wallet/verify-payment',auth.checkSession,walletController.verifyWalletPayment)


router.get('/wishlist',auth.checkSession,wishlistController.getWishlist)
router.post('/wishlist/toggle',auth.checkSession,wishlistController.manageWishlist)

router.get('/referralCode',auth.checkSession,profileController.getReferalCode)
router.get('/rewardCoupons',auth.checkSession,profileController.rewardCoupons)











module.exports=router