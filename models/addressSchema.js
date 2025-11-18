const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addressSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',      // Optional: if linked to User model
    required: true
  },
  address: [
    {
      addressType: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      addressName: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      landmark: {
        type: String,
        required: false
      },
      state: {
        type: String,
        required: true
      },
      pincode: {
        type: Number,
        required: true
      },
      phone: {
        type: String,
        required: true
      },
      altphone: {
        type: String,
        required: false
      },
      isDefault:{
        type:Boolean,
        default:false
      }
    }
  ]
});

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;