const User=require('../../models/userScema')
const mongoose=require('mongoose')
const bcrypt=require('bcrypt')

const pageerror=async(req,res)=>{
    res.render('pageerror')
}

const loadLogin=async(req,res)=>{
    if(req.session.admin){
        return res.redirect('/admin/dashboard')
    }
    res.render('admin-login')
}

const login=async(req,res)=>{
    try{
        const{email,password}=req.body 
    if (!email){
        return res.render('admin-login',{message:'Email is required'})
    }
    if(!password){
        return res.render('admin-login',{message:'Enter Password'})
    }
    const admin=await User.findOne({email:email,isAdmin:true})
    if(!admin){
        return res.render('admin-login',{message:'Admin not found'})
    }
    const isMatch=await bcrypt.compare(password,admin.password)
    if(!isMatch){
        return res.render('admin-login',{message:'Invalid Password'})
    }

    req.session.admin=true
    res.redirect('/admin/dashboard')
    }catch(error){
        console.log("Login eror:",error)
        res.redirect('/pageerror')
    }


}

const loadDashboard=async(req,res)=>{
    if(req.session.admin){
        try{
            return res.render('dashboard')
        }catch(error){
            return res.render('pageerror')
        }
    }else{
        return res.render('admin-login')
    }
    
}

const logout=async(req,res)=>{
    try{
        req.session.destroy((err)=>{
            if(err){
                console.log('Error when logout',err)
                res.redirect('/admin/pageerror')
            }
            res.redirect('/admin/login')
        })
    }catch(error){
        console.log('Logout error:',error)
        res.redirect('/admin/pageerror')
    }
}


module.exports={
    loadLogin,
    login,
    loadDashboard,
    pageerror,
    logout,
}