const brands = require('../../models/brandsSchema')
const messages=require('../../Constants/messages')
const httpStatus=require('../../Constants/httpStatuscode')
const Offer=require('../../models/offerSchema')
const Product=require('../../models/productSchema')
const updateBestPrice=require('../../helpers/updateBestPrice')
const {cloudinary}=require('../../config/cloudinary')

const getBrands = async (req, res) => {
  try {
    const search = req.query.search ? req.query.search : ""
    const page = req.query.page ? req.query.page : 1
    const limit = 4
    const query = { $or: [{ brandName: { $regex: ".*" + search + ".*", $options: "i" } }] }
    const [brandData, totalcount,offers] = await Promise.all([
      brands.find(query)
        .sort({ createdAt: 1 })
        .skip(limit * (page - 1))
        .limit(limit),
      brands.find(query).countDocuments(),
      Offer.find({isDeleted:false})
    ])

    
    res.render('brands', {
      data: brandData,
      currentPage: page,
      totalPages: Math.ceil(totalcount / limit),
      search,
      offers
    })

  } catch (error) {
    console.log("Error while listing brands:", error)
    res.redirect('/pageerror')
  }
}

const addBrand = async (req, res) => {
  try {
    const { brandName } = req.body
    

    if (!brandName) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message:messages.BRAND_MESSAGES.ENTER_BRAND_NAME })
    }
    if (!req.file) {
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
      brandLogo: {
        url:req.file.path,
        public_id:req.file.filename
      },

    })
    await newbrand.save()
    res.status(httpStatus.OK).json({ success: true, message:messages.BRAND_MESSAGES.BRAND_ADDED})
  } catch (error) {
    console.log("error while adding brand:", error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message:messages.MESSAGE.SERVER_ERROR})
  }
}
const addBrand = async (req, res) => {
  try {

    const { brandName } = req.body;

    if (!brandName || !brandName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Brand name cannot be empty"
      });
    }

    // normalize input
    const normalizedInput = brandName
      .toLowerCase()
      .replace(/\s+/g, "")
      .trim();

    // duplicate check
    const duplicate = await brands.findOne({
      $expr: {
        $eq: [
          {
            $replaceAll: {
              input: { $toLower: "$brandName" },
              find: " ",
              replacement: ""
            }
          },
          normalizedInput
        ]
      }
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Brand already exists"
      });
    }

    const newBrand = new brands({
      brandName: brandName.trim()
    });

    if (req.file) {
      newBrand.brandLogo = {
        url: req.file.path,
        public_id: req.file.filename
      };
    }

    await newBrand.save();

    res.status(201).json({
      success: true,
      message: "Brand added successfully"
    });

  } catch (error) {

    console.log(error);

    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: messages.MESSAGE.SERVER_ERROR
    });

  }
};
const editBrand = async (req, res) => {

  try {

    const { brandName, brandId } = req.body;

    if (!brandName || !brandName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Brand name cannot be empty"
      });
    }

    const existingBrand = await brands.findById(brandId);

    if (!existingBrand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found"
      });
    }

    // normalize input
    const normalizedInput = brandName
      .toLowerCase()
      .replace(/\s+/g, "")
      .trim();

    // duplicate check excluding current brand
    const duplicate = await brands.findOne({
      _id: { $ne: brandId },
      $expr: {
        $eq: [
          {
            $replaceAll: {
              input: { $toLower: "$brandName" },
              find: " ",
              replacement: ""
            }
          },
          normalizedInput
        ]
      }
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Brand already exists"
      });
    }

    const updateData = {
      brandName: brandName.trim()
    };

    if (req.file) {

      if (existingBrand.brandLogo?.public_id) {
        await cloudinary.uploader.destroy(
          existingBrand.brandLogo.public_id
        );
      }

      updateData.brandLogo = {
        url: req.file.path,
        public_id: req.file.filename
      };
    }

    const update = await brands.findByIdAndUpdate(
      brandId,
      { $set: updateData },
      { new: true }
    );

    if (!update) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: messages.BRAND_MESSAGES.UNABLE_TO_EDIT_BRAND
      });
    }

    res.status(httpStatus.OK).json({
      success: true,
      message: messages.BRAND_MESSAGES.BRAND_EDITED
    });

  } catch (error) {

    console.log(error);

    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: messages.MESSAGE.SERVER_ERROR
    });

  }
};
const unlistBrand = async (req, res) => {
  try {
    const { brandId } = req.body

    const updated = await brands.findByIdAndUpdate(brandId, { $set: { isListed: false } }, { new: true })
    if (!updated) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message:messages.BRAND_MESSAGES.UNABLE_TO_UNLIST_BRAND})
    }
    const product=await Product.find({brand:brandId})
  
    await updateBestPrice(product)

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
    const product=await Product.find({brand:brandId})
  
    await updateBestPrice(product)

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
    const product=await Product.find({brand:brandId})
  
    await updateBestPrice(product)

    res.status(httpStatus.OK).json({ success: true, message: messages.MESSAGE.OFFER_REMOVED})
  } catch (error) {
    console.log(error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message:messages.MESSAGE.SERVER_ERROR})
  }
}
const deleteBrand = async (req, res) => {
  try {
    const { brandId } = req.body;

    
    const existingBrand = await brands.findById(brandId);
    if (!existingBrand) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: messages.BRAND_MESSAGES.UNABLE_TO_DELETE_BRAND
      });
    }

  
    const products = await Product.find({ brand: brandId });

    
    await Product.updateMany(
      { brand: brandId },
      { $unset: { brand: "" } }
    );

    
    await brands.findByIdAndDelete(brandId);

   
    await updateBestPrice(products);

    res.status(httpStatus.OK).json({
      success: true,
      message: messages.BRAND_MESSAGES.BRAND_DELETED
    });

  } catch (error) {
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: messages.MESSAGE.SERVER_ERROR
    });
  }
};
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