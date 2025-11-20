const User = require("../models/userScema");
const Cart = require("../models/cartSchema");
const Product = require("../models/productSchema");
const Variant = require("../models/variantSchema");

const validateCart1= async (req, res, next) => {
    
  try {
    const userId = req.session.user;
    if (!userId) return res.redirect("/login");

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
        req.session.errorMsg='Cart is empty'
      return res.redirect("/getCart");
    }

    let modified = false;

    for (let item of cart.items) {
      const product = await Product.findById(item.productId)
        .populate([{ path: "category" }, { path: "subcategory" }]);

      
      if (!product || product.isBlocked) {
        modified = true;
        continue;
      }

      
      if (
        !product.category ||
        product.category.isDeleted ||
        !product.subcategory ||
        !product.subcategory.isListed
      ) {
        modified = true;
        continue;
      }

      const variant = await Variant.findById(item.variantId);


      if (!variant || !variant.isListed) {
        modified = true;
        continue;
      }

      if (item.quantity > variant.quantity) {
       
        modified = true;
      }
      
    }

    
    if (!modified) {
      
      req.session.cartError =
        "Some items were updated due to unavailability or stock changes.";
      return res.redirect("/getCart");
    }
        next();
    

    
    
  } catch (err) {
    next(err);
  }
};
const validateCart= async (req, res, next) => {
  try {
    const userId = req.session.user;
    if (!userId) return res.redirect("/login");

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      req.session.errorMsg = "Cart is empty";
      console.log(req.session.errorMsg)
      return res.redirect("/getCart");
    }

    for (let item of cart.items) {

      // Quantity zero
      if (item.quantity === 0) {
        req.session.cartError = "Item quantity cannot be zero.";
        console.log(req.session.cartError)
        return res.redirect("/getCart");
      }

      const product = await Product.findById(item.productId)
        .populate([{ path: "category" }, { path: "subcategory" }]);

      if (!product || product.isBlocked) {
        req.session.cartError = "Some products are unavailable.";
        console.log(req.session.cartError)
        return res.redirect("/getCart");
      }

      if (!product.category || product.category.isDeleted) {
        req.session.cartError = "Product category is unavailable.";
        console.log(req.session.cartError)
        return res.redirect("/getCart");
      }

      if (!product.subcategory || !product.subcategory.isListed) {
        req.session.cartError = "Product subcategory is unavailable.";
        console.log(req.session.cartError)
        return res.redirect("/getCart");
      }

      const variant = await Variant.findById(item.variantId);

      if (!variant || !variant.isListed) {
        req.session.cartError = "Variant unavailable.";
        console.log(req.session.cartError)
        return res.redirect("/getCart");
      }

      if (item.quantity > variant.quantity) {
        req.session.cartError = "Item exceeds available stock.";
        console.log(req.session.cartError)
        return res.redirect("/getCart");
      }
    }

    // All checks passed -> continue
    next();

  } catch (err) {
    next(err);
  }
};

const validateCart2 = async (req, res, next) => {
  try {
    const userId = req.session.user;
    if (!userId) return res.redirect("/login");

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
        req.session.errorMsg='Cart is empty'
      return res.redirect("/getCart");
    }

    let modified = false;

    for (let item of cart.items) {
      const product = await Product.findById(item.productId)
        .populate("category")
        .populate("subcategory");

      
      if (!product || !product.isListed) {
        modified = true;
        continue;
      }

      
      if (
        !product.category ||
        product.category.isDeleted ||
        !product.subcategory ||
        !product.subcategory.isListed
      ) {
        modified = true;
        continue;
      }

      const variant = await Variant.findById(item.variantId);


      if (!variant || !variant.isListed) {
        modified = true;
        continue;
      }

      if (item.quantity > variant.quantity) {
       
        modified = true;
      }
    }

    
    if (!modified) {
      
      req.session.cartError =
        "Some items were updated due to unavailability or stock changes.";
      return res.redirect("/getCart");
    }

    
    next();
  } catch (err) {
    next(err);
  }
};




module.exports = {validateCart};
