const HttpStatus = require('../../Constants/httpStatuscode')
const Order=require('../../models/orderSchema')

const requestReturn=async(req,res,next)=>{
    
    try{
        const{orderId,itemId,returnReason}=req.body 

        const request=await Order.findOneAndUpdate({orderId,'orderedItems._id':itemId},
                                    {$set:{
                                        
                                        'orderedItems.$.returnRequest.reason':returnReason,
                                        'orderedItems.$.returnRequest.status':true,
                                        'orderedItems.$.status': 'Return Requested'
                                    }},{new:true}
        )

        if(!request){
            return res.status(HttpStatus.BAD_REQUEST).json({success:false,message:'Cannot submit request'})
        }

        res.status(HttpStatus.OK).json({success:true,message:'Return requested'})
    }catch(error){
        next(error)
    }
}


const cancelOrder=async(req,res,next)=>{
    
    try{

        const {orderId,reason}=req.body 
         console.log("Received orderId:", orderId);
        const orders=await Order.findOne({orderId})
        console.log(orders)
        const orderedItems=orders.orderedItems 
        
        for(let item of orderedItems){
            item.status='Cancelled'
            item.cancellationRequest.reason=reason
            item.cancellationRequest.status=true
        }
        const updated=await orders.save()
        if(!updated){
            return res.status(HttpStatus.BAD_REQUEST).json({success:false,message:'Cannot submit request'})
        }

        res.status(HttpStatus.OK).json({success:true,message:'Order Cancelled requested'})


        

    }catch(error){
        next(error)
    }
}



const returnOrder=async(req,res,next)=>{
    
    
    try{

        const {orderId,reason}=req.body 
         
        const orders=await Order.findOne({orderId})
        
        const orderedItems=orders.orderedItems 
        
        for(let item of orderedItems){
            item.status='Return Requested'
            item.returnRequest.reason=reason
            item.returnRequest.status=true
        }
        const updated=await orders.save()
        if(!updated){
            return res.status(HttpStatus.BAD_REQUEST).json({success:false,message:'Cannot submit request'})
        }

        res.status(HttpStatus.OK).json({success:true,message:'Order return requested'})


        

    }catch(error){
        next(error)
    }
}

module.exports={
    requestReturn,
    cancelOrder,
    returnOrder
}