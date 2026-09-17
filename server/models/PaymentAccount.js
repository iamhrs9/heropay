const mongoose = require('mongoose')

/**
 * PaymentAccount — one bank/UPI account entry.
 * Admin can add multiple accounts; users get a random active one.
 * Collection: myheroaccounts (isolated from other projects)
 */
const paymentAccountSchema = new mongoose.Schema(
  {
    // Friendly label shown ONLY in admin panel (not to users)
    label: { type: String, required: true, trim: true },

    // Bank Transfer Details
    bankName:      { type: String, default: '', trim: true },
    accountNumber: { type: String, default: '', trim: true },
    accountHolder: { type: String, default: '', trim: true },
    ifscCode:      { type: String, default: '', trim: true },
    accountType:   { type: String, default: 'Current Account', trim: true },
    bankBranch:    { type: String, default: '', trim: true },

    // UPI Details — both empty means UPI tab is hidden on payment screen
    upiId:        { type: String, default: '', trim: true },
    upiPayeeName: { type: String, default: '', trim: true },

    // Method Type: 'bank', 'upi', or 'both'
    methodType: {
      type: String,
      enum: ['bank', 'upi', 'both'],
      default: 'both'
    },

    // Toggle on/off without deleting
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    collection: 'myheroaccounts'
  }
)

module.exports = mongoose.model('PaymentAccount', paymentAccountSchema)
