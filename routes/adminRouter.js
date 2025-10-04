const express=require('express')
const router=express.Router()
const adminController=require('../controller/admin/adminController')
const{userAuth,adminAuth}=require('../middleware/auth')
const customersController=require('../controller/admin/customersController')
const categoryController=require('../controller/admin/categoryController')
const brandController=require('../controller/admin/brandController')
const subcategoryController=require('../controller/admin/subcategoryController')
const productController=require('../controller/admin/productController')
const upload=require('../middleware/multerConfig')
const brandUpload=require('../middleware/brandUpload')
const subcategoryUpload=require('../middleware/subcategoryUpload')


router.get('/pageerror',adminController.pageerror)
router.get('/login',adminController.loadLogin)
router.post('/login',adminController.login)
router.get('/dashboard',adminAuth,adminController.loadDashboard)
router.get('/adminlogout',adminController.logout)


router.get('/customers',adminAuth,customersController.customerInfo)
router.post('/blockCustomer',adminAuth,customersController.customerBlocked)
router.post('/unbloCkcustomer',adminAuth,customersController.customerUnblocked)

router.get('/categories',adminAuth,categoryController.categoryInfo)
router.post('/addcategory',adminAuth,upload.single('categoryImage'),categoryController.addCategory)
router.post('/addCategoryOffer',adminAuth,categoryController.addCategoryOffer)
router.patch('/removeCategoryOffer',adminAuth,categoryController.removeCategoryOffer)
router.patch('/unlistCategory',adminAuth,categoryController.unlistCategory)
router.patch('/listCategory',adminAuth,categoryController.listCategory)
router.patch('/editCategory/:id',adminAuth,upload.single('categoryImage'),categoryController.editCategory)
router.delete('/deleteCategory',adminAuth,categoryController.deleteCategory)

router.get('/brands',adminAuth,brandController.getBrands)
router.post('/addBrand',adminAuth,brandUpload.single('brandLogo'),brandController.addBrand)
router.post('/addBrandOffer',adminAuth,brandController.addBrandOffer)
router.patch('/editBrand',adminAuth,brandUpload.single('brandLogo'),brandController.editBrand)
router.patch('/unlistBrand',adminAuth,brandController.unlistBrand)
router.patch('/listBrand',adminAuth,brandController.listBrand)
router.patch('/removeOffer',adminAuth,brandController.removeOffer)
router.delete('/deleteBrand',adminAuth,brandController.deleteBrand)

router.get('/subcategories/:id',adminAuth,subcategoryController.loadSubcategories)
router.post('/addSubcategory',adminAuth,subcategoryUpload.single('subcategoryImage'),subcategoryController.addSubcategory)
router.post('/addSubcategoryOffer',adminAuth,subcategoryController.addSubcategoryOffer)
router.patch('/removesubcatOffer',adminAuth,subcategoryController.removeOffer)
router.patch('/unlistSubcategory',adminAuth,subcategoryController.unlistSubcategory)
router.patch('/listSubcategory',adminAuth,subcategoryController.listSubcategory)
router.delete('/deleteSubcategory',adminAuth,subcategoryController.deteleSubcategory)




module.exports=router