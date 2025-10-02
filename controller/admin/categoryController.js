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
        let query={name:{$regex:".*"+search+".*",$options: "i"}}
        
        const [categoryData,totalCount]=await Promise.all([
            category.find(query)
                .sort({createdAt:-1})
                .limit(limit)
                .skip((page-1)*limit)
            ,
            category.countDocuments(query)
        ])
        
        res.render('category',{
            data:categoryData,
            currentPage:page,
            totalPages:Math.ceil(totalCount/limit),
            search
        })
    }catch(error){
        console.log('Error loading category details:',error)
        res.redirect('/pageerror')
    }
}

const addCategory=async(req,res)=>{
    console.log('controller hit')
    try{
        const{categoryName,description}=req.body 
        const categoryImage=req.file? req.file.filename:null
        if(!categoryImage){
            return res.status(400).json({success:false,message:'Upload Category image'})
        }
        if(!categoryName||!description){
            return res.status(400).json({sucess:false,message:"All fields are required"})
        }
        console.log(categoryName,categoryImage,description)
        const normalizedName = categoryName.trim().replace(/\s+/g, " ")
        const existing = await category.findOne({
            name: new RegExp(`^${normalizedName}$`, "i")
            });
        if(existing){
            return res.json({success:false,message:"category already exist"})
        }

        const catData=new category({
            name:categoryName,
            description:description,
            categoryImage:categoryImage
        })

        await catData.save()
        return res.status(200).json({ success: true, message: "Category added successfully" });//res.redirect wont work in fetch
    }catch(error){
        console.log("Add category error:",error)
        res.status(500).json({message:"server error"})
    }
}

const addCategoryOffer=async(req,res)=>{
    try{
        const {categoryId,offerPercentage,startDate,endDate}=req.body
    if(!offerPercentage||!startDate||!endDate){
        return res.status(400).json({success:false,message:'All values are required'})
    }

    const CategoryData=await category.findById(categoryId)
    if(!CategoryData){
       return res.status(400).json({success:false,message:'Category not found'})
    }
    if(isNaN(offerPercentage)||offerPercentage<0||offerPercentage>100){
        return res.status(400).json({success:false,message:'Invalid percentage value'})
    }

    if(new Date(startDate) >= new Date(endDate)){
         return res.status(400).json({success:false,message:'startDate should be less than enddate'})
    }

    await category.updateOne(
        {_id:categoryId},
        {$set:{categoryOffer:offerPercentage,startDate:startDate,endDate:endDate}}
    )
    res.json({success:true,message:'Offer added successfully'})
    }catch(error){
        console.log('Error while adding category Offer',error)
        res.status(500).json({success:false,message:'Something went wrong'})
    }
}

const removeCategoryOffer=async(req,res)=>{
    
    try{
        const{categoryId}=req.body
        const categoryData=await category.findById(categoryId)
        if(!categoryData){
            return res.status(400).json({success:false,message:'Category not found'})
        }
        await category.updateOne({_id:categoryId},
            {$set:{categoryOffer:0,startDate:null,endDate:null}}
        )

        res.json({success:true,message:'Offer removed successfully'})
    }catch(error){
        console.log("Error while deleting offer",error)
        res.json({success:false,message:'Something went wrong'})
    }
}

const unlistCategory=async(req,res)=>{
    try{
        const{categoryId}=req.body
        await category.findByIdAndUpdate(categoryId,{isListed:false})
        res.json({success:true,message:'category unlisted successfully'})
    }catch(error){
        console.log('Error while unlisting the category:',error)
        res.json({success:false,message:'Something went wrong'})
    }
}

const listCategory=async(req,res)=>{
    try{
        const{categoryId}=req.body
        await category.findByIdAndUpdate(categoryId,{isListed:true})
        res.json({success:true,message:'category listed successfully'})
    }catch(error){
        console.log('Error while listing the category:',error)
        res.json({success:false,message:'Something went wrong'})
    }
}

const editCategory=async(req,res)=>{
    try{
        
        const {categoryName,description}=req.body
        const categoryId=req.params.id
        const updated={
            name:categoryName,
            description:description
        }
        if(req.file){
            updated.categoryImage=req.file.filename
        }

        const update=await category.findByIdAndUpdate(categoryId,updated,{new:true})
        if(!update){
            return res.json({success:false,message:"Unable to edit category"})
        }

        res.json({success:true,message:'Category edited successfully'})
    }catch(error){
        console.log("Error while editing the category:",error)
        res.json({success:false,message:'Server Error'})
    }
}

const deleteCategory=async(req,res)=>{
    try{
        const {categoryId}=req.body
        const deleted=await category.findByIdAndDelete(categoryId)
        if(!deleted){
            return res.json({success:false,message:'Unable to delete Category'})
        }
        res.json({success:true,message:'Category deleted successfully'})
    }catch(error){
        console.log('Error while deleting the category')
        res.json({success:false,message:'Server error'})
    }
}


module.exports={
    categoryInfo,
    addCategory,
    addCategoryOffer,
    removeCategoryOffer,
    unlistCategory,
    listCategory,
    editCategory,
    deleteCategory
}