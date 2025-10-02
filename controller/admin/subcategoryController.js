const categories=require('../../models/categprySchema')

const loadSubcategories=async(req,res)=>{
   try{
     const {categoryId}=req.body 
    const page=parseInt(req.query.page)
    const limit=5
    const search=req.query.search?req.query.search.trim().toLowercase():''

    const category=await categories.findById(categoryId)
    if (!category){
       return res.json({success:false,message:'Category not found'})

            }

    const filterSubcategories=category.subcategories.fund((sub)=>{
        sub.name.toLowercase().includes(search)
    })

    const count=filterSubcategories.length()
    const sortedSubcategories=filterSubcategories.sort((a,b)=>b.createdAt-a.createdAt)
    
    const totalPages=Math.ceil(count/limit)
    const skip=(page-1)*limit
    const paginatedSubcategories=sortedSubcategories.slice(skip,skip+limit)

    res.render('subcategories',{
        categoryName:category.name,
        categoryId:categoryId,
        currentPage:page,
        totalPages,
        data:paginatedSubcategories,
        search

    })
   }catch(error){
    console.log(error)
    res.redirect('/pageerror')
   }
}

module.exports={
    loadSubcategories,
}