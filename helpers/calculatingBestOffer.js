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

    if (
        category &&
        category.categoryOffer &&
        category.offerStartDate <= new Date() &&
        category.offerEndDate >= new Date()
    ) {
        offers.push(category.categoryOffer);
    }

   
    const subcategory = await Subcategory.findById(product.subcategory);

    if (
        subcategory &&
        subcategory.subcategoryOffer &&
        subcategory.offerStartDate <= new Date() &&
        subcategory.offerEndDate >= new Date()
    ) {
        offers.push(subcategory.subcategoryOffer);
    }

    
    const brand = await Brand.findById(product.brand);

    if (
        brand &&
        brand.brandOffer &&
        brand.offerStartDate <= new Date() &&
        brand.offerEndDate >= new Date()
    ) {
        offers.push(brand.brandOffer);
    }

    
    if (offers.length === 0) return 0;

    
    
    return Math.max(...offers);
}

module.exports = {
    calculateBestOffer
};
