const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    txId: {
      type: String,
      required: true,
      unique: true
    },
    packageRange: {
      type: String,
      required: true // e.g. "2000-2999"
    },
    assignedAmount: {
      type: Number,
      required: true // randomly picked amount, e.g. 2850
    },
    commission: {
      type: Number,
      required: true // 7.5% + 6 rupees
    },
    totalCoins: {
      type: Number,
      required: true // coins credited to user
    },
    // Payment proof from user
    utr: {
      type: String,
      default: ''
    },
    screenshotUrl: {
      type: String,
      default: ''
    },
    proofSubmitted: {
      type: Boolean,
      default: false
    },
    paymentAccount: {
      type: Object,
      default: null
    },
    // Status: Pending | Success | Failed | Hold | Cancelled
    status: {
      type: String,
      enum: ['Pending', 'Success', 'Failed', 'Hold', 'Cancelled'],
      default: 'Pending'
    },
    // Auto-approve timestamp
    autoApproveAt: {
      type: Date,
      default: null
    },
    // Admin who acted on this order (always 'admin' for single admin)
    actionBy: {
      type: String,
      default: null
    },
    actionNote: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Order', orderSchema, 'myheroorder')
