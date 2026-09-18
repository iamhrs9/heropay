import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  Info,
  Plus,
  ChevronRight,
  AlertCircle,
  X,
  CheckCircle,
  Trash2,
  Edit2
} from 'lucide-react'
import HeroPayLogo from '../components/HeroPayLogo'
import ProviderLogo from '../components/ProviderLogo'
import { useLockScroll } from '../hooks/useLockScroll'
import './UPIScreen.css'

export default function UPIScreen({ onManageUPI, upis = [], onUpdateUpis }) {
  const [localUpis, setLocalUpis] = useState(upis)

  useEffect(() => {
    setLocalUpis(upis)
  }, [upis])

  const currentList = onUpdateUpis ? upis : localUpis

  // Filter out any legacy dummy accounts
  const cleanList = Array.isArray(currentList)
    ? currentList.filter(
        (u) =>
          u &&
          u.id !== 'upi-1' &&
          u.id !== 'upi-2' &&
          !u.isLegacyMock
      )
    : []

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingUpi, setEditingUpi] = useState(null)
  const [newPhone, setNewPhone] = useState('')
  const [newUpiId, setNewUpiId] = useState('')
  const [newProvider, setNewProvider] = useState('gpay')
  const [selectedStatusUpi, setSelectedStatusUpi] = useState(null)

  // Lock background scroll when any modal is open
  useLockScroll(isAddModalOpen || Boolean(editingUpi) || Boolean(selectedStatusUpi))

  const activeUpis = cleanList.filter((u) => u.enabled !== false && u.status !== 'inactive')
  const unavailableUpis = cleanList.filter((u) => u.enabled === false || u.status === 'inactive')

  const updateUpis = (updater) => {
    const next = typeof updater === 'function' ? updater(cleanList) : updater
    if (onUpdateUpis) {
      onUpdateUpis(next)
    } else {
      setLocalUpis(next)
    }
    try {
      localStorage.setItem('hp_withdrawal_upis', JSON.stringify(next))
    } catch {}
  }

  const handleAddUpi = (e) => {
    e.preventDefault()
    if (!newUpiId.trim()) return

    const providerNames = {
      gpay: 'Google Pay',
      phonepe: 'PhonePe',
      paytm: 'Paytm',
      mobikwik: 'Mobikwik'
    }

    const newEntry = {
      id: `upi-${Date.now()}`,
      provider: newProvider,
      providerName: providerNames[newProvider] || 'UPI',
      phone: newPhone.trim(),
      upiIdIndex: (cleanList.length + 1).toString(),
      upiAddress: newUpiId.trim(),
      vpa: newUpiId.trim(),
      minAmount: 200,
      upiOnlineTag: '1/1',
      enabled: true,
      status: 'active',
      withdrawalsToday: '0 times / ₹0.00'
    }

    const updated = [...cleanList, newEntry]
    updateUpis(updated)
    setIsAddModalOpen(false)
    setNewPhone('')
    setNewUpiId('')

    const token = localStorage.getItem('hp_token')
    const userStr = localStorage.getItem('hp_user')
    let userPhone = ''
    let userId = ''
    if (userStr) {
      try {
        const u = JSON.parse(userStr)
        userPhone = u.phone || ''
        userId = u._id || ''
      } catch {}
    }

    fetch('/api/withdrawals/sync-upis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        upis: updated,
        activeWithdrawalUpi: newUpiId.trim(),
        phone: userPhone,
        userId: userId
      })
    }).catch(() => {})
  }

  const handleSaveEdit = (e) => {
    e.preventDefault()
    if (!editingUpi) return

    updateUpis((prev) =>
      prev.map((u) =>
        u.id === editingUpi.id
          ? {
              ...u,
              phone: newPhone.trim(),
              upiAddress: newUpiId.trim(),
              vpa: newUpiId.trim()
            }
          : u
      )
    )
    setEditingUpi(null)
  }

  const handleDeleteUpi = (id) => {
    updateUpis((prev) => prev.filter((u) => u.id !== id))
    setEditingUpi(null)
  }

  return (
    <div className="upi-screen-root">
      {/* Top Header */}
      <header className="upi-top-header">
        <div className="upi-brand-meta">
          <HeroPayLogo size={36} className="upi-brand-logo" />
          <div className="upi-brand-text">
            <h1 className="upi-brand-title">UPI Management</h1>
            <p className="upi-brand-subtitle">Add, manage and withdraw easily</p>
          </div>
        </div>

        <button
          type="button"
          className="upi-manage-btn"
          onClick={onManageUPI || (() => alert('Managing all linked payment accounts...'))}
          aria-label="Manage payment methods"
        >
          <CreditCard size={15} strokeWidth={2.2} className="upi-manage-icon" />
          <span>Manage</span>
        </button>
      </header>

      {/* Main Hero Summary Card */}
      <div className="upi-hero-card">
        <div className="upi-hero-content">
          <div className="upi-hero-left">
            <div className="upi-avail-label-row">
              <span className="upi-avail-label">UPIs Available</span>
              <button
                type="button"
                className="upi-info-btn"
                onClick={() => alert('You can bind up to 3 active UPI IDs for instantaneous withdrawals.')}
                aria-label="UPI limits info"
              >
                <Info size={14} strokeWidth={2.2} />
              </button>
            </div>

            <div className="upi-ratio-row">
              <span className="upi-ratio-current">{activeUpis.length}</span>
              <span className="upi-ratio-slash">/</span>
              <span className="upi-ratio-total">3</span>
            </div>

            <div className="upi-summary-meta">
              <p>Min withdrawal: ₹300.00</p>
              <p>Daily limit: Up to ₹50,000 / day</p>
            </div>
          </div>

          <div className="upi-hero-right">
            <button
              type="button"
              className="upi-add-cta-btn"
              onClick={() => {
                setNewPhone('')
                setNewUpiId('')
                setIsAddModalOpen(true)
              }}
            >
              <Plus size={16} strokeWidth={2.6} />
              <span>Add UPI</span>
            </button>

            {/* 3D UPI Terminal Stack Art */}
            <div className="upi-3d-art-box">
              <div className="upi-script-tag">Multiple<br />UPIs<br />More Freedom</div>
              <div className="upi-terminal-pad">
                <div className="upi-pad-layer layer-back" />
                <div className="upi-pad-layer layer-mid" />
                <div className="upi-pad-layer layer-front">
                  <div className="upi-brand-badge">
                    <span className="upi-text-u">UP</span><span className="upi-text-i">I</span>
                    <span className="upi-arrow-green">▶</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Promo Banner: The More UPI The Higher Withdraw */}
      <div
        className="upi-promo-banner"
        onClick={() => alert('Adding 3 UPI accounts raises your daily withdrawal cap to ₹2,00,000.')}
      >
        <div className="upi-banner-art">
          <div className="upi-banner-folder" />
          <div className="upi-banner-wallet" />
          <div className="upi-banner-arrow-up">▲</div>
        </div>

        <div className="upi-banner-text">
          <div className="upi-banner-title-row">
            <span className="banner-txt-dark">THE MORE </span>
            <span className="banner-txt-orange">UPI</span>
          </div>
          <div className="upi-banner-title-row">
            <span className="banner-txt-dark">THE HIGHER </span>
            <span className="banner-txt-orange">WITHDRAW</span>
          </div>
          <p className="upi-banner-sub">
            Add more UPI methods to enjoy faster withdrawals and higher limits.
          </p>
        </div>

        <div className="upi-banner-arrow">
          <ChevronRight size={18} strokeWidth={2.4} />
        </div>
      </div>

      {/* Section: Available UPIs */}
      <section className="upi-list-section">
        <h3 className="upi-section-title">Available UPIs</h3>

        <div className="upi-cards-list">
          {activeUpis.map((item) => (
            <div key={item.id} className="upi-item-card">
              {/* Provider Logo */}
              <div className="upi-item-logo-box">
                <ProviderLogo provider={item.provider} size="sm" />
              </div>

              {/* Main Info */}
              <div className="upi-item-info">
                <span className="upi-item-phone">{item.phone}</span>
                <div className="upi-item-sub-row">
                  <span className="upi-id-tag">UPI ID: {item.upiIdIndex}</span>
                  <button
                    type="button"
                    className="upi-edit-btn"
                    onClick={() => {
                      setEditingUpi(item)
                      setNewPhone(item.phone)
                      setNewUpiId(item.upiAddress)
                    }}
                  >
                    Edit &gt;
                  </button>
                </div>
                <span className="upi-item-stat">
                  Withdrawal today: <strong>{item.withdrawalsToday}</strong>
                </span>
              </div>

              {/* Status & Action */}
              <div className="upi-item-status-col">
                <div className="upi-status-badge active">
                  <span className="status-dot green" />
                  <span>Active</span>
                </div>

                <button
                  type="button"
                  className="upi-status-link"
                  onClick={() => setSelectedStatusUpi(item)}
                >
                  <span>Status</span>
                  <ChevronRight size={13} strokeWidth={2.4} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Warning / Customer Service Notice */}
        <div className="upi-warning-alert">
          <AlertCircle size={18} strokeWidth={2.2} className="warning-icon" />
          <p className="warning-text">
            If payment has not been received for a long time, please contact customer service.
          </p>
        </div>
      </section>

      {/* Section: Unavailable UPIs */}
      {unavailableUpis.length > 0 && (
        <section className="upi-list-section">
          <h3 className="upi-section-title">Unavailable UPIs</h3>

          <div className="upi-cards-list">
            {unavailableUpis.map((item) => (
              <div key={item.id} className="upi-item-card unavailable">
                {/* Provider Logo */}
                <div className="upi-item-logo-box">
                  <ProviderLogo provider={item.provider} size="sm" />
                </div>

                {/* Main Info */}
                <div className="upi-item-info">
                  <span className="upi-item-phone">{item.phone}</span>
                  <div className="upi-item-sub-row">
                    <span className="upi-id-tag">UPI ID: {item.upiIdIndex}</span>
                    <button
                      type="button"
                      className="upi-edit-btn"
                      onClick={() => {
                        setEditingUpi(item)
                        setNewPhone(item.phone)
                        setNewUpiId(item.upiAddress)
                      }}
                    >
                      Edit &gt;
                    </button>
                  </div>
                  <span className="upi-item-stat">
                    Withdrawal today: <strong>{item.withdrawalsToday}</strong>
                  </span>
                </div>

                {/* Status & Action */}
                <div className="upi-item-status-col">
                  <div className="upi-status-badge unauthorized">
                    <span className="status-dot gray" />
                    <span>Not Authorized</span>
                  </div>

                  <button
                    type="button"
                    className="upi-status-link"
                    onClick={() => setSelectedStatusUpi(item)}
                  >
                    <span>Status</span>
                    <ChevronRight size={13} strokeWidth={2.4} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Add UPI Modal */}
      {isAddModalOpen && (
        <div className="upi-modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="upi-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="upi-sheet-handle" />
            <div className="upi-sheet-header">
              <h3>Add New UPI</h3>
              <button
                type="button"
                className="upi-sheet-close"
                onClick={() => setIsAddModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUpi} className="upi-modal-form">
              <div className="upi-form-field">
                <label>Select Provider</label>
                <div className="upi-provider-picker">
                  {['gpay', 'phonepe', 'paytm', 'mobikwik'].map((prov) => (
                    <button
                      key={prov}
                      type="button"
                      className={`provider-chip ${newProvider === prov ? 'active' : ''}`}
                      onClick={() => setNewProvider(prov)}
                    >
                      <ProviderLogo provider={prov} size="icon" />
                      <span>
                        {prov === 'gpay' && 'Google Pay'}
                        {prov === 'phonepe' && 'PhonePe'}
                        {prov === 'paytm' && 'Paytm'}
                        {prov === 'mobikwik' && 'MobiKwik'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="upi-form-field">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="upi-modal-input"
                />
              </div>

              <div className="upi-form-field">
                <label>UPI ID (VPA)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. username@okaxis"
                  value={newUpiId}
                  onChange={(e) => setNewUpiId(e.target.value)}
                  className="upi-modal-input"
                />
              </div>

              <button type="submit" className="upi-submit-btn">
                Confirm & Add UPI
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit UPI Modal */}
      {editingUpi && (
        <div className="upi-modal-backdrop" onClick={() => setEditingUpi(null)}>
          <div className="upi-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="upi-sheet-handle" />
            <div className="upi-sheet-header">
              <h3>Edit UPI ({editingUpi.providerName})</h3>
              <button
                type="button"
                className="upi-sheet-close"
                onClick={() => setEditingUpi(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="upi-modal-form">
              <div className="upi-form-field">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="upi-modal-input"
                />
              </div>

              <div className="upi-form-field">
                <label>UPI Address (VPA)</label>
                <input
                  type="text"
                  value={newUpiId}
                  onChange={(e) => setNewUpiId(e.target.value)}
                  className="upi-modal-input"
                />
              </div>

              <div className="upi-edit-actions">
                <button type="submit" className="upi-submit-btn flex-1">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="upi-delete-btn"
                  onClick={() => handleDeleteUpi(editingUpi.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPI Status Details Modal */}
      {selectedStatusUpi && (
        <div className="upi-modal-backdrop" onClick={() => setSelectedStatusUpi(null)}>
          <div className="upi-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="upi-sheet-handle" />
            <div className="upi-sheet-header">
              <h3>UPI Status Details</h3>
              <button
                type="button"
                className="upi-sheet-close"
                onClick={() => setSelectedStatusUpi(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="upi-status-modal-content">
              <div className="status-modal-row">
                <span>Account Provider</span>
                <strong>{selectedStatusUpi.providerName}</strong>
              </div>
              <div className="status-modal-row">
                <span>Linked Mobile</span>
                <strong>{selectedStatusUpi.phone}</strong>
              </div>
              <div className="status-modal-row">
                <span>VPA / Address</span>
                <strong>{selectedStatusUpi.upiAddress}</strong>
              </div>
              <div className="status-modal-row">
                <span>Authorization State</span>
                <strong
                  style={{
                    color: selectedStatusUpi.status === 'active' ? 'var(--color-success)' : '#64748B'
                  }}
                >
                  {selectedStatusUpi.status === 'active' ? 'Active & Ready' : 'Pending Verification'}
                </strong>
              </div>
              <div className="status-modal-row">
                <span>Withdrawal Limits</span>
                <strong>Min ₹300 • Up to ₹50,000 / day</strong>
              </div>

              <button
                type="button"
                className="upi-submit-btn"
                style={{ marginTop: '16px' }}
                onClick={() => setSelectedStatusUpi(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
