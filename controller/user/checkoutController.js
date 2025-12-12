const User=require('../../models/userScema')
const Cart=require('../../models/cartSchema')
const Product=require('../../models/productSchema')
const Variant=require('../../models/variantSchema')
const Address=require('../../models/addressSchema')
const Coupons=require('../../models/couponSchema')
const httpStatus=require('../../Constants/httpStatuscode')
require('dotenv').config()


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
      addresses: addresses?.address || []
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

const getconfirmationPage = async (req, res, next) => {
  console.log('comntroller hit')
  try {
    const userId = req.session.user
    const user = await User.findById(userId)
    const addressId = req.session.addressId
    const paymentMethod = req.session.paymentMethod
    const couponId = req.query.couponId
    console.log(couponId)

    const cart = await Cart.findOne({ userId }).populate('items.productId').populate('items.variantId')
    const addresses = await Address.findOne({ userId })
    const address = addresses.address.id(addressId)

    let subTotal = 0
    let totalMRP = 0
    let applicableDiscount = 0

    for (let item of cart.items) {
      const price = item.productId.finalPrice
      const mrp = item.productId.price
      const quantity = item.quantity
      const itemTotal = quantity * price
      const priceDifference = mrp - price
      subTotal += itemTotal
      totalMRP += mrp * quantity
      applicableDiscount += priceDifference

    }

    

      const coupons = await Coupons.find({
      status: true,
       
    });

    

      
    

    let appliedCoupon = null
    let discount = 0

    if (couponId) {
      let coupon = await Coupons.findById(couponId)
      
      if (coupon&&coupon.usagePerUser!==null) {
        const userExist = coupon?.usedUsers?.find((u) => u.userId.toString() == userId.toString())
        if (userExist) {
          if (userExist.count >= coupon.usagePerUser) {
            
                const CGST = Math.round(subTotal * 0.09)
                const SGST = Math.round(subTotal * 0.09)
                const totalTax = CGST + SGST
                const TotalPayable = subTotal + totalTax
                let shippingCharge = subTotal < 1000 ? 60 : 0;
                const referralCoupons = user.referralCoupons.filter((c) => c.isUsed == false)



               return  res.render('confirmationPage', {
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
                  TotalPayable,
                  coupons,
                  appliedCoupon,
                  couponError:"You reached the maximum usage limit of this coupon",
                  rewardCoupons: referralCoupons,

                }
                )
          }

        }

      } 

        if (!coupon) {
        coupon = user.referralCoupons.id(couponId);
        if (coupon) coupon.isReferral = true;
    }

      if (coupon && coupon.isReferral) {
        discount = coupon.discount
        coupon.isUsed = true
        appliedCoupon = {
          code: coupon.couponCode,
          discountValue: coupon.discount,
          discount: discount
        }
      } else {

        if (coupon &&coupon.type == 'fixed') {
          discount = coupon.discountValue
        } else {
          discount = subTotal * (coupon.discountValue / 100)
        }

        if (discount > coupon.maximumDiscount) {
          discount = coupon.maximumDiscount
        }
        appliedCoupon = {
          code: coupon.code,
          discountValue: coupon.discountValue,
          discount: discount
        }

      }



      subTotal = subTotal - discount


      req.session.couponCode = coupon.isReferral ? coupon.couponCode : coupon.code;
      req.session.couponDiscount = discount

    }





    const CGST = Math.round(subTotal * 0.09)
    const SGST = Math.round(subTotal * 0.09)
    const totalTax = CGST + SGST
    const TotalPayable = subTotal + totalTax
    let shippingCharge = subTotal < 1000 ? 60 : 0;
    const referralCoupons = user.referralCoupons.filter((c) => c.isUsed == false)



    res.render('confirmationPage', {
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
      TotalPayable,
      coupons,
      appliedCoupon,
      rewardCoupons: referralCoupons,

    }
    )
  } catch (error) {
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
selectPaymentmethod,

}



