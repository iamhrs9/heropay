require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const Admin = require('./models/Admin')

const path = require('path')

const authRoutes = require('./routes/auth')
const orderRoutes = require('./routes/orders')
const adminRoutes = require('./routes/admin')
const supportRoutes = require('./routes/support')
const withdrawalRoutes = require('./routes/withdrawals')

const compression = require('compression')

const app = express()

// ── HTTP Response Compression ─────────────────────────────────────────
// Automatically compress JS, CSS, HTML, JSON, and text responses via gzip/deflate
app.use(compression())

// ── Middleware ──────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// CORS: allow all origins in production, localhost in development
app.use(cors({ origin: true, credentials: true }))

// ── API Cache Policy: Never cache private/sensitive transactional API data ──
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  next()
})

// ── API Routes ──────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/support', supportRoutes)
app.use('/api/withdrawals', withdrawalRoutes)

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'HeroPay API' }))

// ── Static Frontend Serving (Production) with Cache Optimization ─────
// 1. Immutable 1-year cache for hashed Vite assets (/assets/index-xxxxx.js, .css, .webp)
app.use('/assets', express.static(path.join(__dirname, '../dist/assets'), {
  maxAge: '1y',
  immutable: true
}))

// 2. Default static handler with strict no-cache revalidation for index.html
app.use(express.static(path.join(__dirname, '../dist'), {
  maxAge: 0,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      res.setHeader('Pragma', 'no-cache')
      res.setHeader('Expires', '0')
    }
  }
}))

// 3. SPA Fallback with fresh HTML headers
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    return res.sendFile(path.join(__dirname, '../dist/index.html'))
  }
  next()
})

// ── MongoDB Connection + Server Start ───────────────────────────────
const startServer = async () => {
  try {
    console.log('⏳ Connecting to MongoDB (myheropay)...')
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ MongoDB connected → database: myheropay')

    // Seed admin account on first run (only if not already present)
    await seedAdmin()

    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => {
      console.log(`🚀 HeroPay API running on http://localhost:${PORT}`)
      console.log(`🛡️  Admin panel accessible at /adminonly`)
    })
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message)
    process.exit(1)
  }
}

// ── Seed / Sync Admin password from .env into MongoDB ───────────────
const seedAdmin = async () => {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminPassword) {
      console.warn('⚠️  ADMIN_PASSWORD not set in .env — skipping admin setup.')
      return
    }

    const existing = await Admin.findOne({ username: 'admin' })
    if (!existing) {
      // First run: create admin (password will be hashed by pre-save hook)
      await Admin.create({ username: 'admin', password: adminPassword })
      console.log(`🔑 Admin account created → password hashed & saved to myheroadmin`)
    } else {
      // Subsequent runs: always re-hash and update password from .env
      existing.password = adminPassword  // pre-save hook will hash it
      await existing.save()
      console.log(`🔑 Admin password synced from .env → hashed & updated in myheroadmin`)
    }
    console.log(`   Collections: myheroadmin, myherouser, myheroorder`)
  } catch (err) {
    console.error('Admin seed error:', err.message)
  }
}

startServer()
