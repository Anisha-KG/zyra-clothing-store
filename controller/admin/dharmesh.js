const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const SubCategory = require("../../models/subcategorySchema");
const User = require("../../models/userSchema");
const Cart = require("../../models/cartSchema");
const Address = require("../../models/adressSchema");

const getCheckoutPage = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const userData = await User.findById(userId);
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    let errorMessage = null;

    if (!cart || cart.items.length === 0) {
      return res.render("user/cart", {
        user: userData,
        items: [],
        grandTotal: 0,
        tax: 0,
        shippingCharge: 0,
        payableTotal: 0,
        errorMessage: "Your cart is empty."
      });
    }

    const validItems = [];

    for (let item of cart.items) {
      const product = await Product.findById(item.productId)
        .populate("categoryId")
        .populate("subCategoryId");

      if (
        !product ||
        product.isDeleted ||
        !product.isListed ||
        !product.categoryId ||
        product.categoryId.isDeleted ||
        !product.subCategoryId ||
        product.subCategoryId.isDeleted
      ) {
        errorMessage = "Some unavailable products were removed from your cart.";
        continue;
      }

      const variant = product.variants.find(
        v => v.color === item.color && v.size === item.size
      );

      if (!variant) {
        errorMessage = "Some unavailable products were removed.";
        continue;
      }

      const stock = variant.variantQuantity;

      if (stock <= 0) {
        errorMessage = "Some items were out of stock and removed.";
        continue;
      }

      if (item.quantity > stock) {
        item.quantity = stock;
        errorMessage = "Quantities adjusted due to stock changes.";
      }

      item.salePrice = variant.salePrice;

      // 🟢 FIX: Always set the correct image
      item.mainImage =
        product.images?.[0]?.url ||  // new format
        product.images?.[0] ||       // old string format
        null;

      validItems.push(item);
    }

    cart.items = validItems;
    await cart.save();

    if (cart.items.length === 0) {
      return res.render("user/cart", {
        user: userData,
        items: [],
        grandTotal: 0,
        tax: 0,
        shippingCharge: 0,
        payableTotal: 0,
        errorMessage: "All items were removed due to stock issues."
      });
    }

    let grandTotal = 0;
    cart.items.forEach(i => {
      grandTotal += i.quantity * i.salePrice;
    });

    const addressesDoc = await Address.findOne({ userId });
    const addresses = addressesDoc ? addressesDoc.address : [];

    return res.render("user/checkout-address", {
      user: userData,
      addresses,
      cartItems: cart.items,
      grandTotal,
      errorMessage
    });

  } catch (error) {
    console.log(error);
    return res.redirect("/pageNotFound");
  }
};

module.exports = {
  getCheckoutPage
};





const loadOnlinePaymentPage = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.redirect("/user/cart");
    }

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: Math.round(order.payableAmount * 100), 
      currency: "INR",
      receipt: order_rcpt_${orderId},
      payment_capture: 1
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return res.render("user/onlinePayment", {
      order,
      razorpayOrder,
      key_id: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.log("Razorpay load error:", error);
    return res.redirect("/500");
  }
};

