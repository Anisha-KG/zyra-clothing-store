const cron = require("node-cron");
const Product = require("../models/productSchema");
const Category = require("../models/categprySchema");
const Subcategory = require("../models/subcategorySchema");
const Brand = require("../models/brandsSchema");
const updateBestPrice = require("../helpers/updateBestPrice");

cron.schedule("0 0 * * *", async () => {
  console.log("Running offer expiry check at 12 AM");

  const now = new Date();

  try {

  
    const expiredProducts = await Product.find({
      offerValidUntil: { $lt: now },
      offer: { $gt: 0 }
    });

    await Product.updateMany(
      {
        offerValidUntil: { $lt: now },
        offer: { $gt: 0 }
      },
      {
        $set: {
          offer: 0,
          offerId: null,
          startDate: null,
          offerValidUntil: null
        }
      }
    );

    await updateBestPrice(expiredProducts);


    // 2️⃣ Handle expired CATEGORY offers
    const expiredCategories = await Category.find({
      endDate: { $lt: now },
      categoryOffer: { $gt: 0 }
    });

    const categoryIds = expiredCategories.map(c => c._id);

    await Category.updateMany(
      { _id: { $in: categoryIds } },
      {
        $set: {
          categoryOffer: 0,
          offerId: null,
          startDate: null,
          endDate: null
        }
      }
    );

    const categoryProducts = await Product.find({
      category: { $in: categoryIds }
    });

    await updateBestPrice(categoryProducts);


   
    const expiredSubcategories = await Subcategory.find({
      endDate: { $lt: now },
      offer: { $gt: 0 }
    });

    const subcategoryIds = expiredSubcategories.map(s => s._id);

    await Subcategory.updateMany(
      { _id: { $in: subcategoryIds } },
      {
        $set: {
          offer: 0,
          offerId: null,
          startDate: null,
          endDate: null
        }
      }
    );

    const subcategoryProducts = await Product.find({
      subcategory: { $in: subcategoryIds }
    });

    await updateBestPrice(subcategoryProducts);


   
    const expiredBrands = await Brand.find({
      endDate: { $lt: now },
      brandOffer: { $gt: 0 }
    });

    const brandIds = expiredBrands.map(b => b._id);

    await Brand.updateMany(
      { _id: { $in: brandIds } },
      {
        $set: {
          brandOffer: 0,
          offerId: null,
          startDate: null,
          endDate: null
        }
      }
    );

    const brandProducts = await Product.find({
      brand: { $in: brandIds }
    });

    await updateBestPrice(brandProducts);


    console.log("Expired offers removed & bestPrice updated successfully");

  } catch (error) {
    console.log("Error in offer expiry cron:", error);
  }
});