const Order = require('../../models/orderSchema')
const httpstatus = require('../../Constants/httpStatuscode')
const Product = require('../../models/productSchema')
const Variant = require('../../models/variantSchema')
const Cart = require('../../models/cartSchema')
const User = require('../../models/userScema')
const {razorpayInstance,generateRazorpayOrder}=require('../../helpers/razorpayInstance')
const crypto = require('crypto');
require('dotenv').config()



const onlinePayment = async (req, res, next) => {
    try {

        const { orderId, razorpayorderId } = req.query
        console.log(orderId)

        const order = await Order.findOne({ orderId })
        res.render('onlinePayment', {
            orderId,
            razorpayorderId,
            amount: order.totalPayable,
            razorpayKey_id: process.env.RAZORPAY_KEY_ID
        })
    } catch (error) {
        next(error)
    }
}
const verifyRazorpayPayment = async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
        console.log(orderId)

        const order = await Order.findOne({ orderId });
        if (!order) {
            return res.status(httpstatus.BAD_REQUEST).json({ success: false, redirectURL: `/onlinepayment/orderfailed?message=cannot find order` });
        }

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            order.orderedItems.forEach(item => item.status = 'Failed');
            order.paymentStatus = 'Failed';
            await order.save();
            return res.status(httpstatus.BAD_REQUEST).json({ success: false, redirectURL: `/onlinepayment/orderfailed?orderId=${orderId}` });
        }

        const hash = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (hash !== razorpay_signature) {
            order.orderedItems.forEach(item => item.status = 'Failed');
            order.paymentStatus = 'Failed';
            await order.save();
            return res.status(httpstatus.BAD_REQUEST).json({ success: false, redirectURL: `/onlinepayment/orderfailed?orderId=${orderId}` });
        }

        const paymentDetails = await razorpayInstance.payments.fetch(razorpay_payment_id);

        if (paymentDetails.status !== 'captured') {
            order.orderedItems.forEach(item => item.status = 'Failed');
            order.paymentStatus = 'Failed';
            await order.save();
            return res.status(httpstatus.BAD_REQUEST).json({ success: false, redirectURL: `/onlinepayment/orderfailed?orderId=${orderId}` });
        }

        // Payment successful
        order.orderedItems.forEach(item => item.status = 'Confirmed');
        order.paymentStatus = 'Completed';
        await order.save();

        // Reduce variant quantities
        for (let item of order.orderedItems) {
            await Variant.findOneAndUpdate(
                { _id: item.variant, size: item.size, color: item.color },
                { $inc: { quantity: -item.quantity } }
            );
        }

        // Clear cart
        await Cart.updateOne({ userId: order.userId }, { $set: { items: [] } });

        delete req.session.address;
        delete req.session.paymentMethod;

        return res.status(httpstatus.OK).json({ success: true, redirectURL: '/orderSuccessfull' });

    } catch (error) {
        next(error);
    }
};


const getFailurePage = async (req, res, next) => {
    try {
        const { orderId, message } = req.query
        const userId = req.session.user
        const user = await User.findById(userId)

        if (!message) {
            res.render('onlinepaymentFailure', { orderId, user })
        } else {
            res.render('onlinepaymentFailure', { orderId, message, user })
        }

    } catch (error) {
        next(error)
    }
}

const retryPayment=async(req,res,next)=>{
    try{

        const {orderId}=req.body

        const order=await Order.findOne({orderId})
        if(!order){
            return res.status(httpstatus.BAD_REQUEST).json({success:false,message:'Order doesnot exist'})
        }

        if(order.paymentStatus!=='Failed'){
            return res.status(httpstatus.BAD_REQUEST).json({success:false,message:'Payment already completed or retry not allowed'})
        }

        const razorpayOrder=await generateRazorpayOrder(order.orderId,order.totalPayable) 

        order.razorpayorderId=razorpayOrder.id 
        await order.save()

        return res.status(httpstatus.OK).json({success:true,redirectUrl:`/onlinePayment?orderId=${order.orderId}&razorpayorderId=${razorpayOrder.id }`})



    }catch(error){
        next(error)
    }
}
module.exports = {
    onlinePayment,
    verifyRazorpayPayment,
    getFailurePage,
    retryPayment
}