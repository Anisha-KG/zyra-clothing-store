const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const SubCategory = require("../../models/subcategorySchema");
const User = require("../../models/userSchema");
const Cart = require("../../models/cartSchema");

const addToCart = async (req, res) => {
  try {
    console.log("add to cart controller function hit")
    const userId = req.session.user._id;
    const { productId, size, color, quantity = 1 } = req.body;

    if (!productId || !color || !size) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const product = await Product.findById(productId)
      .populate("categoryId")
      .populate("subCategoryId");

    if (!product || product.isDeleted === true || product.isListed === false) {
      return res.status(400).json({ success: false, message: "Product not available" });
    }

    if (product.categoryId && (product.categoryId.isDeleted === true || product.categoryId.isListed === false)) {
      return res.status(400).json({ success: false, message: "Category inactive" });
    }

    if (product.subCategoryId && (product.subCategoryId.isDeleted === true || product.subCategoryId.isListed === false)) {
      return res.status(400).json({ success: false, message: "Subcategory inactive" });
    }

    const variant = product.variants.find(v => v.color === color && v.size === size);

    if (!variant) {
      return res.status(400).json({ success: false, message: "Variant not available" });
    }

    if (variant.variantQuantity < 1) {
      return res.status(400).json({ success: false, message: "Out of stock" });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    let existingItem = cart.items.find(
      item =>
        item.productId.toString() === productId &&
        item.size === size &&
        item.color === color
    );

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (newQty > 5) {
        return res.status(400).json({ success: false, message: "Max 5 allowed" });
      }
      existingItem.quantity = newQty;
    } else {
      cart.items.push({
        productId,
        color,
        size,
        quantity,
        variantPrice: variant.variantPrice,
        salePrice: variant.salePrice,
        sku: variant.sku || ""
      });
    }

    let grandTotal = 0;
    cart.items.forEach(item => {
      grandTotal += item.salePrice * item.quantity;
    });

    const shippingCharge = grandTotal < 1000 ? 50 : 0;
    const tax = grandTotal * 0.18;
    const payableTotal = grandTotal + tax + shippingCharge;

    await cart.save();

    return res.status(200).json({
      success: true,
      message: existingItem ? "Cart updated" : "Added to cart",
      cartCount: cart.items.length,
      updatedTotal: {
        grandTotal,
        shippingCharge,
        payableTotal
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
const getCartPage = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const userDetails = await User.findById(userId);

    let cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart) {
      return res.render("user/cart", {
        user: userDetails,
        items: [],
        grandTotal: 0,
        tax: 0,
        shippingCharge: 0,
        payableTotal: 0
      });
    }

    const validItems = [];

    for (let item of cart.items) {
      const product = await Product.findById(item.productId)
        .populate("categoryId")
        .populate("subCategoryId");

      if (
        !product ||
        product.isDeleted === true ||
        product.isListed === false ||
        !product.categoryId ||
        !product.subCategoryId ||
        product.categoryId.isDeleted === true ||
        product.categoryId.isListed === false ||
        product.subCategoryId.isDeleted === true ||
        product.subCategoryId.isListed === false
      ) {
        continue;
      }

      validItems.push(item);
    }

    cart.items = validItems;
    await cart.save();

    let grandTotal = 0;
    cart.items.forEach(item => {
      grandTotal += item.quantity * item.salePrice;
    });

    const tax = grandTotal * 0.18;
    const shippingCharge = grandTotal < 1000 ? 50 : 0;
    const payableTotal = grandTotal + tax + shippingCharge;

    return res.render("user/cart", {
      user: userDetails,
      items: cart.items,
      grandTotal,
      tax,
      shippingCharge,
      payableTotal
    });

  } catch (error) {
    return res.redirect("/pageNotFound");
  }
};


const increseQuantity = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const { productId, color, size } = req.body;

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(400).json({ success: false, message: "cart not found" });
        }

        let item = cart.items.find(
            i =>
                i.productId.toString() === productId &&
                i.color == color &&
                i.size == size
        );

        if (!item) {
            return res.status(400).json({ success: false, message: "item not found in cart" });
        }

        if (item.quantity >= 5) {
            return res.status(400).json({ success: false, message: "max 5 qty allowed" });
        }

        let product = await Product.findById(productId);
        const variant = product.variants.find(
            v => v.color == color && v.size == size
        );

        if (item.quantity + 1 > variant.variantQuantity) {
            return res.status(400).json({ success: false, message: "Not enough stock" });
        }

        item.quantity += 1;
        await cart.save();

        let grandTotal = 0;
        cart.items.forEach(i => {
            grandTotal += i.quantity * i.salePrice;
        });

        let tax = grandTotal * 0.18;
        let shippingCharge = grandTotal < 1000 ? 50 : 0;
        const payableTotal = grandTotal + tax + shippingCharge;

        return res.status(200).json({
            success: true,
            message: "Quantity Increased",
            itemQuantity: item.quantity,
            updatedTotal: {
                grandTotal,
                tax,
                shippingCharge,
                payableTotal
            }
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

const decreaseQuantity = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const { productId, color, size } = req.body;

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(400).json({ success: false, message: "cart not found" });
        }

        let item = cart.items.find(
            i =>
                i.productId.toString() === productId &&
                i.color == color &&
                i.size == size
        );

        if (!item) {
            return res.status(400).json({ success: false, message: "item not found in cart" });
        }

        if (item.quantity === 1) {
            cart.items = cart.items.filter(
                i =>
                    !(
                        i.productId.toString() === productId &&
                        i.color == color &&
                        i.size == size
                    )
            );

            await cart.save();

            let grandTotal = 0;
            cart.items.forEach(i => {
                grandTotal += i.quantity * i.salePrice;
            });

            let tax = grandTotal * 0.18;
            let shippingCharge = grandTotal < 1000 ? 50 : 0;
            const payableTotal = grandTotal + tax + shippingCharge;

            return res.status(200).json({
                success: true,
                itemRemoved: true,
                updatedTotal: {
                    grandTotal,
                    tax,
                    shippingCharge,
                    payableTotal
                }
            });
        }

        item.quantity -= 1;
        await cart.save();

        let grandTotal = 0;
        cart.items.forEach(i => {
            grandTotal += i.quantity * i.salePrice;
        });

        let tax = grandTotal * 0.18;
        let shippingCharge = grandTotal < 1000 ? 50 : 0;
        const payableTotal = grandTotal + tax + shippingCharge;

        return res.status(200).json({
            success: true,
            itemQuantity: item.quantity,
            updatedTotal: {
                grandTotal,
                tax,
                shippingCharge,
                payableTotal
            }
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

const removeCartItem = async (req, res) => {
    try {
        console.log("remove cart item controller hit")
        const userId = req.session.user._id;
        const { productId, size, color } = req.body;

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(400).json({ success: false, message: "Cart not found" });
        }

        cart.items = cart.items.filter(
            i =>
                !(
                    i.productId.toString() === productId &&
                    i.size === size &&
                    i.color === color
                )
        );

        await cart.save();

        let grandTotal = 0;
        cart.items.forEach(i => {
            grandTotal += i.quantity * i.salePrice;
        });

        let tax = grandTotal * 0.18;
        let shippingCharge = grandTotal < 1000 ? 50 : 0;
        let payableTotal = grandTotal + tax + shippingCharge;

        return res.status(200).json({
            success: true,
            updatedTotal: {
                grandTotal,
                tax,
                shippingCharge,
                payableTotal
            }
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

const emptyCart = async (req, res) => {
    try {
        const userId = req.session.user._id;

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(400).json({ success: false, message: "Cart not found" });
        }

        cart.items = [];
        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Cart emptied successfully"
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};


module.exports = {
  addToCart,
  getCartPage
};



  <script>
function updateSummary(summary) {
    if (!summary) return;

    document.getElementById("subTotal").innerText = "₹" + (summary.subTotal || 0);
    document.getElementById("tax").innerText = "₹" + (summary.tax || 0);
    document.getElementById("total").innerText = "₹" + (summary.total || 0);
}

// Make sure increment is also global
async function increment(itemId) {
    try {
        const response = await fetch('/cart/incrementQuantity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId })
        });

        const result = await response.json();
        const qtyElement = document.getElementById(`qty-${itemId}`);
        qtyElement.innerText = result.quantity;

        // Update summary safely
        if (typeof updateSummary === 'function') {
            updateSummary(result.summary);
        }

        if (result.insufficientStock) {
            Swal.fire({ icon: 'warning', title: 'Stock Limit', text: 'Reached max stock available' });
        }

    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Something went wrong'
        });
    }
}

// Make it accessible in HTML onclick
window.increment = increment;
</script>


<script>

  function updateSummary(summary) {

    
    if (!summary) return;

    // Update subtotal, tax, total
    document.getElementById("subTotal")?.innerText = "₹" + summary.subTotal;
    document.getElementById("tax")?.innerText = "₹" + summary.tax;
    document.getElementById("total")?.innerText = "₹" + summary.total;
  }
  
</script>
<script>
  async function increment(itemId) {
  console.log("FUNCTION CALLED", itemId);

  try {
    const response = await fetch('/cart/incrementQuantity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId })
    });

    let result;
    try {
      result = await response.json();
    } catch (e) {
      console.error('Invalid JSON', e);
      return;
    }

    const qtyElement = document.getElementById(`qty-${itemId}`);
    console.log(result)

    if (!response.ok) {
      // Handle non-200 status gracefully
      if (result && result.message) {
        Swal.fire({ icon: 'warning', title: 'Error', text: result.message });
      }
      return;
    }

    if (result.insufficientStock) {
      qtyElement.innerText = result.quantity;
      updateSummary(result.summary);
      Swal.fire({ icon: 'warning', title: 'Stock Limit', text: result.message });
      return;
    }

    if (result.success) {
      qtyElement.innerText = result.quantity;
      updateSummary(result.summary);
      return;
    }

  } catch (error) {
    console.error(error);
    // Only show the alert if it's a real network or unexpected error
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Something went wrong'
    });
  }
}
window.increment = increment;
</script>




