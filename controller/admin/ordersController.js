const Order=require('../../models/orderSchema')
const User=require('../../models/userScema')
const Variant=require('../../models/variantSchema')
const httpStatus=require('../../Constants/httpStatuscode')
const listOrders = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;

        const search = req.query.search || '';
        const paymentStatus = req.query.paymentStatus || 'All';
        const sort = req.query.sort || 'newest';

        let sortQuery = sort === 'newest' ? { createdAt: -1 } : { createdAt: 1 };

        // Base query (search)
        let query = {
            orderId: { $regex: search, $options: "i" }
        };

        // Payment Filter
        if (paymentStatus !== 'All') {
            query.paymentStatus = paymentStatus;
        }

        // Fetch orders + count BEFORE pagination
        const totalOrders = await Order.countDocuments(query);

        const orders = await Order.find(query)
            .sort(sortQuery)
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("userId", "email");

        const totalPages = Math.ceil(totalOrders / limit);

        res.render("orders", {
            currentPage: page,
            totalPages,
            orders,
            search,
            sort,
            paymentStatus,
            limit
        });

    } catch (error) {
        next(error);
    }
};


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

        let order=await Order.findOne({orderId})

        if(status=='Delivered'&&order.paymentMethod=='cod'){
            order.paymentStatus='Completed'
            await order.save()
        }

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
                                                    'orderedItems.$.status':'Returned'
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
const updateExpectedDeliveryDate = async (req, res, next) => {
    try {
        const { itemId, orderId, selectedDate } = req.body;

        const update = await Order.findOneAndUpdate(
            {
                orderId,
                'orderedItems._id': itemId
            },
            {
                $set: {
                    'orderedItems.$.expectedDelivery': selectedDate
                }
            },
            { new: true }
        );

        if (!update) {
            return res.json({ success: false, message: "Order not found" });
        }

        return res.json({ success: true, message: "Expected delivery updated!" });

    } catch (error) {
        next(error);
    }
};

const incrementStock=async(req,res,next)=>{
    try{
        const {itemId,orderId}=req.body 
        const order=await Order.findOne({orderId})
        const orderedItem=order.orderedItems.id(itemId) 
        const incrementStock=await Variant.findOneAndUpdate({
                _id:orderedItem.variant,
                size:orderedItem.size,
                color:orderedItem.color

        },
            {$inc:{quantity:orderedItem.quantity}},{new:true}
        )

        if(incrementStock){
            res.status(httpStatus.OK).json({success:true})
        }





    }catch(error){
        next(error)
    }
}

module.exports={
    listOrders,
    orderDetails,
    updateItemstatus,
    handleReturnRequest,
    updateExpectedDeliveryDate,
    incrementStock
}