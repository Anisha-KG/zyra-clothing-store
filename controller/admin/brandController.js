const brands = require('../../models/brandsSchema')

const getBrands = async (req, res) => {
    try {
        const search = req.query.search ? req.query.search : ""
        const page = req.query.page ? req.query.page : 1
        const limit = 3
        const query = { $or: [{ brandName: { $regex: ".*" + search + ".*", $options: "i" } }] }
        const [brandData, totalcount] = await Promise.all([
            brands.find(query)
                .sort({ createdAt: 1 })
                .skip(limit * (page - 1))
                .limit(limit),
            brands.find(query).countDocuments()
        ])
        res.render('brands', {
            data: brandData,
            currentPage: page,
            totalPages: Math.ceil(totalcount / limit),
            search
        })

    } catch (error) {
        console.log("Error while listing brands:", error)
        res.redirect('/pageerror')
    }
}

const addBrand = async (req, res) => {
    try {
        const { brandName } = req.body
        const brandLogo = req.file ? req.file.filename : null

        if (!brandName) {
            return res.json({ success: false, message: 'Enter brand Name' })
        }
        if (!brandLogo) {
            return res.json({ success: false, message: 'Upload Brand Logo' })
        }
        const normalizedName = brandName.trim().replace(/\s+/g, " ")
        const existing = await brands.findOne({
            name: new RegExp(`^${normalizedName}$`, "i")
        });
        if (existing) {
            return res.json({ success: false, message: 'brand already exist' })
        }
        const newbrand = new brands({
            brandName: brandName,
            brandLogo: brandLogo,

        })
        await newbrand.save()
        res.json({ success: true, message: 'Brand added succesfully' })
    } catch (error) {
        console.log("error while adding brand:", error)
        res.json({ success: falsr, message: 'Server error' })
    }
}

const addBrandOffer = async (req, res) => {
    console.log('controller hit')
    try {
        const { brandId, offer, startDate, endDate } = req.body
        if (!offer || !startDate || !endDate) {
            return res.json({ success: false, message: 'All values are required' })
        }

        const brandData = await brands.findById(brandId)
        if (!brandData) {
            return res.json({ success: false, message: 'Category not found' })
        }
        if (isNaN(offer) || offer < 0 || offer > 100) {
            return res.json({ success: false, message: 'Invalid percentage value' })
        }

        if (new Date(startDate) >= new Date(endDate)) {
            return res.json({ success: false, message: 'startDate should be less than enddate' })
        }
        await brands.findByIdAndUpdate({ _id: brandId }, { $set: { brandOffer: offer, startDate: startDate, endDate: endDate } })
        res.json({ success: true, message: 'Offer added successfully' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: 'Server error' })
    }
}

const editBrand = async (req, res) => {
    try {
        const { brandName, brandId } = req.body
        const updateData = { brandName };

        if (req.file) {
            updateData.brandLogo = req.file.filename;
        }

        const update = await brands.findByIdAndUpdate(brandId, { $set: updateData }, { new: true })
        if (!update) {
            return res.json({ success: false, message: "Unable to edit category" })
        }

        if (!update) {
            return res.json({ success: false, message: 'Unable to edit brand' })
        }
        res.json({ success: true, message: 'Brand edited successfully' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: 'Server error' })
    }
}

const unlistBrand = async (req, res) => {
    try {
        const { brandId } = req.body

        const updated = await brands.findByIdAndUpdate(brandId, { $set: { isListed: false } }, { new: true })
        if (!updated) {
            return res.json({ success: false, message: "unable to unlist brand" })
        }
        res.json({ success: true, message: 'Brand unlisted successfully' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: 'Server error' })
    }
}

const listBrand = async (req, res) => {
    try {
        const { brandId } = req.body

        const updated = await brands.findByIdAndUpdate(brandId, { $set: { isListed: true } }, { new: true })
        if (!updated) {
            return res.json({ success: false, message: "unable to list brand" })
        }
        res.json({ success: true, message: 'Brand listed successfully' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: 'Server error' })
    }
}


const removeOffer = async (req, res) => {
    try {
        const { brandId } = req.body
        if (!brandId) {
            return res.json({ success: false, message: "BrandId is missing" })
        }
        const updated = await brands.findByIdAndUpdate(brandId, { $set: { brandOffer: null } }, { new: true })
        if (!updated) {
            return res.json({ success: false, message: 'Unable to remove offer' })
        }
        res.json({ success: true, message: 'Offer removed successfully' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: "Server error" })
    }
}

const deleteBrand = async (req, res) => {

    try {
        const { brandId } = req.body

        const updated = await brands.deleteOne({ _id: brandId })
        if (!updated) {
            return res.json({ succes: false, message: 'Unable to delete brand' })
        }
        res.json({ success: true, message: 'Brand deleted successfully' })


    } catch (error) {
        console.log(error)
        res.json({ success: false, message: 'Server error' })
    }
}
module.exports = {
    getBrands,
    addBrand,
    addBrandOffer,
    editBrand,
    unlistBrand,
    listBrand,
    removeOffer,
    deleteBrand
}