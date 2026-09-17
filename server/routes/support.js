const express = require('express')
const SupportTicket = require('../models/SupportTicket')
const User = require('../models/User')
const { protect, adminOnly } = require('../middleware/auth')

const router = express.Router()

// POST /api/support — Submit a new customer support query (User)
router.post('/', protect, async (req, res) => {
  try {
    const { category, message, screenshotUrl } = req.body

    if (!category || !category.trim()) {
      return res.status(400).json({ message: 'Please select an issue category.' })
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Please describe your problem.' })
    }

    // Look up user to attach verified phone number
    let userPhone = 'User'
    const user = await User.findById(req.userId)
    if (user && user.phone) {
      userPhone = user.phone
    }

    // Generate unique Ticket ID: e.g. TKT749201
    const ticketId = 'TKT' + Math.floor(100000 + Math.random() * 900000)

    const ticket = await SupportTicket.create({
      userId: req.userId,
      userPhone,
      ticketId,
      category: category.trim(),
      message: message.trim(),
      screenshotUrl: screenshotUrl || '',
      status: 'Open'
    })

    res.status(201).json(ticket)
  } catch (err) {
    console.error('[POST /api/support]', err.message)
    res.status(500).json({ message: 'Server error while submitting support query.' })
  }
})

// GET /api/support/my — Get all support queries submitted by the logged-in user
router.get('/my', protect, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.userId }).sort({ createdAt: -1 })
    res.json(tickets)
  } catch (err) {
    console.error('[GET /api/support/my]', err.message)
    res.status(500).json({ message: 'Server error while fetching your queries.' })
  }
})

// GET /api/support/admin/all — List all support queries (Admin Only)
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const tickets = await SupportTicket.find().sort({ createdAt: -1 })
    res.json(tickets)
  } catch (err) {
    console.error('[GET /api/support/admin/all]', err.message)
    res.status(500).json({ message: 'Server error while fetching support queries.' })
  }
})

// PATCH /api/support/admin/:id — Update ticket status or add admin reply (Admin Only)
router.patch('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminReply } = req.body
    const updateFields = {}

    if (status) {
      const allowed = ['Open', 'In Progress', 'Resolved', 'Closed']
      if (allowed.includes(status)) {
        updateFields.status = status
      }
    }

    if (typeof adminReply === 'string') {
      updateFields.adminReply = adminReply.trim()
    }

    const updatedTicket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    )

    if (!updatedTicket) {
      return res.status(404).json({ message: 'Support ticket not found.' })
    }

    res.json(updatedTicket)
  } catch (err) {
    console.error('[PATCH /api/support/admin/:id]', err.message)
    res.status(500).json({ message: 'Server error while updating support ticket.' })
  }
})

module.exports = router
