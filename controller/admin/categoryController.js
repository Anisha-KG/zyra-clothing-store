const category = require('../../models/categprySchema')
const message = require('../../Constants/messages')
const httpStatus = require('../../Constants/httpStatuscode')
const Offer=require('../../models/offerSchema')

const categoryInfo = async (req, res) => {
  try {
    let search = ""
    if (req.query.search) {
      search = req.query.search
    }

    let page = 1
    if (req.query.page) {
      page = parseInt(req.query.page, 10)
    }
    let limit = 3
    let query = { name: { $regex: ".*" + search + ".*", $options: "i" } }

    const [categoryData, totalCount,offers] = await Promise.all([
      category.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
      ,
      category.countDocuments(query),
      Offer.find({isDeleted:false})
    ])

    res.render('category', {
      data: categoryData,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      search,
      offers
    })
  } catch (error) {
    console.log('Error loading category details:', error)
    res.redirect('/pageerror')
  }
}

const addCategory = async (req, res) => {

  try {
    const { categoryName, description } = req.body
    const categoryImage = req.file ? req.file.filename : null
    if (!categoryImage) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: message.CATEGORY_MESSAGE.UPLOAD_IMAGE_REQUIRED })
    }
    if (!categoryName || !description) {
      return res.status(httpStatus.BAD_REQUEST).json({ sucess: false, message: message.MESSAGE.ALL_FIELDS_REQUIRED })
    }

    const normalizedName = categoryName.trim().replace(/\s+/g, " ")
    const existing = await category.findOne({
      name: new RegExp(`^${normalizedName}$`, "i")
    });
    if (existing) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: message.CATEGORY_MESSAGE.CATEGORY_EXISTS })
    }

    const catData = new category({
      name: categoryName,
      description: description,
      categoryImage: categoryImage
    })

    await catData.save()
    return res.status(httpStatus.OK).json({ success: true, message: message.CATEGORY_MESSAGE.CATEGORY_ADDED });//res.redirect wont work in fetch
  } catch (error) {
    console.log("Add category error:", error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: message.MESSAGE.SERVER_ERROR })
  }
}

const addCategoryOffer = async (req, res,next) => {
  
  try {
    const { categoryId, offerId } = req.body

  const offer = await Offer.findById(offerId)
  if (!offer) {
    return res.json({ success:false, message:"Offer not found" })
  }

  await category.findByIdAndUpdate(categoryId, {
    categoryOffer: offer.discount,
    startDate: offer.startDate,
    endDate: offer.endDate,
    offerId: offer._id
  })

  res.json({ success:true, message:"Offer applied successfully" })

  } catch (error) {
   next(error)
  }
}

const removeCategoryOffer = async (req, res) => {

  try {
    const { categoryId } = req.body
    const categoryData = await category.findById(categoryId)
    if (!categoryData) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: message.CATEGORY_MESSAGE.CATEGORY_NOT_FOUND })
    }
    await category.updateOne({ _id: categoryId },
      { $set: { categoryOffer: 0, startDate: null, endDate: null } }
    )

    res.status(httpStatus.OK).json({ success: true, message: message.MESSAGE.OFFER_REMOVED })
  } catch (error) {
    console.log("Error while deleting offer", error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: message.MESSAGE.SERVER_ERROR })
  }
}

const unlistCategory = async (req, res) => {
  try {
    const { categoryId } = req.body
    await category.findByIdAndUpdate(categoryId, { isListed: false })
    res.status(httpStatus.OK).json({ success: true, message: message.CATEGORY_MESSAGE.CATEGORY_UNLISTED })
  } catch (error) {
    console.log('Error while unlisting the category:', error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: message.MESSAGE.SERVER_ERROR })
  }
}

const listCategory = async (req, res) => {
  try {
    const { categoryId } = req.body
    await category.findByIdAndUpdate(categoryId, { isListed: true })
    res.status(httpStatus.OK).json({ success: true, message: message.CATEGORY_MESSAGE.CATEGORY_LISTED })
  } catch (error) {
    console.log('Error while listing the category:', error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: message.MESSAGE.SERVER_ERROR })
  }
}

const editCategory = async (req, res) => {
  try {

    const { categoryName, description } = req.body
    const categoryId = req.params.id
    const updated = {
      name: categoryName,
      description: description
    }
    if (req.file) {
      updated.categoryImage = req.file.filename
    }

    const update = await category.findByIdAndUpdate(categoryId, updated, { new: true })
    if (!update) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: message.CATEGORY_MESSAGE.CATEGORY_EDIT_FAILED })
    }

    res.status(httpStatus.OK).json({ success: true, message: message.CATEGORY_MESSAGE.CATEGORY_EDITED })
  } catch (error) {
    console.log("Error while editing the category:", error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: message.MESSAGE.SERVER_ERROR })
  }
}

const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.body
    const deleted = await category.findByIdAndDelete(categoryId)
    if (!deleted) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: message.CATEGORY_MESSAGE.CATEGORY_DELETE_FAILED })
    }
    res.status(httpStatus.OK).json({ success: true, message: message.CATEGORY_MESSAGE.CATEGORY_DELETED })
  } catch (error) {
    console.log('Error while deleting the category')
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: message.MESSAGE.SERVER_ERROR })
  }
}

module.exports = {
  categoryInfo,
  addCategory,
  addCategoryOffer,
  removeCategoryOffer,
  unlistCategory,
  listCategory,
  editCategory,
  deleteCategory
}