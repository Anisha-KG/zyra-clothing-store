const express=require('express')
const router=express.Router()
const userController=require('../controller/user/userController')
const passport = require('../config/passport');

router.get('/pagenotfound',userController.pageNotFound)
router.get('/home',userController.loadHomepage)
router.get('/signup',userController.loadsignup)
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
router.get('/login',userController.loadLogin)
router.post('/login',userController.loginUser)
router.get('/logout',userController.logout)
module.exports=router