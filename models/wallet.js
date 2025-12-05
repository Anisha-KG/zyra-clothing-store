const mongoose = require('mongoose');
const { Schema } = mongoose;

const walletSchema = new Schema(
  {
 userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    balance: {
      type: Number,
      default: 0
    },

    walletTransactions: [
      {
        date: {
          type: Date,
          default: Date.now
        },
        amount: {
          type: Number,
          required: true
        },
        description: {
          type: String,
          required: true
        },
        type: {
          type: String,
          enum: ['Debit', 'Credit'],
          required: true
        },
        status: {
          type: String,
          enum: ['Added', 'Refund', 'Used for order'],
          default: 'Added'
        }
      }
    ]
  },
  { timestamps: true }
);

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;