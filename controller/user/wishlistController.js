const Wishlist=require('../../models/wishlistSchema')
const httpStatus=require('../../Constants/httpStatuscode')
const Variant=require('../../models/variantSchema')
const User=require('../../models/userScema')
const Product=require('../../models/productSchema')
const Category=require('../../models/categprySchema')
const Subcategory=require('../../models/subcategorySchema')
const {calculateBestOffer}=require('../../helpers/calculatingBestOffer')

const getWishlist = async (req, res, next) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId);

        const wishlist = await Wishlist.findOne({ userId })
            .populate({
                path: 'products.productId'
            });

        if (!wishlist) {
            return res.render('wishlist', {
                user,
                items: [],
                totalItems: 0
            });
        }

        const items = [];

        // FIXED LOOP
        for (let entry of wishlist.products) {
            let product = entry.productId;
            if(product.isBlocked) continue

            const bestOffer = await calculateBestOffer(product);
            
            const discountAmount = (product.price * bestOffer) / 100;
            product.bestOffer = bestOffer;
            product.finalPriceDynamic = Math.round(product.price - discountAmount);


            const color = entry.color;

            const variant = await Variant.findOne({
                product: product._id,
                color: color
            });

            const variants = await Variant.find({
                product: product._id,
                color: color
            });

            const availableSizes = variants.map(v => v.size);

            if (!variant) continue;

            items.push({
                productId: product._id,
                name: product.name,
                color: color,
                prize: product.finalPriceDynamic,
                bestOffer:product.bestOffer,
                mrp: product.price,
                variant,
                availableSizes
            });
        }

        return res.render('wishlist', {
            user,
            items,
            totalItems: items.length
        });

    } catch (error) {
        next(error);
    }
};


const getWishlist1=async(req,res,next)=>{
    try{

        const userId=req.session.user 
        const user=await User.findById(userId)
        const wishlist=await Wishlist.findOne({userId})
                .populate({
                    path:'products.productId',
                    
                })
                .populate({
                    path:'products.variantId',
                    
                })
        const totalItems=wishlist?wishlist.products.length :0

        res.render('wishlist',{
            user,
            wishlist,
            totalItems
        })


    }catch(error){
       res.redirect('/pageNotFound')
    }
}



