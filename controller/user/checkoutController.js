const User=require('../../models/userScema')
const Cart=require('../../models/cartSchema')
const Product=require('../../models/productSchema')
const Variant=require('../../models/variantSchema')
const Address=require('../../models/addressSchema')
const httpStatus=require('../../Constants/httpStatuscode')


const viewCheckoutPage = async (req, res, next) => {
  try {
    const userId = req.session.user;
    const user = await User.findById(userId);

    const cart = await Cart.findOne({ userId })
      .populate("items.productId")
      .populate("items.variantId");

    if (!cart || cart.items.length === 0) {
      return res.redirect("/getCart");
    }

    // Validate items again
    for (let item of cart.items) {
      if (!item.productId || item.productId.isBlocked ||
          !item.variantId || !item.variantId.isListed ||
          item.quantity > item.variantId.quantity) {
        return res.redirect("/getCart");
      }
    }

    let subtotal = 0;

    for (let item of cart.items) {
      let quantity = item.quantity;
      let price = item.productId.finalPrice;
      subtotal += quantity * price;
    }

    const tax = Math.round(subtotal * 0.02);
    const total = subtotal + tax;

    const addresses=await Address.findOne({userId})

    res.render("checkoutPage", {
      user,
      cart,
      subTotal: subtotal,
      total,
      tax,
      addresses
    });

  } catch (error) {
    next(error);
  }
};

const selectPayment=async(req,res,next)=>{
  try {
    console.log(req.session.addressId)
    const userId = req.session.user;
    const user = await User.findById(userId);

    const cart = await Cart.findOne({ userId })
      .populate("items.productId")
      .populate("items.variantId");

    if (!cart || cart.items.length === 0) {
      return res.redirect("/getCart");
    }

    // Validate items again
    for (let item of cart.items) {
      if (!item.productId || item.productId.isBlocked ||
          !item.variantId || !item.variantId.isListed ||
          item.quantity > item.variantId.quantity) {
        return res.redirect("/getCart");
      }
    }

    let subtotal = 0;

    for (let item of cart.items) {
      let quantity = item.quantity;
      let price = item.productId.finalPrice;
      subtotal += quantity * price;
    }

    const tax = Math.round(subtotal * 0.02);
    const total = subtotal + tax;

    

    res.render("paymentmethod", {
      user,
      cart,
      subTotal: subtotal,
      total,
      tax,
      
    });

  } catch (error) {
    next(error);
  }
}

const getconfirmationPage=async(req,res,next)=>{
  try{
    const userId=req.session.user 
    const user=await User.findById(userId)
    const addressId=req.session.addressId 
    const paymentMethod=req.session.paymentMethod 

    const cart=await Cart.findOne({userId}).populate('items.productId').populate('items.variantId')
    const addresses=await Address.findOne({userId})
    const address=addresses.address.id(addressId)

    let subTotal=0
    let totalMRP=0
    let applicableDiscount=0

    for(let item of cart.items){
      const price=item.productId.finalPrice 
      const mrp=item.productId.price
      const quantity=item.quantity 
      const itemTotal=quantity*price 
      const priceDifference=mrp-price
      subTotal+=itemTotal 
      totalMRP+=mrp *quantity
      applicableDiscount+=priceDifference 

    }

      
       
       const CGST=Math.round(subTotal*0.09)
       const SGST=Math.round(subTotal*0.09)
       const totalTax = CGST+SGST
       const TotalPayable=subTotal+totalTax
       let shippingCharge = subTotal < 1000 ? 60 : 0;
    res.render('confirmationPage',{
      user,
      address,
      paymentMethod,
      cart,
      subTotal,
      totalMRP,
      CGST,
      SGST,
      totalTax,
      shippingCharge,
      applicableDiscount,
      TotalPayable
    }
    )
  }catch(error){
    next(error)
  }
}

const selectedAddress=async(req,res,next)=>{
  try{
    const {addressId}=req.body 
    if(!addressId){
     return  res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Address is required'})
    }
    req.session.addressId=addressId 
    //res.status(httpStatus.OK).json({success:true})
    res.redirect('/checkout/paymentmethod')
  }catch(error){
    next(error)
  }
}

const selectPaymentmethod=async(req,res,next)=>{
  try{
    const {paymentMethod}=req.body 
    if(!paymentMethod){
      return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Select a payment method'})
    }

    req.session.paymentMethod=paymentMethod
    console.log(req.session.paymentMethod)
    res.redirect('/checkout/confirmationPage')
  }catch(error){
    next(error)
  }
}




module.exports={
viewCheckoutPage,
selectPayment,
getconfirmationPage,
selectedAddress,
selectPaymentmethod
}