const verifyRazorpayPayment = async (req, res) => {

  try {
     
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      await Order.findOneAndUpdate(
        { orderId },
        { $set: { status: "failed", paymentStatus: "failed" } }
      );
      return res.json({ success: false, redirectURL:/user/orderFailed/${orderId}});
    }

    const hash = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (hash !== razorpay_signature) {
      await Order.findOneAndUpdate(
        { orderId },
        { $set: { status: "failed", paymentStatus: "failed" } }
      );
      return res.json({ success: false, redirectURL:/user/orderFailed/${orderId}});
    }

    const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);

    if (payment.status !== "captured") {
 
      await Order.findOneAndUpdate(
        { orderId },
        { $set: { status: "failed", paymentStatus: "failed" } }
      );
      return res.json({
        success: false,
        redirectURL: /user/orderFailed/${orderId}
      });
    }

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    order.paymentStatus = "completed";
    order.status = "confirmed";
    await order.save();

    for (let item of order.orderedItems) {
      await Product.updateOne(
        {
          _id: item.productId,
          "variants.size": item.size,
          "variants.color": item.color
        },
        {
          $inc: { "variants.$.quantity": -item.quantity }
        }
      );
    }
    await Cart.updateOne({ userId: order.userId }, { $set: { items: [] } });

    return res.json({
      success: true,
      redirectURL: /user/orderSuccess/${order.orderId}
    });

  } catch (error) {
    console.log("Payment verification error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const   getOrderFailedPage=async (req,res)=>{
  try{
    const orderId=req.params.orderId
    const order=await Order.findOne({orderId})
    if(!order){
      return res.redirect("/user/order")
    }
    return res.render("user/orderFailed", { order });

  }
  catch (error){
    console.log("Order failed page error:", error);
    return res.redirect("/user/Page-404.ejs");
  }
}

const retryPayment = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(400).json({ success: false, message: "Order not found" });
    }

    if (order.paymentStatus !== "failed") {
      return res.ststus(400).json({ success: false, message: "Payment already completed or retry not allowed" });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Order is cancelled. Retry not allowed" });
    }

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: Math.round(order.payableAmount * 100),
      currency: "INR",
      receipt: retry_rcpt_${orderId},
      payment_capture: 1
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return res.json({
      success: true,
      redirectURL: /user/online-payment/${orderId}
    });

  } catch (err) {
    return res.json({ success: false, message: "Error processing retry request" });
  }






  const confirmOrder = async (req, res) => { 
  try {
      
    const userId = req.session.user._id;
    const { addressId, paymentMethod } = req.body;
    console.log("request body is ",req.body)

    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart || cart.items.length === 0) {
      return res.redirect("/user/cart");
    }

    const validItems = [];

    for (let item of cart.items) {
      const product = await Product.findById(item.productId)
        .populate("categoryId")
        .populate("subCategoryId");

      if (!product) continue;
      if (!product.isListed || product.isDeleted) continue;
      if (product.categoryId?.isDeleted || !product.categoryId?.isListed) continue;
      if (product.subCategoryId?.isDeleted || !product.subCategoryId?.isListed) continue;

      const variant = product.variants.find(
        v => v.color === item.color && v.size === item.size
      );

      if (!variant) continue;
      if (variant.variantQuantity <= 0) continue;

      item.variantPrice = variant.variantPrice;
      item.salePrice = variant.salePrice;

      validItems.push(item);
    }

    if (validItems.length === 0) {
      return res.redirect("/user/cart");
    }

    let subTotal = 0;
    let discountAmount = 0;

    validItems.forEach(i => {
      subTotal += i.variantPrice * i.quantity;
      discountAmount += (i.variantPrice - i.salePrice) * i.quantity;
    });

    const cgst = subTotal * 0.09;
    const sgst = subTotal * 0.09;
    const deliveryCharge = subTotal < 1000 ? 50 : 0;

    const payableAmount =
      subTotal - discountAmount + cgst + sgst + deliveryCharge;

    const addressDoc = await Address.findOne({ userId });
    const selectedAddress = addressDoc.address.id(addressId);

    const addressString =
      `${selectedAddress.fullName}, ${selectedAddress.houseNo}, ` +
      `${selectedAddress.city}, ${selectedAddress.landMark}, ` +
      `${selectedAddress.district}, ${selectedAddress.state}, ` +
      ${selectedAddress.pincode}, Phone: ${selectedAddress.phone};

    const orderedItems = validItems.map(i => ({
      productId: i.productId._id,
      productName: i.productId.name,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
      price: i.variantPrice,
      salePrice: i.salePrice,
      finalPrice: i.salePrice * i.quantity,
      status: "pending"
    }));

    if (paymentMethod === "cod") {
      const order = new Order({
        userId,
        orderedItems,
        subTotal,
        discountAmount,
        deliveryCharge,
        payableAmount,
        address: addressString,
        appliedCoupon: null,
        paymentMethod: "cod",
        paymentStatus: "completed",
        status: "confirmed"
      });

      await order.save();

      for (let i of validItems) {
        await Product.updateOne(
          {
            _id: i.productId._id,
            "variants.size": i.size,
            "variants.color": i.color
          },
          { $inc: { "variants.$.variantQuantity": -i.quantity } }
        );
      }

      cart.items = cart.items.filter(
        c => !validItems.some(
          v =>
            v.productId._id.toString() === c.productId._id.toString() &&
            v.size === c.size &&
            v.color === c.color
        )
      );

      await cart.save();

      return res.redirect("/user/orderSuccess/" + order.orderId);
    }

    if (paymentMethod === "razorpay") {
      const order = new Order({
        userId,
        orderedItems,
        subTotal,
        discountAmount,
        deliveryCharge,
        payableAmount,
        address: addressString,
        appliedCoupon: null,
        paymentMethod: "razorpay",
        paymentStatus: "pending",
        status: "pending"
      });

      await order.save();
      req.session.tempOrderId = order.orderId;
      return res.redirect(/user/online-payment/${order.orderId});
    }


    if (paymentMethod === "wallet") {

      const wallet = await Wallet.findOne({ userId });
      if (!wallet || wallet.balance < payableAmount) {
        req.flash("error_msg", "Insufficient wallet balance");
        return res.redirect("/user/checkoutPayment?addressId=" + addressId);
      }

      await deductMoneyFromWallet(userId, payableAmount, {
        description: "Order Payment",
        method: "wallet_payment"
      });

      orderedItems.forEach(item => item.status = "confirmed");

      const order = new Order({
        userId,
        orderedItems,
        subTotal,
        discountAmount,
        deliveryCharge,
        payableAmount,
        address: addressString,
        appliedCoupon: null,
        paymentMethod: "wallet",
        paymentStatus: "completed",
        status: "confirmed"
      });

      await order.save();

      for (let i of validItems) {
        await Product.updateOne(
          { _id: i.productId._id, "variants.size": i.size, "variants.color": i.color },
          { $inc: { "variants.$.variantQuantity": -i.quantity } }
        );
      }

      cart.items = cart.items.filter(c => !validItems.some(
        v =>
          v.productId._id.toString() === c.productId._id.toString() &&
          v.size === c.size &&
          v.color === c.color
      ));
      await cart.save();

      return res.redirect("/user/orderSuccess/" + order.orderId);
    }

  } catch (error) {
    console.log("Confirm Order Error:", error);
    return res.redirect("/500");
    }

};