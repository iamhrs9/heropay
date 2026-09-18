import React, { useState } from 'react'
import {
  ChevronLeft,
  Plus,
  ChevronDown,
  AlertCircle,
  X,
  Check,
  CheckCircle2
} from 'lucide-react'
import HeroPayLogo from '../components/HeroPayLogo'
import ProviderLogo from '../components/ProviderLogo'
import { useLockScroll } from '../hooks/useLockScroll'
import './WithdrawUPIScreen.css'

export default function WithdrawUPIScreen({ onBack, onAddUpi, upis = [], onUpdateUpis }) {
  const [activeTab, setActiveTab] = useState('available') // 'available' | 'unavailable'
  const [autoUpiChange, setAutoUpiChange] = useState(true)

  // Clean out any legacy dummy records
  const cleanList = (Array.isArray(upis) ? upis : []).filter(
    (u) => u && u.id !== 'upi-1' && u.id !== 'upi-2' && !u.isLegacyMock
  )

  const availableList = cleanList.filter((u) => u.enabled !== false && u.status !== 'inactive')
  const unavailableList = cleanList.filter((u) => u.enabled === false || u.status === 'inactive')

  const updateUpis = (updater) => {
    const next = typeof updater === 'function' ? updater(cleanList) : updater
    try {
      localStorage.setItem('hp_withdrawal_upis', JSON.stringify(next))
    } catch {}
    if (onUpdateUpis) onUpdateUpis(next)
  }

  // Min Amount Picker State
  const [amountPickerItem, setAmountPickerItem] = useState(null)
  const amountOptions = [200, 500, 1000, 2000, 5000]

  // Add UPI Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newProvider, setNewProvider] = useState('paytm')
  const [newPhone, setNewPhone] = useState('')
  const [newVpa, setNewVpa] = useState('')

  // Lock background scrolling when modal is open
  useLockScroll(isAddModalOpen || Boolean(amountPickerItem))

  const handleToggleAvailable = (id) => {
    updateUpis((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              enabled: !item.enabled,
              status: !item.enabled ? 'active' : 'inactive'
            }
          : item
      )
    )
  }

  const handleSelectMinAmount = (amount) => {
    if (amountPickerItem) {
      updateUpis((prev) =>
        prev.map((item) =>
          item.id === amountPickerItem.id ? { ...item, minAmount: amount } : item
        )
      )
      setAmountPickerItem(null)
    }
  }

  const handleAddUpiSubmit = (e) => {
    e.preventDefault()
    if (!newVpa.trim()) return

    const providerNames = {
      paytm: 'Paytm',
      phonepe: 'PhonePe',
      mobikwik: 'Mobikwik',
      gpay: 'Google Pay'
    }

    const newEntry = {
      id: `upi-${Date.now()}`,
      provider: newProvider,
      providerName: providerNames[newProvider] || 'UPI',
      phone: newPhone.trim(),
      vpa: newVpa.trim(),
      upiAddress: newVpa.trim(),
      minAmount: 200,
      upiOnlineTag: '1/1',
      enabled: true,
      status: 'active',
      withdrawalsToday: '0 times / ₹0.00'
    }

    const updated = [newEntry, ...cleanList]
    updateUpis(updated)
    setIsAddModalOpen(false)
    setNewVpa('')
    setNewPhone('')

    const token = localStorage.getItem('hp_token')
    if (token) {
      fetch('/api/withdrawals/sync-upis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          upis: updated,
          activeWithdrawalUpi: newVpa.trim()
        })
      }).catch(() => {})
    }
  }

  return (
    <div className="withdraw-upi-root">
      {/* Top Header */}
      <header className="withdraw-header">
        <button
          type="button"
          className="withdraw-back-btn"
          onClick={onBack}
          aria-label="Go back"
        >
          <ChevronLeft size={22} strokeWidth={2.4} />
        </button>

        <h1 className="withdraw-header-title">Withdraw UPI</h1>

        <button
          type="button"
          className="withdraw-add-btn"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={16} strokeWidth={2.6} />
          <span>Add</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="withdraw-content">
        {/* Category Pill Switcher */}
        <div className="withdraw-tab-switcher">
          <button
            type="button"
            className={`withdraw-tab-pill ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            Available UPI
          </button>
          <button
            type="button"
            className={`withdraw-tab-pill ${activeTab === 'unavailable' ? 'active' : ''}`}
            onClick={() => setActiveTab('unavailable')}
          >
            Unavailable UPI
          </button>
        </div>

        {/* Tab 1: Available UPI Cards */}
        {activeTab === 'available' && (
          <div className="withdraw-cards-list">
            {availableList.length === 0 ? (
              <div className="withdraw-empty-state">
                <AlertCircle size={36} className="withdraw-empty-icon" />
                <p className="withdraw-empty-title">No Active UPI Added</p>
                <p className="withdraw-empty-sub">Add your UPI ID to receive payouts</p>
                <button
                  type="button"
                  className="withdraw-empty-add-btn"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus size={16} strokeWidth={2.4} />
                  <span>Add UPI Now</span>
                </button>
              </div>
            ) : (
              availableList.map((item) => (
                <div key={item.id} className="withdraw-upi-card available-card">
                  {/* Top Row: Provider Logo + Name + Phone + Online Tag */}
                  <div className="withdraw-card-top-row">
                    <div className="withdraw-card-provider-info">
                      {/* Provider Logo Artwork */}
                      <div className="withdraw-provider-logo-wrap">
                        <ProviderLogo provider={item.provider} size="sm" />
                      </div>

                      <div className="withdraw-provider-text">
                        <span className="withdraw-provider-name">{item.providerName}</span>
                        <span className="withdraw-provider-phone">{item.phone}</span>
                      </div>
                    </div>

                    <div className="withdraw-online-tag">
                      <span>UPI Online:{item.upiOnlineTag || '1/1'}</span>
                    </div>
                  </div>

                  {/* Middle Row: Min Amount with interactive dropdown */}
                  <div className="withdraw-card-middle-row">
                    <span className="withdraw-min-label">Minimum single withdrawal amount</span>
                    <button
                      type="button"
                      className="withdraw-amount-picker-btn"
                      onClick={() => setAmountPickerItem(item)}
                    >
                      <span>₹{item.minAmount || 200}</span>
                      <ChevronDown size={14} strokeWidth={2.4} />
                    </button>
                  </div>

                  <div className="withdraw-card-divider" />

                  {/* Bottom Row: VPA, Today Withdrawal, and Enable Switch */}
                  <div className="withdraw-card-bottom-row">
                    <div className="withdraw-card-meta-left">
                      <span className="withdraw-vpa-address">{item.vpa || item.upiAddress}</span>
                      <span className="withdraw-today-stat">
                        Withdrawal today: {item.withdrawalsToday || '0 times / ₹0.00'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className={`withdraw-ios-toggle ${item.enabled !== false ? 'active' : ''}`}
                      onClick={() => handleToggleAvailable(item.id)}
                      aria-label="Toggle UPI Active State"
                    >
                      <div className="toggle-thumb" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Unavailable UPI Cards */}
        {activeTab === 'unavailable' && (
          <div className="withdraw-cards-list">
            {unavailableList.length === 0 ? (
              <div className="withdraw-empty-state">
                <AlertCircle size={36} className="withdraw-empty-icon" />
                <p className="withdraw-empty-title">No Unavailable UPI</p>
                <p className="withdraw-empty-sub">All your linked UPI accounts are currently active</p>
              </div>
            ) : (
              unavailableList.map((item) => (
                <div key={item.id} className="withdraw-upi-card unavailable-card">
                  {/* Top Row: Provider Logo + Name + Phone + UPI ID */}
                  <div className="withdraw-card-top-row">
                    <div className="withdraw-card-provider-info">
                      <div className="withdraw-provider-logo-wrap">
                        <ProviderLogo provider={item.provider} size="sm" />
                      </div>

                      <div className="withdraw-provider-text">
                        <span className="withdraw-provider-name">{item.providerName}</span>
                        <span className="withdraw-provider-phone">{item.phone}</span>
                      </div>
                    </div>

                    <div className="withdraw-unavail-right">
                      <span className="withdraw-id-label" style={{ color: '#EF4444', fontWeight: 600 }}>Inactive</span>
                    </div>
                  </div>

                  {/* Middle Row: Min Amount */}
                  <div className="withdraw-card-middle-row">
                    <span className="withdraw-min-label">Minimum single withdrawal amount</span>
                    <span className="withdraw-min-value-static">₹{item.minAmount || 200}</span>
                  </div>

                  <div className="withdraw-card-divider" />

                  {/* Bottom Row: VPA & Today Stat */}
                  <div className="withdraw-card-bottom-row">
                    <div className="withdraw-card-meta-left">
                      <span className="withdraw-vpa-address">{item.vpa || item.upiAddress}</span>
                      <span className="withdraw-today-stat">
                        Withdrawal today: {item.withdrawalsToday || '0 times / ₹0.00'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className={`withdraw-ios-toggle ${item.enabled ? 'active' : ''}`}
                      onClick={() => handleToggleAvailable(item.id)}
                      aria-label="Re-enable UPI"
                    >
                      <div className="toggle-thumb" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bottom Sticky Policy / Footer Section */}
      <footer className="withdraw-bottom-footer">
        {/* Row 1: Auto UPI Switch */}
        <div className="withdraw-auto-switch-row">
          <span className="auto-switch-text">
            Automatic UPI change if withdrawal fails.
          </span>
          <button
            type="button"
            className={`withdraw-ios-toggle ${autoUpiChange ? 'active' : ''}`}
            onClick={() => setAutoUpiChange(!autoUpiChange)}
            aria-label="Toggle Automatic UPI Change"
          >
            <div className="toggle-thumb" />
          </button>
        </div>

        {/* Row 2: Warning Banner */}
        <div className="withdraw-warning-banner">
          <AlertCircle size={15} className="warning-icon" />
          <p className="warning-text">
            Please use a UPI that you are certain can receive payment; otherwise, your Hero-Coins will not be able to be sold.
          </p>
        </div>
      </footer>

      {/* Modal 1: Minimum Amount Dropdown Sheet */}
      {amountPickerItem && (
        <div className="withdraw-modal-backdrop" onClick={() => setAmountPickerItem(null)}>
          <div className="withdraw-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="withdraw-sheet-handle" />
            <div className="withdraw-amount-options-list">
              {amountOptions.map((amt) => {
                const isSelected = amountPickerItem.minAmount === amt
                return (
                  <button
                    key={amt}
                    type="button"
                    className={`withdraw-amount-option-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectMinAmount(amt)}
                  >
                    <span className="amount-label">₹{amt.toLocaleString('en-IN')}</span>
                    {isSelected && (
                      <CheckCircle2 size={18} color="#FF6810" strokeWidth={2.4} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Add New UPI Modal Sheet */}
      {isAddModalOpen && (
        <div className="withdraw-modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="withdraw-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="withdraw-sheet-handle" />
            <div className="withdraw-sheet-header">
              <h3>Add New Withdrawal UPI</h3>
              <button
                type="button"
                className="withdraw-sheet-close"
                onClick={() => setIsAddModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUpiSubmit} className="withdraw-modal-form">
              <div className="withdraw-form-group">
                <label>Select Provider</label>
                <div className="withdraw-provider-chips">
                  {[
                    { id: 'paytm', label: 'Paytm' },
                    { id: 'gpay', label: 'Google Pay' },
                    { id: 'phonepe', label: 'PhonePe' },
                    { id: 'mobikwik', label: 'Mobikwik' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`withdraw-chip-btn ${newProvider === p.id ? 'active' : ''}`}
                      onClick={() => setNewProvider(p.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <ProviderLogo provider={p.id} size="sm" />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="withdraw-form-group">
                <label>Linked Mobile Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="withdraw-modal-input"
                />
              </div>

              <div className="withdraw-form-group">
                <label>UPI ID (VPA)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. username@paytm or number@okaxis"
                  value={newVpa}
                  onChange={(e) => setNewVpa(e.target.value)}
                  className="withdraw-modal-input"
                />
              </div>

              <button type="submit" className="withdraw-submit-btn">
                Confirm & Add UPI
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
