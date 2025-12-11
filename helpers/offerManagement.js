const Product=require('../models/productSchema')
const Category=require('../models/categprySchema')
const Subcategory=require('../models/subcategorySchema')
const Brand=require('../models/brandsSchema')

async function ManageOffer(){
    const [product,category,subcategory,brand]=await Promise.all([
        Product.find()
    ])
}