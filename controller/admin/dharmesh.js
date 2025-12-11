const asyncHandler = require('express-async-handler')
const Order = require('../../models/orderSchema')
const {buildDateRange, buildMatch} = require('../../utils/dateFilter')
const path = require('path')
const ejs = require('ejs')
const ExcelJS = require('exceljs')
const puppeteer = require('puppeteer')
const mongoose = require('mongoose')

const loadSalesReport = asyncHandler( async( req,res) => {
    const {filterType = 'daily',from,to} = req.query
    const page = parseInt(req.query.page) || 1
    const limit = 5
    const skip = (page - 1) * limit

    const {startDate, endDate} = buildDateRange(filterType,from, to)
    const match = buildMatch(startDate, endDate)
    match['items.status'] = {$nin:['CANCELLED','RETURNED']}

    const data = await Order.aggregate([
        {$match:match},
        {$facet:{totals:[
            {$group:{_id:null,totalOrders:{$sum:1},totalRevenue:{$sum:'$totalAmount'},totalDiscount:{$sum:'$totalDiscount'},}}
        ],
        orders:[{$sort:{createdAt:-1}},{$skip:skip},{$limit:limit},
            {$lookup:{from:'users',localField:'user',foreignField:'_id',as:'user'}},
            {$unwind:{path:'$user',preserveNullAndEmptyArrays:true}},
            {$project:{
                orderNumber:1,createdAt:1,subtotal:1,totalAmount:1,totalDiscount:1,paymentMethod:1,'user.name':1,
            }}
        ],
        count:[{$count:'count'}]
    }}
    ])

    const totals = data[0].totals[0] || {
        totalOrders:0,totalRevenue:0,totalDiscount:0
    }

    const orders = data[0].orders
    const totalCount = data[0].count[0]?.count || 0
    const totalPages = Math.ceil(totalCount / limit)

    res.render('admin/report',{layout:'layouts/admin_main',orders,totalOrders:totals.totalOrders,totalRevenue:totals.totalRevenue,totalDiscount:totals.totalDiscount,filterType,fromDate:from || '',toDate:to || '',currentPage:page,totalPages,query:req.query})

})

function buildDateRange(filterType, fromStr, toStr) {
  const today = new Date();

  const startOfDay = d => new Date(d.setHours(0,0,0,0));
  const endOfDay   = d => new Date(d.setHours(23,59,59,999));

  let startDate = null;
  let endDate = null;

  if (filterType === "daily") {
    startDate = startOfDay(new Date(today));
    endDate = endOfDay(new Date(today));
  } 
  else if (filterType === "weekly") {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    startDate = startOfDay(weekStart);
    endDate = endOfDay(today);
  } 
  else if (filterType === "monthly") {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    startDate = startOfDay(monthStart);
    endDate = endOfDay(monthEnd);
  } 
  else if (filterType === "custom") {
    if (!fromStr || !toStr) return { startDate: null, endDate: null };

    const fromDate = new Date(fromStr);
    const toDate = new Date(toStr);
    startDate = startOfDay(new Date(fromDate));
    endDate = endOfDay(new Date(toDate));
  }

  return { startDate, endDate };
}


function buildMatch(startDate, endDate) {
  const match = {};

  if (startDate && endDate) {
    match.createdAt = { $gte: startDate, $lte: endDate };
  }

  return match;
}

module.exports = { buildDateRange, buildMatch };

