import React, { useState, useEffect, useCallback, useMemo } from 'react'
import LoginScreen from './screens/LoginScreen'
import SignupScreen from './screens/SignupScreen'
import WithdrawUPIScreen from './screens/WithdrawUPIScreen'
import SellScreen from './screens/SellScreen'
import BuyScreen from './screens/BuyScreen'
import PaymentGatewayScreen from './screens/PaymentGatewayScreen'
import UPIScreen from './screens/UPIScreen'
import TeamScreen from './screens/TeamScreen'
import MeScreen from './screens/MeScreen'
import RecordScreen from './screens/RecordScreen'
import BottomNavigation from './components/BottomNavigation'
import backgroundSrc from './assets/background.png'
import { Coins, Clock, X, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react'
import { AUTO_APPROVE_MINUTES, STOCK_FLUCTUATE_MS, commissionLabel } from './config'

// Random live stock generator for active packages (packages 1-6 up to 9,999)
// Packages 7-12 (> 9,000) strictly remain at 0 (sold out)
export const generateRandomStock = () => ({
  1: Math.floor(Math.random() * 50) + 5,  // 500 - 999
  2: Math.floor(Math.random() * 50) + 5,  // 1000 - 1999
  3: Math.floor(Math.random() * 58) + 2,  // 2000 - 2999 (e.g. 23 -> 45 -> 12 -> 2 -> 54 etc.)
  4: Math.floor(Math.random() * 40) + 3,  // 3000 - 4999
  5: Math.floor(Math.random() * 32) + 2,  // 5000 - 7499
  6: Math.floor(Math.random() * 25) + 1,  // 7500 - 9999
  // Strictly 0 stock for packages sold out (> 9,000)
  7: 0,   // 10000 - 14999
  8: 0,   // 15000 - 24999
  9: 0,   // 25000 - 34999
  10: 0,  // 35000 - 49999
  11: 0,  // 50000 - 59999
  12: 0   // 60000 - 75000
})

export default function App() {
  // Screens: 'signup', 'login', 'withdraw-upi', 'sell', 'buy', 'payment-gateway', 'upi', 'team', 'me'
  const [currentScreen, setCurrentScreen] = useState('login')
  const [activeTab, setActiveTab] = useState('sell')
  const [returnScreen, setReturnScreen] = useState('sell')
  const [toastMessage, setToastMessage] = useState(null)

  // Logged in user (from MongoDB via JWT)
  const [loggedInUser, setLoggedInUser] = useState(null)

  // Wallet & Accounting Shared State (synced from DB on login)
  const [userBalance, setUserBalance] = useState(() => {
    try {
      const savedUser = localStorage.getItem('hp_user')
      if (savedUser) {
        const u = JSON.parse(savedUser)
        return Number(u.balance) || 0
      }
    } catch {}
    return 0
  })
  const [totalAward, setTotalAward] = useState(0.00)
  const [totalBuyGoCoin, setTotalBuyGoCoin] = useState(0.00)

  // Package Stock State initialized randomly on browser refresh / first load
  const [packagesStock, setPackagesStock] = useState(generateRandomStock)

  // User's Withdrawal UPI accounts (synced with localStorage, starts empty until user adds their own)
  const [withdrawalUpis, setWithdrawalUpis] = useState(() => {
    try {
      const saved = localStorage.getItem('hp_withdrawal_upis')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Clean out any legacy dummy UPI accounts only
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (u) => u && u.id !== 'upi-1' && u.id !== 'upi-2' && !u.isLegacyMock
          )
        }
      }
    } catch {}
    return []
  })

  // Whenever withdrawalUpis changes, save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('hp_withdrawal_upis', JSON.stringify(withdrawalUpis))
    } catch {}
  }, [withdrawalUpis])

  const isUpiActive = (u) => Boolean(u && u.enabled !== false && u.status !== 'inactive')

  // Count of active/enabled withdrawal UPI accounts
  const activeUpiCount = useMemo(() => {
    return withdrawalUpis.filter(isUpiActive).length
  }, [withdrawalUpis])

  // Dynamic Transaction Records & Pending Orders
  const [transactionRecords, setTransactionRecords] = useState([])
  const [pendingOrdersList, setPendingOrdersList] = useState([])
  const [pendingOrderDetails, setPendingOrderDetails] = useState(null)
  const [inspectProofOrder, setInspectProofOrder] = useState(null)

  // ── Dynamic 15-min In-Transaction Sell Simulator Engine ──────────
  // User simulated sell transactions (synced with localStorage)
  const [simulatedSellOrders, setSimulatedSellOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('hp_sim_sell_orders')
      if (saved) return JSON.parse(saved)
    } catch {}
    return []
  })

  // Simulated cycle metadata: { phase: 'active' | 'cooldown', phaseEndsAt: number }
  const [sellSimCycle, setSellSimCycle] = useState(() => {
    try {
      const saved = localStorage.getItem('hp_sim_sell_cycle')
      if (saved) return JSON.parse(saved)
    } catch {}
    return null
  })

  useEffect(() => {
    try {
      localStorage.setItem('hp_sim_sell_orders', JSON.stringify(simulatedSellOrders))
    } catch {}
  }, [simulatedSellOrders])

  useEffect(() => {
    try {
      if (sellSimCycle) {
        localStorage.setItem('hp_sim_sell_cycle', JSON.stringify(sellSimCycle))
      } else {
        localStorage.removeItem('hp_sim_sell_cycle')
      }
    } catch {}
  }, [sellSimCycle])

  // Helper to generate realistic withdrawal orders for any cycle window
  const generateSimulatedOrders = useCallback((startTime, endTime, activeUpis, currentBal, isFailed, userPhone) => {
    const bal = Number(currentBal) || 0
    if (bal <= 0) return []

    // Target withdrawal amount: strictly <= bal (never exceeds user wallet balance)
    let targetTotal = 0
    if (bal < 100) {
      targetTotal = Math.floor(bal)
    } else {
      // Pick an amount between 60% and 100% of user balance (rounded to nearest 50 or 100)
      const ratios = [0.65, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0]
      const chosenRatio = ratios[Math.floor(Math.random() * ratios.length)]
      let rawAmt = bal * chosenRatio
      if (bal >= 500) {
        targetTotal = Math.floor(rawAmt / 100) * 100
      } else {
        targetTotal = Math.floor(rawAmt / 50) * 50
      }
      if (targetTotal <= 0) targetTotal = Math.floor(bal)
      if (targetTotal > bal) targetTotal = Math.floor(bal)
    }

    if (targetTotal <= 0) return []

    // Divide into 1, 2, or max 3 orders randomly as requested
    let chunks = [targetTotal]
    let orderCount = 1

    if (targetTotal >= 600) {
      const rand = Math.random()
      if (rand < 0.40) orderCount = 1      // 40% chance 1 order
      else if (rand < 0.75) orderCount = 2 // 35% chance 2 orders
      else orderCount = 3                  // 25% chance 3 orders
    } else if (targetTotal >= 300) {
      orderCount = Math.random() < 0.5 ? 1 : 2
    } else {
      orderCount = 1
    }

    if (orderCount === 1) {
      chunks = [targetTotal]
    } else if (orderCount === 2) {
      let c1 = Math.round((targetTotal * 0.6) / 50) * 50
      if (c1 >= targetTotal || c1 <= 0) c1 = Math.floor(targetTotal / 2)
      let c2 = targetTotal - c1
      if (c1 > 0 && c2 > 0) {
        chunks = [c1, c2]
      } else {
        chunks = [targetTotal]
      }
    } else if (orderCount === 3) {
      let c1 = Math.round((targetTotal * 0.4) / 50) * 50
      let c2 = Math.round((targetTotal * 0.35) / 50) * 50
      if (c1 <= 0) c1 = 100
      if (c2 <= 0) c2 = 100
      let c3 = targetTotal - c1 - c2
      if (c1 > 0 && c2 > 0 && c3 > 0) {
        chunks = [c1, c2, c3]
      } else {
        let half = Math.floor(targetTotal / 2)
        chunks = [half, targetTotal - half]
      }
    }

    // Determine UPI list to assign orders to
    const fallbackUpi = {
      providerName: 'UPI',
      vpa: userPhone ? `${userPhone}@paytm` : 'user@okaxis',
      phone: userPhone || ''
    }
    const upiList = activeUpis && activeUpis.length > 0 ? activeUpis : [fallbackUpi]

    const d = new Date(startTime)
    const nowD = new Date()
    const isToday = d.toDateString() === nowD.toDateString()
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const dateStr = isToday
      ? `Today, ${timeStr}`
      : `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`

    return chunks.map((chunkAmt, idx) => {
      const chosenUpi = upiList[idx % upiList.length]
      const methodStr = `${chosenUpi.providerName || 'UPI'} (${chosenUpi.vpa || chosenUpi.upiAddress || chosenUpi.phone || 'Linked UPI'})`
      const orderId = `SELL_${startTime}_${idx + 1}`

      return {
        id: orderId,
        txId: orderId,
        type: 'sell',
        title: 'Sell Hero-Coin to HeroPay',
        amount: `-${Number(chunkAmt).toFixed(2)}`,
        coins: Number(chunkAmt).toFixed(2),
        status: isFailed ? 'Failed' : 'Pending',
        date: dateStr,
        method: methodStr,
        assignedUpi: chosenUpi,
        createdAt: startTime,
        expiresAt: endTime,
        autoApproveAt: endTime,
        actionNote: isFailed ? 'Order failed because of your UPI issue' : ''
      }
    })
  }, [])

  // Continuous Simulator Lifecycle Engine: runs even when app was closed, offline, or minimized
  const reconcileCycles = useCallback(() => {
    const activeUpis = withdrawalUpis.filter(isUpiActive)
    const currentBal = Number(userBalance) || 0

    // RULE 1: If user has 0 balance (or <= 0), NO withdrawal should run!
    if (currentBal <= 0) {
      try {
        localStorage.removeItem('hp_sim_cycle_anchor')
        localStorage.removeItem('hp_sim_sell_cycle')
      } catch {}
      setSellSimCycle(null)
      setSimulatedSellOrders((prev) => {
        if (!prev.some((o) => o.status === 'Pending')) return prev
        return prev.filter((o) => o.status !== 'Pending')
      })
      return
    }

    // RULE 2: If user has XYZ balance (> 0), start withdrawal cycle!
    const now = Date.now()
    const ACTIVE_DURATION_MS = 15 * 60 * 1000 // 15 mins active
    const COOLDOWN_DURATION_MS = 90 * 1000 // 1.5 mins cooldown
    const TOTAL_CYCLE_MS = ACTIVE_DURATION_MS + COOLDOWN_DURATION_MS // 16.5 mins per cycle

    let anchor = null
    try {
      const savedAnchor = localStorage.getItem('hp_sim_cycle_anchor')
      if (savedAnchor) anchor = parseInt(savedAnchor, 10)
    } catch {}

    if (!anchor || isNaN(anchor) || anchor > now) {
      anchor = now
      try {
        localStorage.setItem('hp_sim_cycle_anchor', String(anchor))
      } catch {}
    }

    const elapsed = now - anchor
    const completedCycles = Math.floor(elapsed / TOTAL_CYCLE_MS)

    // Reconcile completed cycles that occurred while app was offline/closed
    if (completedCycles > 0) {
      const newAnchor = anchor + completedCycles * TOTAL_CYCLE_MS
      try {
        localStorage.setItem('hp_sim_cycle_anchor', String(newAnchor))
      } catch {}

      // Generate historical failed records for elapsed cycles (up to last 6)
      const startIdx = Math.max(0, completedCycles - 6)
      const historicalFailedOrders = []

      for (let i = startIdx; i < completedCycles; i++) {
        const cycleStart = anchor + i * TOTAL_CYCLE_MS
        const cycleEnd = cycleStart + ACTIVE_DURATION_MS
        const orders = generateSimulatedOrders(
          cycleStart,
          cycleEnd,
          activeUpis,
          currentBal,
          true,
          loggedInUser?.phone
        )
        historicalFailedOrders.push(...orders)
      }

      setSimulatedSellOrders((prev) => {
        const updatedPrev = prev.map((o) =>
          o.status === 'Pending'
            ? { ...o, status: 'Failed', actionNote: 'Order failed because of your UPI issue' }
            : o
        )
        const existingIds = new Set(updatedPrev.map((o) => o.id))
        const newPast = historicalFailedOrders.filter((o) => !existingIds.has(o.id))
        return [...newPast, ...updatedPrev].slice(0, 35)
      })

      anchor = newAnchor
    }

    // Evaluate current cycle
    const currentOffset = now - anchor

    if (currentOffset < ACTIVE_DURATION_MS) {
      // Phase: ACTIVE (15 mins)
      const activeEndsAt = anchor + ACTIVE_DURATION_MS
      const activeCycle = { phase: 'active', phaseEndsAt: activeEndsAt }
      setSellSimCycle(activeCycle)
      try {
        localStorage.setItem('hp_sim_sell_cycle', JSON.stringify(activeCycle))
      } catch {}

      setSimulatedSellOrders((prev) => {
        const pendingOrders = prev.filter((o) => o.status === 'Pending')
        const pendingTotal = pendingOrders.reduce((sum, o) => sum + (Number(o.coins) || 0), 0)

        // If existing pending total exceeds current balance, wipe and generate strictly <= currentBal
        if (pendingTotal > currentBal || pendingTotal <= 0) {
          const nonPending = prev.filter((o) => o.status !== 'Pending')
          const freshBatch = generateSimulatedOrders(
            anchor,
            activeEndsAt,
            activeUpis,
            currentBal,
            false,
            loggedInUser?.phone
          )
          return [...freshBatch, ...nonPending].slice(0, 35)
        }

        const hasActivePending = pendingOrders.length > 0 && pendingOrders.some(
          (o) => o.expiresAt && o.expiresAt > now
        )
        if (hasActivePending) {
          return prev.map((o) =>
            o.status === 'Pending'
              ? { ...o, expiresAt: activeEndsAt, autoApproveAt: activeEndsAt }
              : o
          )
        }

        // Generate current cycle's pending withdrawal batch strictly <= currentBal
        const newBatch = generateSimulatedOrders(
          anchor,
          activeEndsAt,
          activeUpis,
          currentBal,
          false,
          loggedInUser?.phone
        )
        const nonPending = prev.filter((o) => o.status !== 'Pending')
        return [...newBatch, ...nonPending].slice(0, 35)
      })
    } else {
      // Phase: COOLDOWN (1.5 mins) — during this phase inTransaction is 0.00
      const cooldownEndsAt = anchor + TOTAL_CYCLE_MS
      const cooldownCycle = { phase: 'cooldown', phaseEndsAt: cooldownEndsAt }
      setSellSimCycle(cooldownCycle)
      try {
        localStorage.setItem('hp_sim_sell_cycle', JSON.stringify(cooldownCycle))
      } catch {}

      setSimulatedSellOrders((prev) => {
        if (!prev.some((o) => o.status === 'Pending')) return prev
        return prev.map((o) =>
          o.status === 'Pending'
            ? { ...o, status: 'Failed', actionNote: 'Order failed because of your UPI issue' }
            : o
        )
      })
    }
  }, [withdrawalUpis, userBalance, loggedInUser, generateSimulatedOrders])

  useEffect(() => {
    reconcileCycles()

    const interval = setInterval(reconcileCycles, 2000)

    const handleSync = () => {
      reconcileCycles()
    }

    document.addEventListener('visibilitychange', handleSync)
    window.addEventListener('focus', handleSync)
    window.addEventListener('online', handleSync)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleSync)
      window.removeEventListener('focus', handleSync)
      window.removeEventListener('online', handleSync)
    }
  }, [reconcileCycles])

  // Safety guard: ensure pending simulated sell orders NEVER exceed current userBalance
  useEffect(() => {
    const currentBal = Number(userBalance) || 0
    if (currentBal <= 0) return // NEVER wipe orders if user balance is 0 or loading!

    const pendingOrders = simulatedSellOrders.filter((o) => o.status === 'Pending')
    if (pendingOrders.length === 0) return

    const pendingTotal = pendingOrders.reduce(
      (acc, o) => acc + Math.abs(parseFloat(o.amount || o.coins || 0)),
      0
    )

    // Only clamp if pendingTotal strictly exceeds currentBal
    if (pendingTotal > currentBal) {
      const maxPossible = Math.floor(currentBal)
      const validAmounts = [100, 200, 300, 400, 500, 600, 700, 800, 1000, 1200, 1500].filter(
        (v) => v <= maxPossible
      )
      const candidatePool = validAmounts.slice(Math.max(0, validAmounts.length - 3))
      const newTarget =
        candidatePool[Math.floor(Math.random() * candidatePool.length)] || Math.min(maxPossible, 500)

      // Split into chunks if multiple pending orders existed
      let newChunks = [newTarget]
      if (newTarget >= 400 && pendingOrders.length > 1) {
        let c1 = Math.round((newTarget * 0.6) / 100) * 100
        if (c1 >= newTarget) c1 = newTarget - 100
        newChunks = [c1, newTarget - c1]
      }

      setSimulatedSellOrders((prev) => {
        const nonPending = prev.filter((o) => o.status !== 'Pending')
        const updatedPending = pendingOrders.slice(0, newChunks.length).map((order, i) => {
          const amt = newChunks[i] || newChunks[0]
          return {
            ...order,
            amount: `-${Number(amt).toFixed(2)}`,
            coins: Number(amt).toFixed(2)
          }
        })
        return [...updatedPending, ...nonPending]
      })
    }
  }, [userBalance, simulatedSellOrders])

  // Combine real user orders and simulated sell transactions
  const allTransactionRecords = useMemo(() => {
    const map = new Map()
    simulatedSellOrders.forEach((o) => map.set(o.id, o))
    transactionRecords.forEach((o) => {
      if (!map.has(o.id)) map.set(o.id, o)
    })
    return Array.from(map.values()).sort((a, b) => {
      const timeA = a.createdAt || 0
      const timeB = b.createdAt || 0
      return timeB - timeA
    })
  }, [simulatedSellOrders, transactionRecords])

  // Dynamic metrics for Sell / Withdrawal section
  const sellStats = useMemo(() => {
    const completedSells = allTransactionRecords.filter(
      (tx) => tx.type === 'sell' && tx.status === 'Success'
    )
    const todayWithdrawal = completedSells.reduce((sum, tx) => {
      const num = parseFloat(String(tx.amount).replace(/[^0-9.-]/g, '')) || 0
      return sum + Math.abs(num)
    }, 0)

    const pendingSells = allTransactionRecords.filter(
      (tx) => tx.type === 'sell' && tx.status === 'Pending'
    )
    const inTransaction = pendingSells.reduce((sum, tx) => {
      const num = parseFloat(String(tx.amount).replace(/[^0-9.-]/g, '')) || 0
      return sum + Math.abs(num)
    }, 0)

    const hasWithdrawalInProgress = pendingSells.length > 0 && inTransaction > 0
    const activeWithdrawal = pendingSells[0] || null

    return {
      todayWithdrawal,
      inTransaction,
      hasWithdrawalInProgress,
      activeWithdrawal
    }
  }, [allTransactionRecords])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 2800)
  }

  // ── Fetch User Orders from MongoDB ──────────────────────────────
  const loadUserOrders = useCallback(async (token) => {
    if (!token) return
    try {
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) return
      const orders = await res.json()
      if (Array.isArray(orders)) {
        const recordsList = []
        orders.forEach((o) => {
          const autoApproveMs = o.autoApproveAt ? new Date(o.autoApproveAt).getTime() : null
          const timeStr = new Date(o.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          const dateStr = new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })

          const mainEntry = {
            id: o.txId,
            txId: o.txId,
            _id: o._id,
            type: 'buy',
            title: `Buy Package (${o.packageRange})`,
            amount: `+${o.assignedAmount.toFixed(2)}`,
            coins: o.assignedAmount.toFixed(2),
            commissionAmount: o.commission,
            totalCoins: o.totalCoins,
            status: o.status,
            date: `${dateStr}, ${timeStr}`,
            method: o.proofSubmitted ? (o.utr ? `UTR: ${o.utr}` : 'Proof Submitted') : 'Payment Incomplete (Click to Pay)',
            utr: o.utr,
            screenshot: o.screenshotUrl,
            proofSubmitted: Boolean(o.proofSubmitted),
            pkg: { range: o.packageRange },
            packageRange: o.packageRange,
            assignedAmount: o.assignedAmount,
            commission: o.commission,
            autoApproveAt: autoApproveMs,
            paymentAccount: o.paymentAccount,
            createdAt: new Date(o.createdAt).getTime()
          }
          recordsList.push(mainEntry)

          // If order is approved (Success), also generate the separate Commission entry
          if (o.status === 'Success' && o.commission > 0) {
            recordsList.push({
              id: `${o.txId}_COMM`,
              txId: `${o.txId}_COMM`,
              type: 'buy',
              title: `Buy Commission (${commissionLabel})`,
              amount: `+${Number(o.commission).toFixed(2)}`,
              coins: Number(o.commission).toFixed(2),
              commissionAmount: o.commission,
              totalCoins: o.commission,
              status: 'Success',
              date: `${dateStr}, ${timeStr}`,
              method: 'System Yield Credited',
              createdAt: new Date(o.createdAt).getTime() + 1
            })
          }
        })
        setTransactionRecords(recordsList)
        setPendingOrdersList(recordsList.filter((m) => m.status === 'Pending'))
      }
    } catch {}
  }, [])

  // ── Auto-login from localStorage on first mount & background live sync ──────────
  useEffect(() => {
    const token = localStorage.getItem('hp_token')
    const userStr = localStorage.getItem('hp_user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        setLoggedInUser(user)
        setUserBalance(user.balance || 0)
        setTotalBuyGoCoin(user.totalBuyGoCoin || 0)
        setTotalAward(user.totalAward || 0)
        setCurrentScreen('sell')
        setActiveTab('sell')
        loadUserOrders(token)
      } catch (_) {
        localStorage.removeItem('hp_token')
        localStorage.removeItem('hp_user')
      }
    }
  }, [loadUserOrders])

  // Live polling: refresh fresh balance, award & orders from DB every 4 seconds
  useEffect(() => {
    const token = localStorage.getItem('hp_token')
    if (!token) return

    const syncUserAndOrders = () => {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((freshUser) => {
          if (freshUser._id) {
            setLoggedInUser(freshUser)
            setUserBalance(freshUser.balance || 0)
            setTotalBuyGoCoin(freshUser.totalBuyGoCoin || 0)
            setTotalAward(freshUser.totalAward || 0)
            localStorage.setItem('hp_user', JSON.stringify(freshUser))
          }
        })
        .catch(() => {})

      loadUserOrders(token)
    }

    syncUserAndOrders()
    const pollTimer = setInterval(syncUserAndOrders, 4000)
    return () => clearInterval(pollTimer)
  }, [loggedInUser?._id, loadUserOrders])

  // Re-roll random stock units for active packages (1-6) on demand
  const handleManualRefreshStock = () => {
    setPackagesStock(generateRandomStock())
  }

  // Auto-fluctuate stock units every 1-2 minutes for active packages (packages > 9k stay 0)
  useEffect(() => {
    const stockTimer = setInterval(() => {
      setPackagesStock(generateRandomStock())
    }, STOCK_FLUCTUATE_MS)
    return () => clearInterval(stockTimer)
  }, [])

  // Auto-approve pending orders after 15-20 minutes if admin hasn't approved
  useEffect(() => {
    const autoApprovalInterval = setInterval(() => {
      const now = Date.now()
      pendingOrdersList.forEach((order) => {
        if (order.autoApproveAt && now >= order.autoApproveAt) {
          handleApproveOrder(order.id, true)
        }
      })
    }, 2500)
    return () => clearInterval(autoApprovalInterval)
  }, [pendingOrdersList])

  // Navigate to Payment Gateway & Save Order immediately to MongoDB
  const handleProceedToPayment = (order) => {
    // If resuming an already generated order (from Record screen)
    if (order.txId) {
      setPendingOrderDetails(order)
      setCurrentScreen('payment-gateway')
      return
    }

    // New order: generate unique txId and 15-minute deadline
    const txId = 'TX' + Math.floor(100000 + Math.random() * 900000)
    const autoApproveAt = Date.now() + AUTO_APPROVE_MINUTES * 60 * 1000
    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    const newPendingOrder = {
      ...order,
      id: txId,
      txId,
      type: 'buy',
      title: `Buy Package (${order.pkg?.range || order.packageRange})`,
      amount: `+${order.assignedAmount.toFixed(2)}`,
      coins: order.assignedAmount.toFixed(2),
      commissionAmount: order.commission,
      totalCoins: order.totalCoins,
      status: 'Pending',
      proofSubmitted: false,
      date: `Today, ${timeStr}`,
      method: 'Payment Incomplete (Click to Pay)',
      pkg: order.pkg || { range: order.packageRange },
      packageRange: order.pkg?.range || order.packageRange,
      assignedAmount: order.assignedAmount,
      commission: order.commission,
      autoApproveAt,
      createdAt: Date.now()
    }

    // 1. Immediately store in local state so Record screen has it
    setTransactionRecords((prev) => [newPendingOrder, ...prev.filter((p) => p.id !== txId)])
    setPendingOrdersList((prev) => [newPendingOrder, ...prev.filter((p) => p.id !== txId)])
    setPendingOrderDetails(newPendingOrder)
    setCurrentScreen('payment-gateway')

    // 2. Save order to MongoDB immediately so closing/refreshing preserves it
    const token = localStorage.getItem('hp_token')
    if (token) {
      fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          txId,
          packageRange: order.pkg?.range || order.packageRange,
          assignedAmount: order.assignedAmount,
          commission: order.commission,
          totalCoins: order.totalCoins,
          autoApproveAt: new Date(autoApproveAt).toISOString(),
          proofSubmitted: false,
          paymentAccount: order.paymentAccount || null
        })
      })
        .then((r) => r.json())
        .then((saved) => {
          if (saved?._id) {
            setPendingOrderDetails((prev) => (prev ? { ...prev, _id: saved._id } : null))
          }
        })
        .catch(() => {})
    }
  }

  // Resume an incomplete order from RecordScreen
  const handleContinueOrder = (order) => {
    setPendingOrderDetails(order)
    setCurrentScreen('payment-gateway')
  }

  // Cancel an incomplete/pending order
  const handleCancelOrder = async (order) => {
    if (!order) return
    const orderTxId = order.txId || order.id

    // 1. Call backend to cancel order in MongoDB
    const token = localStorage.getItem('hp_token')
    if (token && orderTxId) {
      try {
        const res = await fetch(`/api/orders/by-tx/${orderTxId}/cancel`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })
        const data = await res.json()
        if (!res.ok) {
          showToast(data.message || 'Failed to cancel order.')
          return
        }
      } catch (err) {
        console.error('Cancel order error:', err)
      }
    }

    // 2. Update transaction status to 'Cancelled' in state
    setTransactionRecords((prev) =>
      prev.map((tx) =>
        (tx.id === orderTxId || tx.txId === orderTxId)
          ? {
              ...tx,
              status: 'Cancelled',
              actionNote: 'Cancelled by user',
              method: 'Order Cancelled'
            }
          : tx
      )
    )

    // 3. Remove from pending queue
    setPendingOrdersList((prev) =>
      prev.filter((o) => o.id !== orderTxId && o.txId !== orderTxId)
    )

    // 4. Restore package stock if proof had been submitted and stock decremented
    if (order.proofSubmitted && order.pkg?.id) {
      setPackagesStock((prev) => ({
        ...prev,
        [order.pkg.id]: (prev[order.pkg.id] || 0) + 1
      }))
    }

    // 5. Clear active pending order details if matching
    if (pendingOrderDetails?.id === orderTxId || pendingOrderDetails?.txId === orderTxId) {
      setPendingOrderDetails(null)
    }

    showToast(`Order #${orderTxId} has been cancelled.`)

    // 6. If currently on payment gateway screen, return to Buy screen
    if (currentScreen === 'payment-gateway') {
      setCurrentScreen('buy')
      setActiveTab('buy')
    }
  }

  // Handle Request Withdrawal / Sell Coins
  const handleRequestWithdrawal = ({ amount, upi }) => {
    if (!amount || amount <= 0) return
    if (amount > userBalance) {
      showToast('Insufficient HeroPay balance.')
      return
    }

    // 1. Deduct from user balance
    setUserBalance((prev) => Number((prev - amount).toFixed(2)))

    // 2. Generate transaction ID & date
    const txId = 'TX_SELL_' + Date.now().toString().slice(-6)
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const newTx = {
      id: txId,
      txId,
      type: 'sell',
      title: `Sell HeroPay (${upi.providerName || 'UPI'})`,
      amount: `-${amount.toFixed(2)}`,
      coins: amount.toFixed(2),
      status: 'Pending',
      date: `Today, ${timeStr}`,
      method: `UPI: ${upi.vpa}`,
      assignedAmount: amount,
      withdrawalAccount: upi
    }

    // 3. Add to transaction records
    setTransactionRecords((prev) => [newTx, ...prev])
    showToast(`Withdrawal request of ₹${amount.toFixed(2)} submitted! Processing to ${upi.vpa}`)

    // 4. Update the withdrawalsToday on the specific UPI account
    setWithdrawalUpis((prev) =>
      prev.map((u) => {
        if (u.id === upi.id) {
          const currentTimes = parseInt(u.withdrawalsToday?.split(' ')?.[0] || '0', 10) + 1
          const currentTotal = parseFloat(u.withdrawalsToday?.split('₹')?.[1] || '0') + amount
          return {
            ...u,
            withdrawalsToday: `${currentTimes} times / ₹${currentTotal.toFixed(2)}`
          }
        }
        return u
      })
    )

    // 5. Automatic realistic banking processing (transitions to Success after 25s)
    setTimeout(() => {
      setTransactionRecords((prev) =>
        prev.map((t) =>
          t.id === txId
            ? { ...t, status: 'Success', actionNote: 'Processed via UPI Network' }
            : t
        )
      )
      showToast(`⚡ ₹${amount.toFixed(2)} credited to ${upi.vpa}! Withdrawal complete.`)
    }, 25000)
  }

  // Handle Payment Proof Submission (UTR + Screenshot)
  const handlePaymentProofSubmitted = ({ utr, screenshot, order }) => {
    const targetOrder = order || pendingOrderDetails
    if (!targetOrder) return

    // 1. Decrement package stock
    if (targetOrder.pkg && targetOrder.pkg.id && packagesStock[targetOrder.pkg.id] > 0) {
      setPackagesStock((prev) => ({
        ...prev,
        [targetOrder.pkg.id]: Math.max(0, prev[targetOrder.pkg.id] - 1)
      }))
    }

    const orderTxId = targetOrder.txId || targetOrder.id

    // 2. Update record in state to marked as proofSubmitted
    setTransactionRecords((prev) =>
      prev.map((tx) =>
        (tx.id === orderTxId || tx.txId === orderTxId)
          ? {
              ...tx,
              utr,
              screenshot,
              proofSubmitted: true,
              method: `UTR: ${utr}`
            }
          : tx
      )
    )

    setPendingOrdersList((prev) =>
      prev.map((tx) =>
        (tx.id === orderTxId || tx.txId === orderTxId)
          ? {
              ...tx,
              utr,
              screenshot,
              proofSubmitted: true,
              method: `UTR: ${utr}`
            }
          : tx
      )
    )

    // 3. Update proof in MongoDB
    const token = localStorage.getItem('hp_token')
    if (token) {
      fetch(`/api/orders/by-tx/${orderTxId}/proof`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          utr: utr || '',
          screenshotUrl: screenshot || ''
        })
      }).catch(() => {})
    }

    showToast('Payment proof submitted! System payment check kar raha hai, please wait...')
    setCurrentScreen('record')
    setActiveTab('record')
  }

  // Admin Approval Handler: Approves order, credits coins and commission
  const handleApproveOrder = (orderId, isAuto = false) => {
    const order = pendingOrdersList.find((o) => o.id === orderId)
    if (!order) return

    // 1. Update the order in transactionRecords to 'Success'
    setTransactionRecords((prev) =>
      prev.map((tx) => (tx.id === orderId ? { ...tx, status: 'Success' } : tx))
    )

    // 2. Add second entry for commission (+9.5% + ₹6)
    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const commTxId = 'TX' + Math.floor(100000 + Math.random() * 900000)
    const commEntry = {
      id: commTxId,
      type: 'buy',
      title: `Buy Commission (${commissionLabel})`,
      amount: `+${order.commissionAmount.toFixed(2)}`,
      coins: order.commissionAmount.toFixed(2),
      status: 'Success',
      date: `Today, ${timeStr}`,
      method: isAuto ? `Auto-Approved (${AUTO_APPROVE_MINUTES}m Timer)` : 'Admin Yield Credited'
    }
    setTransactionRecords((prev) => [commEntry, ...prev])

    // 3. Credit user balance by total coins (assigned amount + commission)
    setUserBalance((prev) => Number((prev + order.totalCoins).toFixed(2)))

    // 4. Update Record screen totals
    setTotalBuyGoCoin((prev) => Number((prev + order.assignedAmount).toFixed(2)))
    setTotalAward((prev) => Number((prev + order.commissionAmount).toFixed(2)))

    // 5. Remove from pending queue
    setPendingOrdersList((prev) => prev.filter((o) => o.id !== orderId))
    if (inspectProofOrder?.id === orderId) setInspectProofOrder(null)

    showToast(
      isAuto
        ? `⚡ ${AUTO_APPROVE_MINUTES}m Passed! Order ${orderId} Auto-Approved. +${order.totalCoins.toFixed(2)} Coins Credited!`
        : `Order ${orderId} Approved! +${order.totalCoins.toFixed(2)} Coins Credited!`
    )
  }

  // Admin Rejection Handler
  const handleRejectOrder = (orderId) => {
    const order = pendingOrdersList.find((o) => o.id === orderId)
    if (!order) return

    // Update transaction status to Failed
    setTransactionRecords((prev) =>
      prev.map((tx) => (tx.id === orderId ? { ...tx, status: 'Failed' } : tx))
    )

    // Restore package stock
    if (order.pkg && order.pkg.id) {
      setPackagesStock((prev) => ({
        ...prev,
        [order.pkg.id]: (prev[order.pkg.id] || 0) + 1
      }))
    }

    setPendingOrdersList((prev) => prev.filter((o) => o.id !== orderId))
    if (inspectProofOrder?.id === orderId) setInspectProofOrder(null)
    showToast(`Order ${orderId} Rejected. Stock restored.`)
  }

  // Direct Instant Buy (for developer bypass)
  const handleBuyOrderSuccess = ({ pkg, assignedAmount, commission, totalCoins }) => {
    if (pkg && pkg.id && packagesStock[pkg.id] > 0) {
      setPackagesStock((prev) => ({
        ...prev,
        [pkg.id]: Math.max(0, prev[pkg.id] - 1)
      }))
    }
    setUserBalance((prev) => Number((prev + totalCoins).toFixed(2)))
    setTotalBuyGoCoin((prev) => Number((prev + assignedAmount).toFixed(2)))
    setTotalAward((prev) => Number((prev + commission).toFixed(2)))

    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const randomHex1 = Math.floor(100000 + Math.random() * 900000)
    const randomHex2 = Math.floor(100000 + Math.random() * 900000)

    const entryPackage = {
      id: `TX${randomHex1}`,
      type: 'buy',
      title: `Buy Package (${pkg.range})`,
      amount: `+${assignedAmount.toFixed(2)}`,
      coins: assignedAmount.toFixed(2),
      status: 'Success',
      date: `Today, ${timeStr}`,
      method: 'HeroPay Buy Order'
    }

    const entryCommission = {
      id: `TX${randomHex2}`,
      type: 'buy',
      title: 'Buy Commission (9.5% + ₹6)',
      amount: `+${commission.toFixed(2)}`,
      coins: commission.toFixed(2),
      status: 'Success',
      date: `Today, ${timeStr}`,
      method: 'Auto Yield Credited'
    }

    setTransactionRecords((prev) => [entryPackage, entryCommission, ...prev])
    showToast(`Order Placed! +${totalCoins.toFixed(2)} Hero-Coins Credited`)
  }

  const handleLoginSuccess = (data) => {
    setLoggedInUser(data)
    setUserBalance(data.balance || 0)
    setTotalBuyGoCoin(data.totalBuyGoCoin || 0)
    setTotalAward(data.totalAward || 0)
    showToast(`Welcome back, ${data.fullName || data.phone}! 👋`)
    setCurrentScreen('sell')
    setActiveTab('sell')
    loadUserOrders(data.token || localStorage.getItem('hp_token'))
  }

  const handleSignupSuccess = (data) => {
    setLoggedInUser(data)
    setUserBalance(data.balance || 0)
    setTotalBuyGoCoin(data.totalBuyGoCoin || 0)
    setTotalAward(data.totalAward || 0)
    showToast(`Welcome to HeroPay, ${data.fullName}! 🎉`)
    setCurrentScreen('sell')
    setActiveTab('sell')
    loadUserOrders(data.token || localStorage.getItem('hp_token'))
  }

  const handleLogout = () => {
    localStorage.removeItem('hp_token')
    localStorage.removeItem('hp_user')
    setLoggedInUser(null)
    setUserBalance(0)
    setTotalBuyGoCoin(0)
    setTotalAward(0)
    setTransactionRecords([])
    setPendingOrdersList([])
    setCurrentScreen('login')
    setActiveTab('sell')
    showToast('Logged out successfully.')
  }



  const handleCreateAccount = () => {
    setCurrentScreen('signup')
  }

  const handleOpenManageUPI = (fromScreen = 'sell') => {
    setReturnScreen(fromScreen)
    setCurrentScreen('withdraw-upi')
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setCurrentScreen(tabId)
  }

  return (
    <div className="desktop-preview-container">
      <div className="mobile-app-shell">
        {/* Background Layer with imported background image */}
        <div className="app-background-layer" aria-hidden="true">
          <img src={backgroundSrc} alt="" role="presentation" />
          <div className="app-background-overlay" />
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div
            style={{
              position: 'absolute',
              top: '48px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 999,
              background: 'rgba(15, 23, 42, 0.92)',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '12.5px',
              fontWeight: '600',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              whiteSpace: 'nowrap',
              animation: 'fadeInDown 0.2s ease-out'
            }}
          >
            {toastMessage}
          </div>
        )}

        {/* Screen Content */}
        {currentScreen === 'login' ? (
          <div className="mobile-content-viewport" style={{ paddingBottom: 0 }}>
            <LoginScreen
              onLoginSuccess={handleLoginSuccess}
              onCreateAccount={handleCreateAccount}
            />
          </div>
        ) : currentScreen === 'signup' ? (
          <div className="mobile-content-viewport" style={{ paddingBottom: 0 }}>
            <SignupScreen
              onSignupSuccess={handleSignupSuccess}
              onNavigateLogin={() => setCurrentScreen('login')}
            />
          </div>
        ) : currentScreen === 'withdraw-upi' ? (
          <div className="mobile-content-viewport" style={{ paddingBottom: 0 }}>
            <WithdrawUPIScreen
              upis={withdrawalUpis}
              onUpdateUpis={setWithdrawalUpis}
              onBack={() => {
                setCurrentScreen(returnScreen || 'sell')
                setActiveTab(returnScreen === 'upi' ? 'upi' : 'sell')
              }}
            />
          </div>
        ) : currentScreen === 'payment-gateway' ? (
          <div className="mobile-content-viewport" style={{ paddingBottom: 0 }}>
            <PaymentGatewayScreen
              order={pendingOrderDetails}
              onBack={() => {
                showToast('Order saved in Record section! You can resume anytime.')
                setCurrentScreen('record')
                setActiveTab('record')
              }}
              onSubmitProof={handlePaymentProofSubmitted}
              onShowToast={showToast}
              onCancelOrder={handleCancelOrder}
            />
          </div>
        ) : currentScreen === 'record' ? (
          <div className="mobile-content-viewport" style={{ paddingBottom: 0 }}>
            <RecordScreen
              records={allTransactionRecords}
              totalAward={totalAward}
              totalBuyGoCoin={totalBuyGoCoin}
              onContinueOrder={handleContinueOrder}
              onCancelOrder={handleCancelOrder}
              onBack={() => {
                setCurrentScreen('sell')
                setActiveTab('sell')
              }}
            />
          </div>
        ) : activeTab === 'sell' ? (
          <>
            <main className="mobile-content-viewport">
              <SellScreen
                balance={userBalance}
                totalAward={totalAward}
                activeUpiCount={activeUpiCount}
                todayWithdrawal={sellStats.todayWithdrawal}
                inTransaction={sellStats.inTransaction}
                hasWithdrawalInProgress={sellStats.hasWithdrawalInProgress}
                activeWithdrawal={sellStats.activeWithdrawal}
                withdrawalUpis={withdrawalUpis}
                onManageUPI={() => handleOpenManageUPI('sell')}
                onDeposit={() => showToast('Opening USDT Deposit Portal...')}
                onOpenRecord={() => setCurrentScreen('record')}
                onRequestWithdrawal={handleRequestWithdrawal}
                onNavigateTab={(tab) => handleTabChange(tab)}
                onShowToast={showToast}
                user={loggedInUser}
              />
            </main>
            <BottomNavigation
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </>
        ) : activeTab === 'buy' ? (
          <>
            <main className="mobile-content-viewport">
              <BuyScreen
                balance={userBalance}
                packagesStock={packagesStock}
                onProceedToPayment={handleProceedToPayment}
                onBuyOrderSuccess={handleBuyOrderSuccess}
                onShowToast={showToast}
                onRefreshStock={handleManualRefreshStock}
              />
            </main>
            <BottomNavigation
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </>
        ) : activeTab === 'upi' ? (
          <>
            <main className="mobile-content-viewport">
              <UPIScreen
                upis={withdrawalUpis}
                onUpdateUpis={setWithdrawalUpis}
                onManageUPI={() => handleOpenManageUPI('upi')}
              />
            </main>
            <BottomNavigation
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </>
        ) : activeTab === 'team' ? (
          <>
            <main className="mobile-content-viewport">
              <TeamScreen onShareInvite={() => showToast('Invite link copied!')} user={loggedInUser} />
            </main>
            <BottomNavigation
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </>
        ) : (
          <>
            <main className="mobile-content-viewport">
              <MeScreen
                onLogout={handleLogout}
                onNavigateTab={(tab) => handleTabChange(tab)}
                onShowToast={showToast}
                user={loggedInUser}
              />
            </main>
            <BottomNavigation
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </>
        )}
      </div>

      {/* Screenshot Lightbox */}
      {inspectProofOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setInspectProofOrder(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '380px',
              width: '100%',
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '800', fontSize: '13.5px', color: '#0F172A' }}>
                Receipt Proof • UTR: {inspectProofOrder.utr}
              </span>
              <button
                type="button"
                onClick={() => setInspectProofOrder(null)}
                style={{ background: '#F1F5F9', border: 'none', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={14} />
              </button>
            </div>
            <img
              src={inspectProofOrder.screenshot}
              alt="Payment Proof"
              style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: '12px', border: '1px solid #E2E8F0' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
