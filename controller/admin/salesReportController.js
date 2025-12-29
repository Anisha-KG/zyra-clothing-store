const ExcelJS = require('exceljs');
const ejs = require('ejs');
const path = require('path');
const puppeteer = require('puppeteer');

const Orders = require('../../models/orderSchema'); 
const { buildDateRange } = require('../../helpers/buildDateRange'); 

const getSalesReport=async(req,res,next)=>{
    try{
        const{filter='daily',from,to}=req.query 
        const page=parseInt(req.query.page)||1
        //const search=req.query.search||''
        const limit=10
        const skip=(page-1)*limit 

        

        const {startDate, endDate} = buildDateRange(filter,from, to)
        const match={}
        if(startDate&&endDate){
            match.createdAt={$gte:startDate,$lte:endDate}
        }
        match['orderedItems.status']={$nin:['Cancelled','Returned','Returning']}

        const data=await Orders.aggregate([
            {$match:match},
            {$facet:{
                totals:[
                    {$group:{_id:null,totalOrders:{$sum:1},totalRevenue:{$sum:'$totalPayable'},totalDiscount:{$sum:'$couponDiscount'}}}
                ],

                orders:[
                    {$sort:{createdAt:-1}},
                    {$skip:skip},
                    {$limit:limit},

                    {$lookup:{from:'users',localField:'userId',foreignField:'_id',as:'user'}},
                    {$unwind:{path:'$user',preserveNullAndEmptyArrays:true}},
                    {$project:{orderId:1,createdAt:1,subTotal:1,totalPayable:1,totalDiscount:1,paymentMethod:1,'user.name':1,}}
                ],

                count:[{$count:'count'}]
            }}
        ]
            

        )

        const totals=data[0].totals[0]||{
            totalOrders:0,totalRevenue:0,totalDiscount:0
        }

        const orders=data[0].orders 
        const totalCount = data[0].count[0]?.count || 0
        const totalPages = Math.ceil(totalCount / limit)

        res.render('salesReport',{
            totals,
            orders,
            totalCount,
            totalPages,
            currentPage:page,
            filter,
            fromDate:from||'',
            toDate:to||'',
            query:req.query,
            

        })








    }catch(error){
        next(error)
    }
}


const downloadSalesExcel = async (req, res,next) => {
    try{
        const { filter = 'daily', from, to } = req.query;

    const { startDate, endDate } = buildDateRange(filter, from, to);
    const match = {};
    if (startDate && endDate) match.createdAt = { $gte: startDate, $lte: endDate };
    match['orderedItems.status'] = { $nin: ['Cancelled', 'Returned', 'Returning'] };

    const rows = await Orders.aggregate([
        { $match: match },
        { $sort: { createdAt: 1 } },
        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                orderId: 1,
                createdAt: 1,
                subTotal: 1,
                totalPayable: 1,
                totalDiscount: 1,
                paymentMethod: 1,
                'user.name': 1,
            }
        }
    ]);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sales Report');

    sheet.columns = [
        { header: 'Order ID', key: 'orderId', width: 15 },
        { header: 'User', key: 'userName', width: 20 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Subtotal (₹)', key: 'subTotal', width: 15 },
        { header: 'Discount (₹)', key: 'discount', width: 15 },
        { header: 'Total Payable (₹)', key: 'totalAmount', width: 18 },
        { header: 'Payment Method', key: 'paymentMethod', width: 15 },
    ];

    rows.forEach(r => {
        sheet.addRow({
            orderId: r.orderId,
            userName: r.user?.name || 'Unknown',
            date: new Date(r.createdAt).toLocaleDateString('en-IN'),
            subTotal: r.subTotal || 0,
            discount: r.totalDiscount || 0,
            totalAmount: r.totalPayable || 0,
            paymentMethod: r.paymentMethod || '',
        });
    });

    // Totals row
    const totalSub = rows.reduce((a, b) => a + (b.subTotal || 0), 0);
    const totalDisc = rows.reduce((a, b) => a + (b.totalDiscount || 0), 0);
    const totalPay = rows.reduce((a, b) => a + (b.totalPayable || 0), 0);

    const totalRow = sheet.addRow({
        orderId: 'TOTAL',
        subTotal: totalSub,
        discount: totalDisc,
        totalAmount: totalPay,
    });
    totalRow.font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="sales-report-${Date.now()}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
    }catch(error){
        next(error)
    }
    
}


const downloadSalesPdf = async (req, res,next) => {
    try{
        const { filter = 'daily', from, to } = req.query;

    const { startDate, endDate } = buildDateRange(filter, from, to);
    const match = {};
    if (startDate && endDate) match.createdAt = { $gte: startDate, $lte: endDate };
    match['orderedItems.status'] = { $nin: ['Cancelled', 'Returned', 'Returning'] };

    const result = await Orders.aggregate([
        { $match: match },
        {
            $facet: {
                totals: [
                    {
                        $group: {
                            _id: null,
                            totalOrders: { $sum: 1 },
                            totalRevenue: { $sum: '$totalPayable' },
                            totalDiscount: { $sum: '$totalDiscount' },
                        }
                    }
                ],
                data: [
                    { $sort: { createdAt: 1 } },
                    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
                    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            orderId: 1,
                            createdAt: 1,
                            subTotal: 1,
                            totalPayable: 1,
                            totalDiscount: 1,
                            paymentMethod: 1,
                            'user.name': 1,
                        }
                    }
                ]
            }
        }
    ]);

    const totals = result[0].totals[0] || { totalOrders: 0, totalRevenue: 0, totalDiscount: 0 };
    const orders = result[0].data || [];

    const pdfTemplate = path.join(__dirname, '../../views/admin/salesReportPdf.ejs');

    const html = await ejs.renderFile(pdfTemplate, {
        orders,
        totalOrders: totals.totalOrders,
        totalRevenue: totals.totalRevenue,
        totalDiscount: totals.totalDiscount,
        filterType: filter,
        fromDate: from || '',
        toDate: to || '',
    });

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '10mm', bottom: '20mm', left: '10mm' },
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="sales-report-${Date.now()}.pdf"`);

    res.send(pdfBuffer);
    }catch(error){
        next(error)
    }
}


module.exports={
    getSalesReport,
    downloadSalesPdf,
    downloadSalesExcel
}