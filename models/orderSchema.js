const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const orderSchema = new Schema({
    orderId: {
        type: String,
        default: () => uuidv4(),
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
         totalPrice: {
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
            enum: ['Processing','Packed', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled','Cancellation Requested', 'Return Requested', 'Returning','Return Rejected', 'Returned','Failed'],
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
    }],
    subTotal: {
        type: Number,
        required: true
    },
    deliveryCharge: {
        type: Number,
        default: 0
    },
    discount: {
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
        enum: ['cod','razorpay','Wallet'],
        default: 'cod'
    },
    invoiceDate: {
        type: Date,
        default: Date.now
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
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
