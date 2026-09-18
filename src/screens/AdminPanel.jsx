import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  ShieldCheck, LogIn, LogOut, Users, ShoppingBag, Clock, CheckCircle2,
  XCircle, PauseCircle, RefreshCw, Coins, Eye, X, Settings, Save, Building2, Smartphone,
  Plus, Edit2, Trash2, Power, AlertTriangle, Check, Shuffle, Headphones, MessageSquare, Send
} from 'lucide-react'
import './AdminPanel.css'

const API = '/api/admin'

export default function AdminPanel() {
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('hp_admin_token') || '')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [activeTab, setActiveTab] = useState('orders') // 'orders' | 'users' | 'stats' | 'settings' | 'support'
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])
  const displayedOrdersRef = useRef([])
  const backgroundOrdersRef = useRef([])
  const [orderFilter, setOrderFilter] = useState('') // Default '' (All Orders)
  const [inspectOrder, setInspectOrder] = useState(null)
  const [actionNote, setActionNote] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasNewUpdates, setHasNewUpdates] = useState(false)
  const [newUpdatesCount, setNewUpdatesCount] = useState(0)
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)
  const [initialOrdersLoading, setInitialOrdersLoading] = useState(true)
  const [toast, setToast] = useState(null)

  // Multiple Payment Accounts state
  const [paymentAccounts, setPaymentAccounts] = useState([])
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [editingAccountId, setEditingAccountId] = useState(null)
  const [isSavingAccount, setIsSavingAccount] = useState(false)

  // Support Tickets state
  const [supportTickets, setSupportTickets] = useState([])
  const [supportFilter, setSupportFilter] = useState('all') // 'all' | 'Open' | 'In Progress' | 'Resolved'
  const [replyModalTicket, setReplyModalTicket] = useState(null)
  const [replyInput, setReplyInput] = useState('')
  const [replyStatusInput, setReplyStatusInput] = useState('Resolved')
  const [isUpdatingTicket, setIsUpdatingTicket] = useState(false)
  const [previewScreenshot, setPreviewScreenshot] = useState(null)

  const filteredSupportTickets = supportTickets.filter((t) => {
    if (supportFilter === 'all') return true
    return t.status === supportFilter
  })
  const [accountForm, setAccountForm] = useState({
    label: '',
    methodType: 'upi',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    ifscCode: '',
    accountType: 'Current Account',
    bankBranch: '',
    upiId: '',
    upiPayeeName: '',
    isActive: true
  })

  // User Balance Adjustment Modal State
  const [balanceModalUser, setBalanceModalUser] = useState(null)
  const [balanceAdjustType, setBalanceAdjustType] = useState('add') // 'add' | 'deduct'
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState('')
  const [isAdjustingBalance, setIsAdjustingBalance] = useState(false)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`
  }), [adminToken])

  // ── Login ──────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setIsLoggingIn(true)
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPassword })
      })
      const data = await res.json()
      if (!res.ok) {
        setLoginError(data.message || 'Login failed.')
        return
      }
      localStorage.setItem('hp_admin_token', data.token)
      setAdminToken(data.token)
    } catch {
      setLoginError('Could not connect to server.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = useCallback(() => {
    localStorage.removeItem('hp_admin_token')
    setAdminToken('')
    setStats(null)
    setUsers([])
    setOrders([])
    setPaymentAccounts([])
  }, [])

  // ── Multiple Payment Accounts Management ───────────────────────────
  const fetchPaymentAccounts = useCallback(async () => {
    try {
      const res = await fetch(`${API}/payment-accounts`, { headers: authHeaders() })
      if (res.status === 401 || res.status === 403) {
        handleLogout()
        setLoginError('Admin session expired. Please enter password.')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setPaymentAccounts(Array.isArray(data) ? data : [])
      }
    } catch {}
  }, [authHeaders, handleLogout])

  // ── Support Tickets Management ─────────────────────────────────────
  const fetchSupportTickets = useCallback(async () => {
    try {
      const res = await fetch('/api/support/admin/all', { headers: authHeaders() })
      if (res.status === 401 || res.status === 403) {
        handleLogout()
        setLoginError('Admin session expired. Please enter password.')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setSupportTickets(Array.isArray(data) ? data : [])
      }
    } catch {}
  }, [authHeaders, handleLogout])

  const handleUpdateTicket = async (ticketId, status, adminReply) => {
    setIsUpdatingTicket(true)
    try {
      const res = await fetch(`/api/support/admin/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({
          status,
          adminReply
        })
      })
      if (res.ok) {
        setToast({ type: 'success', msg: 'Support ticket updated successfully!' })
        fetchSupportTickets()
        setReplyModalTicket(null)
      } else {
        setToast({ type: 'error', msg: 'Failed to update ticket.' })
      }
    } catch {
      setToast({ type: 'error', msg: 'Server error updating ticket.' })
    } finally {
      setIsUpdatingTicket(false)
    }
  }

  const handleOpenAddAccount = () => {
    setEditingAccountId(null)
    setAccountForm({
      label: '',
      methodType: 'upi',
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      ifscCode: '',
      accountType: 'Current Account',
      bankBranch: '',
      upiId: '',
      upiPayeeName: '',
      isActive: true
    })
    setIsAccountModalOpen(true)
  }

  const handleOpenEditAccount = (acc) => {
    setEditingAccountId(acc._id)
    let mType = acc.methodType
    if (!mType) {
      if (acc.upiId && !acc.accountNumber) mType = 'upi'
      else if (acc.accountNumber && !acc.upiId) mType = 'bank'
      else mType = 'both'
    }
    setAccountForm({
      label: acc.label || '',
      methodType: mType,
      bankName: acc.bankName || '',
      accountNumber: acc.accountNumber || '',
      accountHolder: acc.accountHolder || '',
      ifscCode: acc.ifscCode || '',
      accountType: acc.accountType || 'Current Account',
      bankBranch: acc.bankBranch || '',
      upiId: acc.upiId || '',
      upiPayeeName: acc.upiPayeeName || '',
      isActive: acc.isActive !== undefined ? acc.isActive : true
    })
    setIsAccountModalOpen(true)
  }

  const handleSaveAccount = async (e) => {
    e.preventDefault()
    if (!accountForm.label.trim()) {
      showToast('Account label is required', 'error')
      return
    }

    if (accountForm.methodType === 'upi' && !accountForm.upiId.trim()) {
      showToast('UPI ID is required for UPI accounts', 'error')
      return
    }

    if (accountForm.methodType === 'bank' && (!accountForm.accountNumber.trim() || !accountForm.bankName.trim() || !accountForm.ifscCode.trim())) {
      showToast('Bank Name, Account Number and IFSC Code are required', 'error')
      return
    }

    if (accountForm.methodType === 'both') {
      if (!accountForm.upiId.trim()) {
        showToast('UPI ID is required', 'error')
        return
      }
      if (!accountForm.accountNumber.trim() || !accountForm.bankName.trim() || !accountForm.ifscCode.trim()) {
        showToast('Bank details are required for Both', 'error')
        return
      }
    }

    setIsSavingAccount(true)
    try {
      const url = editingAccountId
        ? `${API}/payment-accounts/${editingAccountId}`
        : `${API}/payment-accounts`
      const method = editingAccountId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(accountForm)
      })
      if (res.status === 401 || res.status === 403) {
        handleLogout()
        setLoginError('Admin session expired. Please enter password.')
        return
      }
      const data = await res.json()
      if (res.ok) {
        showToast(data.message || 'Saved successfully!', 'success')
        setIsAccountModalOpen(false)
        fetchPaymentAccounts()
      } else {
        showToast(data.message || 'Failed to save account.', 'error')
      }
    } catch {
      showToast('Server error.', 'error')
    } finally {
      setIsSavingAccount(false)
    }
  }

  const handleDeleteAccount = async (id, label) => {
    if (!window.confirm(`Are you sure you want to delete "${label}"?`)) return
    try {
      const res = await fetch(`${API}/payment-accounts/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
      if (res.status === 401 || res.status === 403) {
        handleLogout()
        return
      }
      const data = await res.json()
      if (res.ok) {
        showToast(data.message || 'Account deleted.', 'success')
        fetchPaymentAccounts()
      } else {
        showToast(data.message || 'Could not delete account.', 'error')
      }
    } catch {
      showToast('Server error.', 'error')
    }
  }

  const handleToggleAccountActive = async (acc) => {
    try {
      const res = await fetch(`${API}/payment-accounts/${acc._id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ isActive: !acc.isActive })
      })
      if (res.status === 401 || res.status === 403) {
        handleLogout()
        return
      }
      const data = await res.json()
      if (res.ok) {
        showToast(`Account ${!acc.isActive ? 'activated' : 'deactivated'}.`, 'success')
        fetchPaymentAccounts()
      } else {
        showToast(data.message || 'Could not update status.', 'error')
      }
    } catch {
      showToast('Server error.', 'error')
    }
  }

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/stats`, { headers: authHeaders() })
      if (res.status === 401 || res.status === 403) {
        handleLogout()
        setLoginError('Admin session expired. Please enter password.')
        return
      }
      if (res.ok) setStats(await res.json())
    } catch {}
  }, [authHeaders, handleLogout])

  const fetchUsers = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true)
    try {
      const res = await fetch(`${API}/users`, { headers: authHeaders() })
      if (res.status === 401 || res.status === 403) {
        handleLogout()
        setLoginError('Admin session expired. Please enter password.')
        return
      }
      if (res.ok) setUsers(await res.json())
    } catch {}
    if (showLoading) setIsLoading(false)
  }, [authHeaders, handleLogout])

  // Direct load/reload of orders (called on tab load, filter change, or manual refresh)
  const loadOrdersDirect = useCallback(async (filter = orderFilter, isManual = false) => {
    if (isManual) setIsManualRefreshing(true)
    try {
      const url = filter ? `${API}/orders?status=${filter}` : `${API}/orders`
      const res = await fetch(url, { headers: authHeaders() })
      if (res.status === 401 || res.status === 403) {
        handleLogout()
        setLoginError('Admin session expired. Please enter password.')
        return
      }
      if (res.ok) {
        const data = await res.json()
        const orderList = Array.isArray(data) ? data : []
        setOrders(orderList)
        displayedOrdersRef.current = orderList
        backgroundOrdersRef.current = orderList
        setHasNewUpdates(false)
        setNewUpdatesCount(0)
        if (isManual) {
          showToast('Orders list reloaded with latest server data.', 'success')
        }
      }
    } catch {}
    if (isManual) {
      setTimeout(() => setIsManualRefreshing(false), 450)
    }
    setInitialOrdersLoading(false)
  }, [authHeaders, orderFilter, handleLogout, showToast])

  // Silent background check: Fetches from server but DOES NOT reload the UI table
  const checkOrdersBackground = useCallback(async (filter = orderFilter) => {
    try {
      const url = filter ? `${API}/orders?status=${filter}` : `${API}/orders`
      const res = await fetch(url, { headers: authHeaders() })
      if (res.status === 401 || res.status === 403) return
      if (res.ok) {
        const data = await res.json()
        const freshList = Array.isArray(data) ? data : []
        backgroundOrdersRef.current = freshList

        // Compare freshList against currently displayed orders in UI
        const currentList = displayedOrdersRef.current || []
        const currentMap = new Map(currentList.map((o) => [o._id, o.status]))

        let diff = 0
        for (const item of freshList) {
          if (!currentMap.has(item._id)) {
            diff++ // new order
          } else if (currentMap.get(item._id) !== item.status) {
            diff++ // status changed
          }
        }
        if (diff === 0 && freshList.length !== currentList.length) {
          diff = Math.abs(freshList.length - currentList.length)
        }

        if (diff > 0) {
          setHasNewUpdates(true)
          setNewUpdatesCount(diff)
        } else {
          setHasNewUpdates(false)
          setNewUpdatesCount(0)
        }
      }
    } catch {}
  }, [authHeaders, orderFilter])

  // Apply background orders when user clicks reload button or banner
  const applyBackgroundOrders = useCallback(() => {
    setIsManualRefreshing(true)
    if (backgroundOrdersRef.current) {
      setOrders(backgroundOrdersRef.current)
      displayedOrdersRef.current = backgroundOrdersRef.current
    }
    setHasNewUpdates(false)
    setNewUpdatesCount(0)
    showToast('Orders UI reloaded with latest data!', 'success')
    setTimeout(() => setIsManualRefreshing(false), 450)
  }, [showToast])

  // Handle explicit filter selection by admin
  const handleFilterChange = useCallback((newFilter) => {
    setOrderFilter(newFilter)
    loadOrdersDirect(newFilter, false)
  }, [loadOrdersDirect])

  useEffect(() => {
    if (!adminToken) return
    fetchStats()
    fetchPaymentAccounts()
    fetchSupportTickets()
    if (activeTab === 'users') fetchUsers(true)
    if (activeTab === 'orders') loadOrdersDirect(orderFilter, false)
    if (activeTab === 'settings') fetchPaymentAccounts()
    if (activeTab === 'support') fetchSupportTickets()

    // Live background auto-sync every 8 seconds
    // Note: Background sync checks server, but does NOT reset/reload the UI until user clicks reload
    const interval = setInterval(() => {
      fetchStats()
      fetchSupportTickets()
      if (activeTab === 'orders') checkOrdersBackground(orderFilter)
      if (activeTab === 'users') fetchUsers(false)
      if (activeTab === 'support') fetchSupportTickets()
    }, 8000)

    return () => clearInterval(interval)
  }, [adminToken, activeTab, orderFilter, loadOrdersDirect, checkOrdersBackground, fetchUsers, fetchStats, fetchPaymentAccounts, fetchSupportTickets])

  // ── Update Order Status ────────────────────────────────────────────
  const handleOrderAction = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus, actionNote })
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.message || 'Action failed.', 'error')
        return
      }
      showToast(data.message, 'success')
      setInspectOrder(null)
      setActionNote('')

      // Instantly update status in state so UI reflects it immediately without reloading screen
      setOrders(prev => {
        const updated = prev.map(o => o._id === orderId ? { ...o, status: newStatus, actionNote } : o)
        displayedOrdersRef.current = updated
        backgroundOrdersRef.current = updated
        return updated
      })
      fetchStats()
    } catch {
      showToast('Server error.', 'error')
    }
  }

  // ── Render Login ───────────────────────────────────────────────────
  if (!adminToken) {
    return (
      <div className="ap-login-root">
        <div className="ap-login-card">
          <div className="ap-login-icon">
            <ShieldCheck size={44} />
          </div>
          <h1 className="ap-login-title">HeroPay Admin</h1>
          <p className="ap-login-sub">Secure admin access only</p>
          <form onSubmit={handleLogin} className="ap-login-form">
            <input
              type="password"
              className="ap-login-input"
              placeholder="Enter admin password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              autoFocus
              required
            />
            {loginError && <div className="ap-login-error">{loginError}</div>}
            <button type="submit" className="ap-login-btn" disabled={isLoggingIn}>
              <LogIn size={18} />
              {isLoggingIn ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Render Admin Panel ─────────────────────────────────────────────
  return (
    <div className="ap-root">
      {/* Toast */}
      {toast && (
        <div className={`ap-toast ap-toast--${toast.type}`}>{toast.msg}</div>
      )}

      {/* Header */}
      <header className="ap-header">
        <div className="ap-header-brand">
          <ShieldCheck size={22} />
          <span>HeroPay Admin Panel</span>
        </div>
        <button className="ap-logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </header>

      {/* Stats Bar */}
      {stats && (
        <div className="ap-stats-bar">
          <div className="ap-stat-card">
            <Users size={20} className="ap-stat-icon ap-stat-icon--blue" />
            <div>
              <span className="ap-stat-value">{stats.totalUsers}</span>
              <span className="ap-stat-label">Total Users</span>
            </div>
          </div>
          <div className="ap-stat-card">
            <Clock size={20} className="ap-stat-icon ap-stat-icon--yellow" />
            <div>
              <span className="ap-stat-value">{stats.pendingOrders}</span>
              <span className="ap-stat-label">Pending</span>
            </div>
          </div>
          <div className="ap-stat-card">
            <PauseCircle size={20} className="ap-stat-icon ap-stat-icon--orange" />
            <div>
              <span className="ap-stat-value">{stats.holdOrders}</span>
              <span className="ap-stat-label">On Hold</span>
            </div>
          </div>
          <div className="ap-stat-card">
            <CheckCircle2 size={20} className="ap-stat-icon ap-stat-icon--green" />
            <div>
              <span className="ap-stat-value">{stats.successOrders}</span>
              <span className="ap-stat-label">Approved</span>
            </div>
          </div>
          <div className="ap-stat-card">
            <Coins size={20} className="ap-stat-icon ap-stat-icon--purple" />
            <div>
              <span className="ap-stat-value">{stats.totalCoinsInCirculation?.toFixed(2)}</span>
              <span className="ap-stat-label">Total Coins</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="ap-tabs">
        <button
          className={`ap-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <ShoppingBag size={16} /> Orders
        </button>
        <button
          className={`ap-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} /> Users
        </button>
        <button
          className={`ap-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Building2 size={16} /> Bank Accounts ({paymentAccounts.length})
        </button>
        <button
          className={`ap-tab ${activeTab === 'support' ? 'active' : ''}`}
          onClick={() => setActiveTab('support')}
        >
          <Headphones size={16} /> Support Queries ({supportTickets.filter((t) => t.status === 'Open').length > 0 ? `${supportTickets.filter((t) => t.status === 'Open').length} New` : supportTickets.length})
        </button>
      </div>

      {/* ── ORDERS TAB ── */}
      {activeTab === 'orders' && (
        <div className="ap-content">
          {/* Live Background Updates Banner */}
          {hasNewUpdates && (
            <div className="ap-orders-update-banner">
              <div className="ap-orders-update-info">
                <span className="ap-orders-pulse-dot" />
                <span>
                  <strong>{newUpdatesCount} Live Update{newUpdatesCount > 1 ? 's' : ''} in Background:</strong> Naye orders ya status changes background me update ho chuke hain.
                </span>
              </div>
              <button
                type="button"
                className="ap-orders-reload-now-btn"
                onClick={applyBackgroundOrders}
              >
                <RefreshCw size={13} className={isManualRefreshing ? 'spinning' : ''} />
                <span>Reload Orders UI</span>
              </button>
            </div>
          )}

          <div className="ap-filter-bar">
            <span className="ap-filter-label">Filter:</span>
            {['', 'Pending', 'Hold', 'Success', 'Failed'].map((f) => {
              let count = null
              if (stats) {
                if (f === 'Pending') count = stats.pendingOrders
                else if (f === 'Hold') count = stats.holdOrders
                else if (f === 'Success') count = stats.successOrders
                else if (f === '') count = stats.totalOrders
              }
              return (
                <button
                  key={f || 'all'}
                  className={`ap-filter-btn ${orderFilter === f ? 'active' : ''}`}
                  onClick={() => handleFilterChange(f)}
                >
                  {f === '' ? 'All Orders' : f} {count !== null && count !== undefined ? `(${count})` : ''}
                </button>
              )
            })}

            {/* Manual Reload Button with Live Updates Notification */}
            <button
              type="button"
              className={`ap-refresh-btn ${hasNewUpdates ? 'has-updates' : ''} ${isManualRefreshing ? 'spinning' : ''}`}
              onClick={() => {
                if (hasNewUpdates) applyBackgroundOrders()
                else loadOrdersDirect(orderFilter, true)
              }}
              title={hasNewUpdates ? `${newUpdatesCount} updates ready in background — Click to reload UI` : 'Reload Orders'}
            >
              <RefreshCw size={15} />
              {hasNewUpdates && <span className="ap-refresh-badge">{newUpdatesCount}</span>}
            </button>

            {/* Background Sync Active Indicator */}
            <div className="ap-background-sync-badge" title="Live background syncing active. UI will not reload automatically until you click Reload.">
              <span className="ap-sync-status-dot" />
              <span>Background Sync Active</span>
            </div>
          </div>

          {initialOrdersLoading && orders.length === 0 ? (
            <div className="ap-loading">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="ap-empty">No orders found.</div>
          ) : (
            <div className="ap-table-wrapper">
              <table className="ap-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Package</th>
                    <th>Amount</th>
                    <th>Commission</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className={`ap-tr ap-tr--${order.status.toLowerCase()}`}>
                      <td>
                        <div className="ap-user-cell">
                          <span className="ap-user-name">{order.userId?.fullName || 'N/A'}</span>
                          <span className="ap-user-phone">{order.userId?.phone || ''}</span>
                        </div>
                      </td>
                      <td>{order.packageRange}</td>
                      <td>₹{order.assignedAmount?.toFixed(2)}</td>
                      <td>₹{order.commission?.toFixed(2)}</td>
                      <td>
                        <span className={`ap-badge ap-badge--${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                      <td>
                        <button
                          className="ap-inspect-btn"
                          onClick={() => { setInspectOrder(order); setActionNote('') }}
                        >
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── USERS TAB ── */}
      {activeTab === 'users' && (
        <div className="ap-content">
          <div className="ap-filter-bar">
            <span className="ap-filter-label">All Registered Users</span>
            <button className="ap-refresh-btn" onClick={fetchUsers} title="Refresh">
              <RefreshCw size={15} />
            </button>
          </div>

          {isLoading ? (
            <div className="ap-loading">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="ap-empty">No users registered yet.</div>
          ) : (
            <div className="ap-table-wrapper">
              <table className="ap-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Coin Balance</th>
                    <th>Total Bought</th>
                    <th>Joined</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr key={user._id} className="ap-tr">
                      <td className="ap-td-num">{idx + 1}</td>
                      <td>
                        <div className="ap-user-cell">
                          <div className="ap-user-avatar">{(user.fullName || 'U')[0].toUpperCase()}</div>
                          <span className="ap-user-name">{user.fullName}</span>
                        </div>
                      </td>
                      <td>{user.phone}</td>
                      <td>{user.email || '—'}</td>
                      <td>
                        <span className="ap-coin-val">⭐ {user.balance?.toFixed(2)}</span>
                      </td>
                      <td>⭐ {user.totalBuyGoCoin?.toFixed(2)}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                      <td>
                        <button
                          type="button"
                          className="ap-btn-edit"
                          style={{ fontSize: '11px', padding: '5px 10px', background: '#FF6810', color: '#fff', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                          onClick={() => {
                            setBalanceModalUser(user)
                            setBalanceAdjustAmount('')
                            setBalanceAdjustType('add')
                          }}
                        >
                          + Adjust Balance
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}


      {/* ── PAYMENT ACCOUNTS TAB ── */}
      {activeTab === 'settings' && (
        <div className="ap-content">
          <div className="ap-accounts-header">
            <div>
              <div className="ap-accounts-title-row">
                <Building2 size={22} className="ap-accounts-main-icon" />
                <h2>Bank & UPI Accounts Rotation</h2>
                <span className="ap-badge ap-badge--hold">
                  <Shuffle size={13} style={{ marginRight: 4 }} /> Random Rotation
                </span>
              </div>
              <p className="ap-accounts-subtitle">
                Each user making a payment will automatically see a <strong>random active payment account</strong> (Bank, UPI, or Both).
              </p>
            </div>
            <button
              type="button"
              className="ap-btn-add-account"
              onClick={handleOpenAddAccount}
            >
              <Plus size={16} /> Add Payment Account
            </button>
          </div>

          {paymentAccounts.length === 0 ? (
            <div className="ap-empty">No payment accounts found. Click "Add Payment Account" to create one.</div>
          ) : (
            <div className="ap-accounts-grid">
              {paymentAccounts.map((acc) => {
                const isUpiOnly = acc.methodType === 'upi' || (acc.upiId && !acc.accountNumber)
                const isBankOnly = acc.methodType === 'bank' || (acc.accountNumber && !acc.upiId)
                const isBoth = acc.methodType === 'both' || (acc.upiId && acc.accountNumber)

                return (
                  <div
                    key={acc._id}
                    className={`ap-account-card ${!acc.isActive ? 'ap-account-card--inactive' : ''}`}
                  >
                    <div className="ap-account-card-top">
                      <div className="ap-account-label-group">
                        <span className="ap-account-label">{acc.label}</span>
                        <div className="ap-account-badges">
                          <span className={`ap-status-pill ${acc.isActive ? 'active' : 'inactive'}`}>
                            {acc.isActive ? 'Active (Live)' : 'Inactive'}
                          </span>
                          {isUpiOnly && (
                            <span className="ap-method-pill ap-method-pill--upi">
                              <Smartphone size={12} /> UPI Only
                            </span>
                          )}
                          {isBankOnly && (
                            <span className="ap-method-pill ap-method-pill--bank">
                              <Building2 size={12} /> Bank Only
                            </span>
                          )}
                          {isBoth && (
                            <span className="ap-method-pill ap-method-pill--both">
                              <Shuffle size={12} /> Bank + UPI
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="ap-account-details-list">
                      {/* Show UPI details if present */}
                      {(isUpiOnly || isBoth) && (
                        <div className="ap-acc-row ap-acc-row--upi">
                          <span className="ap-acc-key">UPI ID</span>
                          <span className="ap-acc-val font-mono highlight">{acc.upiId || '—'}</span>
                        </div>
                      )}
                      {(isUpiOnly || isBoth) && acc.upiPayeeName && (
                        <div className="ap-acc-row">
                          <span className="ap-acc-key">UPI Payee</span>
                          <span className="ap-acc-val">{acc.upiPayeeName}</span>
                        </div>
                      )}

                      {/* Show Bank details if present */}
                      {(isBankOnly || isBoth) && (
                        <>
                          <div className="ap-acc-row">
                            <span className="ap-acc-key">Bank Name</span>
                            <span className="ap-acc-val ap-acc-val--bold">{acc.bankName || '—'}</span>
                          </div>
                          <div className="ap-acc-row">
                            <span className="ap-acc-key">Account Number</span>
                            <span className="ap-acc-val font-mono highlight">{acc.accountNumber || '—'}</span>
                          </div>
                          <div className="ap-acc-row">
                            <span className="ap-acc-key">IFSC Code</span>
                            <span className="ap-acc-val font-mono highlight">{acc.ifscCode || '—'}</span>
                          </div>
                          <div className="ap-acc-row">
                            <span className="ap-acc-key">Account Holder</span>
                            <span className="ap-acc-val">{acc.accountHolder || '—'}</span>
                          </div>
                          {acc.accountType && (
                            <div className="ap-acc-row">
                              <span className="ap-acc-key">Account Type</span>
                              <span className="ap-acc-val">{acc.accountType}</span>
                            </div>
                          )}
                          {acc.bankBranch && (
                            <div className="ap-acc-row">
                              <span className="ap-acc-key">Branch</span>
                              <span className="ap-acc-val">{acc.bankBranch}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                  <div className="ap-account-card-actions">
                    <button
                      type="button"
                      className={`ap-acc-act-btn ${acc.isActive ? 'deactivate' : 'activate'}`}
                      onClick={() => handleToggleAccountActive(acc)}
                      title={acc.isActive ? 'Disable from rotation' : 'Enable in rotation'}
                    >
                      <Power size={14} />
                      <span>{acc.isActive ? 'Deactivate' : 'Activate'}</span>
                    </button>
                    <button
                      type="button"
                      className="ap-acc-act-btn edit"
                      onClick={() => handleOpenEditAccount(acc)}
                    >
                      <Edit2 size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="ap-acc-act-btn delete"
                      onClick={() => handleDeleteAccount(acc._id, acc.label)}
                      title="Delete account"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )
            })}
            </div>
          )}
        </div>
      )}

      {/* ── SUPPORT QUERIES TAB ── */}
      {activeTab === 'support' && (
        <div className="ap-content">
          <div className="ap-accounts-header">
            <div>
              <div className="ap-accounts-title-row">
                <Headphones size={22} className="ap-accounts-main-icon" style={{ color: '#FF5000' }} />
                <h2>Customer Support Queries ({supportTickets.length})</h2>
              </div>
              <p className="ap-accounts-subtitle">
                User problems & queries regarding Withdrawals, Buy/Deposits, UPI, and general help.
              </p>
            </div>
            <button
              type="button"
              className="ap-btn-add-account"
              style={{ background: '#1E293B' }}
              onClick={fetchSupportTickets}
            >
              <RefreshCw size={14} /> Refresh Queries
            </button>
          </div>

          {/* Filter Bar */}
          <div className="ap-filter-bar">
            <span className="ap-filter-label">Filter Status:</span>
            {['all', 'Open', 'In Progress', 'Resolved', 'Closed'].map((st) => (
              <button
                key={st}
                type="button"
                className={`ap-filter-btn ${supportFilter === st ? 'active' : ''}`}
                onClick={() => setSupportFilter(st)}
              >
                {st === 'all' ? `All (${supportTickets.length})` : `${st} (${supportTickets.filter((t) => t.status === st).length})`}
              </button>
            ))}
          </div>

          {filteredSupportTickets.length === 0 ? (
            <div className="ap-empty">No support queries found for this filter.</div>
          ) : (
            <div className="ap-support-tickets-grid">
              {filteredSupportTickets.map((t) => (
                <div key={t._id || t.ticketId} className="ap-support-ticket-card">
                  <div className="ap-ticket-card-header">
                    <div className="ap-ticket-id-tag">
                      <Headphones size={15} color="#FF5000" />
                      <strong>#{t.ticketId}</strong>
                    </div>
                    <span className={`ap-badge ap-badge--${t.status === 'Open' ? 'hold' : t.status === 'In Progress' ? 'pending' : 'success'}`}>
                      {t.status}
                    </span>
                  </div>

                  <div className="ap-ticket-meta-row">
                    <div className="ap-ticket-meta-item">
                      <span className="ap-ticket-meta-label">User Phone:</span>
                      <strong className="ap-ticket-meta-val">{t.userPhone}</strong>
                    </div>
                    <div className="ap-ticket-meta-item">
                      <span className="ap-ticket-meta-label">Category:</span>
                      <span className="ap-ticket-category-tag">{t.category}</span>
                    </div>
                    <div className="ap-ticket-meta-item">
                      <span className="ap-ticket-meta-label">Submitted:</span>
                      <span className="ap-ticket-meta-val">{new Date(t.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>

                  {/* Problem Description */}
                  <div className="ap-ticket-problem-box">
                    <span className="ap-ticket-problem-label">User Problem Description:</span>
                    <p className="ap-ticket-problem-text">{t.message}</p>
                  </div>

                  {/* Attached Screenshot */}
                  {t.screenshotUrl && (
                    <div className="ap-ticket-screenshot-row">
                      <span className="ap-ticket-problem-label">Attached Screenshot (Click to enlarge):</span>
                      <img
                        src={t.screenshotUrl}
                        alt="User screenshot proof"
                        className="ap-ticket-screenshot-thumb"
                        onClick={() => setPreviewScreenshot(t.screenshotUrl)}
                      />
                    </div>
                  )}

                  {/* Admin Reply */}
                  {t.adminReply && (
                    <div className="ap-ticket-reply-display">
                      <span className="ap-ticket-reply-label">Current Admin Reply:</span>
                      <p className="ap-ticket-reply-text">{t.adminReply}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="ap-ticket-actions-row">
                    {t.status !== 'In Progress' && (
                      <button
                        type="button"
                        className="ap-ticket-btn in-progress"
                        onClick={() => handleUpdateTicket(t._id, 'In Progress', t.adminReply)}
                      >
                        <Clock size={13} />
                        <span>In Progress</span>
                      </button>
                    )}

                    {t.status !== 'Resolved' && (
                      <button
                        type="button"
                        className="ap-ticket-btn resolve"
                        onClick={() => handleUpdateTicket(t._id, 'Resolved', t.adminReply)}
                      >
                        <CheckCircle2 size={13} />
                        <span>Mark Resolved</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="ap-ticket-btn reply"
                      onClick={() => {
                        setReplyModalTicket(t)
                        setReplyInput(t.adminReply || '')
                        setReplyStatusInput(t.status === 'Open' ? 'Resolved' : t.status)
                      }}
                    >
                      <MessageSquare size={13} />
                      <span>{t.adminReply ? 'Edit Reply' : 'Reply & Resolve'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ORDER INSPECT MODAL ── */}
      {inspectOrder && (
        <div className="ap-modal-overlay" onClick={() => setInspectOrder(null)}>
          <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ap-modal-header">
              <h2>Order Details</h2>
              <button className="ap-modal-close" onClick={() => setInspectOrder(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="ap-modal-body">
              <div className="ap-modal-grid">
                <div className="ap-modal-row">
                  <span className="ap-modal-key">Transaction ID</span>
                  <span className="ap-modal-val">{inspectOrder.txId}</span>
                </div>
                <div className="ap-modal-row">
                  <span className="ap-modal-key">User</span>
                  <span className="ap-modal-val">{inspectOrder.userId?.fullName} ({inspectOrder.userId?.phone})</span>
                </div>
                <div className="ap-modal-row">
                  <span className="ap-modal-key">Package</span>
                  <span className="ap-modal-val">₹{inspectOrder.packageRange}</span>
                </div>
                <div className="ap-modal-row">
                  <span className="ap-modal-key">Amount Paid</span>
                  <span className="ap-modal-val ap-modal-val--highlight">₹{inspectOrder.assignedAmount?.toFixed(2)}</span>
                </div>
                <div className="ap-modal-row">
                  <span className="ap-modal-key">Commission</span>
                  <span className="ap-modal-val">₹{inspectOrder.commission?.toFixed(2)}</span>
                </div>
                <div className="ap-modal-row">
                  <span className="ap-modal-key">Total Coins</span>
                  <span className="ap-modal-val ap-modal-val--highlight">⭐ {inspectOrder.totalCoins?.toFixed(2)}</span>
                </div>
                <div className="ap-modal-row">
                  <span className="ap-modal-key">UTR Number</span>
                  <span className="ap-modal-val">{inspectOrder.utr || '—'}</span>
                </div>
                <div className="ap-modal-row">
                  <span className="ap-modal-key">Current Status</span>
                  <span className={`ap-badge ap-badge--${inspectOrder.status.toLowerCase()}`}>
                    {inspectOrder.status}
                  </span>
                </div>
                <div className="ap-modal-row">
                  <span className="ap-modal-key">Submitted</span>
                  <span className="ap-modal-val">
                    {new Date(inspectOrder.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Screenshot */}
              {inspectOrder.screenshotUrl && (
                <div className="ap-screenshot-section">
                  <p className="ap-screenshot-label">Payment Screenshot</p>
                  <img
                    src={inspectOrder.screenshotUrl}
                    alt="Payment proof"
                    className="ap-screenshot-img"
                  />
                </div>
              )}

              {/* Action Note */}
              <div className="ap-action-note-wrap">
                <label className="ap-action-note-label">Admin Note (optional)</label>
                <input
                  type="text"
                  className="ap-action-note-input"
                  placeholder="Reason for action..."
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="ap-action-btns">
                <button
                  className="ap-action-btn ap-action-btn--approve"
                  onClick={() => handleOrderAction(inspectOrder._id, 'Success')}
                  disabled={inspectOrder.status === 'Success'}
                >
                  <CheckCircle2 size={16} />
                  Approve
                </button>
                <button
                  className="ap-action-btn ap-action-btn--hold"
                  onClick={() => handleOrderAction(inspectOrder._id, 'Hold')}
                  disabled={inspectOrder.status === 'Hold'}
                >
                  <PauseCircle size={16} />
                  Hold
                </button>
                <button
                  className="ap-action-btn ap-action-btn--reject"
                  onClick={() => handleOrderAction(inspectOrder._id, 'Failed')}
                  disabled={inspectOrder.status === 'Failed'}
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT ACCOUNT MODAL ── */}
      {isAccountModalOpen && (
        <div className="ap-modal-overlay" onClick={() => setIsAccountModalOpen(false)}>
          <div className="ap-modal ap-modal--account" onClick={(e) => e.stopPropagation()}>
            <div className="ap-modal-header">
              <h2>{editingAccountId ? 'Edit Payment Account' : 'Add Payment Account'}</h2>
              <button className="ap-modal-close" onClick={() => setIsAccountModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="ap-modal-body ap-account-form">
              <div className="ap-form-group">
                <label>Account Label / Nickname *</label>
                <input
                  type="text"
                  placeholder="e.g. Primary UPI, HDFC Bank"
                  value={accountForm.label}
                  onChange={(e) => setAccountForm(f => ({ ...f, label: e.target.value }))}
                  required
                />
                <small className="ap-input-hint">Friendly label shown in admin panel</small>
              </div>

              {/* Account Type / Method Selector */}
              <div className="ap-form-group">
                <label>Payment Method Type *</label>
                <div className="ap-method-selector">
                  <button
                    type="button"
                    className={`ap-method-choice ${accountForm.methodType === 'upi' ? 'selected' : ''}`}
                    onClick={() => setAccountForm(f => ({ ...f, methodType: 'upi' }))}
                  >
                    <Smartphone size={16} />
                    <span>UPI Only</span>
                  </button>
                  <button
                    type="button"
                    className={`ap-method-choice ${accountForm.methodType === 'bank' ? 'selected' : ''}`}
                    onClick={() => setAccountForm(f => ({ ...f, methodType: 'bank' }))}
                  >
                    <Building2 size={16} />
                    <span>Bank Account Only</span>
                  </button>
                  <button
                    type="button"
                    className={`ap-method-choice ${accountForm.methodType === 'both' ? 'selected' : ''}`}
                    onClick={() => setAccountForm(f => ({ ...f, methodType: 'both' }))}
                  >
                    <Shuffle size={16} />
                    <span>Both (Bank + UPI)</span>
                  </button>
                </div>
              </div>

              {/* UPI Section (Shown for UPI Only and Both) */}
              {(accountForm.methodType === 'upi' || accountForm.methodType === 'both') && (
                <div className="ap-method-section">
                  <div className="ap-form-subheading">
                    <Smartphone size={15} />
                    <span>UPI Transfer Details</span>
                  </div>
                  <div className="ap-settings-grid">
                    <div className="ap-form-group">
                      <label>UPI ID (VPA) *</label>
                      <input
                        type="text"
                        placeholder="e.g. merchant@icici"
                        value={accountForm.upiId}
                        onChange={(e) => setAccountForm(f => ({ ...f, upiId: e.target.value }))}
                        required={accountForm.methodType === 'upi' || accountForm.methodType === 'both'}
                      />
                    </div>
                    <div className="ap-form-group">
                      <label>UPI Payee Name</label>
                      <input
                        type="text"
                        placeholder="e.g. HeroPay Tech Solutions"
                        value={accountForm.upiPayeeName}
                        onChange={(e) => setAccountForm(f => ({ ...f, upiPayeeName: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Section (Shown for Bank Only and Both) */}
              {(accountForm.methodType === 'bank' || accountForm.methodType === 'both') && (
                <div className="ap-method-section">
                  <div className="ap-form-subheading">
                    <Building2 size={15} />
                    <span>Bank Account Details</span>
                  </div>
                  <div className="ap-settings-grid">
                    <div className="ap-form-group">
                      <label>Bank Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. ICICI Bank Ltd"
                        value={accountForm.bankName}
                        onChange={(e) => setAccountForm(f => ({ ...f, bankName: e.target.value }))}
                        required={accountForm.methodType === 'bank' || accountForm.methodType === 'both'}
                      />
                    </div>
                    <div className="ap-form-group">
                      <label>Account Number *</label>
                      <input
                        type="text"
                        placeholder="e.g. 001205018924"
                        value={accountForm.accountNumber}
                        onChange={(e) => setAccountForm(f => ({ ...f, accountNumber: e.target.value }))}
                        required={accountForm.methodType === 'bank' || accountForm.methodType === 'both'}
                      />
                    </div>
                    <div className="ap-form-group">
                      <label>Account Holder Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. HEROPAY TECH SOLUTIONS PVT LTD"
                        value={accountForm.accountHolder}
                        onChange={(e) => setAccountForm(f => ({ ...f, accountHolder: e.target.value }))}
                        required={accountForm.methodType === 'bank' || accountForm.methodType === 'both'}
                      />
                    </div>
                    <div className="ap-form-group">
                      <label>IFSC Code *</label>
                      <input
                        type="text"
                        placeholder="e.g. ICIC0000012"
                        value={accountForm.ifscCode}
                        onChange={(e) => setAccountForm(f => ({ ...f, ifscCode: e.target.value }))}
                        required={accountForm.methodType === 'bank' || accountForm.methodType === 'both'}
                      />
                    </div>
                    <div className="ap-form-group">
                      <label>Account Type</label>
                      <input
                        type="text"
                        placeholder="e.g. Current Account"
                        value={accountForm.accountType}
                        onChange={(e) => setAccountForm(f => ({ ...f, accountType: e.target.value }))}
                      />
                    </div>
                    <div className="ap-form-group">
                      <label>Bank Branch</label>
                      <input
                        type="text"
                        placeholder="e.g. Connaught Place, New Delhi"
                        value={accountForm.bankBranch}
                        onChange={(e) => setAccountForm(f => ({ ...f, bankBranch: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="ap-form-checkbox-row">
                <label className="ap-checkbox-label">
                  <input
                    type="checkbox"
                    checked={accountForm.isActive}
                    onChange={(e) => setAccountForm(f => ({ ...f, isActive: e.target.checked }))}
                  />
                  <span>Account is Active (Included in user rotation)</span>
                </label>
              </div>

              <div className="ap-modal-form-actions">
                <button
                  type="button"
                  className="ap-btn-cancel"
                  onClick={() => setIsAccountModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ap-save-btn"
                  disabled={isSavingAccount}
                >
                  <Save size={16} />
                  {isSavingAccount ? 'Saving...' : editingAccountId ? 'Update Account' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADJUST USER BALANCE MODAL ── */}
      {balanceModalUser && (
        <div className="ap-modal-overlay" onClick={() => setBalanceModalUser(null)}>
          <div className="ap-modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="ap-modal-header">
              <div className="ap-modal-title-row">
                <Wallet size={20} className="ap-modal-icon" />
                <h3>Adjust Wallet Balance</h3>
              </div>
              <button
                type="button"
                className="ap-modal-close"
                onClick={() => setBalanceModalUser(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const num = parseFloat(balanceAdjustAmount)
                if (!num || isNaN(num)) {
                  showToast('Enter a valid amount', 'error')
                  return
                }
                setIsAdjustingBalance(true)
                try {
                  const res = await fetch(`${API}/users/${balanceModalUser._id}/adjust-balance`, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({ amount: num, type: balanceAdjustType })
                  })
                  const data = await res.json()
                  if (!res.ok) {
                    showToast(data.message || 'Failed to adjust balance', 'error')
                    return
                  }
                  showToast(data.message, 'success')
                  setBalanceModalUser(null)
                  setBalanceAdjustAmount('')
                  fetchUsers()
                  fetchStats()
                } catch {
                  showToast('Network error while updating balance', 'error')
                } finally {
                  setIsAdjustingBalance(false)
                }
              }}
              className="ap-modal-form"
            >
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '14px', fontSize: '13px' }}>
                <div>User: <strong>{balanceModalUser.fullName}</strong> ({balanceModalUser.phone})</div>
                <div style={{ marginTop: '4px' }}>Current Balance: <strong style={{ color: '#FF6810' }}>₹{balanceModalUser.balance?.toFixed(2)}</strong></div>
              </div>

              <div className="ap-form-group">
                <label>Operation Type</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      border: balanceAdjustType === 'add' ? '2px solid #10B981' : '1px solid #CBD5E1',
                      background: balanceAdjustType === 'add' ? '#ECFDF5' : '#FFF',
                      color: balanceAdjustType === 'add' ? '#047857' : '#475569',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    onClick={() => setBalanceAdjustType('add')}
                  >
                    + Add Funds (Credit)
                  </button>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      border: balanceAdjustType === 'deduct' ? '2px solid #EF4444' : '1px solid #CBD5E1',
                      background: balanceAdjustType === 'deduct' ? '#FEF2F2' : '#FFF',
                      color: balanceAdjustType === 'deduct' ? '#B91C1C' : '#475569',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    onClick={() => setBalanceAdjustType('deduct')}
                  >
                    - Deduct Funds (Debit)
                  </button>
                </div>
              </div>

              <div className="ap-form-group">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="e.g. 500"
                  value={balanceAdjustAmount}
                  onChange={(e) => setBalanceAdjustAmount(e.target.value)}
                  className="ap-input"
                  autoFocus
                />
              </div>

              <div className="ap-modal-form-actions">
                <button
                  type="button"
                  className="ap-btn-cancel"
                  onClick={() => setBalanceModalUser(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ap-save-btn"
                  disabled={isAdjustingBalance}
                >
                  {isAdjustingBalance ? 'Updating...' : balanceAdjustType === 'add' ? '+ Credit Balance' : '- Deduct Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SUPPORT REPLY MODAL ── */}
      {replyModalTicket && (
        <div className="ap-modal-overlay" onClick={() => setReplyModalTicket(null)}>
          <div className="ap-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="ap-modal-header">
              <h2>Reply to Support Ticket #{replyModalTicket.ticketId}</h2>
              <button className="ap-modal-close" onClick={() => setReplyModalTicket(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="ap-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="ap-modal-row">
                <span className="ap-modal-label">User Phone:</span>
                <strong>{replyModalTicket.userPhone}</strong>
              </div>
              <div className="ap-modal-row">
                <span className="ap-modal-label">Issue Category:</span>
                <span className="ap-ticket-category-tag">{replyModalTicket.category}</span>
              </div>
              <div className="ap-modal-row">
                <span className="ap-modal-label">User's Problem:</span>
                <p className="ap-ticket-problem-text" style={{ margin: 0 }}>{replyModalTicket.message}</p>
              </div>

              <div className="ap-field" style={{ marginTop: 10 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ap-text-dim)', marginBottom: 6 }}>
                  Update Ticket Status:
                </label>
                <select
                  value={replyStatusInput}
                  onChange={(e) => setReplyStatusInput(e.target.value)}
                  className="ap-select"
                  style={{ width: '100%' }}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="ap-field">
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ap-text-dim)', marginBottom: 6 }}>
                  Admin Reply to User (User will see this in their app):
                </label>
                <textarea
                  rows={4}
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  placeholder="e.g. Aapka withdrawal check kar liya hai, 15 minute me bank me credit ho jayega..."
                  className="ap-input"
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>
            </div>

            <div className="ap-modal-actions">
              <button className="ap-btn-cancel" onClick={() => setReplyModalTicket(null)}>
                Cancel
              </button>
              <button
                className="ap-save-btn"
                disabled={isUpdatingTicket}
                onClick={() => handleUpdateTicket(replyModalTicket._id, replyStatusInput, replyInput)}
              >
                {isUpdatingTicket ? 'Saving...' : 'Send Reply & Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SCREENSHOT PREVIEW MODAL ── */}
      {previewScreenshot && (
        <div className="ap-modal-overlay" onClick={() => setPreviewScreenshot(null)}>
          <div className="ap-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="ap-modal-header">
              <h2>Screenshot Proof</h2>
              <button className="ap-modal-close" onClick={() => setPreviewScreenshot(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="ap-modal-body" style={{ textAlign: 'center', padding: 14 }}>
              <img src={previewScreenshot} alt="Full screenshot proof" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 10 }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
