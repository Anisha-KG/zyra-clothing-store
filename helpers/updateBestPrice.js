const calculateBestOffer=require('../helpers/calculatingBestOffer')

const updateBestPrice=async(product)=>{
    console.log('updating price')
for(let p of product){
    const bestOffer = await calculateBestOffer(p);
   const discountAmount = (p.price * bestOffer) / 100;
   p.finalPriceDynamic = Math.round(p.price - discountAmount);
   

   await p.save()
  }
}

module.exports=updateBestPrice


