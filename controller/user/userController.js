
const pageNotFound=async(req,res)=>{
    try{
        res.render('page404')
    }catch(error){
        res.redirect('/pageNotFound')
    }
}
const loadHomepage=async(req,res)=>{
    try{
        return res.render('homepage',{user:null})
    }catch(error){
        console.log('error while loading homepage')
        res.status(500).send('server error')
    }
}

module.exports={
    loadHomepage,
    pageNotFound,
}