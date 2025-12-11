const User=require('../../models/userScema')
const Product=require('../../models/productSchema')
const httpStatus=require('../../Constants/httpStatuscode')
const Cart=require('../../models/cartSchema')
const Variant=require('../../models/variantSchema')
const Category=require('../../models/categprySchema')
const Subcategory=require('../../models/subcategorySchema')
const Wishlist=require('../../models/wishlistSchema')

const viewCart = async (req, res, next) => {
    try {

        const cartError = req.session.cartError;
        req.session.cartError = null;
        const userId = req.session.user || null
        if (!userId) {
            return res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: 'User not logged in ' })
        }
        const user = await User.findById(userId)

        const cart = await Cart.findOne({ userId })

        if (!cart || cart.items.length == 0) {
            return res.render('cart', {
                user,
                cartItems: [],
                subTotal:0,
                total: 0,
                tax: 0,
                cartCount:0,
                cartError

            })
        }
        const cartItems = []

        let modified = false, quantityModified = false
        let subTotal = 0
        for (let item of cart.items) {

            const product = await Product.findById(item.productId)
            if (!product || product.isBlocked) {
                cart.items.pull(item._id)
                modified = true
                continue
            }

            const variant = await Variant.findById(item.variantId)
            if (!variant || !variant.isListed) {
                cart.items.pull(item._id)
                modified = true
                continue
            }

            if (variant.quantity == 0) {
                   // cart.items.pull(item._id)
                item.quantity = 0

                modified = true
                quantityModified = true
                }

            if (item.quantity > variant.quantity) {
                

                item.quantity = variant.quantity
                modified = true
                quantityModified = true



            }

            const price = product.finalPrice
            const itemsTotal = item.quantity * price
            subTotal = subTotal + itemsTotal

            cartItems.push({
                _id: item._id,
                product,
                variant,
                price,
                itemsTotal,
                quantity:item.quantity,
                isOutOfStock: variant.quantity === 0   
            })
        }

        if (modified) {
            await cart.save()
        }

        const tax = Math.round(subTotal * 0.18)
        const total = subTotal + tax
        const cartCount = cart.items.reduce((acc, item) => {
            return acc += item.quantity
        }, 0)






        res.render('cart', {
            user,
            cartItems,
            total,
            tax,
            subTotal,
            cartCount,
            cartError


        })
    } catch (error) {
        next(error)
    }
}


const addToCart=async(req,res,next)=>{
    try{

        const userId=req.session.user 
        if(!userId){
            return res.status(httpStatus.UNAUTHORIZED).json({success:false,message:'You are not logged in '})
        }

        const {productId,size,color}=req.body
        const quantity=Number(req.body.quantity)
        
 
        

        if(!productId||!size||!color||!quantity){
            return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Product size color and quandity is required'})
        }

        const product=await Product.findById(productId)
        if(!product){
            return res.status(httpStatus.NOT_FOUND).json({success:false,message:'Product is not found'})
        }
        if(product.isBlocked){
            return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'This product is currently unavailable'})
        }

        const category=await Category.findById(product.category)
        if(!category||!category.isListed){
            return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'This product Category is not available'})
        }

        const subcategory=await Subcategory.findById(product.subcategory)
        if(!subcategory||!subcategory.isListed){
            return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'This product subcategory is not available'})
        }

        const variant=await Variant.findOne({product:productId,size,color})
        
        
        if(!variant||!variant.isListed){
            return res.status(httpStatus.NOT_FOUND).json({success:false,message:'Selected Color and size are not available'})
        }
        if(quantity>variant.quantity){
            return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'insufficiant quantiry for selected size and color'})
        }

        let cart=await Cart.findOne({userId})
        if(!cart){
          cart=new Cart({userId,items:[]})
        }

        const existingItem=cart.items.find((item)=>{
            return item.productId.toString()==productId&& item.size==size && item.color===color
            
        })
        
        if(existingItem){
            const qty=existingItem.quantity+quantity
            
            if(qty>5){
                return res.status(httpStatus.BAD_REQUEST).json({status:false,message:'Only 5 products of this size and color can be added'})
            }
            if(qty>variant.quantity){
                return res.status(httpStatus.BAD_REQUEST).json({status:false,message:'Insufficient stock'})
            }
            existingItem.quantity=existingItem.quantity+quantity 
            existingItem.itemsTotal = product.finalPrice * qty; 
        }else{
            cart.items.push({
                productId:productId,
                variantId:variant._id,
                size,
                color,
                MRPprice:product.price,
                price:product.finalPrice,
                //price:product.finalPrice,
                quantity:Math.min(quantity,5),
                itemsTotal:product.finalPrice*quantity
            })
        }

            await cart.save()

            await Wishlist.findOneAndUpdate(
                { userId }, 
                {
                    $pull: {
                        products: { 
                            productId: productId, 
                            color 
                        }
                    }
                }
);


        res.status(httpStatus.OK).json({success:true,message:'Product added to cart successfully'})




    }catch(error){
        next(error)
    }
}


