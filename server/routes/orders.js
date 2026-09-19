const express = require('express')
const Order = require('../models/Order')
const User = require('../models/User')
const PaymentAccount = require('../models/PaymentAccount')
const { protect } = require('../middleware/auth')

const router = express.Router()

// All routes below are protected (require user JWT)

// Helper: auto-approve any pending orders whose deadline has passed
async function autoApproveUserExpiredOrders(userId) {
  try {
    const now = new Date()
    const pendingOrders = await Order.find({
      userId,
      status: 'Pending',
      autoApproveAt: { $lte: now }
    })

    if (!pendingOrders || !pendingOrders.length) {
      return { approvedCount: 0, coinsAdded: 0, approvedOrders: [] }
    }

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
      await User.findByIdAndUpdate(userId, {
        $inc: {
          balance: totalCoinsAdded,
          totalBuyGoCoin: totalBuyAdded,
          totalAward: totalCommissionAdded
        }
      })
    }

    return {
      approvedCount: pendingOrders.length,
      coinsAdded: totalCoinsAdded,
      approvedOrders: pendingOrders
    }
  } catch (err) {
    console.error('[autoApproveUserExpiredOrders]', err.message)
    return { approvedCount: 0, coinsAdded: 0, approvedOrders: [] }
  }
}

// GET /api/orders  — fetch this user's orders (for Record screen)
router.get('/', protect, async (req, res) => {
  try {
    // Automatically auto-approve any expired orders on fetch
    await autoApproveUserExpiredOrders(req.userId)

    const user = await User.findById(req.userId)
    const filter = user ? { $or: [{ userId: user._id }, { userId: req.userId }] } : { userId: req.userId }
    const orders = await Order.find(filter).sort({ createdAt: -1 })
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

    // Ensure order is assigned an active payment account from MongoDB
    let assignedPaymentAccount = paymentAccount || null
    if (!assignedPaymentAccount) {
      let activeAccounts = await PaymentAccount.find({ isActive: true })
      if (!activeAccounts.length) {
        activeAccounts = await PaymentAccount.find()
      }
      if (activeAccounts.length > 0) {
        const randomIndex = Math.floor(Math.random() * activeAccounts.length)
        const chosen = activeAccounts[randomIndex]
        assignedPaymentAccount = {
          label: chosen.label,
          methodType: chosen.methodType || 'both',
          bankName: chosen.bankName || '',
          accountNumber: chosen.accountNumber || '',
          accountHolder: chosen.accountHolder || '',
          ifscCode: chosen.ifscCode || '',
          accountType: chosen.accountType || 'Current Account',
          bankBranch: chosen.bankBranch || '',
          upiId: chosen.upiId || '',
          upiPayeeName: chosen.upiPayeeName || ''
        }
      }
    }

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
      paymentAccount: assignedPaymentAccount,
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
router.post('/auto-approve', protect, async (req, res) => {
  try {
    const result = await autoApproveUserExpiredOrders(req.userId)
    const updatedUser = await User.findById(req.userId)
    res.json({
      approvedCount: result.approvedCount,
      coinsAdded: result.coinsAdded,
      newBalance: updatedUser?.balance || 0,
      approvedOrders: result.approvedOrders.map((o) => ({
        id: o.txId,
        coins: o.totalCoins
      }))
    })
  } catch (err) {
    console.error('[POST /api/orders/auto-approve]', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
})

module.exports = router
