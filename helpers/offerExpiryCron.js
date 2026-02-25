const cron = require("node-cron");
const Product = require("../models/product");
const Category = require("../models/category");
const Subcategory = require("../models/subcategory");
const Brand = require("../models/brand");

cron.schedule("0 0 * * *", async () => {
  console.log("Running offer expiry check at 12 AM");

  const now = new Date();

  try {
 
    await Product.updateMany(
      { offerValidUntil: { $lt: now } },
      {
        $set: {
          offer: 0,
          offerId: null
        }
      }
    );


    await Category.updateMany(
      { endDate: { $lt: now } },
      {
        $set: {
          categoryOffer: 0,
          offerId: null
        }
      }
    );

  
    await Subcategory.updateMany(
      { endDate: { $lt: now } },
      {
        $set: {
          offer: 0
        }
      }
    );

    
    await Brand.updateMany(
      { endDate: { $lt: now } },
      {
        $set: {
          brandOffer: 0
        }
      }
    );

    console.log("Expired offers removed successfully");
  } catch (error) {
    console.log("Error in offer expiry cron:", error);
  }

});