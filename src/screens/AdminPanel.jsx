import React, { useState, useEffect, useCallback } from 'react'
import {
  ShieldCheck, LogIn, LogOut, Users, ShoppingBag, Clock, CheckCircle2,
  XCircle, PauseCircle, RefreshCw, Coins, Eye, X, Settings, Save, Building2, Smartphone,
  Plus, Edit2, Trash2, Power, AlertTriangle, Check, Shuffle
} from 'lucide-react'
import './AdminPanel.css'

const API = '/api/admin'

export default function AdminPanel() {
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('hp_admin_token') || '')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [activeTab, setActiveTab] = useState('orders') // 'orders' | 'users' | 'stats' | 'settings'
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])
  const [orderFilter, setOrderFilter] = useState('Pending') // Pending | Success | Failed | Hold | ''
  const [inspectOrder, setInspectOrder] = useState(null)
  const [actionNote, setActionNote] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState(null)

  // Multiple Payment Accounts state
  const [paymentAccounts, setPaymentAccounts] = useState([])
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [editingAccountId, setEditingAccountId] = useState(null)
  const [isSavingAccount, setIsSavingAccount] = useState(false)
  const [accountForm, setAccountForm] = useState({
    label: '',
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

  const handleOpenAddAccount = () => {
    setEditingAccountId(null)
    setAccountForm({
      label: '',
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
    setAccountForm({
      label: acc.label || '',
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

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API}/users`, { headers: authHeaders() })
      if (res.status === 401 || res.status === 403) {
        handleLogout()
        setLoginError('Admin session expired. Please enter password.')
        return
      }
      if (res.ok) setUsers(await res.json())
    } catch {}
    setIsLoading(false)
  }, [authHeaders, handleLogout])

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const url = orderFilter ? `${API}/orders?status=${orderFilter}` : `${API}/orders`
      const res = await fetch(url, { headers: authHeaders() })
      if (res.status === 401 || res.status === 403) {
        handleLogout()
        setLoginError('Admin session expired. Please enter password.')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setOrders(Array.isArray(data) ? data : [])
      }
    } catch {}
    setIsLoading(false)
  }, [authHeaders, orderFilter, handleLogout])

  useEffect(() => {
    if (!adminToken) return
    fetchStats()
    fetchPaymentAccounts()
    if (activeTab === 'users') fetchUsers()
    if (activeTab === 'orders') fetchOrders()
    if (activeTab === 'settings') fetchPaymentAccounts()

    // Live auto-refresh every 8 seconds
    const interval = setInterval(() => {
      fetchStats()
      if (activeTab === 'orders') fetchOrders()
      if (activeTab === 'users') fetchUsers()
    }, 8000)

    return () => clearInterval(interval)
  }, [adminToken, activeTab, fetchOrders, fetchUsers, fetchStats, fetchPaymentAccounts])

  useEffect(() => {
    if (adminToken && activeTab === 'orders') fetchOrders()
  }, [orderFilter, fetchOrders, adminToken, activeTab])

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
      fetchOrders()
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
      </div>

      {/* ── ORDERS TAB ── */}
      {activeTab === 'orders' && (
        <div className="ap-content">
          <div className="ap-filter-bar">
            <span className="ap-filter-label">Filter:</span>
            {['Pending', 'Hold', 'Success', 'Failed', ''].map((f) => {
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
                  onClick={() => setOrderFilter(f)}
                >
                  {f || 'All'} {count !== null && count !== undefined ? `(${count})` : ''}
                </button>
              )
            })}
            <button className="ap-refresh-btn" onClick={fetchOrders} title="Refresh">
              <RefreshCw size={15} />
            </button>
          </div>

          {isLoading ? (
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
                Each user making a payment will automatically see a <strong>random active bank account</strong>.
                If an account has no UPI ID configured, the UPI tab is automatically hidden for that user.
              </p>
            </div>
            <button
              type="button"
              className="ap-btn-add-account"
              onClick={handleOpenAddAccount}
            >
              <Plus size={16} /> Add Bank Account
            </button>
          </div>

          {paymentAccounts.length === 0 ? (
            <div className="ap-empty">No payment accounts found. Click "Add Bank Account" to create one.</div>
          ) : (
            <div className="ap-accounts-grid">
              {paymentAccounts.map((acc) => (
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
                        {acc.upiId?.trim() ? (
                          <span className="ap-upi-pill ap-upi-pill--enabled">
                            <Smartphone size={12} /> UPI Enabled
                          </span>
                        ) : (
                          <span className="ap-upi-pill ap-upi-pill--disabled">
                            Bank Only (UPI Hidden)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="ap-account-details-list">
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
                    <div className="ap-acc-row">
                      <span className="ap-acc-key">Account Type</span>
                      <span className="ap-acc-val">{acc.accountType || 'Current Account'}</span>
                    </div>
                    {acc.bankBranch && (
                      <div className="ap-acc-row">
                        <span className="ap-acc-key">Branch</span>
                        <span className="ap-acc-val">{acc.bankBranch}</span>
                      </div>
                    )}
                    <div className="ap-acc-row ap-acc-row--upi">
                      <span className="ap-acc-key">UPI ID</span>
                      <span className="ap-acc-val">
                        {acc.upiId?.trim() ? (
                          <span className="ap-upi-id-text">{acc.upiId}</span>
                        ) : (
                          <em className="ap-text-dim">None (User sees Bank only)</em>
                        )}
                      </span>
                    </div>
                    {acc.upiPayeeName && (
                      <div className="ap-acc-row">
                        <span className="ap-acc-key">UPI Payee</span>
                        <span className="ap-acc-val">{acc.upiPayeeName}</span>
                      </div>
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
              <h2>{editingAccountId ? 'Edit Payment Account' : 'Add New Bank Account'}</h2>
              <button className="ap-modal-close" onClick={() => setIsAccountModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="ap-modal-body ap-account-form">
              <div className="ap-form-group">
                <label>Account Label / Nickname *</label>
                <input
                  type="text"
                  placeholder="e.g. Primary ICICI, HDFC Backup"
                  value={accountForm.label}
                  onChange={(e) => setAccountForm(f => ({ ...f, label: e.target.value }))}
                  required
                />
                <small className="ap-input-hint">Friendly label shown in admin panel</small>
              </div>

              <div className="ap-settings-grid">
                <div className="ap-form-group">
                  <label>Bank Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. ICICI Bank Ltd"
                    value={accountForm.bankName}
                    onChange={(e) => setAccountForm(f => ({ ...f, bankName: e.target.value }))}
                    required
                  />
                </div>
                <div className="ap-form-group">
                  <label>Account Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. 001205018924"
                    value={accountForm.accountNumber}
                    onChange={(e) => setAccountForm(f => ({ ...f, accountNumber: e.target.value }))}
                    required
                  />
                </div>
                <div className="ap-form-group">
                  <label>Account Holder Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. HEROPAY TECH SOLUTIONS PVT LTD"
                    value={accountForm.accountHolder}
                    onChange={(e) => setAccountForm(f => ({ ...f, accountHolder: e.target.value }))}
                    required
                  />
                </div>
                <div className="ap-form-group">
                  <label>IFSC Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. ICIC0000012"
                    value={accountForm.ifscCode}
                    onChange={(e) => setAccountForm(f => ({ ...f, ifscCode: e.target.value }))}
                    required
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

              {/* UPI section inside modal */}
              <div className="ap-form-subheading">
                <Smartphone size={15} />
                <span>UPI Transfer Details (Optional)</span>
              </div>
              <div className="ap-upi-explainer">
                💡 <strong>Leave UPI ID empty</strong> if this account should NOT offer UPI payment to users (the UPI tab will be automatically hidden).
              </div>
              <div className="ap-settings-grid">
                <div className="ap-form-group">
                  <label>UPI ID (Leave blank to hide UPI tab)</label>
                  <input
                    type="text"
                    placeholder="e.g. heropay@icici or empty"
                    value={accountForm.upiId}
                    onChange={(e) => setAccountForm(f => ({ ...f, upiId: e.target.value }))}
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
    </div>
  )
}
