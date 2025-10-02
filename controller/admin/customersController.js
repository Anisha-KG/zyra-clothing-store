const User=require('../../models/userScema')

const customerInfo=async(req,res)=>{
    try{
        let search=""
        if(req.query.search){
            search=req.query.search
        }
        let page=1
        if(req.query.page){
            page=req.query.page
        }
        let limit=9
        const userData=await User.find({
            isAdmin:false,
            $or:[
                {name:{$regex:".*"+search+".*"}},
                {email:{$regex:".*"+search+".*"}}
            ]
        })
        .sort({CreatedAt:-1})
        .limit(limit*1)
        .skip((page-1)*limit) 
        .exec()

        const count=await User.find({
            isAdmin:false,
            $or:[
                {name:{$regex:".*"+search+".*"}},
                {email:{$regex:".*"+search+".*"}}
            ]
        }).countDocuments()

        res.render('customers',{
            data:userData,
            totalPages:Math.ceil(count/limit),
            currentPage:page,
            search
        })

        }catch(error){
        console.log('Error fetching customers',error)
        res.redirect('/pageerror')
    }
}

const customerBlocked=async(req,res)=>{   
    try{
        const {id}=req.body
        await User.updateOne({_id:id},{$set:{isBlocked:true}})
        res.redirect('/admin/customers')
    }catch(error){
        console.log("Error while blocking customer:",error)
        res.redirect('/pageerror')
    }
}
const customerUnblocked=async(req,res)=>{
    try{
        const {id}=req.body
        await User.updateOne({_id:id},{$set:{isBlocked:false}})
        res.redirect('/admin/customers')
    }catch(error){
        console.log("Error while unblocking customer:",error)
        res.redirect('/pageerror')
    }
}




module.exports={
    customerInfo,
    customerBlocked,
    customerUnblocked
}