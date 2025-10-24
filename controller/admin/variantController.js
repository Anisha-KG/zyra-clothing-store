
const Variant=require('../../models/variantSchema')
const httpstatus=require('../../Constants/httpStatuscode')
const path=require('path')
const fs=require('fs')

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
      limit,
      productId:productId

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

const editVariant=async(req,res)=>{
  try {
    const { variantId, color, size, quantity } = req.body;

    if (!variantId) return res.status(400).json({ success: false, message: 'Variant ID is required' });

    // Find the variant
    const variant = await Variant.findById(variantId);
    if (!variant) return res.status(404).json({ success: false, message: 'Variant not found' });

    // Update basic fields
    variant.color = color || variant.color;
    variant.size = size || variant.size;
    variant.quantity = quantity || variant.quantity;

    // Handle images
    // Assume variant.images = [image1, image2, image3, image4]
    const updatedImages = [...variant.images]; // copy existing images

    // Loop through 4 possible images
    for (let i = 1; i <= 4; i++) {
      const fieldName = `image${i}`;
      const croppedFieldName = `croppedImage${i}`;

      if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
        // New image uploaded (or recropped converted to blob)
        // Remove old file if exists
        if (variant.images[i - 1]) {
          const oldPath = path.join(__dirname, '..', 'public', 'uploads', 'variants', variant.images[i - 1]);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        // Save new filename
        updatedImages[i - 1] = req.files[fieldName][0].filename;
      } else if (req.body[croppedFieldName]) {
        // Cropped image sent as base64
        const base64Data = req.body[croppedFieldName].replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `variant-${Date.now()}-${i}.jpg`;
        const filePath = path.join(__dirname, '..', 'public', 'uploads', 'variants', filename);
        fs.writeFileSync(filePath, buffer);

        // Remove old file if exists
        if (variant.images[i - 1]) {
          const oldPath = path.join(__dirname, '..', 'public', 'uploads', 'variants', variant.images[i - 1]);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        updatedImages[i - 1] = filename;
      }
      // else no change, keep existing image
    }

    // Update images array in variant
    variant.images = updatedImages;

    // Save variant
    await variant.save();

    return res.json({ success: true, message: 'Variant updated successfully', variant });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

const listVariant=async(req,res)=>{
  try{
    const {variantId}=req.body

    const updated=await Variant.findByIdAndUpdate(variantId,{$set:{isListed:true}},{new:true})
    if(!updated){
      return res.status(httpstatus.BAD_REQUEST).json({success:false,message:'Unable to list variant'})
    }
    res.status(httpstatus.OK).json({success:true,message:'variant listed successfully'})
  }catch(error){
    console.log('Error while listing variant:',error)
    res.status(httpstatus.INTERNAL_SERVER_ERROR).json({success:false,message:'Server error'})
  }
}

const unlistVariant=async(req,res)=>{
  try{
    const {variantId}=req.body

    const updated=await Variant.findByIdAndUpdate(variantId,{$set:{isListed:false}},{new:true})
    if(!updated){
      return res.status(httpstatus.BAD_REQUEST).json({success:false,message:'Unable to unlist variant'})
    }
    res.status(httpstatus.OK).json({success:true,message:'variant unlisted successfully'})
  }catch(error){
    console.log('Error while unlisting variant:',error)
    res.status(httpstatus.INTERNAL_SERVER_ERROR).json({success:false,message:'Server error'})
  }
}

module.exports={
  getVariant,
  addVariant,
  editVariant,
  listVariant,
  unlistVariant
}