const addToWishlist=async(req,res,next)=>{
    
    try{

        const {productId,variantId}=req.body 
        const userId=req.session.user
        if(!productId||!variantId){
            return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Insufficeant  data'})
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
        
                const variant=await Variant.findById(variantId)
                
                
                if(!variant||!variant.isListed){
                    return res.status(httpStatus.NOT_FOUND).json({success:false,message:'Selected Color and size are not available'})
                }

       

        const wishlist=await Wishlist.findOne({userId})
        if(!wishlist){
            const newWishlist=new Wishlist({
                userId,
                products:[
                    {
                        productId,
                        variantId,
                        addedOn:Date.now()
                    }

                ]
            })

             await newWishlist.save()

        return res.status(httpStatus.OK).json({success:true,message:'Product added to wishlist successfully'})
        }else{
            wishlist.products.push({
                        productId,
                        variantId,
                        addedOn:Date.now()
                    })

                  await  wishlist.save()

                  res.status(httpStatus.OK).json({success:true,message:'Product added to wishlist successfully'})
        }

    }catch(error){
        next(error)
    }
}

const removeFromWishlist=async(req,res,next)=>{
    console.log('controller hit remove')
    try{

        const{productId,variantId}=req.body 
         const userId=req.session.user
        if(!productId||!variantId){
            return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Cannot complete request'})
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
        
                const variant=await Variant.findById(variantId)
                
                
                if(!variant||!variant.isListed){
                    return res.status(httpStatus.NOT_FOUND).json({success:false,message:'Selected Color and size are not available'})
                }



                const deletewishlist=await Wishlist.findOneAndUpdate({userId},
                    {$pull:{
                        products: {
                            productId: productId,
                            variantId: variantId
                        }
                    }},
                    {new:true}
                )

                if(!deletewishlist){
                    return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Unable to delete item from wishlist'})
                }

                return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Item removed from wishlist'})

       
    }catch(error){
        next(error)
    }
}

const manageWishlist1=async(req,res,next)=>{
    try{

        let{productId,variantId}=req.body 
        const size=req.query.size 
        const color=req.query.color 
        if(!variantId&&size&&color){
            const variant=await Variant.findOne({product:productId,size,color})
            if (!variant) {
        return res.status(404).json({ success: false, message: "Variant not found" });
    }
    variantId = variant._id;
        }
         const userId=req.session.user
        if(!productId||!variantId){
            return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Cannot complete request'})
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
        
                const variant=await Variant.findById(variantId)
                
                
                if(!variant||!variant.isListed||variant.quantity==0){
                    return res.status(httpStatus.NOT_FOUND).json({success:false,message:'Selected Color and size are not available'})
                }




        const wishlist=await Wishlist.findOne({userId})
        if(!wishlist){
            const newWishlist=new Wishlist({
                userId,
                products:[
                    {
                        productId,
                        variantId,
                        addedOn:Date.now()
                    }

                ]
            })

             await newWishlist.save()

        return res.status(httpStatus.OK).json({success:true,message:'Product added to wishlist successfully'})
        }else{

            const productExist=wishlist.products.some((item)=>{
            return item.productId.toString()==productId.toString()&&item.variantId.toString()==variantId.toString()
        })

        if(productExist){
            const update=await Wishlist.findOneAndUpdate({userId},
                {$pull:{
                    products:{
                    productId,
                    variantId
                    }
                }},
                {new:true}
            )

            if(!update){
                return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Cannot remove from wishlist'})
            }
            return res.status(httpStatus.OK).json({removed:true,message:'Product removed from wishlist'})
        }else{
             const update=await Wishlist.findOneAndUpdate({userId},
                {$push:{
                    products:{
                    productId,
                    variantId
                    }
                }},
                {new:true}
            )

            if(!update){
                return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Cannot add to wishlist'})
            }
            

            

        return res.status(httpStatus.OK).json({success:true,message:'Product added to wishlist successfully'})



        }



        }


        

    }catch(error){
        next(error)
    }
}

const manageWishlist=async(req,res,next)=>{
    try{

        let{productId,color}=req.body 
        const userId=req.session.user

        if(!productId||!color){
            return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Cannot complete request'})
        }
       
        const variant=await Variant.findOne({product:productId,color})
        if (!variant) {
        return res.status(404).json({ success: false, message: "Variant not found" });
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
        
                




        const wishlist=await Wishlist.findOne({userId})
        if(!wishlist){
            const newWishlist=new Wishlist({
                userId,
                products:[
                    {
                        productId,
                        color,
                        addedOn:Date.now()
                    }

                ]
            })

             await newWishlist.save()

        return res.status(httpStatus.OK).json({success:true,message:'Product added to wishlist successfully'})
        }else{

            const productExist=wishlist.products.some((item)=>{
            return item.productId.toString()==productId.toString()&&item.color === color

        })

        if(productExist){
            const update=await Wishlist.findOneAndUpdate({userId},
                {$pull:{
                    products:{
                    productId,
                    color
                    }
                }},
                {new:true}
            )

            if(!update){
                return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Cannot remove from wishlist'})
            }
            return res.status(httpStatus.OK).json({removed:true,message:'Product removed from wishlist'})
        }else{
             const update=await Wishlist.findOneAndUpdate({userId},
                {$push:{
                    products:{
                    productId,
                    color
                    }
                }},
                {new:true}
            )

            if(!update){
                return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Cannot add to wishlist'})
            }
            

            

        return res.status(httpStatus.OK).json({success:true,message:'Product added to wishlist successfully'})



        }



        }


        

    }catch(error){
        next(error)
    }
}

module.exports={
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    manageWishlist
}