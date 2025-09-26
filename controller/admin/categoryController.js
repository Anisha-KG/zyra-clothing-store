const category=require('../../models/categprySchema')


const categoryInfo=async(req,res)=>{
    try{
        let search=""
        if(req.query.search){
            search=req.query.search
        }

        let page=1
        if(req.query.page){
            page=parseInt(req.query.page,10)
        }
        let limit=9
        const categoryData=await category.find({name:{$regex:".*"+search+".*"}})
            .sort({createdAt:-1})
            .limit(limit)
            .skip((page-1)*limit)

        const count=await category.find({name:{$regex:".*"+search+".*"}}).countDocuments()
        
        res.render('category',{
            data:categoryData,
            currentPage:page,
            totalPages:Math.ceil(count/limit),
            search
        })
    }catch(error){
        console.log('Error loading category details:',error)
        res.redirect('/pageerror')
    }
}

const addCategory=async(req,res)=>{
    try{
        const{name,description}=req.body 
        if(!categoryName||!categoryImage||!description){
            res.status(400).json({sucess:false,message:"All fields are required"})
        }
        const normalizedName = name.trim().replace(/\s+/g, " ")
        const existing = await Category.findOne({
            name: new RegExp(`^${normalizedName}$`, "i")
            });
        if(categoryData){
            res.json({success:false,message:"category already exist"})
        }

        const catData=new category({
            name:name,
            description:description,
            categoryImage:categoryImage
        })

        await catData.save()
        res.redirect('/admin/categories')
    }catch(error){
        console.log("Add category error:",error)
        res.status(500).json({message:"server error"})
    }
}


module.exports={
    categoryInfo,
    addCategory,
}