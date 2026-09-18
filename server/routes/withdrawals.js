const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Withdrawal = require('../models/Withdrawal')
const { protect } = require('../middleware/auth')

// ── GET /api/withdrawals/my ──────────────────────────────────────────
// Fetch all withdrawal records for the logged-in user (shows in Sell / Records)
router.get('/my', protect, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ userId: req.userId }).sort({ createdAt: -1 })
    res.json(withdrawals)
  } catch (err) {
    console.error('[GET /api/withdrawals/my]', err.message)
    res.status(500).json({ message: 'Server error while fetching withdrawals.' })
  }
})

// ── GET /api/withdrawals/status ──────────────────────────────────────
// Check if user's withdrawal is enabled, get balance and UPI list
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ message: 'User not found.' })

    res.json({
      isWithdrawalEnabled: user.isWithdrawalEnabled !== false,
      balance: user.balance || 0,
      activeWithdrawalUpi: user.activeWithdrawalUpi || '',
      withdrawalUpis: user.withdrawalUpis || []
    })
  } catch (err) {
    console.error('[GET /api/withdrawals/status]', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
})

// ── POST /api/withdrawals/sync-upis ──────────────────────────────────
// User syncs their added UPI IDs to their MongoDB profile
router.post('/sync-upis', async (req, res) => {
  try {
    let targetUserId = null

    // 1. Try auth header token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1]
        const jwt = require('jsonwebtoken')
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        targetUserId = decoded.id
      } catch (e) {}
    }

    // 2. Fallback to userId or phone in body
    if (!targetUserId && req.body.userId) {
      targetUserId = req.body.userId
    }

    let user = null
    if (targetUserId) {
      user = await User.findById(targetUserId)
    } else if (req.body.phone) {
      user = await User.findOne({ phone: String(req.body.phone).trim() })
    }

    if (!user) {
      return res.status(401).json({ message: 'User not authenticated or not found.' })
    }

    const upis = req.body.upis || req.body.withdrawalUpis
    const activeWithdrawalUpi = req.body.activeWithdrawalUpi

    if (Array.isArray(upis)) {
      user.withdrawalUpis = upis.map((u) => {
        const address = (u.upiAddress || u.vpa || u.upiId || (u.id && !String(u.id).startsWith('upi-') ? u.id : '') || '').trim()
        return {
          upiId: address,
          payeeName: (u.payeeName || u.name || u.providerName || '').trim(),
          isDefault: Boolean(u.isDefault),
          enabled: u.enabled !== false && u.status !== 'inactive',
          addedAt: u.addedAt || new Date()
        }
      }).filter((u) => u.upiId)
    }

    if (typeof activeWithdrawalUpi === 'string' && activeWithdrawalUpi.trim()) {
      user.activeWithdrawalUpi = activeWithdrawalUpi.trim()
    } else if (user.withdrawalUpis?.length > 0 && !user.activeWithdrawalUpi) {
      const active = user.withdrawalUpis.find(u => u.enabled !== false) || user.withdrawalUpis[0]
      user.activeWithdrawalUpi = active ? active.upiId : ''
    }

    await user.save()

    res.json({
      message: 'UPI accounts synced successfully.',
      withdrawalUpis: user.withdrawalUpis,
      activeWithdrawalUpi: user.activeWithdrawalUpi
    })
  } catch (err) {
    console.error('[POST /api/withdrawals/sync-upis]', err.message)
    res.status(500).json({ message: 'Server error while syncing UPI accounts.' })
  }
})

module.exports = router
