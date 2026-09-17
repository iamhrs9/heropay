const express = require('express')
const jwt = require('jsonwebtoken')
const Admin = require('../models/Admin')
const User = require('../models/User')
const Order = require('../models/Order')
const PaymentConfig = require('../models/PaymentConfig')
const { protect, adminOnly } = require('../middleware/auth')

const router = express.Router()

const generateAdminToken = () =>
  jwt.sign({ id: 'admin', type: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' })

// POST /api/admin/login  — Admin login (single admin)
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body
    if (!password) return res.status(400).json({ message: 'Password is required.' })

    const admin = await Admin.findOne({ username: 'admin' })
    if (!admin) return res.status(401).json({ message: 'Admin account not set up yet.' })

    const isMatch = await admin.matchPassword(password)
    if (!isMatch) return res.status(401).json({ message: 'Incorrect admin password.' })

    return res.json({
      message: 'Admin login successful.',
      token: generateAdminToken()
    })
  } catch (err) {
    console.error('[POST /api/admin/login]', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
})

// All routes below require admin JWT
// GET /api/admin/stats  — Summary stats for dashboard
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const totalOrders = await Order.countDocuments()
    const pendingOrders = await Order.countDocuments({ status: 'Pending' })
    const holdOrders = await Order.countDocuments({ status: 'Hold' })
    const successOrders = await Order.countDocuments({ status: 'Success' })

    const totalCoinsResult = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$balance' } } }
    ])
    const totalCoinsInCirculation = totalCoinsResult[0]?.total || 0

    res.json({
      totalUsers,
      totalOrders,
      pendingOrders,
      holdOrders,
      successOrders,
      totalCoinsInCirculation
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error.' })
  }
})

// GET /api/admin/users  — All users with balances
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: 'Server error.' })
  }
})

// GET /api/admin/orders  — All orders with user info (for payment management)
router.get('/orders', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.query
    const filter = status ? { status } : {}
    const orders = await Order.find(filter)
      .populate('userId', 'fullName phone email balance')
      .sort({ createdAt: -1 })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ message: 'Server error.' })
  }
})

// PATCH /api/admin/orders/:id/status  — Approve / Reject / Hold
router.patch('/orders/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status, actionNote } = req.body
    const allowedStatuses = ['Pending', 'Success', 'Failed', 'Hold', 'Cancelled']
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' })
    }

    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found.' })

    const previousStatus = order.status
    order.status = status
    order.actionBy = 'admin'
    order.actionNote = actionNote || ''
    await order.save()

    // If approving: credit coins and commission to user wallet
    if (status === 'Success' && previousStatus !== 'Success') {
      await User.findByIdAndUpdate(order.userId, {
        $inc: {
          balance: order.totalCoins,
          totalBuyGoCoin: order.assignedAmount,
          totalAward: order.commission
        }
      })
    }

    // If reversing an approval (e.g., Success → Failed/Hold): deduct coins and commission
    if (previousStatus === 'Success' && status !== 'Success') {
      await User.findByIdAndUpdate(order.userId, {
        $inc: {
          balance: -order.totalCoins,
          totalBuyGoCoin: -order.assignedAmount,
          totalAward: -order.commission
        }
      })
    }

    const updatedOrder = await Order.findById(req.params.id).populate(
      'userId',
      'fullName phone email balance'
    )
    res.json({ message: `Order ${status === 'Success' ? 'approved' : status === 'Failed' ? 'rejected' : 'put on hold'} successfully.`, order: updatedOrder })
  } catch (err) {
    console.error('[PATCH /api/admin/orders/:id/status]', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
})

// POST /api/admin/users/:id/adjust-balance — Add/Deduct balance directly
router.post('/users/:id/adjust-balance', protect, adminOnly, async (req, res) => {
  try {
    const { amount, type } = req.body
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount === 0) {
      return res.status(400).json({ message: 'Valid non-zero amount required.' })
    }

    const delta = type === 'deduct' ? -Math.abs(numAmount) : Math.abs(numAmount)
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found.' })

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $inc: { balance: delta } },
      { new: true }
    ).select('-password')

    res.json({
      message: `Balance ${delta >= 0 ? 'credited' : 'deducted'} by ₹${Math.abs(delta).toFixed(2)}. New balance: ₹${updatedUser.balance.toFixed(2)}`,
      user: updatedUser
    })
  } catch (err) {
    console.error('[POST /api/admin/users/:id/adjust-balance]', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
})

const PaymentAccount = require('../models/PaymentAccount')

async function ensureDefaultAccount() {
  const count = await PaymentAccount.countDocuments()
  if (count === 0) {
    const oldConfig = await PaymentConfig.findOne({ configKey: 'main' }).catch(() => null)
    await PaymentAccount.create({
      label: 'Primary ICICI Account',
      bankName: oldConfig?.bankName || process.env.VITE_BANK_NAME || 'ICICI Bank Ltd',
      accountNumber: oldConfig?.accountNumber || process.env.VITE_ACCOUNT_NUMBER || '001205018924',
      accountHolder: oldConfig?.accountHolder || process.env.VITE_ACCOUNT_HOLDER || 'HEROPAY TECH SOLUTIONS PVT LTD',
      ifscCode: oldConfig?.ifscCode || process.env.VITE_IFSC_CODE || 'ICIC0000012',
      accountType: oldConfig?.accountType || process.env.VITE_ACCOUNT_TYPE || 'Current Account',
      bankBranch: oldConfig?.bankBranch || process.env.VITE_BANK_BRANCH || 'Connaught Place, New Delhi',
      upiId: oldConfig?.upiId || process.env.VITE_UPI_ID || 'heropay@icici',
      upiPayeeName: oldConfig?.upiPayeeName || process.env.VITE_UPI_PAYEE_NAME || 'HeroPay Tech Solutions',
      isActive: true
    })
  }
}