const downloadExcel = asyncHandler( async( req,res) => {
    const {filterType = 'daily', from, to, onlyCompleted} = req.query
    
    const {startDate, endDate} = buildDateRange(filterType, from, to)
    const match = buildMatch(startDate, endDate, {onlyCompleted:onlyCompleted === 'true'})
    match['items.status'] = { $nin: ['CANCELLED', 'RETURNED'] }
    
    const rows = await Order.aggregate([
        {$match:match},{$sort:{createdAt:-1}},
        {$lookup:{from:'users',localField:'user',foreignField:'_id',as:'user'},},
        {$unwind:{path:'$user',preserveNullAndEmptyArrays:true}},
    ])

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Sales Report')

    sheet.columns = [
      { header: "Order No", key: "orderNumber", width: 15 },
      { header: "User", key: "userName", width: 20 },
      { header: "Date", key: "date", width: 20 },
      { header: "Subtotal (₹)", key: "subtotal", width: 15 },
      { header: "Discount (₹)", key: "discount", width: 15 },
      { header: "Total Amount (₹)", key: "totalAmount", width: 18 },
      { header: "Payment Method", key: "paymentMethod", width: 15 },
    ]

    rows.forEach(r => {
        sheet.addRow({
            orderNumber:r.orderNumber,
            userName: r.user?.name || "Unknown",
            date: new Date(r.createdAt).toLocaleString("en-IN"),
            subtotal: r.subtotal || 0,
            discount: r.totalDiscount || 0,
            totalAmount: r.totalAmount || 0,
            paymentMethod: r.paymentMethod || "",
        })
    })

    sheet.addRow({})

    const totalSubtotal = rows.reduce((a,b) => a + (b.subtotal || 0), 0)
    const totalDiscount = rows.reduce((a, b) => a + (b.totalDiscount || 0), 0)
    const grandTotal = rows.reduce((a, b) => a + (b.totalAmount || 0), 0)

    const totalRow = sheet.addRow({
        orderNumber: "TOTAL",
        subtotal: totalSubtotal,
        discount: totalDiscount,
        totalAmount: grandTotal,
    })

    totalRow.font = { bold: true }

    res.setHeader(
        "Content-Disposition",
        attachment; filename="sales-report-${Date.now()}.xlsx"
    )

    await workbook.xlsx.write(res)
    res.end()
})




const downloadPdf = asyncHandler( async( req,res) => {
    const {filterType = 'daily', from, to, onlyCompleted} = req.query
    
    const {startDate, endDate} = buildDateRange(filterType, from, to)
    const match = buildMatch(startDate, endDate, {onlyCompleted:onlyCompleted === 'true'})
    match["items.status"] = { $nin: ["CANCELLED", "RETURNED"] }

    const result = await Order.aggregate([
        {$match:match},
        {$facet:{totals:[
            {$group:{_id:null,totalOrders:{$sum:1},totalRevenue:{$sum:{$ifNull:['$totalAmount',0]}},totalDiscount:{$sum:{$ifNull:['$totalDiscount',0]}},},},
        ],
        data:[
            {$sort:{createdAt:-1}},
            {$lookup:{from:'users',localField:'user',foreignField:'_id',as:'user'},},
            {$unwind:{path:'$user',preserveNullAndEmptyArrays:true}},
        ],
    }}
    ])

    const totals = result[0].totals[0] || { totalOrders: 0, totalRevenue: 0, totalDiscount: 0 }
    const orders = result[0].data || []

    const pdfTemplate = path.join(__dirname,'../../views/admin/salesReportPdf.ejs')

    const html = await ejs.renderFile(pdfTemplate, {
        orders,
        totalOrders: totals.totalOrders,
        totalRevenue: totals.totalRevenue,
        totalDiscount: totals.totalDiscount,
        filterType,
        fromDate: from || '',
        toDate: to || '',
    })

    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    const page = await browser.newPage()
    await page.setContent(html,{waitUntil:'networkidle0'})

    const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
            top: "20mm",
            right: "10mm",
            bottom: "20mm",
            left: "10mm",
        },
    })

    await browser.close()

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
        "Content-Disposition",
        attachment; filename="sales-report-${Date.now()}.pdf"
    )

    res.send(pdfBuffer)
})



module.exports = {loadSalesReport,downloadExcel,downloadPdf}




const User = require('../../models/userSchema');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const {apiLogger, errorLogger}=require('../../config/logger');
const Order = require("../../models/orderSchema");
const dayjs = require("dayjs");
const isoWeek = require("dayjs/plugin/isoWeek");
dayjs.extend(isoWeek);
const ExcelJS = require("exceljs");
const puppeteer = require("puppeteer");


