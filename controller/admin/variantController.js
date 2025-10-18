
const Variant=require('../../models/variantSchema')
const httpstatus=require('../../Constants/httpStatuscode')

const getVariant=async(req,res)=>{
    try{
        const {productId}=req.params
        const page=req.query.page?parseInt(req.query.page):1
        const search=req.query.search||""
        const limit=5

        const query={$regex:'.*'+search+'.*',$options:'i'}

        const[variants,variantCount]=await Promise.all([
            Variant.find({product:productId,$or:[{color:query},{size:query}]})
                .sort({createdAt:-1})
                .skip(limit*(page-1))
                .limit(limit)
                .populate('product')
                .lean(),
            Variant.countDocuments({product:productId,$or:[{color:query},{size:query}]})
        ])

        res.render('variant',{
            variants,
            variantCount,
            totalPages:Math.ceil(variantCount/limit),
            search,
            currentPage:page,
            limit
            
        })
    }catch(error){
        console.log('Error while getting variant page:',error)
        res.redirect('/pageerror')
    }
}

const addVariant=async(req,res)=>{
    try{
        const{color,size,quantity,productId}=req.body
        const imageFields=['image1','image2','image3','image4']
        const images=[]
        imageFields.map((file)=>{
            if(req.files[file]){
                images.push(req.files[file][0].filename)
            }
        })
        console.log(color+" "+size+" "+quantity+" "+productId)

        if(!color||!size||!quantity||!productId){
            return res.status(httpstatus.BAD_REQUEST).json({success:false,message:'All fileds are required'})
        }
        if(images.length===0){
            return res.status(httpstatus.BAD_REQUEST).json({success:false,message:'Image is required'})
        }

        const variant=new Variant({
            color,
            size,
            quantity,
            product:productId,
            images
        })
        await variant.save()
        res.status(httpstatus.OK).json({success:true,message:'variant added successfully'})
    }catch(error){
        console.log('Error while adding variant:',error)
        res.status(httpstatus.INTERNAL_SERVER_ERROR).json({status:false,message:'Some thing went wrong'})
    }
}

module.exports={
    getVariant,
    addVariant
}