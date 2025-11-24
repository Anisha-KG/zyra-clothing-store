const httpStatus=require('../../Constants/httpStatuscode')
const User=require('../../models/userScema')
const Cart=require('../../models/cartSchema')
const Address=require('../../models/addressSchema')
const Order=require('../../models/orderSchema')
const Product=require('../../models/productSchema')
const Variant=require('../../models/variantSchema')
const Orders=require('../../models/orderSchema')


const placeOrder=async(req,res,next)=>{
    try{

        
        const addressId=req.session.addressId 
        const paymentMethod=req.session.paymentMethod 


        if(!addressId||!paymentMethod){
            return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'required details not available'})
        }

        const userId=req.session.user 
        const user=await User.findById(userId)

        const cart=await Cart.findOne({userId}).populate('items.productId').populate('items.variantId')
        if(!cart||cart.items.length==0){
             return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Cart not available'})
        }

        const addressDoc=await Address.findOne({userId})
        if(!addressDoc){
            return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Address document not found'})
        }

        const selectedAddress=addressDoc.address.find((addr)=>{
            return addr._id.toString()===addressId.toString()
        })
        if(!selectedAddress){
             return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Selected address not found'})
        }

                    const formattedAddress = `
                ${selectedAddress.name}
                ${selectedAddress.addressName}
                ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}
                Landmark: ${selectedAddress.landmark || "N/A"}
                Phone: ${selectedAddress.phone}
                `.trim();

        

        const orderedProducts=cart.items.map((item)=>{
            const product=item.productId 
            return{
                product:product._id,
                variant:item.variantId._id,
                productName:item.productId.name,
                MRPprice:item.totalPrice,
                finalPrice:item.price,
                size:item.size,
                color:item.color,
                quantity:item.quantity,
                totalPrice:item.totalPrice,
                status:'Confirmed'
            }
        })
        const summary=await calculatetotalSummary(cart)
        const deliveryCharge=summary.subTotal>1000?0:60

        const newOrder=new Order({
            userId,
            orderedItems:orderedProducts,
            subTotal:summary.subTotal,
            deliveryCharge,
            discount:0,
            totalPayable:summary.total,
            address:formattedAddress,
            paymentMethod,
            invoiceDate:new Date(),
            paymentStatus:'pending',
            status:'confirmed'




        })
        await newOrder.save()

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

await Cart.updateOne({userId:userId},{$set:{items:[]}})

delete req.session.address 
delete req.session.paymentMethod 

res.status(httpStatus.OK).json({success:true,message:'Order placed successfully'})

    }catch(error){
        next(error)
    }
}

const orderSuccessfull=async(req,res,next)=>{
    try{
        const userId=req.session.user 
        const user=await User.findById(userId)
        res.render('orderSuccessfullPage',{user})

    }catch(error){
        next(error)
    }
}

const orderDetails=async(req,res,next)=>{
    try{
        const userId=req.session.user 
        const user=await User.findById(userId)
        res.render('orderDetails',{user})
    }catch(error){
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

const orderedProducts=async(req,res,next)=>{
    try{
        const userId=req.session.user 
        const user=await User.findById(userId) 
        const itemId=req.params.itemId 
        const order=await Order.findOne({userId,'orderedItems._id':itemId})
                        .populate('orderedItems.product')
                        .populate('orderedItems.variant')
        const orderedItem=order.orderedItems.id(itemId)


        res.render('orderedProducts',{
            user,
            order,
            itemId,
            orderedItem
        })
    }catch(error){
        next(error)
    }
}
const requestCancelOrder = async (req, res, next) => {
  try {
    const { orderId, itemId, cancelReason } = req.body;

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

    return res.status(200).json({ success: true, message: 'Item cancelled' });
  } catch (error) {
    next(error);
  }
};



const productDetails=async(req,res,next)=>{
    
    try{
        res.render('orderedProducts')
    }catch(error){
        next(error)
    }
}


async function calculatetotalSummary(cart){
    let subTotal=0
    
    
    for(let item of cart.items){
        
         
         subTotal+=item.totalPrice
    }

    const tax=Math.round(subTotal*0.02)
    const total=subTotal+tax 
    
    return{subTotal,tax,total}

}

module.exports={
    placeOrder,
    orderSuccessfull,
    orderDetails,
    listOrder,
    orderedProducts,
    productDetails,
    requestCancelOrder
}