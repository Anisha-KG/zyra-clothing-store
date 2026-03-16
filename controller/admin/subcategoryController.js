const Subcategories = require('../../models/subcategorySchema')
const Category = require('../../models/categprySchema')
const Offer=require('../../models/offerSchema')
const updateBestPrice=require('../../helpers/updateBestPrice')
const Product=require('../../models/productSchema')
const {cloudinary}=require('../../config/cloudinary')

const loadSubcategories = async (req, res) => {
  try {
    const categoryId = req.params.id
    const search = req.query.search ? req.query.search : ""
    const page = req.query.page ? Number(req.query.page) : 1
    const limit = 4

    const [category, subcategories, count,offers] = await Promise.all([
      Category.findById(categoryId),
      Subcategories.find({
        categoryId: categoryId,
        name: { $regex: ".*" + search + ".*", $options: 'i' }
        , isDeleted: false
      })
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Subcategories.find({
        categoryId: categoryId,
        name: { $regex: ".*" + search + ".*", $options: 'i' }
        , isDeleted: false
      }).countDocuments(),
      Offer.find({isDeleted:false})
    ])

    if (!category) {
      return res.status(400).json({ error: "Category not found" })
    }

    res.render('subcategories', {
      category,
      subcategories,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      search,
      offers

    })

  } catch (error) {
    console.log('Error while loading subcategories', error)
    res.redirect('/admin/pageerror')
  }
}

const addSubcategory = async (req, res) => {

  try {
    const { subcategoryName, description, categoryId } = req.body
    
    if (!subcategoryName || !description) {
      return res.json({ success: false, message: "Please fill all fields" })
    }
    if (!req.file) {
          return res.status(400).json({
            success: false,
            message: "Image is required"
          });
        }
    
    const normalizedName = subcategoryName.trim().replace(/\s+/g, " ")
    const existing = await Subcategories.findOne({
      name: new RegExp(`^${normalizedName}$`, "i")
    });
    if (existing) {
      return res.json({ success: false, message: "Subcategory already exist" })
    }

    const subcatData = new Subcategories({
      name: subcategoryName,
      image: {
        url:req.file.path,
        public_id:req.file.filename
      },
      description: description,
      categoryId: categoryId
    })

    await subcatData.save()
    res.json({ success: true, message: 'Subcategory added successfully' })
  } catch (error) {
    console.log("Error whuile adding subcategory", error)
    res.json({ success: false, message: "Server error , Cannot add subcategory" })
  }
}
const addSubcategory = async (req, res) => {
  try {

    const { subcategoryName, description } = req.body;

    if (!subcategoryName || !subcategoryName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subcategory name cannot be empty"
      });
    }

    // normalize input
    const normalizedInput = subcategoryName
      .toLowerCase()
      .replace(/\s+/g, "")
      .trim();

    // duplicate check
    const duplicate = await Subcategories.findOne({
      $expr: {
        $eq: [
          {
            $replaceAll: {
              input: { $toLower: "$name" },
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
        message: "Subcategory already exists"
      });
    }

    const newSubcategory = new Subcategories({
      name: subcategoryName.trim(),
      description
    });

    if (req.file) {
      newSubcategory.image = {
        url: req.file.path,
        public_id: req.file.filename
      };
    }

    await newSubcategory.save();

    res.status(201).json({
      success: true,
      message: "Subcategory added successfully"
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
};

const removeOffer = async (req, res) => {
  try {
    const { id } = req.body
    const subcategory = await Subcategories.findById(id)
    if (!subcategory) {
      return res.json({ success: false, message: "Subcategory not found" })
    }
    const updated = await Subcategories.findByIdAndUpdate(id, { $set: { offer: null, startDate: null, endDate: null } }, { new: true })
    if (!updated) {
      return res.json({ success: false, message: "Cannot remove offer" })
    }
     const product=await Product.find({subcategory:id})
    
      await updateBestPrice(product)

    res.json({ success: true, message: 'Offer removed successfully' })

  } catch (error) {
    console.log(error)
    return res.json({ success: false, message: 'Server error' })
  }
}

const unlistSubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.body
    const subcategory = await Subcategories.findById(subcategoryId)
    if (!subcategory) {
      return res.json({ sucess: false, message: 'Subcategory not found' })
    }
    const updated = await Subcategories.findByIdAndUpdate(subcategoryId, { $set: { isListed: false } }, { new: true })
    if (!updated) {
      return res.json({ sucess: false, message: 'Cannot unlist subcategory' })
    }

    const product=await Product.find({subcategory:subcategoryId})
    
      await updateBestPrice(product)
    
    res.json({ success: true, message: 'Suvcategory unlisted successfully' })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Server error" })
  }
}

const listSubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.body
    const subcategory = await Subcategories.findById(subcategoryId)
    if (!subcategory) {
      return res.json({ sucess: false, message: 'Subcategory not found' })
    }
    const updated = await Subcategories.findByIdAndUpdate(subcategoryId, { $set: { isListed: true } }, { new: true })
    if (!updated) {
      return res.json({ sucess: false, message: 'Cannot list subcategory' })
    }

    const product=await Product.find({subcategory:subcategoryId})
    
      await updateBestPrice(product)
    res.json({ success: true, message: 'Suvcategory listed successfully' })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: "Server error" })
  }
}

const deteleSubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.body;

    
    const existing = await Subcategories.findById(subcategoryId);
    if (!existing) {
      return res.json({
        success: false,
        message: "Unable to delete subcategory"
      });
    }

   
    const products = await Product.find({ subcategory: subcategoryId });

  
    await Product.updateMany(
      { subcategory: subcategoryId },
      { $unset: { subcategory: "" } }
    );


    await Subcategories.findByIdAndDelete(subcategoryId);

   
    await updateBestPrice(products);

    res.json({
      success: true,
      message: "Subcategory deleted successfully"
    });

  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Server error"
    });
  }
};
const editSubcategory = async (req, res) => {

  try {

    const { subcategoryId, subcategoryName, description } = req.body;

    if (!subcategoryName || !subcategoryName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subcategory name cannot be empty"
      });
    }

    const existingSubcategory = await Subcategories.findById(subcategoryId);

    if (!existingSubcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found"
      });
    }

    // normalize input
    const normalizedInput = subcategoryName
      .toLowerCase()
      .replace(/\s+/g, "")
      .trim();

    // duplicate check excluding current subcategory
    const duplicate = await Subcategories.findOne({
      _id: { $ne: subcategoryId },
      $expr: {
        $eq: [
          {
            $replaceAll: {
              input: { $toLower: "$name" },
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
        message: "Subcategory already exists"
      });
    }

    const updateData = {
      name: subcategoryName.trim(),
      description
    };

    if (req.file) {

      if (existingSubcategory.image?.public_id) {
        await cloudinary.uploader.destroy(
          existingSubcategory.image.public_id
        );
      }

      updateData.image = {
        url: req.file.path,
        public_id: req.file.filename
      };
    }

    const updatedData = await Subcategories.findByIdAndUpdate(
      subcategoryId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Subcategory edited successfully",
      data: updatedData
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
};

module.exports={
  loadSubcategories,
  addSubcategory,
  addSubcategoryOffer,
  removeOffer,
  unlistSubcategory,
  listSubcategory,
  deteleSubcategory,
  editSubcategory
}