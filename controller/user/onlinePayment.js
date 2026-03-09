const Order = require('../../models/orderSchema')
const httpstatus = require('../../Constants/httpStatuscode')
const Product = require('../../models/productSchema')
const Variant = require('../../models/variantSchema')
const Cart = require('../../models/cartSchema')
const User = require('../../models/userScema')
const {razorpayInstance,generateRazorpayOrder}=require('../../helpers/razorpayInstance')
const crypto = require('crypto');
require('dotenv').config()
const mongoose=require('mongoose')



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
const oldone = async (req, res, next) => {
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

        
        
        // Clear cart
        await Cart.updateOne({ userId: order.userId }, { $set: { items: [] } });

        delete req.session.address;
        delete req.session.paymentMethod;

        return res.status(httpstatus.OK).json({ success: true, redirectURL: '/orderSuccessfull' });

    } catch (error) {
        next(error);
    }
};

const verifyRazorpayPayment = async (req, res, next) => {
   
    const session=await mongoose.startSession()
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

       

         session.startTransaction()
        try{
            console.log('transaction started')


            if (order.paymentStatus === "Completed") {
                await session.abortTransaction();
                session.endSession();

                return res.status(200).json({
                    success: true,
                    message: "Already processed",
                });
                }

             for (let item of order.orderedItems) {
        const updatedVariant = await Variant.findOneAndUpdate(
          {
            _id: item.variant,
            quantity: { $gte: item.quantity },
          },
          { $inc: { quantity: -item.quantity } },
          { new: true, session }
        );

        if (!updatedVariant) {
          throw new Error("Product out of stock");
        }
      }

            // Payment successful
        order.orderedItems.forEach(item => item.status = 'Confirmed');
        order.paymentStatus = 'Completed';
        await order.save({session});

        
        
        // Clear cart
        await Cart.updateOne({ userId: order.userId }, { $set: { items: [] } },{session});

        await session.commitTransaction();
      session.endSession();

      delete req.session.addressId;
      delete req.session.paymentMethod;
      delete req.session.couponCode;
      delete req.session.couponDiscount;

       return res.status(httpstatus.OK).json({ success: true, redirectURL: '/orderSuccessfull' });



        }catch(error){
            await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: error.message,
      });
        }

        

        
    } catch (error) {
        session.endSession();
    next(error);
  }
    
};

const oldone2 = async (req, res, next) => {
  let session;

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    console.log("Incoming OrderId:", orderId);
    console.log("Razorpay OrderId:", razorpay_order_id);

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({
        success: false,
        redirectURL: `/onlinepayment/orderfailed?message=Invalid payment response`,
      });
    }

    // Find order
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(400).json({
        success: false,
        redirectURL: `/onlinepayment/orderfailed?message=Order not found`,
      });
    }

    // Prevent duplicate processing
    if (order.paymentStatus === "Completed") {
      return res.status(200).json({
        success: true,
        message: "Payment already processed",
        redirectURL: "/orderSuccessfull",
      });
    }

    // 🔐 Verify Signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    console.log("Generated Signature:", generatedSignature);
    console.log("Received Signature:", razorpay_signature);

    if (generatedSignature !== razorpay_signature) {
      order.paymentStatus = "Failed";
      order.orderedItems.forEach(item => (item.status = "Failed"));
      await order.save();

      return res.status(400).json({
        success: false,
        redirectURL: `/onlinepayment/orderfailed?orderId=${orderId}`,
      });
    }

    // 🔍 Fetch payment details from Razorpay
    const paymentDetails = await razorpayInstance.payments.fetch(
      razorpay_payment_id
    );

    console.log("Payment Status:", paymentDetails.status);

    // Accept both authorized & captured
    if (!["captured", "authorized"].includes(paymentDetails.status)) {
      order.paymentStatus = "Failed";
      order.orderedItems.forEach(item => (item.status = "Failed"));
      await order.save();

      return res.status(400).json({
        success: false,
        redirectURL: `/onlinepayment/orderfailed?orderId=${orderId}`,
      });
    }

    // 🚀 START TRANSACTION
    session = await mongoose.startSession();
    session.startTransaction();

    // Reduce stock atomically
    for (let item of order.orderedItems) {
      const updatedVariant = await Variant.findOneAndUpdate(
        {
          _id: item.variant,
          quantity: { $gte: item.quantity },
        },
        { $inc: { quantity: -item.quantity } },
        { new: true, session }
      );

      if (!updatedVariant) {
        throw new Error("Product out of stock");
      }
    }

    // Update order status
    order.paymentStatus = "Completed";
    order.orderedItems.forEach(item => (item.status = "Confirmed"));
    await order.save({ session });

    // Clear cart
    await Cart.updateOne(
      { userId: order.userId },
      { $set: { items: [] } },
      { session }
    );

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Clear session values
    delete req.session.addressId;
    delete req.session.paymentMethod;
    delete req.session.couponCode;
    delete req.session.couponDiscount;

    return res.status(200).json({
      success: true,
      redirectURL: "/orderSuccessfull",
    });

  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }

    console.error("Payment Verification Error:", error);

    return res.status(500).json({
      success: false,
      redirectURL: `/onlinepayment/orderfailed?message=Something went wrong`,
    });
  }
};





const getFailurePage = async (req, res, next) => {
    try {
        const { orderId, message } = req.query
        const userId = req.session.user
        const user = await User.findById(userId)
        const cart=await Cart.findOne({userId})

        

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