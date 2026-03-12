const Product = require('../models/productSchema');
const Category = require('../models/categprySchema');
const Subcategory = require('../models/subcategorySchema');
const Brand = require('../models/brandsSchema');

async function calculateBestOffer(product) {

    let offers = [];

 
    if (
        product.offer &&
        product.startDate <= new Date() &&
        product.offerValidUntil >= new Date()
    ) {
        offers.push(product.offer);
    }

   
    const category = await Category.findById(product.category);

    console.log("CATEGORY:", category);

if (category) {
    console.log("Offer:", category.categoryOffer);
    console.log("Start:", category.startDate);
    console.log("End:", category.endDate);
}

    if (
        category &&
        category.categoryOffer &&
        category.startDate <= new Date() &&
        category.endDate >= new Date()
    ) {
         console.log("Category offer added");
        offers.push(category.categoryOffer);
    }

   
    const subcategory = await Subcategory.findById(product.subcategory);

    if (
        subcategory &&
        subcategory.offer &&
        subcategory.startDate <= new Date() &&
        subcategory.endDate >= new Date()
    ) {
        offers.push(subcategory.offer);
    }

    
    const brand = await Brand.findById(product.brand);

    if (
        brand &&
        brand.brandOffer &&
        brand.startDate <= new Date() &&
        brand.endDate >= new Date()
    ) {
        offers.push(brand.brandOffer);
    }

    
    if (offers.length === 0) return 0;

    console.log("All Offers:", offers);
    console.log("Best Offer:", Math.max(...offers));
    
    return Math.max(...offers);
}

module.exports = 
    calculateBestOffer