// GET /api/admin/payment-config — PUBLIC: fetch a RANDOM active bank & UPI account for user payment
router.get('/payment-config', async (req, res) => {
  try {
    await ensureDefaultAccount()
    let accounts = await PaymentAccount.find({ isActive: true })
    if (!accounts.length) {
      accounts = await PaymentAccount.find()
    }
    if (!accounts.length) {
      return res.json({
        bankName: process.env.VITE_BANK_NAME || '',
        accountNumber: process.env.VITE_ACCOUNT_NUMBER || '',
        accountHolder: process.env.VITE_ACCOUNT_HOLDER || '',
        ifscCode: process.env.VITE_IFSC_CODE || '',
        accountType: process.env.VITE_ACCOUNT_TYPE || 'Current Account',
        bankBranch: process.env.VITE_BANK_BRANCH || '',
        upiId: process.env.VITE_UPI_ID || '',
        upiPayeeName: process.env.VITE_UPI_PAYEE_NAME || ''
      })
    }
    const randomIndex = Math.floor(Math.random() * accounts.length)
    res.json(accounts[randomIndex])
  } catch (err) {
    console.error('[GET /api/admin/payment-config]', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
})

// GET /api/admin/payment-accounts — ADMIN ONLY: list all accounts
router.get('/payment-accounts', protect, adminOnly, async (req, res) => {
  try {
    await ensureDefaultAccount()
    const accounts = await PaymentAccount.find().sort({ createdAt: -1 })
    res.json(accounts)
  } catch (err) {
    console.error('[GET /api/admin/payment-accounts]', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
})

// POST /api/admin/payment-accounts — ADMIN ONLY: add new account
router.post('/payment-accounts', protect, adminOnly, async (req, res) => {
  try {
    const {
      label,
      bankName,
      accountNumber,
      accountHolder,
      ifscCode,
      accountType,
      bankBranch,
      upiId,
      upiPayeeName,
      isActive
    } = req.body

    if (!label?.trim()) {
      return res.status(400).json({ message: 'Account label/name is required.' })
    }

    const newAccount = await PaymentAccount.create({
      label: label.trim(),
      bankName: bankName?.trim() || '',
      accountNumber: accountNumber?.trim() || '',
      accountHolder: accountHolder?.trim() || '',
      ifscCode: ifscCode?.trim() || '',
      accountType: accountType?.trim() || 'Current Account',
      bankBranch: bankBranch?.trim() || '',
      upiId: upiId?.trim() || '',
      upiPayeeName: upiPayeeName?.trim() || '',
      isActive: isActive !== undefined ? Boolean(isActive) : true
    })

    res.status(201).json({ message: 'Payment account added successfully.', account: newAccount })
  } catch (err) {
    console.error('[POST /api/admin/payment-accounts]', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
})

// PATCH /api/admin/payment-accounts/:id — ADMIN ONLY: update account
router.patch('/payment-accounts/:id', protect, adminOnly, async (req, res) => {
  try {
    const account = await PaymentAccount.findById(req.params.id)
    if (!account) return res.status(404).json({ message: 'Account not found.' })

    const {
      label,
      bankName,
      accountNumber,
      accountHolder,
      ifscCode,
      accountType,
      bankBranch,
      upiId,
      upiPayeeName,
      isActive
    } = req.body

    if (label !== undefined) account.label = label.trim()
    if (bankName !== undefined) account.bankName = bankName.trim()
    if (accountNumber !== undefined) account.accountNumber = accountNumber.trim()
    if (accountHolder !== undefined) account.accountHolder = accountHolder.trim()
    if (ifscCode !== undefined) account.ifscCode = ifscCode.trim()
    if (accountType !== undefined) account.accountType = accountType.trim()
    if (bankBranch !== undefined) account.bankBranch = bankBranch.trim()
    if (upiId !== undefined) account.upiId = upiId.trim()
    if (upiPayeeName !== undefined) account.upiPayeeName = upiPayeeName.trim()
    if (isActive !== undefined) account.isActive = Boolean(isActive)

    await account.save()
    res.json({ message: 'Payment account updated successfully.', account })
  } catch (err) {
    console.error('[PATCH /api/admin/payment-accounts/:id]', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
})

// DELETE /api/admin/payment-accounts/:id — ADMIN ONLY: delete account
router.delete('/payment-accounts/:id', protect, adminOnly, async (req, res) => {
  try {
    const count = await PaymentAccount.countDocuments()
    if (count <= 1) {
      return res.status(400).json({ message: 'Cannot delete the only remaining account. Please add another account first.' })
    }
    const deleted = await PaymentAccount.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ message: 'Account not found.' })
    res.json({ message: 'Payment account deleted successfully.' })
  } catch (err) {
    console.error('[DELETE /api/admin/payment-accounts/:id]', err.message)
    res.status(500).json({ message: 'Server error.' })
  }
})

module.exports = router
