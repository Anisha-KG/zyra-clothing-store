const express=require('express')
const router=express.Router()
const adminController=require('../controller/admin/adminController')
const{userAuth,adminAuth,isAdminLogin}=require('../middleware/auth')
const customersController=require('../controller/admin/customersController')
const categoryController=require('../controller/admin/categoryController')
const brandController=require('../controller/admin/brandController')
const subcategoryController=require('../controller/admin/subcategoryController')
const productController=require('../controller/admin/productController')
const upload=require('../middleware/commonMulterconfig')
const brandUpload=require('../middleware/brandUpload')
const subcategoryUpload=require('../middleware/subcategoryUpload')
const product_editController=require('../controller/admin/product-editController')
const variantController=require('../controller/admin/variantController')


router.get('/pageerror',adminController.pageerror)
router.get('/login',isAdminLogin,adminController.loadLogin)
router.post('/login',adminController.login)
router.get('/dashboard',adminAuth,adminController.loadDashboard)
router.get('/adminlogout',adminController.logout)


router.get('/customers',adminAuth,customersController.customerInfo)
router.post('/blockCustomer',adminAuth,customersController.customerBlocked)
router.post('/unblockCustomer',adminAuth,customersController.customerUnblocked)

router.get('/categories',adminAuth,categoryController.categoryInfo)
router.post('/addcategory',adminAuth,upload.single('categoryImage'),categoryController.addCategory)
router.post('/addCategoryOffer',adminAuth,categoryController.addCategoryOffer)
router.patch('/removeCategoryOffer',adminAuth,categoryController.removeCategoryOffer)
router.patch('/unlistCategory',adminAuth,categoryController.unlistCategory)
router.patch('/listCategory',adminAuth,categoryController.listCategory)
router.patch('/editCategory/:id',adminAuth,upload.single('categoryImage'),categoryController.editCategory)
router.delete('/deleteCategory',adminAuth,categoryController.deleteCategory)

router.get('/brands',adminAuth,brandController.getBrands)
router.post('/addBrand',adminAuth,upload.single('brandLogo'),brandController.addBrand)
router.post('/addBrandOffer',adminAuth,brandController.addBrandOffer)
router.patch('/editBrand',adminAuth,upload.single('brandLogo'),brandController.editBrand)
router.patch('/unlistBrand',adminAuth,brandController.unlistBrand)
router.patch('/listBrand',adminAuth,brandController.listBrand)
router.patch('/removeOffer',adminAuth,brandController.removeOffer)
router.delete('/deleteBrand',adminAuth,brandController.deleteBrand)

router.get('/subcategories/:id',adminAuth,subcategoryController.loadSubcategories)
router.post('/addSubcategory',adminAuth,upload.single('subcategoryImage'),subcategoryController.addSubcategory)
router.post('/addSubcategoryOffer',adminAuth,subcategoryController.addSubcategoryOffer)
router.patch('/removesubcatOffer',adminAuth,subcategoryController.removeOffer)
router.patch('/unlistSubcategory',adminAuth,subcategoryController.unlistSubcategory)
router.patch('/listSubcategory',adminAuth,subcategoryController.listSubcategory)
router.delete('/deleteSubcategory',adminAuth,subcategoryController.deteleSubcategory)
router.patch('/editSubcategory',adminAuth,upload.single('subcategoryImage'),subcategoryController.editSubcategory)

router.get('/products',adminAuth,productController.getProducts)
router.get('/addProduct',adminAuth,productController.getaddProduct)
router.post('/addProduct',adminAuth,productController.addProduct)
router.patch('/blockProduct',adminAuth,productController.blockProduct)
router.patch('/unblockProduct',adminAuth,productController.unblockProduct)
router.delete('/deleteProduct',adminAuth,productController.deleteProduct)
router.post('/addProductOffer',adminAuth,productController.addProductOffer)
router.patch('/removeProductOffer',adminAuth,productController.removeProductOffer)
router.get('/edit-product/:productId',adminAuth,product_editController.geteditProduct)
router.patch('/editproduct',adminAuth,product_editController.editProduct)

router.get('/product/:productId/variants',adminAuth,variantController.getVariant)
router.post('/addVariant',adminAuth,upload.fields([
            { name: 'image1', maxCount: 1 },
            { name: 'image2', maxCount: 1 },
            { name: 'image3', maxCount: 1 },
            { name: 'image4', maxCount: 1 }
]),variantController.addVariant)



module.exports=router