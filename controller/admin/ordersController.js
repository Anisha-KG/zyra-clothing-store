const Order=require('../../models/orderSchema')
const User=require('../../models/userScema')
const httpStatus=require('../../Constants/httpStatuscode')

const listOrders=async(req,res,next)=>{
    try{
        const page=parseInt(req.query.page)||1 
        const limit=5 
        const search=req.query.search||''

        
        const user=await User.find({ email: { $regex: ".*" + search + ".*", $options: "i" } })
        const userIds=user.map((u)=>u._id)
        let query={$or:[{ orderId: { $regex: ".*" + search + ".*", $options: "i" } },{userId:{$in:userIds}}]}
        const [orders,totalOrders]=await Promise.all([
            Order.find(query)
                .sort({createdAt:-1})
                .skip((page-1)*limit) 
                .limit(limit)
                .populate('userId','email'),
            Order.countDocuments(query)
            
            
        ])

        const totalPages=Math.ceil(totalOrders/limit)

        res.render('orders',{
            currentPage:page,
            totalPages,
            orders,
            search,
            limit

        })

    }catch(error){
        next(error)
    }
}


const orderDetails=async(req,res,next)=>{
    try{
        const orderId=req.params.orderId 
        const order=await Order.findOne({orderId}).populate('userId','email name').populate('orderedItems.variant')


        res.render('orderdetailsPage',{
            order
        })

    }catch(error){
        next(error)
    }
}
const updateItemstatus = async (req, res, next) => {
    try {
        const { itemId, status, orderId } = req.body;

        const updatedOrder = await Order.findOneAndUpdate(
            { orderId, "orderedItems._id": itemId },
            { $set: { "orderedItems.$.status": status } },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: "Cannot update item status"
            });
        }

        return res.status(httpStatus.OK).json({
            success: true,
            message: "Item status updated successfully"
        });

    } catch (error) {
        next(error);
    }
};

const handleReturnRequest=async(req,res,next)=>{
    try{
        const{itemId,orderId,action}=req.body 

        if(action=='accept'){
            const acceptReturn=await Order.findOneAndUpdate({orderId,'orderedItems._id':itemId},
                                                {$set:{
                                                    
                                                    'orderedItems.$.returnRequest.resolvedAt':Date.now(),
                                                    'orderedItems.$.status':'Returning'
                                                }}
            )
            if(!acceptReturn){
                return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Error while updating'})
            }

            return res.status(httpStatus.OK).json({success:true,message:'Return Approved'})
        }else if(action=='reject'){
            const acceptReturn=await Order.findOneAndUpdate({orderId,'orderedItems._id':itemId},
                                                {$set:{
                                                    
                                                    'orderedItems.$.returnRequest.resolvedAt':Date.now(),
                                                    'orderedItems.$.status':'Return Rejected'
                                                }}
            )
            if(!acceptReturn){
                return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Error while updating'})
            }

            return res.status(httpStatus.OK).json({success:true,message:'Return Rejected'})
        }
    }catch(error){
        next(error)
    }
}

module.exports={
    listOrders,
    orderDetails,
    updateItemstatus,
    handleReturnRequest
}