const razorpay=require('razorpay')

const razorpayInstance=new razorpay({
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_KEY_SECRET,

})


const generateRazorpayOrder = async (orderId, amount) => {
  try {
    const options = {
      amount: amount * 100,          // Razorpay amount = paise
      currency: "INR",
      receipt: orderId.toString(),   // Your DB order ID
      payment_capture: 1             // Razorpay auto-captures payment
    };

    const razorpayOrder = await razorpayInstance.orders.create(options)
    console.log("razorpayOrder:",razorpayOrder)
    return razorpayOrder

  } catch (error) {
    console.log("Razorpay Order Error:", error)
    throw error;
  }
};


module.exports={
    razorpayInstance,
    generateRazorpayOrder
}