const loadAdminLogin = async (req, res) => {
  try {
    if (req.session.admin) {
      return res.redirect('/admin/dashboard');
    }
    res.render('admin/login', { message: null }); 
  } catch (error) {
    errorLogger.error('there is an error in loading admin login page: %o',error);
    res.status(500).send('Server error loading admin login');
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    apiLogger.info('Admin login attempt: %o', req.body);

    const admin = await User.findOne({ email, role: 'admin' });
    if (!admin) {
      return res.render('admin/login', { message: 'Admin not found or invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.render('admin/login', { message: 'Invalid password' });
    }

    req.session.admin =admin._id;
    res.redirect('/admin/dashboard');

  } catch (error) {
     errorLogger.error('Admin login failed: %o', error);
    res.render('admin/login', { message: 'Login failed, please try again later' });
  }
};

const logout = async (req, res) => {
  try {
    if (req.session.admin) {
      delete req.session.admin;

      req.session.save((err) => {
        if (err) {
           errorLogger.error('Error saving session during logout: %o', err);
          return res.redirect('/admin/pageerror');
        }
        return res.redirect('/admin/login');
      });
    } else {
      return res.redirect('/admin/login');
    }
  } catch (error) {
    errorLogger.error('there is an error in adminlogout: %o',error);
    return res.redirect('/admin/pageerror');
  }
};

const buildDateFilter = (type, from, to) => {
  if (type === "day") {
    return {
      $gte: dayjs().startOf("day").toDate(),
      $lte: dayjs().endOf("day").toDate()
    };
  }

  if (type === "week") {
    return {
      $gte: dayjs().startOf("isoWeek").toDate(),
      $lte: dayjs().endOf("isoWeek").toDate()
    };
  }

  if (type === "month") {
    return {
      $gte: dayjs().startOf("month").toDate(),
      $lte: dayjs().endOf("month").toDate()
    };
  }

  if (type === "year") {
    return {
      $gte: dayjs().startOf("year").toDate(),
      $lte: dayjs().endOf("year").toDate()
    };
  }

  if (type === "custom" && from && to) {
    return {
      $gte: dayjs(from).startOf("day").toDate(),
      $lte: dayjs(to).endOf("day").toDate()
    };
  }

  return {};
};


const getSalesReport = async (req, res) => {
  try {
      const { type, from, to, search } = req.query;

      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      const query = { status: "delivered" };

      if (type) {
        query.createdOn = buildDateFilter(type, from, to);
      }

      if (search) {
        query.$or = [
          { "orderedItems.productName": { $regex: search, $options: "i" } },
          { "userId.fullName": { $regex: search, $options: "i" } }
        ];
      }

      const orders = await Order.find(query)
  .populate("userId")
  .populate({
      path: "orderedItems.productId",
      populate: { path: "categoryId" }
  })
  .sort({ createdOn: -1 });

      const salesRows = [];
      let totalSales = 0;
      let totalRevenue = 0;
      let totalProductDiscount = 0;
      let totalCouponDiscount = 0;

      for (const order of orders) {
        totalRevenue += order.payableAmount;
        totalProductDiscount += order.discountAmount;
        totalCouponDiscount += order.couponDiscount;

        for (const item of order.orderedItems) {
          if (item.status !== "delivered") continue;

          totalSales++;

          const product = item.productId;
          const discount = (item.price - item.salePrice) * item.quantity;
          const total = item.salePrice * item.quantity;

          salesRows.push({
            orderId: order.orderId,
            buyer: order.userId?.fullName || "Unknown",
            productName: item.productName,
            productId: product?._id || "",
            quantity: item.quantity,
            price: item.price,
            category: product?.categoryId.name || "N/A",
            discount,
            total,
            deliveredOn: item.deliveredOn || null,
            orderDate: new Date(order.createdOn).toLocaleDateString("en-IN")

          });
        }
      }

      const totalPages = Math.ceil(salesRows.length / limit);
      const salesData = salesRows.slice(skip, skip + limit);

      const filterQuery = new URLSearchParams(req.query).toString();

      res.render("admin/salesReport", {
        salesData,
        totalSales,
        totalRevenue,
        totalProductDiscount,
        totalCouponDiscount,
        type,
        from,
        to,
        search,
        totalPages,
        currentPage: page,
        filterQuery
      });

    } catch (error) {
      console.log("Sales Report Error:", error);
      res.redirect("/admin/pageerror");
    }
  };

const exportSalesExcel = async (req, res) => {
    try {
        const { type, from, to, search } = req.query;

        const query = { status: "delivered" };
        if (type) query.createdOn = buildDateFilter(type, from, to);
        if (search) {
            query.$or = [
                { "orderedItems.productName": { $regex: search, $options: "i" } },
                { "userId.fullName": { $regex: search, $options: "i" } }
            ];
        }

        const orders = await Order.find(query)
            .populate("userId")
            .populate({
                path: "orderedItems.productId",
                populate: { path: "categoryId" }
            })
            .sort({ createdOn: -1 });

        let totalSales = 0;
        let totalRevenue = 0;
        let totalProductDiscount = 0;
        let totalCouponDiscount = 0;

        orders.forEach(order => {
            totalRevenue += order.payableAmount;
            totalProductDiscount += order.discountAmount;
            totalCouponDiscount += order.couponDiscount;

            order.orderedItems.forEach(item => {
                if (item.status === "delivered") totalSales++;
            });
        });

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Sales Report");

        sheet.mergeCells("A1", "J1");
        sheet.getCell("A1").value = "Sales Report";
        sheet.getCell("A1").font = { size: 16, bold: true };
        sheet.getCell("A1").alignment = { horizontal: "center" };

        sheet.mergeCells("A2", "J2");
        sheet.getCell("A2").value =
            type === "day" ? "Report Type: Today"
            : type === "week" ? "Report Type: Weekly"
            : type === "month" ? "Report Type: Monthly"
            : type === "year" ? "Report Type: Yearly"
            : type === "custom" ? Report Type: Custom (${from} to ${to})
            : "Report Type: All";
        sheet.getCell("A2").alignment = { horizontal: "center" };

        sheet.addRow([]);

        sheet.columns = [
            { key: "orderId", width: 18 },
            { key: "orderDate", width: 16 },
            { key: "buyer", width: 20 },
            { key: "product", width: 28 },
            { key: "productId", width: 22 },
            { key: "qty", width: 8 },
            { key: "price", width: 12 },
            { key: "category", width: 18 },
            { key: "discount", width: 14 },
            { key: "total", width: 14 }
        ];

        const header = sheet.addRow({
            orderId: "Order ID",
            orderDate: "Order Date",
            buyer: "Buyer",
            product: "Product",
            productId: "Product ID",
            qty: "Qty",
            price: "Price",
            category: "Category",
            discount: "Discount",
            total: "Total"
        });

        header.font = { bold: true };

        orders.forEach(order => {
            const orderDateStr = new Date(order.createdOn).toLocaleDateString("en-IN");

            order.orderedItems.forEach(item => {
                if (item.status !== "delivered") return;

                const product = item.productId;
                const discount = (item.price - item.salePrice) * item.quantity;
                const total = item.salePrice * item.quantity;

                sheet.addRow({
                    orderId: order.orderId,
                    orderDate: orderDateStr,
                    buyer: order.userId?.fullName || "Unknown",
                    product: item.productName,
                    productId: product?._id || "",
                    qty: item.quantity,
                    price: item.price,
                    category: product?.categoryId?.name || "N/A",
                    discount,
                    total
                });
            });
        });

        sheet.addRow([]);
        sheet.addRow(["Total Sales", totalSales]);
        sheet.addRow(["Total Revenue", totalRevenue]);
        sheet.addRow(["Total Product Discount", totalProductDiscount]);
        sheet.addRow(["Total Coupon Discount", totalCouponDiscount]);

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=sales-report.xlsx"
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.log(err);
        res.redirect("/admin/pageerror");
    }
};


const exportSalesPDF = async (req, res) => {
    try {
        const { type, from, to, search } = req.query;

        const query = { status: "delivered" };
        if (type) query.createdOn = buildDateFilter(type, from, to);
        if (search) {
            query.$or = [
                { "orderedItems.productName": { $regex: search, $options: "i" } },
                { "userId.fullName": { $regex: search, $options: "i" } }
            ];
        }

        const orders = await Order.find(query)
            .populate("userId")
            .populate({
                path: "orderedItems.productId",
                populate: { path: "categoryId" }
            })
            .sort({ createdOn: -1 });

        let totalSales = 0;
        let totalRevenue = 0;
        let totalProductDiscount = 0;
        let totalCouponDiscount = 0;

        const salesRows = [];

        for (const order of orders) {
            totalRevenue += order.payableAmount;
            totalProductDiscount += order.discountAmount;
            totalCouponDiscount += order.couponDiscount;

            for (const item of order.orderedItems) {
                if (item.status !== "delivered") continue;

                totalSales++;

                const product = item.productId;
                const discount = (item.price - item.salePrice) * item.quantity;
                const total = item.salePrice * item.quantity;

                salesRows.push({
                    orderId: order.orderId,
                    buyer: order.userId?.fullName || "Unknown",
                    productName: item.productName,
                    productId: product?._id || "",
                    qty: item.quantity,
                    price: item.price,
                    category: product?.categoryId?.name || "N/A",
                    discount,
                    total,
                    orderDate: new Date(order.createdOn).toLocaleDateString("en-IN")
                });
            }
        }

        const reportType =
            type === "day" ? "Today"
            : type === "week" ? "This Week"
            : type === "month" ? "This Month"
            : type === "year" ? "This Year"
            : type === "custom" ? "Custom Range"
            : "All Records";

        const dateRange =
            type === "custom"
                ? ${from || ""} to ${to || ""}
                : "";

        const html = await new Promise((resolve, reject) => {
            res.render(
                "admin/salesReport-pdf",
                {
                    salesRows,
                    totalSales,
                    totalRevenue,
                    totalProductDiscount,
                    totalCouponDiscount,
                    reportType,
                    dateRange
                },
                (err, html) => (err ? reject(err) : resolve(html))
            );
        });

        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.setContent(html, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true
        });

        await browser.close();

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=sales-report.pdf");
        res.send(pdfBuffer);
    } catch (err) {
        console.log(err);
        res.redirect("/admin/pageerror");
    }
};

const loadAdminDashboard = async (req, res) => {
  try {

    const { type, from, to } = req.query;

    const dateFilter = type ? buildDateFilter(type, from, to) : {};

    const filter = { status: { $nin: ["cancelled", "returned", "failed", "return-requested"] } };
    if (Object.keys(dateFilter).length > 0) filter.createdOn = dateFilter;

    const totalCustomers = await User.countDocuments({ role: "user" });

    const totalOrders = await Order.countDocuments(filter);

    const revenueAgg = await Order.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: "$payableAmount" } } }
    ]);

    const totalSales = revenueAgg[0]?.total || 0;

    const pendingQuery = { status: "pending" };
    if (Object.keys(dateFilter).length > 0) pendingQuery.createdOn = dateFilter;

    const totalPending = await Order.countDocuments(pendingQuery);

    let groupId = {};

    if (type === "year") {
      groupId = { year: { $year: "$createdOn" } };
    } else if (type === "month") {
      groupId = { year: { $year: "$createdOn" }, month: { $month: "$createdOn" } };
    } else if (type === "week") {
      groupId = { year: { $year: "$createdOn" }, week: { $week: "$createdOn" } };
    } else {
      groupId = { year: { $year: "$createdOn" }, month: { $month: "$createdOn" }, day: { $dayOfMonth: "$createdOn" } };
    }

    let sortBy = {};

    if (type === "year") {
      sortBy = { "_id.year": 1 };
    } else if (type === "month") {
      sortBy = { "_id.year": 1, "_id.month": 1 };
    } else if (type === "week") {
      sortBy = { "_id.year": 1, "_id.week": 1 };
    } else {
      sortBy = { "_id.year": 1, "_id.month": 1, "_id.day": 1 };
    }

    const salesAgg = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: groupId,
          totalSales: { $sum: "$payableAmount" }
        }
      },
      { $sort: sortBy }
    ]);

    const chartLabels = [];
    const chartData = [];

    for (const row of salesAgg) {
      const id = row._id;

      if (type === "year") {
        chartLabels.push(String(id.year));
      } else if (type === "month") {
        const date = new Date(id.year, id.month - 1, 1);
        chartLabels.push(date.toLocaleString("default", { month: "short", year: "numeric" }));
      } else if (type === "week") {
        chartLabels.push(W${id.week} ${id.year});
      } else {
        const date = new Date(id.year, id.month - 1, id.day);
        chartLabels.push(date.toLocaleDateString("en-IN"));
      }

      chartData.push(Number(row.totalSales.toFixed(2)));
    }

    const topProducts = await Order.aggregate([
      { $match: filter },
      { $unwind: "$orderedItems" },
      {
        $group: {
          _id: "$orderedItems.productName",
          totalQty: { $sum: "$orderedItems.quantity" }
        }
      },
      { $sort: { totalQty: -1 } },
      { $limit: 3 }
    ]);

    const topCategories = await Order.aggregate([
      { $match: filter },
      { $unwind: "$orderedItems" },
      {
        $group: {
          _id: "$orderedItems.category",
          totalQty: { $sum: "$orderedItems.quantity" }
        }
      },
      { $sort: { totalQty: -1 } },
      { $limit: 3 }
    ]);

    const topSubcategories = await Order.aggregate([
      { $match: filter },
      { $unwind: "$orderedItems" },
      {
        $group: {
          _id: "$orderedItems.subCategory",
          totalQty: { $sum: "$orderedItems.quantity" }
        }
      },
      { $sort: { totalQty: -1 } },
      { $limit: 3 }
    ]);

    res.render("admin/dashboard", {
      totalCustomers,
      totalOrders,
      totalSales,
      totalPending,
      topProducts,
      topCategories,
      topSubcategories,
      chartLabels,
      chartData,
      type,
      from,
      to
    });

  } catch (err) {
    console.error("Dashboard Error:", err);
    res.redirect("/admin/pageerror");
  }
};



module.exports = {
  loadAdminLogin,
  adminLogin,
  loadAdminDashboard,
  logout,
  getSalesReport,
  exportSalesExcel,
  exportSalesPDF,

};