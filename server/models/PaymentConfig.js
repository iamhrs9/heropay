const mongoose = require('mongoose')

/**
 * PaymentConfig — stores bank & UPI payment details
 * Only ONE document ever exists (singleton pattern).
 * Admin can update it from /adminonly panel.
 * Collection: myheroconfig (isolated from other projects)
 */
const paymentConfigSchema = new mongoose.Schema(
  {
    // Bank Transfer Details
    bankName:      { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    accountHolder: { type: String, default: '' },
    ifscCode:      { type: String, default: '' },
    accountType:   { type: String, default: 'Current Account' },
    bankBranch:    { type: String, default: '' },

    // UPI Details
    upiId:         { type: String, default: '' },
    upiPayeeName:  { type: String, default: '' },

    // Config lock key — ensures only one document exists
    configKey:     { type: String, default: 'main', unique: true }
  },
  {
    timestamps: true,
    collection: 'myheroconfig'  // explicit collection name for project isolation
  }
)

module.exports = mongoose.model('PaymentConfig', paymentConfigSchema)
