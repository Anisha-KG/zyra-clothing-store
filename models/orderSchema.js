const mongoose = require('mongoose');
const { Schema } = mongoose;

function generateOrderId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return 'ZA-' + result;
}

const orderSchema = new Schema({
    orderId: {
        type: String,
        default: generateOrderId,
        unique: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },

    
    orderedItems: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product'
        },
        variant: {
            type: Schema.Types.ObjectId,
            ref: 'variant'
        },
        productName: {
            type: String,
            required: true
        },
        MRPprice: {
            type: Number,
            required: true
        },
        finalPrice: {
            type: Number,
            required: true
        },
         itemsTotal: {
            type: Number,
            required: true
        },
        size: {
            type: String,
            required: true
        },
        color: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['Pending','Processing','Packed', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled','Cancellation Requested', 'Return Requested', 'Returning','Return Rejected', 'Returned','Failed'],
            default: 'Processing'
        },
        returnRequest: {
          status: {
            type: Boolean,
            default: false,
          },
          reason: String,
          requestedAt: Date,
          resolvedAt: Date,
          refundAmount: Number,
        },
        cancellationRequest: {
            status: {
            type: Boolean,
            default: false,
          },
          reason: String,
          refundAmount: Number,
        },
    expectedDelivery:{
        type:Date
    }
    }],
    subTotal: {
        type: Number,
        required: true
    },
    taxRate: {
        type: Number,
        required: true
    },
    taxAmount: {
        type: Number,
        required: true
    },
    deliveryCharge: {
        type: Number,
        default: 0
    },
    couponDiscount: {
        type: Number,
        default: 0
    },
    totalDiscount: {
        type: Number,
        default: 0
    },
    totalPayable: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cod','razorpay','wallet'],
        default: 'cod'
    },
    invoiceDate: {
        type: Date,
        default: Date.now
    },
    razorpayorderId:{
        type:String,
        default:null
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
        default: 'pending'
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'return_requested', 'returning', 'returned','failed'],
        default: 'pending'
    },
    deliveredOn: {
        type: Date
    }
}, {
    timestamps: true
});

const order = mongoose.model('order', orderSchema);
module.exports = order;
