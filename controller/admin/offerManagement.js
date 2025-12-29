const Offer = require('../../models/offerSchema');
const Category=require('../../models/categprySchema')
const SubCategory=require('../../models/subcategorySchema')
const Brand=require('../../models/brandsSchema')
const Product=require('../../models/productSchema')


const getOfferManagementPage = async (req, res, next) => {
  console.log('controller hit')
  try {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || "";
    const filter = req.query.filter || "all";
    const limit = 5;

    const query = {
  offerName: { $regex: search, $options: "i" },
  isDeleted: false
};

    if (filter === "active") {
      query.isActive = true;
    } else if (filter === "inactive") {
      query.isActive = false;
    }

    const totalOffers = await Offer.countDocuments(query);

    const offers = await Offer.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

      console.log(offers)

    res.render("offerManagement", {
      offers,
      currentPage: page,
      totalPages: Math.ceil(totalOffers / limit),
      search,
      filter
    });

  } catch (error) {
    next(error);
  }
};


const addOffer = async (req, res, next) => {
  try {
    const { offerName, discount, startDate, endDate } = req.body;

    if (!offerName || !discount || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const newOffer = new Offer({
      offerName,
      discount,
      startDate,
      endDate,
      isActive: true,
      isDeleted: false
    });

    await newOffer.save();

    res.status(201).json({
      success: true,
      message: 'Offer added successfully'
    });

  } catch (error) {
    next(error);
  }
};
const editOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { offerName, discount, startDate, endDate } = req.body;

    const offer = await Offer.findOne({ _id: id, isDeleted: false });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    // ✅ Update offer
    offer.offerName = offerName;
    offer.discount = discount;
    offer.startDate = startDate;
    offer.endDate = endDate;

    await offer.save();

    // ✅ Update related collections correctly
    await Promise.all([
      Category.updateMany(
        { offerId: id },
        {
          $set: {
            categoryOffer: discount,
            startDate: startDate,
            endDate: endDate
          }
        }
      ),

      SubCategory.updateMany(
        { offerId: id },
        {
          $set: {
            offer: discount,
            startDate: startDate,
            endDate: endDate
          }
        }
      ),

      Brand.updateMany(
        { offerId: id },
        {
          $set: {
            brandOffer: discount,
            startDate: startDate,
            endDate: endDate
          }
        }
      ),

      Product.updateMany(
        { offerId: id },
        {
          $set: {
            offerDiscount: discount,
            offerStartDate: startDate,
            offerValidUntil: endDate
          }
        }
      )
    ]);

    return res.json({
      success: true,
      message: 'Offer and related entities updated successfully'
    });

  } catch (error) {
    next(error);
  }
};


const deleteOffer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const offer = await Offer.findOne({ _id: id, isDeleted: false });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

 
    await Offer.findByIdAndUpdate(id, { isDeleted: true });

   
    await Promise.all([
      Category.updateMany(
        { offerId: id },
        { 
          $set: { 
            offerId: null,
            startDate: null,
            endDate: null 
          } 
        }
      ),
      SubCategory.updateMany(
        { offerId: id },
        { 
          $set: { 
            offerId: null,
            startDate: null,
            endDate: null 
          } 
        }
      ),
      Brand.updateMany(
        { offerId: id },
        { 
          $set: { 
            offerId: null,
            startDate: null,
            endDate: null 
          } 
        }
      ),
      Product.updateMany(
        { offerId: id },
        { 
          $set: { 
            offerId: null,
            startDate: null,
            offerValidUntil: null 
          } 
        }
      )
    ]);

    res.json({
      success: true,
      message: 'Offer removed successfully and related offer data cleared'
    });

  } catch (error) {
    next(error);
  }
};

const restoreOffer = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Find deleted offer
    const offer = await Offer.findOne({ _id: id, isDeleted: true });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Deleted offer not found'
      });
    }

    // 2. Restore offer
    offer.isDeleted = false;
    await offer.save();

    // 3. Re-apply offer details everywhere it is used
    
    await Promise.all([
      Category.updateMany(
        { offerId: id },
        { 
          $set: { 
            offerId: null,
            startDate: null,
            endDate: null 
          } 
        }
      ),
      SubCategory.updateMany(
        { offerId: id },
        { 
          $set: { 
            offerId: null,
            startDate: null,
            endDate: null 
          } 
        }
      ),
      Brand.updateMany(
        { offerId: id },
        { 
          $set: { 
            offerId: null,
            startDate: null,
            endDate: null 
          } 
        }
      ),
      Product.updateMany(
        { offerId: id },
        { 
          $set: { 
            offerId: null,
            startDate: null,
            offerValidUntil: null 
          } 
        }
      )
    ]);

    res.json({
      success: true,
      message: 'Offer restored and reapplied successfully'
    });

  } catch (error) {
    next(error);
  }
};




module.exports = {
  getOfferManagementPage,
  editOffer,
  deleteOffer,
  addOffer,
  restoreOffer
};
