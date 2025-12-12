const httpStatus = require('../../Constants/httpStatuscode')
const User = require('../../models/userScema')
const Cart = require('../../models/cartSchema')
const Address = require('../../models/addressSchema')
const Order = require('../../models/orderSchema')
const Product = require('../../models/productSchema')
const Variant = require('../../models/variantSchema')
const Orders = require('../../models/orderSchema')
const Wallet=require('../../models/wallet')
const razorpay=require('razorpay')
const Coupons=require('../../models/couponSchema')
require('dotenv').config()

require('dotenv').config()

const razorpayInstance=new razorpay({
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_KEY_SECRET,

})

const generateRazorpayOrder = async (orderId, amount) => {
  try {
    const options = {
      amount: amount * 100,          // Razorpay amount = paise
      currency: "INR",
      receipt: orderId.toString(),   // Your DB order ID
      payment_capture: 1             // Razorpay auto-captures payment
    };

    const razorpayOrder = await razorpayInstance.orders.create(options)
    console.log("razorpayOrder:",razorpayOrder)
    return razorpayOrder

  } catch (error) {
    console.log("Razorpay Order Error:", error)
    throw error;
  }
};


const placeOrder = async (req, res, next) => {
    try {

        const userId=req.session.user
        const addressId = req.session.addressId
        const paymentMethod = req.session.paymentMethod
        const couponCode=req.session.couponCode||null
        const couponDiscount=req.session.couponDiscount ||0
        
        const user = await User.findById(userId)
        
        let coupon = null;
        let normaliseCode = null;
        if(couponCode&&couponDiscount){
            normaliseCode=couponCode.toUpperCase()
        coupon = await Coupons.findOne({
                code: normaliseCode,
                status: true,
                
                });
        if(!coupon){
            coupon = user.referralCoupons.find(c => c.couponCode.toUpperCase() === normaliseCode)
            if (coupon) {
                coupon.isReferral = true;
                }
        }

        if(!coupon){
            return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'coupon expired or not available'})
        }
        }



        if (!addressId || !paymentMethod) {
            return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'required details not available' })
        }

        
        

        const cart = await Cart.findOne({ userId }).populate('items.productId').populate('items.variantId')
        if (!cart || cart.items.length == 0) {
            return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Cart not available' })
        }

        const addressDoc = await Address.findOne({ userId })
        if (!addressDoc) {
            return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Address document not found' })
        }

        const selectedAddress = addressDoc.address.find((addr) => {
            return addr._id.toString() === addressId.toString()
        })
        if (!selectedAddress) {
            return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Selected address not found' })
        }

        const formattedAddress = `
                ${selectedAddress.name}
                ${selectedAddress.addressName}
                ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}
                Landmark: ${selectedAddress.landmark || "N/A"}
                Phone: ${selectedAddress.phone}
                `.trim();



        const orderedProducts = cart.items.map((item) => {
            const product = item.productId
            return {
                product: product._id,
                variant: item.variantId._id,
                productName: item.productId.name,
                MRPprice: item.productId.price,
                finalPrice: item.price,
                size: item.size,
                color: item.color,
                quantity: item.quantity,
                 itemsTotal: item.quantity * item.price, 
                status: 'Pending'
            }
        })
        const summary = await calculatetotalSummary(cart,couponDiscount)
        const deliveryCharge = summary.total > 1000 ? 0 : 60

    if(paymentMethod=='razorpay'){
         const newOrder = new Order({
            userId,
            orderedItems: orderedProducts,
            taxRate: summary.taxRate,
            taxAmount: summary.taxAmount,
            subTotal: summary.subTotal,
            deliveryCharge,
            couponDiscount,
            totalPayable: summary.total+deliveryCharge,
            address: formattedAddress,
            paymentMethod,
            invoiceDate: new Date(),
            paymentStatus: 'Pending'


        })

        await newOrder.save()

        const razorpayOrder=await generateRazorpayOrder(newOrder.orderId,newOrder.totalPayable)

        newOrder.razorpayorderId=razorpayOrder.id 

        await newOrder.save()

        
       return  res.status(httpStatus.OK).json({success:true,paymentType:'razorpay',redirectUrl:`/onlinePayment?orderId=${newOrder.orderId}&razorpayorderId=${razorpayOrder.id }`})

    }

    let orderSuccessfull=false


        if(paymentMethod=='cod'){

            orderedProducts.forEach((item)=>{
                 item.status='Confirmed'
            })

            const newOrder = new Order({
            userId,
            orderedItems: orderedProducts,
            taxRate: summary.taxRate,
            taxAmount: summary.taxAmount,
            subTotal: summary.subTotal,
            deliveryCharge,
            couponDiscount,
            totalPayable: summary.total+deliveryCharge,
            address: formattedAddress,
            paymentMethod,
            invoiceDate: new Date(),
            paymentStatus: 'Pending'


        })
        
        const successfull=await newOrder.save()
        if(successfull){
            orderSuccessfull=true
        }
    
    }


    
        if(paymentMethod=='wallet'){



            const wallet=await Wallet.findOne({userId})
        if(!wallet){
            return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Wallet not found'})
        }

        if(wallet.balance<summary.total+deliveryCharge){
            return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Insufficiant Balance in wallet'})
        }
        wallet.balance-=(summary.total +deliveryCharge)

        wallet.walletTransactions.push({
            date:Date.now(),
            amount:summary.total ,
            description:'Order payment',
            type:'Debit',
            status:'Used for order'

        })

        await wallet.save()

            orderedProducts.forEach((item)=>{
                 item.status='Confirmed'
            })

            const newOrder = new Order({
            userId,
            orderedItems: orderedProducts,
            taxRate: summary.taxRate,
            taxAmount: summary.taxAmount,
            subTotal: summary.subTotal,
            deliveryCharge,
            couponDiscount,
            totalPayable: summary.total+deliveryCharge,
            address: formattedAddress,
            paymentMethod,
            invoiceDate: new Date(),
            paymentStatus: 'Completed'


        })
        await newOrder.save()


        orderSuccessfull=true
        
    
    }



     if(orderSuccessfull){

        if(couponCode&&couponDiscount){
            
        

        if(coupon.isReferral){
            await User.findOneAndUpdate(
                {
                    _id: userId,
                    "referralCoupons.couponCode": normaliseCode
                },
                {
                    $set: { "referralCoupons.$.isUsed": true }
                }
                );
        }else{

            const userExist=coupon.usedUsers.find((u)=>u.userId.toString()==userId.toString())
        if(userExist){
            userExist.count++
        }else{
            coupon.usedUsers.push({
                userId,
                count:1
            })
        }

        coupon.usedCount++ 
        if(coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit){
            coupon.status = false;
        }
        

        await coupon.save()

        }

        }


        for (let item of orderedProducts) {
            await Variant.findOneAndUpdate(
                {
                    _id: item.variant,
                    size: item.size,
                    color: item.color
                },
                { $inc: { quantity: -item.quantity } }
            );
        }

        await Cart.updateOne({ userId: userId }, { $set: { items: [] } })

        delete req.session.address
        delete req.session.paymentMethod

       return  res.status(httpStatus.OK).json({ success: true, message: 'Order placed successfully' })

     }

        

    } catch (error) {
        next(error)
    }
}

