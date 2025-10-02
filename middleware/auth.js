const User=require('../models/userScema')
const constants=require('../Constants/httpStatuscode')


//const userAuth=(req,res,next)=>{
   // if(req.session.user){
       // User.findById(req.session.user)
       // .then((data)=>{
          //  if(data && !data.isBlocked){
              //  next()
           // }else{
              //  res.redirect('/login')
          //  }
       // })
       // .catch((error)=>{
         //   console.log('Error in user auth middleware')
         //   res.status(500).send('Internal server error')
      //  })
   // }else{
       // res.redirect('/login')
   // }
//}

const checkSession=(req,res,next)=>{
    if(req.session.user){
        return next()
    }else if(req.isAuthenticated&&req.isAuthenticated()){
        return next()
    }else{
        res.redirect('/login')
    }
}

const isLogin=(req,res,next)=>{
    if(req.session.user){
        res.redirect('/home')
    }else if(req.isAuthenticated&&req.isAuthenticated()){
        res.redirect('/home')
    }else{
        next()
    }
}

const adminAuth=async (req,res,next)=>{
    try{
        if(!req.session.admin){
            res.redirect('/admin/login')
        }else{
            const adminId=req.session.admin 
            const admin=await User.findById(adminId)
            if(admin&&admin.isAdmin==true){
                next()
            }else{
                res.redirect('/admin/login')
            }
        }
    }catch(error){
        console.log('Access denied:not admin')
        res.status(INTERNAL_SERVER_ERROR).send('Server Error')
    }
}

module.exports={
   // userAuth,
    adminAuth,
    checkSession,
    isLogin,
}