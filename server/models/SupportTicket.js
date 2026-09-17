const mongoose = require('mongoose')

const supportTicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userPhone: {
      type: String,
      required: true,
      trim: true
    },
    ticketId: {
      type: String,
      required: true,
      unique: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    screenshotUrl: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open'
    },
    adminReply: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('SupportTicket', supportTicketSchema)
