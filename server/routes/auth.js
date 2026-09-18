const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const router = express.Router()

const generateToken = (id) =>
  jwt.sign({ id, type: 'user' }, process.env.JWT_SECRET, { expiresIn: '30d' })

// Helper: generate a unique 8-character referral code (HP + 6 uppercase chars/numbers)
async function generateUniqueReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let attempts = 0
  while (attempts < 15) {
    let code = 'HP'
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    const exists = await User.findOne({ referralCode: code })
    if (!exists) return code
    attempts++
  }
  return 'HP' + Date.now().toString(36).toUpperCase().slice(-6)
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { fullName, phone, email, password, referralCode: incomingInviteCode } = req.body

    if (!fullName || !phone || !password) {
      return res.status(400).json({ message: 'Full name, phone, and password are required.' })
    }

    const existingUser = await User.findOne({ phone })
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this phone number already exists.' })
    }

    // 1. Look up referrer if invite code was provided
    let referredByUserId = null
    if (incomingInviteCode && incomingInviteCode.trim()) {
      const cleanCode = incomingInviteCode.trim().toUpperCase()
      const referrer = await User.findOne({
        $or: [
          { referralCode: cleanCode },
          { referralCode: incomingInviteCode.trim() },
          { phone: incomingInviteCode.trim() }
        ]
      })
      if (referrer) {
        referredByUserId = referrer._id
      }
    }

    // 2. Generate unique referral code for the new user
    const myReferralCode = await generateUniqueReferralCode()

    const user = await User.create({
      fullName,
      phone,
      email: email || '',
      password,
      referralCode: myReferralCode,
      referredBy: referredByUserId
    })

    return res.status(201).json({
      message: 'Account created successfully!',
      token: generateToken(user._id),
      user: {
        _id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        referralCode: user.referralCode,
        balance: user.balance,
        totalBuyGoCoin: user.totalBuyGoCoin,
        totalAward: user.totalAward,
        isWithdrawalEnabled: user.isWithdrawalEnabled !== false,
        withdrawalUpis: user.withdrawalUpis || [],
        activeWithdrawalUpi: user.activeWithdrawalUpi || ''
      }
    })
  } catch (err) {
    console.error('[/api/auth/register]', err.message)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required.' })
    }

    let user = await User.findOne({ phone })
    if (!user) {
      return res.status(401).json({ message: 'No account found with this phone number.' })
    }

    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' })
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been suspended. Contact support.' })
    }

    // Auto-assign referralCode if missing for existing user
    if (!user.referralCode || !user.referralCode.trim()) {
      user.referralCode = await generateUniqueReferralCode()
      await user.save()
    }

    return res.json({
      message: 'Login successful!',
      token: generateToken(user._id),
      user: {
        _id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        referralCode: user.referralCode,
        balance: user.balance,
        totalBuyGoCoin: user.totalBuyGoCoin,
        totalAward: user.totalAward,
        isWithdrawalEnabled: user.isWithdrawalEnabled !== false,
        withdrawalUpis: user.withdrawalUpis || [],
        activeWithdrawalUpi: user.activeWithdrawalUpi || ''
      }
    })
  } catch (err) {
    console.error('[/api/auth/login]', err.message)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
})

// GET /api/auth/me  — refresh user data from DB
const { protect } = require('../middleware/auth')
router.get('/me', protect, async (req, res) => {
  try {
    let user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ message: 'User not found.' })

    // Auto-assign referralCode if missing for existing user
    if (!user.referralCode || !user.referralCode.trim()) {
      user.referralCode = await generateUniqueReferralCode()
      await user.save()
    }

    return res.json({
      _id: user._id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      referralCode: user.referralCode,
      balance: user.balance,
      totalBuyGoCoin: user.totalBuyGoCoin,
      totalAward: user.totalAward,
      isWithdrawalEnabled: user.isWithdrawalEnabled !== false,
      withdrawalUpis: user.withdrawalUpis || [],
      activeWithdrawalUpi: user.activeWithdrawalUpi || ''
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error.' })
  }
})

// GET /api/auth/team — fetch this user's dynamic referral team (Level 1 & Level 2)
router.get('/team', protect, async (req, res) => {
  try {
    let user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ message: 'User not found.' })

    if (!user.referralCode || !user.referralCode.trim()) {
      user.referralCode = await generateUniqueReferralCode()
      await user.save()
    }

    // 1. Level 1: direct referrals
    const level1Users = await User.find({ referredBy: user._id }).sort({ createdAt: -1 })

    // 2. Level 2: referrals made by Level 1 members
    const level1Ids = level1Users.map((u) => u._id)
    const level2Users = level1Ids.length > 0
      ? await User.find({ referredBy: { $in: level1Ids } }).sort({ createdAt: -1 })
      : []

    // Helper to format member data safely for UI
    const formatMember = (m) => {
      const p = m.phone || ''
      const maskedPhone = p.length >= 10
        ? `${p.slice(0, 3)}****${p.slice(-3)}`
        : (p ? `${p.slice(0, 2)}****` : 'User')
      const timeStr = new Date(m.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
      const commission = Number(m.totalAward || 0)
      const reward = Number((commission * 0.1).toFixed(2))

      return {
        id: m._id,
        name: m.fullName || 'Member',
        phone: maskedPhone,
        date: timeStr,
        commission,
        reward,
        totalBought: m.totalBuyGoCoin || 0,
        avatarText: (m.fullName || 'U')[0].toUpperCase()
      }
    }

    res.json({
      referralCode: user.referralCode,
      referralUrl: 'https://tinyurl.com/4bxh52nh',
      totalMembers: level1Users.length + level2Users.length,
      level1Count: level1Users.length,
      level2Count: level2Users.length,
      level1Members: level1Users.map(formatMember),
      level2Members: level2Users.map(formatMember)
    })
  } catch (err) {
    console.error('[/api/auth/team]', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
})

module.exports = router
