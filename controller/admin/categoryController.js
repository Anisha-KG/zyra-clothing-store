const category = require('../../models/categprySchema')
const message = require('../../Constants/messages')
const httpStatus = require('../../Constants/httpStatuscode')
const Offer=require('../../models/offerSchema')
const Product=require('../../models/productSchema')
const updateBestPrice=require('../../helpers/updateBestPrice')
const {cloudinary}=require('../../config/cloudinary')

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

    const { categoryName, description } = req.body;

    if (!categoryName || !description) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: message.MESSAGE.ALL_FIELDS_REQUIRED
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image is required"
      });
    }

   
    const normalizedInput = categoryName
      .toLowerCase()
      .replace(/\s+/g, "") 
      .trim();

   
    const categories = await category.find({}, { name: 1 });

 
    const existing = categories.find(cat => {
      const normalizedDbName = cat.name
        .toLowerCase()
        .replace(/\s+/g, "")
        .trim();

      return normalizedDbName === normalizedInput;
    });

    if (existing) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: message.CATEGORY_MESSAGE.CATEGORY_EXISTS
      });
    }

    const catData = new category({
      name: categoryName.trim(),
      description: description,
      categoryImage: {
        url: req.file.path,
        public_id: req.file.filename
      }
    });

    await catData.save();

    return res.status(httpStatus.OK).json({
      success: true,
      message: message.CATEGORY_MESSAGE.CATEGORY_ADDED
    });

  } catch (error) {
    console.log("Add category error:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: message.MESSAGE.SERVER_ERROR
    });
  }
};

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

  const product=await Product.find({category:categoryId})

  await updateBestPrice(product)
    

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

    const product=await Product.find({category:categoryId})

  await updateBestPrice(product)

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
    const product=await Product.find({category:categoryId})

  await updateBestPrice(product)
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
    const product=await Product.find({category:categoryId})

  await updateBestPrice(product)
    res.status(httpStatus.OK).json({ success: true, message: message.CATEGORY_MESSAGE.CATEGORY_LISTED })
  } catch (error) {
    console.log('Error while listing the category:', error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: message.MESSAGE.SERVER_ERROR })
  }
}
const editCategory = async (req, res) => {
  try {

    const categoryId = req.params.id;
    const { categoryName, description } = req.body;

    const existingCategory = await category.findById(categoryId);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

   
    const normalizedInput = categoryName
      .toLowerCase()
      .replace(/\s+/g, "")
      .trim();


    const categories = await category.find(
      { _id: { $ne: categoryId } },
      { name: 1 }
    );

  
    const duplicate = categories.find(cat => {
      const normalizedDbName = cat.name
        .toLowerCase()
        .replace(/\s+/g, "")
        .trim();

      return normalizedDbName === normalizedInput;
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Category name already exists"
      });
    }

    const updatedData = {
      name: categoryName.trim(),
      description
    };

    // image update
    if (req.file) {

      if (existingCategory.categoryImage?.public_id) {
        await cloudinary.uploader.destroy(
          existingCategory.categoryImage.public_id
        );
      }

      updatedData.categoryImage = {
        url: req.file.path,
        public_id: req.file.filename
      };
    }

    const updated = await category.findByIdAndUpdate(
      categoryId,
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updated
    });

  } catch (error) {
    console.log("Edit Category Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};


const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.body
    const deleted = await category.findByIdAndDelete(categoryId)
    if (!deleted) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: message.CATEGORY_MESSAGE.CATEGORY_DELETE_FAILED })
    }
    const product=await Product.find({category:categoryId})

  await updateBestPrice(product)
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