const Cart=require('../models/cartSchema')

const countCartMiddleware=async(req,res,next)=>{
    try{
         let cartCount = 0; 

        if(req.session.user){
            const cart=await Cart.findOne({userId:req.session.user})

           if (cart && cart.items && cart.items.length > 0) {
                cartCount = cart.items.reduce(
                (total, item) => total + item.quantity,
                0
                );
            }

            res.locals.cartCount=cartCount
        }else{
            res.locals.cartCount=0
        }

        next()

    }catch(error){
        res.locals.cartCount=0
        next(error)
    }
}

module.exports={
    countCartMiddleware
}