const Product = require('../models/productSchema');
const Category = require('../models/categprySchema');
const Subcategory = require('../models/subcategorySchema');
const Brand = require('../models/brandsSchema');

async function calculateBestOffer(product) {

    const now = Date.now(); 
    let offers = [];


    if (
        product.offer &&
        new Date(product.startDate).getTime() <= now &&
        new Date(product.offerValidUntil).getTime() >= now
    ) {
        offers.push(Number(product.offer));
    }


    const category = await Category.findById(product.category);

    if (
        category &&
        category.categoryOffer &&
        new Date(category.startDate).getTime() <= now &&
        new Date(category.endDate).getTime() >= now
    ) {
        offers.push(Number(category.categoryOffer));
    }


    const subcategory = await Subcategory.findById(product.subcategory);

    if (
        subcategory &&
        subcategory.offer &&
        new Date(subcategory.startDate).getTime() <= now &&
        new Date(subcategory.endDate).getTime() >= now
    ) {
        offers.push(Number(subcategory.offer));
    }


    const brand = await Brand.findById(product.brand);

    if (
        brand &&
        brand.brandOffer &&
        new Date(brand.startDate).getTime() <= now &&
        new Date(brand.endDate).getTime() >= now
    ) {
        offers.push(Number(brand.brandOffer));
    }


    if (offers.length === 0) {
        return 0;
    }

   
    return Math.max(...offers);
}

module.exports = calculateBestOffer;