const express=require('express')
const router=express.Router()
const userController=require('../controller/user/userController')

router.get('/pagenotfound',userController.pageNotFound)
router.get('/home',userController.loadHomepage)

module.exports=router