const Products = require('../../models/productSchema')
const Brands = require('../../models/brandsSchema')
const Subcategory = require('../../models/subcategorySchema')
const Category = require('../../models/categprySchema')
const httpStatus = require('../../Constants/httpStatuscode')
const mesages = require('../../Constants/messages')

const geteditProduct = async (req, res) => {
    try {
        const productId = req.params.productId
        const product = await Products.findById(productId)
        if (!product) {
            res.status(httpStatus.BAD_REQUEST).json({ error: 'Product not found' })
        }
        const [category, subcategory, brand] = await Promise.all([
            Category.find({ isListed: true, isDeleted: false }),
            Subcategory.find({ isListed: true, isDeleted: false }),
            Brands.find({ isListed: true, isDeleted: false })

        ])
        res.render('product-edit', {
            product,
            category,
            subcategory,
            brand
        })
    } catch (error) {
        console.log('Error while rendering product-edit page', error)
        res.redirect('/pageerror')
    }
}

const editProduct = async (req, res) => {

    try {
        const { productId, productName, material, status, regprice, finalPrice, description, category, subcategory, brand } = req.body
        const price = parseFloat(regprice)
        const finalpriceParsed = parseFloat(finalPrice)
        if (!productName || !material || !status || !description || !category || !subcategory || !brand || isNaN(price) || isNaN(finalpriceParsed)) {
            return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Invalid input fields' })
        }
        const products = await Products.findById(productId)
        if (!products) {
            return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'product not found' })
        }

        const update = {
            name: productName,
            material,
            status,
            price,
            finalPrice: finalpriceParsed,
            description,
            category,
            subcategory,
            brand

        }

        const updated = await Products.findByIdAndUpdate(productId, { $set: update }, { new: true })

        if (!updated) {
            return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Unable to edit product' })
        }
        return res.status(httpStatus.OK).json({ success: true, message: 'Product edited successfully' })
    } catch (error) {
        console.log("Error while editing Product:", error)
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server error' })
    }
}

module.exports = {
    geteditProduct,
    editProduct
}