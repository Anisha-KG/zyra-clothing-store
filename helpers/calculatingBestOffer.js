const Product = require('../models/productSchema');
const Category = require('../models/categprySchema');
const Subcategory = require('../models/subcategorySchema');
const Brand = require('../models/brandsSchema');

async function calculateBestOffer(product) {

    const now = Date.now();
    let offers = [];

    // PRODUCT OFFER
    if (
        product.offer &&
        product.startDate &&
        product.offerValidUntil &&
        new Date(product.startDate).getTime() <= now &&
        new Date(product.offerValidUntil).getTime() >= now
    ) {
        console.log("Product offer added:", product.offer);
        offers.push(Number(product.offer));
    }

    // CATEGORY OFFER
    const category = await Category.findById(product.category);

    if (
        category &&
        category.categoryOffer &&
        category.startDate &&
        category.endDate &&
        new Date(category.startDate).getTime() <= now &&
        new Date(category.endDate).getTime() >= now
    ) {
        console.log("Category offer added:", category.categoryOffer);
        offers.push(Number(category.categoryOffer));
    }

    // SUBCATEGORY OFFER
    const subcategory = await Subcategory.findById(product.subcategory);

    if (
        subcategory &&
        subcategory.offer &&
        subcategory.startDate &&
        subcategory.endDate &&
        new Date(subcategory.startDate).getTime() <= now &&
        new Date(subcategory.endDate).getTime() >= now
    ) {
        console.log("Subcategory offer added:", subcategory.offer);
        offers.push(Number(subcategory.offer));
    }

    // BRAND OFFER
    const brand = await Brand.findById(product.brand);

    if (
        brand &&
        brand.brandOffer &&
        brand.startDate &&
        brand.endDate &&
        new Date(brand.startDate).getTime() <= now &&
        new Date(brand.endDate).getTime() >= now
    ) {
        console.log("Brand offer added:", brand.brandOffer);
        offers.push(Number(brand.brandOffer));
    }

    console.log("Offers array:", offers);

    if (offers.length === 0) {
        return 0;
    }

    return Math.max(...offers);
}

module.exports = calculateBestOffer;