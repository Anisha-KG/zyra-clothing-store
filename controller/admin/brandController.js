const brands = require('../../models/brandsSchema')
const messages=require('../../Constants/messages')
const httpStatus=require('../../Constants/httpStatuscode')

const getBrands = async (req, res) => {
  try {
    const search = req.query.search ? req.query.search : ""
    const page = req.query.page ? req.query.page : 1
    const limit = 4
    const query = { $or: [{ brandName: { $regex: ".*" + search + ".*", $options: "i" } }] }
    const [brandData, totalcount] = await Promise.all([
      brands.find(query)
        .sort({ createdAt: 1 })
        .skip(limit * (page - 1))
        .limit(limit),
      brands.find(query).countDocuments()
    ])
    res.render('brands', {
      data: brandData,
      currentPage: page,
      totalPages: Math.ceil(totalcount / limit),
      search
    })

  } catch (error) {
    console.log("Error while listing brands:", error)
    res.redirect('/pageerror')
  }
}

const addBrand = async (req, res) => {
  try {
    const { brandName } = req.body
    const brandLogo = req.file ? req.file.filename : null

    if (!brandName) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message:messages.BRAND_MESSAGES.ENTER_BRAND_NAME })
    }
    if (!brandLogo) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message:messages.BRAND_MESSAGES.UPLOAD_BRAND_LOGO})
    }
    const normalizedName = brandName.trim().replace(/\s+/g, " ")
    const existing = await brands.findOne({
      name: new RegExp(`^${normalizedName}$`, "i")
    });
    if (existing) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message:messages.BRAND_MESSAGES.BRAND_ALREADY_EXISTS})
    }
    const newbrand = new brands({
      brandName: brandName,
      brandLogo: brandLogo,

    })
    await newbrand.save()
    res.status(httpStatus.OK).json({ success: true, message:messages.BRAND_MESSAGES.BRAND_ADDED})
  } catch (error) {
    console.log("error while adding brand:", error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message:messages.MESSAGE.SERVER_ERROR})
  }
}

const addBrandOffer = async (req, res) => {
  console.log('controller hit')
  try {
    const { brandId, offer, startDate, endDate } = req.body
    if (!offer || !startDate || !endDate) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message:messages.MESSAGE.ALL_FIELDS_REQUIRED})
    }

    const brandData = await brands.findById(brandId)
    if (!brandData) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message:messages.BRAND_MESSAGES.BRAND_NOT_FOUND})
    }
    if (isNaN(offer) || offer < 0 || offer > 100) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: messages.MESSAGE.INVALID_PERCENTAGE})
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message:messages.MESSAGE.STARTDATE_ENDDATE_ERROR})
    }
    await brands.findByIdAndUpdate({ _id: brandId }, { $set: { brandOffer: offer, startDate: startDate, endDate: endDate } })
    res.status(httpStatus.OK).json({ success: true, message: messages.MESSAGE.OFFER_ADDED})
  } catch (error) {
    console.log(error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message:messages.MESSAGE.SERVER_ERROR})
  }
}

const editBrand = async (req, res) => {
  try {
    const { brandName, brandId } = req.body
    const updateData = { brandName };

    if (req.file) {
      updateData.brandLogo = req.file.filename;
    }

    const update = await brands.findByIdAndUpdate(brandId, { $set: updateData }, { new: true })
    if (!update) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message:messages.BRAND_MESSAGES.UNABLE_TO_EDIT_BRAND})
    }

    res.status(httpStatus.OK).json({ success: true, message:messages.BRAND_MESSAGES.BRAND_EDITED})
  } catch (error) {
    console.log(error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message:messages.MESSAGE.SERVER_ERROR})
  }
}

const unlistBrand = async (req, res) => {
  try {
    const { brandId } = req.body

    const updated = await brands.findByIdAndUpdate(brandId, { $set: { isListed: false } }, { new: true })
    if (!updated) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message:messages.BRAND_MESSAGES.UNABLE_TO_UNLIST_BRAND})
    }
    res.status(httpStatus.OK).json({ success: true, message:messages.BRAND_MESSAGES.BRAND_UNLISTED})
  } catch (error) {
    console.log(error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message:messages.MESSAGE.SERVER_ERROR})
  }
}

const listBrand = async (req, res) => {
  try {
    const { brandId } = req.body

    const updated = await brands.findByIdAndUpdate(brandId, { $set: { isListed: true } }, { new: true })
    if (!updated) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message:messages.BRAND_MESSAGES.UNABLE_TO_LIST_BRAND})
    }
    res.status(httpStatus.OK).json({ success: true, message:messages.BRAND_MESSAGES.BRAND_LISTED})
  } catch (error) {
    console.log(error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message:messages.MESSAGE.SERVER_ERROR})
  }
}

const removeOffer = async (req, res) => {
  try {
    const { brandId } = req.body
    if (!brandId) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message:messages.BRAND_MESSAGES.BRAND_ID_MISSING})
    }
    const updated = await brands.findByIdAndUpdate(brandId, { $set: { brandOffer: null } }, { new: true })
    if (!updated) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message:messages.MESSAGE.OFFER_NOTREMOVED})
    }
    res.status(httpStatus.OK).json({ success: true, message: messages.MESSAGE.OFFER_REMOVED})
  } catch (error) {
    console.log(error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message:messages.MESSAGE.SERVER_ERROR})
  }
}

const deleteBrand = async (req, res) => {

  try {
    const { brandId } = req.body

    const updated = await brands.deleteOne({ _id: brandId })
    if (!updated) {
      return res.status(httpStatus.BAD_REQUEST).json({ succes: false, message:messages.BRAND_MESSAGES.UNABLE_TO_DELETE_BRAND})
    }
    res.status(httpStatus.OK).json({ success: true, message:messages.BRAND_MESSAGES.BRAND_DELETED})

  } catch (error) {
    console.log(error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message:messages.MESSAGE.SERVER_ERROR})
  }
}
module.exports = {
  getBrands,
  addBrand,
  addBrandOffer,
  editBrand,
  unlistBrand,
  listBrand,
  removeOffer,
  deleteBrand
}