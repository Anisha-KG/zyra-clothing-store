const Products = require('../../models/productSchema')
const Brands = require('../../models/brandsSchema')
const Subcategory = require('../../models/subcategorySchema')
const Category = require('../../models/categprySchema')
const httpStatus = require('../../Constants/httpStatuscode')
const mesages = require('../../Constants/messages')

const getProducts = async (req, res) => {
  try {
    const search = req.query.search ? req.query.search : ""
    const page = req.query.page ? req.query.page : 1
    const limit = 5
    const query = { name: { $regex: ".*" + search + ".*", $options: 'i' } }

    const [products, productCount] = await Promise.all([
      Products.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('category')
        .populate('subcategory')
        .populate('brand')
        .lean(),//return plain JavaScript objects instead of full Mongoose documents.
      Products.countDocuments(query)
    ])
    const totalPages = Math.ceil(productCount / limit)

    res.render('product', {
      totalPages,
      currentPage: page,
      search,
      products,
      search,
      limit

    })

  } catch (error) {
    console.error('Error fetching products:', error.stack || error);
    res.status(500).send('Server Error');
  }
}

const getaddProduct = async (req, res) => {
  try {
    const [categories, subcategories, brands] = await Promise.all([
      Category.find({ isListed: true, isDeleted: false }),
      Subcategory.find({ isListed: true, isDeleted: false }),
      Brands.find({ isListed: true, isDeleted: false })
    ])
    res.render('product-add', {
      categories,
      subcategories,
      brands
    })
  } catch (error) {
    console.error("Error loading product add page:", error);
    res.status(500).json({ success: false, message: "Error loading product add page" });
  }
}

const addProduct = async (req, res,next) => {
  console.log('controller hit')
  try {
    const { productName, material, status, regprice, finalPrice, description, category, subcategory, brand } = req.body
    const price = parseFloat(regprice)
    const finalpriceParsed = parseFloat(finalPrice)
    if (!productName || !material || !status || !description || !category || !subcategory || !brand || isNaN(price) || isNaN(finalpriceParsed)) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Invalid input fields' })
    }
    const normalizedName = productName.trim().replace(/\s+/g, " ");
    const existing = await Products.findOne({
      name: { $regex: `^${normalizedName}$`, $options: "i" }
    });

    if (existing) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Product already esist' })
    }

    

    const newProdut = new Products({
      name: productName,
      material,
      status,
      price,
      finalPrice,
      description,
      category,
      subcategory,
      brand

    })

    await newProdut.save()

    res.status(httpStatus.OK).json({ success: true, message: 'Product added successfully' })
  } catch (error) {
    next(error)
  }
}

const blockProduct = async (req, res) => {
  console.log('Block request body:', req.body);

  try {
    const productId = req.body.id

    const updated = await Products.findByIdAndUpdate(productId, { $set: { isBlocked: true } }, { new: true })
    if (!updated) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Cannot block Product' })
    }
    res.status(httpStatus.OK).json({ success: true, message: 'Product blocked succesfully' })

  } catch (error) {
    console.log('Error while blocking product:', error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server eror' })
  }
}

const unblockProduct = async (req, res) => {
  console.log('controllerhit')
  try {
    const productId = req.body.id
    const updated = await Products.findByIdAndUpdate(productId, { $set: { isBlocked: false } }, { new: true })
    if (!updated) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Unable to unblock product' })
    }
    res.status(httpStatus.OK).json({ success: true, message: 'Product blocked successfully' })
  } catch (error) {
    conasole.log('Error while unblocking product:', error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server error' })
  }
}

const deleteProduct = async (req, res) => {
  try {
    const productId = req.body.id
    const updated = await Products.deleteOne({ _id: productId })
    if (!updated) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Unable to delete product' })
    }
    res.status(httpStatus.OK).json({ success: true, message: 'Product deleted successfully' })
  } catch (error) {
    conasole.log('Error while deleting product:', error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server error' })
  }
}

const addProductOffer = async (req, res) => {
  try {
    const { productId, offer, startDate, endDate } = req.body
    if (isNaN(offer) || offer < 0 || offer > 100) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Invalid Offer' })
    }
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Start date must be less than end date' })
    }

    const updated = await Products.findByIdAndUpdate(productId, { $set: { offer: offer, startDate: startDate, offerValidUntil: endDate } }, { new: true })
    if (!updated) {
      return res.status(httpStatus.NOT_FOUND).json({ success: false, message: 'Unable to add offer' })
    }
    res.status(httpStatus.OK).json({ success: true, message: 'Offer aded successfully' })
  } catch (error) {
    console.log('Error whuile adding product offer:', error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server Error' })
  }
}

const removeProductOffer = async (req, res) => {
  try {
    const productId = req.body.id
    const removed = await Products.findByIdAndUpdate(productId, { $set: { offer: "", startDate: null, offerValidUntil: null } }, { new: true })
    if (!removed) {
      return res.status(httpStatus.NOT_FOUND).json({ success: false, message: 'Cannnot remove offer' })
    }
    res.status(httpStatus.OK).json({ success: true, message: 'Offer removed successfully' })
  } catch (error) {
    console.log('Error while removing product offer:', error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server Error' })
  }
}

module.exports = {
  getProducts,
  getaddProduct,
  addProduct,
  blockProduct,
  unblockProduct,
  deleteProduct,
  addProductOffer,
  removeProductOffer
}