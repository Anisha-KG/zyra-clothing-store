// controllers/shopController.js
const Product = require("../../models/productSchema");
const Variant = require("../../models/variantSchema");
const Category = require("../../models/categprySchema");
const Subcategory = require("../../models/subcategorySchema");
const Brand = require("../../models/brandsSchema");
const mongoose=require('mongoose')
const User=require('../../models/userScema')


    
const shopPage = async (req, res) => {
  try {

     const userId = req.session.user;
    let user = null;

    if (userId) {
      user = await User.findById(userId).lean();
    }
    const [category, subcategory, allVariants, brand] = await Promise.all([
      Category.find({ isListed: true }).lean(),
      Subcategory.find({ isListed: true }).lean(),
      Variant.find({ isListed: true }).lean(),
      Brand.find({ isListed: true }).lean()
    ]);

    const availableSizes = [...new Set(allVariants.map(v => v.size))];
    const availableColors = [...new Set(allVariants.map(v => v.color))];

    const parseMulti = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
      return String(value).split(',').map(s => s.trim()).filter(Boolean);
    };

    const {
      categoryId = '',
      subcategoryId = '',
      brandId = '',
      sortBy = '',
      size = '',
      color = '',
      price = '',
      search = ''
    } = req.query;

    const sizeArr = parseMulti(size);
    const colorArr = parseMulti(color);

    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;


    let variantQuery = { isListed: true, quantity: { $gt: 0 } };
    if (sizeArr.length) variantQuery.size = { $in: sizeArr };
    if (colorArr.length) variantQuery.color = { $in: colorArr };

    const filteredVariants = await Variant.find(variantQuery).lean();
    const productIdsFromVariants = filteredVariants.map(v => v.product);


    let productQuery = { isBlocked: false };
    if (categoryId) productQuery.category = categoryId;
    if (subcategoryId) productQuery.subcategory = subcategoryId;
    if (brandId) productQuery.brand = brandId;
    if (search) {
      productQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }


    if (price === 'price1') productQuery.finalPrice = { $gte: 0, $lt: 500 };
    else if (price === 'price2') productQuery.finalPrice = { $gte: 500, $lt: 1000 };
    else if (price === 'price3') productQuery.finalPrice = { $gte: 1000, $lt: 2000 };
    else if (price === 'price4') productQuery.finalPrice = { $gte: 2000 };


    if ((sizeArr.length || colorArr.length) && productIdsFromVariants.length > 0) {
      productQuery._id = { $in: productIdsFromVariants };
    } else if ((sizeArr.length || colorArr.length) && productIdsFromVariants.length === 0) {
      productQuery._id = { $in: ['000000000000000000000000'] }; 
    }

    let sortQuery = {};
    if (sortBy === 'lowhigh') sortQuery.finalPrice = 1;
    else if (sortBy === 'highlow') sortQuery.finalPrice = -1;
    else if (sortBy === 'az') sortQuery.name = 1;
    else if (sortBy === 'za') sortQuery.name = -1;
    else if (sortBy === 'newest') sortQuery.createdAt = -1;


    const totalProducts = await Product.countDocuments(productQuery);
    const totalPages = Math.ceil(totalProducts / limit);


    const products = await Product.find(productQuery)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .lean();

    const productIds = products.map(p => p._id.toString());


    const variants = filteredVariants.filter(v => productIds.includes(v.product.toString()));

    res.render('shopPage', {
      user,
      totalPages,
      products,
      variants,
      availableSizes,
      availableColors,
      category,
      subcategory,
      brand,
      currentPage: page,
      selectedSort: sortBy,
      selectedSizes: sizeArr,
      selectedColors: colorArr,
      selectedPrice: price,
      selectedCategoryId: categoryId,
      selectedSubcategoryId: subcategoryId,
      selectedBrandId: brandId
    });

  } catch (error) {
    console.error("Shop Page Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



module.exports = { shopPage };

