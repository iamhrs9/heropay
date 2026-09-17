const express = require('express')
const Order = require('../models/Order')
const User = require('../models/User')
const { protect } = require('../middleware/auth')

const router = express.Router()

// All routes below are protected (require user JWT)

// GET /api/orders  — fetch this user's orders (for Record screen)
router.get('/', protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 })
    res.json(orders)
  } catch (err) {
    console.error('[GET /api/orders]', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
})

// POST /api/orders  — create a new pending buy order (called immediately when user clicks Buy)
router.post('/', protect, async (req, res) => {
  try {
    const {
      txId,
      packageRange,
      assignedAmount,
      commission,
      totalCoins,
      utr,
      screenshotUrl,
      paymentAccount,
      proofSubmitted,
      autoApproveAt: clientAutoApproveAt
    } = req.body

    if (!txId || !packageRange || !assignedAmount) {
      return res.status(400).json({ message: 'Missing required order fields.' })
    }

    // Check if order with txId already exists
    const existing = await Order.findOne({ txId })
    if (existing) {
      return res.json(existing)
    }

    const autoApproveAt = clientAutoApproveAt
      ? new Date(clientAutoApproveAt)
      : new Date(Date.now() + 15 * 60 * 1000) // 15 min from now

    const order = await Order.create({
      userId: req.userId,
      txId,
      packageRange,
      assignedAmount,
      commission: commission || 0,
      totalCoins: totalCoins || 0,
      utr: utr || '',
      screenshotUrl: screenshotUrl || '',
      proofSubmitted: Boolean(proofSubmitted),
      paymentAccount: paymentAccount || null,
      status: 'Pending',
      autoApproveAt
    })

    res.status(201).json(order)
  } catch (err) {
    console.error('[POST /api/orders]', err.message)
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Duplicate transaction ID.' })
    }
    res.status(500).json({ message: 'Server error.' })
  }
})

// PATCH /api/orders/by-tx/:txId/proof — update payment proof (UTR & screenshot)
router.patch('/by-tx/:txId/proof', protect, async (req, res) => {
  try {
    const { utr, screenshotUrl } = req.body
    const order = await Order.findOne({ txId: req.params.txId, userId: req.userId })
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' })
    }

    if (utr !== undefined) order.utr = utr
    if (screenshotUrl !== undefined) order.screenshotUrl = screenshotUrl
    order.proofSubmitted = true
    await order.save()

    res.json({ message: 'Payment proof submitted successfully.', order })
  } catch (err) {
    console.error('[PATCH /api/orders/by-tx/:txId/proof]', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
})

// PATCH /api/orders/by-tx/:txId/cancel — cancel a pending order
router.patch('/by-tx/:txId/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ txId: req.params.txId, userId: req.userId })
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' })
    }
    if (order.status !== 'Pending') {
      return res.status(400).json({ message: `Cannot cancel order with status ${order.status}.` })
    }

    order.status = 'Cancelled'
    order.actionNote = 'Cancelled by user'
    await order.save()

    res.json({ message: 'Order cancelled successfully.', order })
  } catch (err) {
    console.error('[PATCH /api/orders/by-tx/:txId/cancel]', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
})

// POST /api/orders/auto-approve  — called by client timer after 15 min
// Only approves orders that are still Pending and past autoApproveAt
router.post('/auto-approve', protect, async (req, res) => {
  try {
    const now = new Date()
    const pendingOrders = await Order.find({
      userId: req.userId,
      status: 'Pending',
      autoApproveAt: { $lte: now }
    })

    let totalCoinsAdded = 0
    let totalCommissionAdded = 0
    let totalBuyAdded = 0
    for (const order of pendingOrders) {
      order.status = 'Success'
      order.actionBy = 'auto'
      await order.save()
      totalCoinsAdded += (order.totalCoins || 0)
      totalCommissionAdded += (order.commission || 0)
      totalBuyAdded += (order.assignedAmount || 0)
    }

    if (totalCoinsAdded > 0) {
      await User.findByIdAndUpdate(req.userId, {
        $inc: {
          balance: totalCoinsAdded,
          totalBuyGoCoin: totalBuyAdded,
          totalAward: totalCommissionAdded
        }
      })
    }

    const updatedUser = await User.findById(req.userId)
    res.json({
      approvedCount: pendingOrders.length,
      coinsAdded: totalCoinsAdded,
      newBalance: updatedUser.balance
    })
  } catch (err) {
    console.error('[POST /api/orders/auto-approve]', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
})

module.exports = router
