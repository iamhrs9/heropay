const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const router = express.Router()

const generateToken = (id) =>
  jwt.sign({ id, type: 'user' }, process.env.JWT_SECRET, { expiresIn: '30d' })

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { fullName, phone, email, password, referralCode } = req.body

    if (!fullName || !phone || !password) {
      return res.status(400).json({ message: 'Full name, phone, and password are required.' })
    }

    const existingUser = await User.findOne({ phone })
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this phone number already exists.' })
    }

    const user = await User.create({
      fullName,
      phone,
      email: email || '',
      password,
      referralCode: referralCode || ''
    })

    return res.status(201).json({
      message: 'Account created successfully!',
      token: generateToken(user._id),
      user: {
        _id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        balance: user.balance,
        totalBuyGoCoin: user.totalBuyGoCoin,
        totalAward: user.totalAward
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

    const user = await User.findOne({ phone })
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

    return res.json({
      message: 'Login successful!',
      token: generateToken(user._id),
      user: {
        _id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        balance: user.balance,
        totalBuyGoCoin: user.totalBuyGoCoin,
        totalAward: user.totalAward
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
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ message: 'User not found.' })
    return res.json({
      _id: user._id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      balance: user.balance,
      totalBuyGoCoin: user.totalBuyGoCoin,
      totalAward: user.totalAward
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error.' })
  }
})

module.exports = router
