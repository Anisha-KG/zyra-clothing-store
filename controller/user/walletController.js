const Wallet=require('../../models/wallet')
const User=require('../../models/userScema')
const httpStatus=require('../../Constants/httpStatuscode')
const razorpay=require('razorpay')
const {razorpayInstance}=require('../../helpers/razorpayInstance')
const crypto=require('crypto')
require('dotenv').config()

const getWallet=async(req,res,next)=>{
    try{

        const search=req.query.search ||""
        const page=parseInt(req.query.page )||1
        const filterType=req.query.filter 

        const limit=5 
        const skip=(page-1)*limit 
        const userId=req.session.user
        const user=await User.findById(userId)

        const wallet=await Wallet.findOne({userId})
        if(!wallet){
            return res.render('wallet',{
            user,
            currentPage:1,
            transactions:[],
            search,
            totalPages:1,
            wallet:null,
            filterType
        })
        }
        let transactions=wallet.walletTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        if(search){
            const searchLower = search.toLowerCase();
            transactions=transactions.filter((t)=>{
                return t._id.toString().toLowerCase().includes(searchLower)||t.description.toLowerCase().includes(searchLower)||t.type.toLowerCase().includes(searchLower)
            })
        }

        if(filterType&&filterType!=='all'){
            transactions=transactions.filter((t)=>{
                return t.type.toLowerCase()==filterType.toLowerCase()
            })
        }

        
        
        const totalTransactions=transactions.length 
        transactions=transactions.slice(skip,skip+limit)

        const totalPages=Math.ceil(totalTransactions/limit)

        res.render('wallet',{
            user,
            currentPage:page,
            transactions,
            search,
            totalPages,
            wallet,
            filterType
        })

    }catch(error){
        next(error)
    }
}

const addAmount=async(req,res,next)=>{
    try{

        const{amount}=req.body 
        if(!amount||amount<=0){
            res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Invalid amount'})
        }

        const options = {
            amount: amount * 100, // convert to paise
            currency: "INR",
            receipt: "wallet_" + Date.now()
        };

        const razorpayOrder=await razorpayInstance.orders.create(options)

        res.status(httpStatus.OK).json({success:true,
            key:process.env.RAZORPAY_KEY_ID,
            orderId:razorpayOrder.id,
            amount:options.amount,

        })

    }catch(error){
        next(error)
    }
}


const verifyWalletPayment=async(req,res,next)=>{
    
    try{
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount 
    } = req.body;

    if(!razorpay_order_id||!razorpay_payment_id||!razorpay_signature){
        return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Payment failed',redirectURL:'/wallet'})
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

      if(generatedSignature!==razorpay_signature){
        return res.status(httpStatus.BAD_REQUEST).json({success:false,message:'Payment failed',redirectURL:'/wallet'})
      }
       

      const userId=req.session.user 
      let wallet=await Wallet.findOne({userId})
      if(!wallet){
        wallet=new Wallet({
            userId,
            balance:0,
            walletTransactions:[]
        })
      }

      wallet.balance+=Number(amount )
      wallet.walletTransactions.push({
        date:Date.now(),
        amount,
        description:'Walet Recharged',
        type:'Credit',
        status:'Added'

      })

      await wallet.save()

      return res.status(httpStatus.OK).json({success:true,message:'Wallet Recharged Successfully',redirectURL:'/wallet'})
    }catch(error){
        next(error)
        
       } 
}

module.exports={
    getWallet,
    addAmount,
    verifyWalletPayment
}