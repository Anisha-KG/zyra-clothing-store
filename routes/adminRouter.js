const express=require('express')
const router=express.Router()
const adminController=require('../controller/admin/adminController')
const{userAuth,adminAuth}=require('../middleware/auth')
const customersController=require('../controller/admin/customersController')


router.get('/pageerror',adminController.pageerror)
router.get('/login',adminController.loadLogin)
router.post('/login',adminController.login)
router.get('/dashboard',adminAuth,adminController.loadDashboard)
router.get('/adminlogout',adminController.logout)


router.get('/customers',adminAuth,customersController.customerInfo)
router.get('/blockCustomer',adminAuth,customersController.customerBlocked)
router.get('/unbloCkcustomer',adminAuth,customersController.customerUnblocked)
module.exports=router