const orderSuccessfull = async (req, res, next) => {
    try {
        const userId = req.session.user
        const user = await User.findById(userId)
        res.render('orderSuccessfullPage', { user })

    } catch (error) {
        next(error)
    }
}



const listOrder = async (req, res, next) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId);

        const limit = 3;
        const page = parseInt(req.query.page) || 1;

        const [totalOrders, orders] = await Promise.all([
            Orders.countDocuments({ userId }),
            Orders.find({ userId })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('orderedItems.product')
                .populate('orderedItems.variant')
        ]);



        const totalPages = Math.ceil(totalOrders / limit);



        res.render('orderDetails', {
            user,
            orders,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        next(error);
    }
};

const orderedProducts = async (req, res, next) => {
    try {
        const userId = req.session.user
        const user = await User.findById(userId)
        const itemId = req.params.itemId
        const order = await Order.findOne({ userId, 'orderedItems._id': itemId })
            .populate('orderedItems.product')
            .populate('orderedItems.variant')
        const orderedItem = order.orderedItems.id(itemId)


        res.render('orderedProducts', {
            user,
            order,
            itemId,
            orderedItem
        })
    } catch (error) {
        next(error)
    }
}
const CancelItem = async (req, res, next) => {
    try {
        const { orderId, itemId, cancelReason } = req.body;
        const userId=req.session.user

        const updatedOrder = await Order.findOneAndUpdate(
            { orderId, 'orderedItems._id': itemId },
            {
                $set: {

                    'orderedItems.$.cancellationRequest.reason': cancelReason,
                    'orderedItems.$.cancellationRequest.status': true,
                    'orderedItems.$.status': 'Cancelled'
                }
            },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(400).json({ success: false, message: 'Cannot complete request' });
        }

        const order=await Order.findOne({orderId})
        const cancelledItem=order.orderedItems.id(itemId)
        
            await Variant.findByIdAndUpdate(
    cancelledItem.variant,
    { $inc: { quantity: cancelledItem.quantity } }
);
    if(updatedOrder.paymentMethod!=='cod'){
        const couponDiscount=updatedOrder.couponDiscount 
        const couponDiscountPeritem=(cancelledItem.finalPrice/updatedOrder.subTotal)*couponDiscount 
        const AfterDiscountPrice=cancelledItem.finalPrice-couponDiscountPeritem
        const taxRate = Number(process.env.TAX_RATE);
        const refundTax=AfterDiscountPrice*taxRate
        const refundingAmount=AfterDiscountPrice+refundTax

        let wallet=await Wallet.findOne({userId})
        if(!wallet){
            wallet=await new Wallet({
                userId,
                balance:0,
                walletTransactions:[]
            })
            await wallet.save()
        }

        wallet.balance+=Math.round(refundingAmount )
        wallet.walletTransactions.push({
            date:Date.now(),
            amount:Math.round(refundingAmount ),
            description:'Product Cancellation Refund',
            type:'Credit',
            status:'Refund'
        })

        await wallet.save()


    }
        

    return res.status(200).json({ success: true, message: 'Item cancelled. The amount will be credited to your wallet ' });
    } catch (error) {
        next(error);
    }
};




async function calculatetotalSummary(cart,couponDiscount) {
    const taxRate = parseFloat(process.env.TAX_RATE)
    let subTotal = 0


    for (let item of cart.items) {


        subTotal += (item.quantity*item.price)
    }

    subTotalAfterDiscount=subTotal-couponDiscount

    const taxAmount = Math.round(subTotalAfterDiscount * taxRate)
    const total = subTotalAfterDiscount + taxAmount

    return { subTotal, taxAmount, total, taxRate }

}

module.exports = {
    placeOrder,
    orderSuccessfull,
    listOrder,
    orderedProducts,
    CancelItem
}