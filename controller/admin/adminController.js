const User=require('../../models/userScema')
const mongoose=require('mongoose')
const bcrypt=require('bcrypt')


const loadLogin=async(req,res)=>{
    if(req.session.admin){
        return res.redirect('/admin/dashboard')
    }
    res.render('admin-login')
}


module.exports={
    loadLogin,
}