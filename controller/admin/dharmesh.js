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