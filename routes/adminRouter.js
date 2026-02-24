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
const categoryUpload=require('../middleware/categoryMulter')
const orderController=require('../controller/admin/ordersController')
const couponController=require('../controller/admin/couponController')
const salesReportController=require('../controller/admin/salesReportController')
const offerMangementController=require('../controller/admin/offerManagement')
const dashboardController=require('../controller/admin/dashboard')

router.get('/pageerror',adminController.pageerror)
router.get('/login',isAdminLogin,adminController.loadLogin)
router.post('/login',adminController.login)

router.get('/adminlogout',adminController.logout)

router.get('/customers',adminAuth,customersController.customerInfo)
router.post('/blockCustomer',adminAuth,customersController.customerBlocked)
router.post('/unblockCustomer',adminAuth,customersController.customerUnblocked)

router.get('/categories',adminAuth,categoryController.categoryInfo)
router.post('/addcategory',adminAuth,categoryUpload.single('categoryImage'),categoryController.addCategory)
router.post('/addCategoryOffer',adminAuth,categoryController.addCategoryOffer)
router.patch('/removeCategoryOffer',adminAuth,categoryController.removeCategoryOffer)
router.patch('/unlistCategory',adminAuth,categoryController.unlistCategory)
router.patch('/listCategory',adminAuth,categoryController.listCategory)
router.patch('/editCategory/:id',adminAuth,categoryUpload.single('categoryImage'),categoryController.editCategory)
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
router.post('/addSubcategory',adminAuth,subcategoryUpload.single('subcategoryImage'),subcategoryController.addSubcategory)
router.post('/addSubcategoryOffer',adminAuth,subcategoryController.addSubcategoryOffer)
router.patch('/removesubcatOffer',adminAuth,subcategoryController.removeOffer)
router.patch('/unlistSubcategory',adminAuth,subcategoryController.unlistSubcategory)
router.patch('/listSubcategory',adminAuth,subcategoryController.listSubcategory)
router.delete('/deleteSubcategory',adminAuth,subcategoryController.deteleSubcategory)
router.patch('/editSubcategory',adminAuth,subcategoryUpload.single('subcategoryImage'),subcategoryController.editSubcategory)

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
router.patch('/editVariant',adminAuth,upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 }
]),variantController.editVariant)
router.patch('/listVariant',adminAuth,variantController.listVariant)
router.patch('/unlistVariant',adminAuth,variantController.unlistVariant)
router.get('/orders',adminAuth,orderController.listOrders)
router.get('/orders/:orderId',adminAuth,orderController.orderDetails)
router.patch('/updateOrderStatus',adminAuth,orderController.updateItemstatus)
router.patch('/orders/handleReturnRequest',adminAuth,orderController.handleReturnRequest)
router.patch('/orders/updateExpectedDate',adminAuth,orderController.updateExpectedDeliveryDate)
router.patch('/orders/increment-stock',adminAuth,orderController.incrementStock)

router.get('/coupons',adminAuth,couponController.getCoupons)
router.post('/coupon/addCoupon',adminAuth,couponController.addCoupon)
router.patch('/coupon/editCoupon',adminAuth,couponController.editCoupon)
router.patch('/coupon/deactivateCoupon',adminAuth,couponController.deactivateCoupon)
router.patch('/coupon/activateCoupon',adminAuth,couponController.activateCoupon)
router.delete('/coupon/deleteCoupon',adminAuth,couponController.deleteCoupon)

router.get('/salesReport',adminAuth,salesReportController.getSalesReport)
router.get('/sales-report/pdf',adminAuth,salesReportController.downloadSalesPdf)
router.get('/sales-report/excel',adminAuth,salesReportController.downloadSalesExcel)


router.get('/offerManagement',adminAuth,offerMangementController.getOfferManagementPage);
router.post('/offerManagement',adminAuth, offerMangementController.addOffer);
router.put('/offerManagement/:id',adminAuth, offerMangementController.editOffer);
router.patch('/listOffer/:id',adminAuth, offerMangementController.restoreOffer);
router.patch('/unlistOffer/:id',adminAuth, offerMangementController.deleteOffer);

router.get('/dashboard',adminAuth,dashboardController.getAdminDashboard)

module.exports=router