const increment = async (req, res, next) => {
    try {
        const userId = req.session.user;
        const { itemId } = req.body;

        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(400).json({ success: false, message: 'Cart not found' });

        const item = cart.items.id(itemId);
        if (!item) return res.status(400).json({ success: false, message: 'Item not in cart' });

        const product = await Product.findById(item.productId);
        if (!product || product.isBlocked) return res.status(400).json({ success: false, message: 'Product unavailable' });

        const variant = await Variant.findById(item.variantId);
        if (!variant || !variant.isListed) return res.status(400).json({ success: false, message: 'Variant unavailable' });

        // Max quantity per item
        if (item.quantity >= 5) return res.status(400).json({ success: false, message: 'Max 5 items allowed' });

        // Max stock check
        if (item.quantity >= variant.quantity) return res.status(400).json({ success: false, message: 'Insufficient stock' });

        // Increment quantity
        item.quantity += 1;

        // Update cart totals
        await cart.save();
        const summary = await calculatetotalSummary(cart);
        const cartTotal = cart.items.reduce((acc, i) => acc + i.quantity, 0);

        return res.status(200).json({
            success: true,
            message: 'Quantity incremented',
            itemTotal: item.quantity * product.finalPrice,
            quantity: item.quantity,
            cartTotal,
            summary
        });

    } catch (error) {
        next(error);
    }
};

const decrement = async (req, res, next) => {
    try {
        const userId = req.session.user;
        const { itemId } = req.body;

        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(400).json({ success: false, message: 'Cart not found' });

        const item = cart.items.id(itemId);
        if (!item) return res.status(400).json({ success: false, message: 'Item not in cart' });

        const product = await Product.findById(item.productId);
        if (!product || product.isBlocked) return res.status(400).json({ success: false, message: 'Product unavailable' });

        const variant = await Variant.findById(item.variantId);
        if (!variant || !variant.isListed) return res.status(400).json({ success: false, message: 'Variant unavailable' });

        // Only decrement if quantity > 1
        if (item.quantity > 1) {
            item.quantity -= 1;
            await cart.save();
        }

        const summary = await calculatetotalSummary(cart);
        const cartTotal = cart.items.reduce((acc, i) => acc + i.quantity, 0);

        return res.status(200).json({
            success: true,
            message: 'Quantity decremented',
            itemTotal: item.quantity * product.finalPrice,
            quantity: item.quantity,
            cartTotal,
            summary
        });

    } catch (error) {
        next(error);
    }
};

const removeItem=async(req,res,next)=>{
    try{
        const userId=req.session.user 
        const {itemId}=req.body

        const cart=await Cart.findOne({userId})
        if(!cart){
            return res.status(httpStatus.NOT_FOUND).json({success:false,message:'Cannot find cart'})
        }
        const item=cart.items.id(itemId)
        if(!item){
            return res.status(httpStatus.NOT_FOUND).json({success:false,message:'Cannot find item'})
        }

        cart.items.pull(item)
        await cart.save()

        return res.status(httpStatus.OK).json({success:true,message:'Item removed from the cart'})
    }catch(error){
        next(error)
    }
}

async function calculatetotalSummary(cart){
    let subTotal=0
    
    
    for(let item of cart.items){
        const product=await Product.findById(item.productId)
        if(!product){
            return
        }
        const variant=await Variant.findById(item.variantId)
        if(!variant){
            return
        }

        const price=product.finalPrice
         
         subTotal+=price*item.quantity
    }

    const tax=Math.round(subTotal*0.02)
    const total=subTotal+tax 
    
    return{subTotal,tax,total}

}



module.exports={
    viewCart,
    addToCart,
    increment,
    decrement,
    removeItem
}