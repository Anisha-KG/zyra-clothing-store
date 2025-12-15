const HttpStatus = require('../../Constants/httpStatuscode')
const Coupons=require('../../models/couponSchema')


const getCoupons = async (req, res, next) => {
    try {
        const search = req.query.search || "";
        const filter = req.query.filter || 'All';
        const page = parseInt(req.query.page) || 1;

        let sortBy = req.query.sortBy;
        if (!sortBy) sortBy = 'newest';  
        let sortQuery = sortBy === 'oldest' ? { createdAt: -1 } : { createdAt: 1 };

        const limit = 8;
        const skip = (page - 1) * limit;

        let searchQuery = {};

        if (search) {
            searchQuery.$or = [
                { name: { $regex: search, $options: "i" } },
                { code: { $regex: search, $options: "i" } }
            ];
        }

        if (filter === 'Active') searchQuery.status = true;
        if (filter === 'Inactive') searchQuery.status = false;

        const [coupons, couponsCount] = await Promise.all([
            Coupons.find(searchQuery)
                .sort(sortQuery)
                .skip(skip)
                .limit(limit),
            Coupons.countDocuments(searchQuery)
        ]);

        const totalPages = Math.ceil(couponsCount / limit);

        res.render('coupons', {
            coupons,
            currentPage: page,
            totalPages,
            search,
            filterType: filter,
            sortBy
        });

    } catch (error) {
        next(error);
    }
};



const addCoupon=async(req,res,next)=>{
    
    try{
        const {
                name,
                code,
                startingDate,
                expiryDate,
                discountValue,
                minOrderAmount,
                maxDiscount,
                usageLimit,
                usagePerUser,
                status,
                couponType
            }=req.body 

            

            const normaliseCode=code.toUpperCase()

            const coupon=await Coupons.findOne({code:normaliseCode})


            if(coupon){
                return res.status(HttpStatus.BAD_REQUEST).json({success:false,message:'Coupon already exist'})
            }

            const newCoupon=new Coupons({

                 
                name,
                code:normaliseCode,
                startingDate,
                expiryDate,
                discountValue,
                minimumOrderAmount:minOrderAmount,
                maximumDiscount:maxDiscount,
                usageLimit: usageLimit || null,
                usagePerUser:usagePerUser||null,
                status,
                type:couponType
            
            })

            await newCoupon.save()


            res.status(HttpStatus.OK).json({success:true,message:'coupon added successfully'})

    }catch(error){

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Coupon code already exists"
            });
        }
        next(error)
    }
}



const editCoupon=async(req,res,next)=>{
    
    try{
        const {
            id,
                name,
                code,
                startingDate,
                expiryDate,
                discountValue,
                minOrderAmount,
                maxDiscount,
                usageLimit,
                usagePerUser,
                status,
                couponType,
            }=req.body 
            console.log(couponType)

            

            

            const normaliseCode=code.toUpperCase()

            const coupon=await Coupons.findOne({code:normaliseCode,_id:{$ne:id}})


            if(coupon){
                return res.status(HttpStatus.BAD_REQUEST).json({success:false,message:'Coupon already exist'})
            }

           

            const update=await Coupons.findByIdAndUpdate(id,{$set:{
                name,
                code,
                startingDate,
                expiryDate,
                discountValue,
                minimumOrderAmount:minOrderAmount,
                maximumDiscount:maxDiscount,
                usageLimit,
                usagePerUser,
                status,
                type:couponType
            }},{new:true})


            if(!update){
                return res.status(HttpStatus.OK).json({success:false,message:'Cannot edit coupon'})
            }


            res.status(HttpStatus.OK).json({success:true,message:'Coupon edited successfully'})

    }catch(error){

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Coupon code already exists"
            });
        }
        next(error)
    }
}

const deactivateCoupon=async(req,res,next)=>{
    try{

        const {couponId}=req.body 
        const update=await Coupons.findByIdAndUpdate(couponId,{$set:{status:false}},{new:true})
        if(!update){
               return res.status(HttpStatus.OK).json({success:false,message:'Cannot deactivate coupon'})
            }

        res.status(HttpStatus.OK).json({success:true,message:'Coupon deactivated successfully'})

}catch(error){
    next(error)
}
}

const activateCoupon=async(req,res,next)=>{
    try{

        const {couponId}=req.body 
        const update=await Coupons.findByIdAndUpdate(couponId,{$set:{status:true}},{new:true})
        if(!update){
               return res.status(HttpStatus.OK).json({success:false,message:'Cannot activate coupon'})
            }

        res.status(HttpStatus.OK).json({success:true,message:'Coupon activated successfully'})

}catch(error){
    next(error)
}
}

const deleteCoupon=async(req,res,next)=>{
    try{

        const{couponId}=req.body 

        const update=await Coupons.findByIdAndDelete(couponId)
         if(!update){
               return res.status(HttpStatus.OK).json({success:false,message:'Cannot delete coupon'})
            }

        res.status(HttpStatus.OK).json({success:true,message:'Coupon deleted successfully'})

    }catch(error){
        next(error)
    }
}




module.exports={
    getCoupons,
    addCoupon,
    editCoupon,
    deactivateCoupon,
    activateCoupon,
    deleteCoupon
}