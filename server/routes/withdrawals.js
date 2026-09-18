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
router.post('/sync-upis', protect, async (req, res) => {
  try {
    const upis = req.body.upis || req.body.withdrawalUpis
    const activeWithdrawalUpi = req.body.activeWithdrawalUpi

    const updateFields = {}
    if (Array.isArray(upis)) {
      updateFields.withdrawalUpis = upis.map((u) => {
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

    if (typeof activeWithdrawalUpi === 'string') {
      updateFields.activeWithdrawalUpi = activeWithdrawalUpi.trim()
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateFields },
      { new: true }
    )

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' })
    }

    res.json({
      message: 'UPI accounts synced successfully.',
      withdrawalUpis: updatedUser.withdrawalUpis,
      activeWithdrawalUpi: updatedUser.activeWithdrawalUpi
    })
  } catch (err) {
    console.error('[POST /api/withdrawals/sync-upis]', err.message)
    res.status(500).json({ message: 'Server error while syncing UPI accounts.' })
  }
})

module.exports = router
