const user=require('../models/userScema')
const constants=require('../Constants/httpStatuscode')

const checkBlockedUser=async(req,res,next)=>{
    try{
    const userId=req.session.user || req.user?._id//stored by passport
    if(!userId){
        res.redirect('/login')
    }
    const userData=await user.findById(userId)
    if(!userData){
        res.redirect('/signup')
    }

    if(userData.isBlocked==true){
        req.session.destroy((err)=>{//That includes all session data, including what Passport stored
            console.log('error while destroying session')
        })
        
        res.redirect('/home')
    }else{
        next()
    }
    }catch(error){
        console.log("error while checking blocked user",error)
        res.json({success:false,message:'Server error'})
    }
}

module.exports=checkBlockedUser