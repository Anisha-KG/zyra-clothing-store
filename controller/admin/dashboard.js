const Order=require('../../models/orderSchema')
const User = require('../../models/userScema')
const Product = require("../../models/productSchema");
const { buildDateRange } = require('../../helpers/buildDateRange'); 

const getAdminDashboard = async (req, res, next) => {
  try {
    const { filter = "daily", from, to } = req.query;

  
    const { startDate, endDate } = buildDateRange(filter, from, to);

    const matchStage = {};
    if (startDate && endDate) {
      matchStage.createdAt = { $gte: startDate, $lte: endDate };
    }

    matchStage["orderedItems.status"] = {
      $nin: ["Cancelled", "Returned", "Returning"]
    };


    const [
      totalCustomers,
      totalOrdersAgg
    ] = await Promise.all([
      User.countDocuments({ isBlocked: false }),

      Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSales: { $sum: "$totalPayable" }
          }
        }
      ])
    ]);

    const totalOrders = totalOrdersAgg[0]?.totalOrders || 0;
    const totalSales = totalOrdersAgg[0]?.totalSales || 0;

 
    const salesGraph = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: "%d/%m/%Y", date: "$createdAt" }
          },
          sales: { $sum: "$totalPayable" }
        }
      },
      { $sort: { _id: 1 } }
    ]);


    const topProducts = await Order.aggregate([
      { $unwind: "$orderedItems" },
      {
        $match: {
          "orderedItems.status": {
            $nin: ["Cancelled", "Returned", "Returning"]
          }
        }
      },
      {
        $group: {
          _id: "$orderedItems.product",
          sold: { $sum: "$orderedItems.quantity" }
        }
      },
      { $sort: { sold: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $project: {
          name: "$product.name",
          sold: 1
        }
      }
    ]);

   
    const topCategories = await Order.aggregate([
      { $unwind: "$orderedItems" },
      {
        $lookup: {
          from: "products",
          localField: "orderedItems.product",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          sold: { $sum: "$orderedItems.quantity" }
        }
      },
      { $sort: { sold: -1 } },
      { $limit: 3 }
    ]);

  
    const topBrands = await Order.aggregate([
      { $unwind: "$orderedItems" },
      {
        $lookup: {
          from: "products",
          localField: "orderedItems.product",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.brand",
          sold: { $sum: "$orderedItems.quantity" }
        }
      },
      { $sort: { sold: -1 } },
      { $limit: 3 }
    ]);

    res.render("adminDashboard", {
      totalCustomers,
      totalOrders,
      totalSales,
      salesGraph,
      topProducts,
      topCategories,
      topBrands,
      filter,
      fromDate: from || "",
      toDate: to || "",
      
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard
};
