const Subcategories=require('../../models/subcategorySchema')
const Category=require('../../models/categprySchema')

const loadSubcategories=async(req,res)=>{
    try{
        const categoryId=req.params.id
        const search=req.query.search?req.query.search:""
        const page=req.query.page?Number(req.query.page):1 
        const limit=3

        const[category,subcategories,count]=await Promise.all([
            Category.findById(categoryId),
            Subcategories.find({categoryId:categoryId,
                name:{$regex:".*"+search+".*",$options:'i'}
                ,isDeleted:false})
                .sort({createdAt:1})
                .skip((page-1)*limit)
                .limit(limit),
             Subcategories.find({categoryId:categoryId,
                name:{$regex:".*"+search+".*",$options:'i'}
                ,isDeleted:false}).countDocuments()
        ])



        if(!category){
           return res.status(400).json({error:"Category not found"})
        }

        

        res.render('subcategories',{
            category,
            subcategories,
            currentPage:page,
            totalPages:Math.ceil(count/limit),
            search

        })
        
    }catch(error){
        console.log('Error while loading subcategories',error)
        res.redirect('/admin/pageerror')
    }
}

const addSubcategory=async(req,res)=>{
    
    try{
        const {subcategoryName,description,categoryId}=req.body
        const subcategoryImage=req.file?req.file.filename:null
        if(!subcategoryName||!description){
            return res.json({success:false,message:"Please fill all fields"})
        }
        if(!subcategoryImage){
            return res.json({success:false,message:"Upload Image"})
        }
        const normalizedName = subcategoryName.trim().replace(/\s+/g, " ")
        const existing = await Subcategories.findOne({
            name: new RegExp(`^${normalizedName}$`, "i")
            });
        if(existing){
            return res.json({success:false,message:"Subcategory already exist"})
        }

        const subcatData=new Subcategories({
            name:subcategoryName,
            image:subcategoryImage,
            description:description,
            categoryId:categoryId
        })

        await subcatData.save()
        res.json({success:true,message:'Subcategory added successfully'})
    }catch(error){
        console.log("Error whuile adding subcategory",error)
        res.json({success:false,message:"Server error , Cannot add subcategory"})
    }
}


const addSubcategoryOffer=async(req,res)=>{
    console.log('controller hit')
    try{
        const{subcategoryId,offerPercentage,startDate,endDate}=req.body 
        if(!offerPercentage||!startDate||!endDate){
            return res.json({success:false,message:"All fields are required"})
        }
        if(new Date(startDate)>new Date(endDate)){
            return res.json({success:false,message:"Invalid Date"})
        }
        if(isNaN(offerPercentage)||offerPercentage<0||offerPercentage>100){
            return res.json({success:false,message:"Offer Percentage should be between 0 and 100"})
        }

        const update=await Subcategories.findByIdAndUpdate(subcategoryId,{$set:{offer:offerPercentage,startDate:startDate,endDate:endDate}},{new:true})
        if(!update){
            return res.json({success:false,message:"Unable to add offer"})
        }
        res.json({success:true,message:'Offer added successfully'})

    }catch(error){
        console.log("error while adding subcategory offer:",error)
        res.json({success:false,message:"Server error"})
    }
}

const removeOffer=async(req,res)=>{
    try{
        const {subcategoryId}=req.body
        const subcategory=await Subcategories.findById(subcategoryId)
        if(!subcategory){
           return res.json({success:false,message:"Subcategory not found"})
        }
        const updated=await Subcategories.findByIdAndUpdate(subcategoryId,{$set:{offer:null,startDate:null,endDate:null}},{new:true})
        if(!updated){
            return res.json({success:false,message:"Cannot remove offer"})
        }
        res.json({success:true,message:'Offer removed successfully'})

    }catch(error){
        console.log(error)
        return res.json({success:false,message:'Server error'})
    }
}

const unlistSubcategory=async(req,res)=>{
    try{
        const{subcategoryId}=req.body
        const subcategory=await Subcategories.findById(subcategoryId)
        if(!subcategory){
            return res.json({sucess:false,message:'Subcategory not found'})
        }
        const updated=await Subcategories.findByIdAndUpdate(subcategoryId,{$set:{isListed:false}},{new:true})
        if(!updated){
            return res.json({sucess:false,message:'Cannot unlist subcategory'})
        }
        res.json({success:true,message:'Suvcategory unlisted successfully'})
    }catch(error){
        console.log(error)
        res.json({success:false,message:"Server error"})
    }
}

const listSubcategory=async(req,res)=>{
    try{
        const{subcategoryId}=req.body
        const subcategory=await Subcategories.findById(subcategoryId)
        if(!subcategory){
            return res.json({sucess:false,message:'Subcategory not found'})
        }
        const updated=await Subcategories.findByIdAndUpdate(subcategoryId,{$set:{isListed:true}},{new:true})
        if(!updated){
            return res.json({sucess:false,message:'Cannot list subcategory'})
        }
        res.json({success:true,message:'Suvcategory listed successfully'})
    }catch(error){
        console.log(error)
        res.json({success:false,message:"Server error"})
    }
}

const deteleSubcategory=async(req,res)=>{
    try {
        const { subcategoryId } = req.body

        const result = await Subcategories.deleteOne({ _id: subcategoryId })// deleteOne returns { acknowledged: true, deletedCount: 1 }
        if (result.deleteCount=0) {
            return res.json({ succes: false, message: 'Unable to delete subcategory' })
        }
        res.json({ success: true, message: 'subcategory deleted successfully' })


    } catch (error) {
        console.log(error)
        res.json({ success: false, message: 'Server error' })
    }
}







module.exports={
    loadSubcategories,
    addSubcategory,
    addSubcategoryOffer,
    removeOffer,
    unlistSubcategory,
    listSubcategory,
    deteleSubcategory
}