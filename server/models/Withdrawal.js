const mongoose = require('mongoose')

const withdrawalSchema = new mongoose.Schema(
  {
    withdrawalId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userPhone: {
      type: String,
      default: ''
    },
    amount: {
      type: Number,
      required: true,
      min: 1
    },
    upiId: {
      type: String,
      required: true,
      trim: true
    },
    payeeName: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Success', 'Failed', 'Cancelled'],
      default: 'Pending'
    },
    initiatedBy: {
      type: String,
      enum: ['user', 'admin'],
      default: 'admin'
    },
    adminNote: {
      type: String,
      default: ''
    },
    utr: {
      type: String,
      default: '',
      trim: true
    },
    processedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Withdrawal', withdrawalSchema, 'myherowithdrawal')
