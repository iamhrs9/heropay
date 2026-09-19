import React, { useState, useEffect } from 'react'
import {
  ChevronLeft,
  Calendar,
  ChevronDown,
  X,
  CheckCircle2,
  Check,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  Coins,
  Clock,
  AlertTriangle,
  AlertCircle,
  XCircle
} from 'lucide-react'
import RewardCoin from '../components/RewardCoin'
import { useLockScroll } from '../hooks/useLockScroll'
import './RecordScreen.css'

export default function RecordScreen({
  onBack,
  records = [],
  totalAward = 0.00,
  totalBuyGoCoin = 0.00,
  onContinueOrder,
  onCancelOrder,
  initialTab = 'all'
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'all') // 'all' | 'sell' | 'buy' | 'deposit' | 'team'
  const [dateFilter, setDateFilter] = useState('Today')
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [selectedTxDetail, setSelectedTxDetail] = useState(null)
  const [orderToCancel, setOrderToCancel] = useState(null)

  // Live ticking timer for pending orders
  const [nowTs, setNowTs] = useState(Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useLockScroll(isDatePickerOpen || !!selectedTxDetail || !!orderToCancel)

  const formatRemaining = (autoApproveAt) => {
    if (!autoApproveAt) return '15:00'
    const diff = Math.floor((new Date(autoApproveAt).getTime() - nowTs) / 1000)
    if (diff <= 0) return '00:00'
    const mins = Math.floor(diff / 60)
    const secs = diff % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  useLockScroll(isDatePickerOpen || Boolean(selectedTxDetail))

  const dateOptions = ['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'All Time']

  const categories = [
    { id: 'all', label: 'All Record' },
    { id: 'sell', label: 'Sell', dotColor: '#10B981' },
    { id: 'buy', label: 'Buy', dotColor: '#EF4444' },
    { id: 'deposit', label: 'Deposit', dotColor: '#8B5CF6' },
    { id: 'team', label: 'Team', dotColor: '#FF6810' }
  ]

  const filteredTransactions =
    activeTab === 'all'
      ? records
      : records.filter((tx) => tx.type === activeTab)

  const isShowingPopulated = filteredTransactions.length > 0

  return (
    <div className="record-screen-root">
      {/* Top Header */}
      <header className="record-header">
        <button
          type="button"
          className="record-back-btn"
          onClick={onBack}
          aria-label="Back to Home"
        >
          <ChevronLeft size={22} strokeWidth={2.4} />
        </button>

        <h1 className="record-header-title">Record</h1>

        {/* Date Filter Pill */}
        <button
          type="button"
          className="record-date-filter-btn"
          onClick={() => setIsDatePickerOpen(true)}
        >
          <span>{dateFilter}</span>
          <Calendar size={14} strokeWidth={2.2} className="record-cal-icon" />
        </button>
      </header>

      {/* Main Content Viewport */}
      <div className="record-content-viewport">
        {/* Total Award & Metrics Summary Card */}
        <div className="record-summary-card">
          {/* Header Banner: Total Award */}
          <div className="record-card-header">
            <span className="record-award-label">Total Award:</span>
            <div className="record-award-value-wrap">
              <RewardCoin size={18} />
              <span className="record-award-amount">{Number(totalAward).toFixed(2)}</span>
            </div>
          </div>

          {/* Metric Breakdown Rows */}
          <div className="record-breakdown-list">
            <div className="record-metric-row">
              <span className="record-metric-name">Total Sell Hero-Coin:</span>
              <div className="record-metric-val">
                <RewardCoin size={15} />
                <span>0.00</span>
              </div>
            </div>

            <div className="record-metric-row">
              <span className="record-metric-name">Total Buy Hero-Coin:</span>
              <div className="record-metric-val">
                <RewardCoin size={15} />
                <span>{Number(totalBuyGoCoin).toFixed(2)}</span>
              </div>
            </div>

            <div className="record-metric-row">
              <span className="record-metric-name">Total USTD Deposit:</span>
              <div className="record-metric-val">
                <RewardCoin size={15} />
                <span>0.00</span>
              </div>
            </div>

            <div className="record-metric-row">
              <span className="record-metric-name">Total Team Extract:</span>
              <div className="record-metric-val">
                <RewardCoin size={15} />
                <span>0.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Pills Switcher */}
        <div className="record-tabs-container">
          <div className="record-tabs-scrollable">
            {categories.map((cat) => {
              const isActive = activeTab === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`record-tab-chip ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(cat.id)}
                >
                  {cat.dotColor && (
                    <span
                      className="tab-chip-dot"
                      style={{ backgroundColor: cat.dotColor }}
                    />
                  )}
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Records Container: Empty State or Populated State */}
        {!isShowingPopulated ? (
          <div className="record-empty-state">
            {/* 3D Clipboard Illustration */}
            <div className="empty-state-art-box">
              <div className="empty-bubble bubble-left" />
              <div className="empty-bubble bubble-right" />
              <div className="empty-tree tree-left" />
              <div className="empty-tree tree-right" />

              <div className="empty-clipboard">
                <div className="clipboard-clip" />
                <div className="clipboard-sheet">
                  <div className="sheet-line line-1" />
                  <div className="sheet-line line-2" />
                  <div className="sheet-line line-3" />
                  <div className="sheet-line line-4" />
                </div>
              </div>
            </div>

            <p className="empty-state-text">No records found</p>
          </div>
        ) : (
          <div className="record-list-populated">
            <div className="record-list-header">
              <span className="record-count-text">
                Showing {filteredTransactions.length} records
              </span>
            </div>

            <div className="record-cards-stack">
              {filteredTransactions.map((tx) => {
                const isExpired = tx.autoApproveAt && Date.now() >= new Date(tx.autoApproveAt).getTime()
                const isPendingBuy = tx.type === 'buy' && tx.status === 'Pending'
                const isProofNeeded = isPendingBuy && !tx.proofSubmitted && !isExpired

                return (
                  <div
                    key={tx.id}
                    className={`record-tx-card ${isProofNeeded ? 'record-tx-card--action-needed' : ''}`}
                    onClick={() => {
                      if (isProofNeeded && onContinueOrder) {
                        onContinueOrder(tx)
                      } else {
                        setSelectedTxDetail(tx)
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                    title={isProofNeeded ? 'Click to continue payment' : 'Click to view details'}
                  >
                    <div className="record-tx-main">
                      <div className="record-tx-left">
                        <div className={`tx-icon-wrap ${tx.type}`}>
                          {tx.type === 'sell' && <ArrowDownLeft size={18} strokeWidth={2.4} />}
                          {tx.type === 'buy' && <ArrowUpRight size={18} strokeWidth={2.4} />}
                          {tx.type === 'deposit' && <Coins size={18} strokeWidth={2.2} />}
                          {tx.type === 'team' && <Users size={18} strokeWidth={2.2} />}
                        </div>

                        <div className="tx-details">
                          <span className="tx-title">{tx.type === 'sell' ? 'Withdrawal' : tx.title}</span>
                          <span className="tx-method">
                            {isProofNeeded
                              ? '⏳ Payment Incomplete'
                              : (tx.type === 'sell'
                                  ? (tx.utr ? `UTR: ${tx.utr}` : (tx.method && tx.method.startsWith('UTR:') ? tx.method : 'Withdrawal'))
                                  : tx.method)} • {tx.date}
                          </span>
                        </div>
                      </div>

                      <div className="record-tx-right">
                        <div className="tx-amount-row">
                          <RewardCoin size={14} />
                          <span className={`tx-amount ${tx.amount.startsWith('+') ? 'positive' : 'negative'}`}>
                            {tx.amount}
                          </span>
                        </div>
                        <span className={`tx-status-badge ${isProofNeeded ? 'pay-now' : (tx.status ? tx.status.toLowerCase() : '')}`}>
                          {isProofNeeded ? 'Pay Now' : (isPendingBuy && isExpired ? 'Approving...' : tx.status)}
                        </span>
                      </div>
                    </div>

                    {/* For pending sell/withdrawal transactions */}
                    {tx.type === 'sell' && tx.status === 'Pending' && (
                      <div className="record-pending-action-bar" style={{ background: '#ECFDF5', borderColor: '#A7F3D0' }}>
                        <div className="record-pending-timer" style={{ color: '#047857' }}>
                          <Clock size={13} color="#059669" />
                          <span>Payout in progress • Time Left: <strong>{formatRemaining(tx.expiresAt || tx.autoApproveAt)}</strong></span>
                        </div>
                      </div>
                    )}

                    {/* For failed transactions with an actionNote (ignoring any manual/admin note) */}
                    {tx.status === 'Failed' && tx.actionNote && !tx.actionNote.toLowerCase().includes('manual') && !tx.actionNote.toLowerCase().includes('admin') && (
                      <div style={{
                        marginTop: '8px',
                        padding: '6px 10px',
                        background: '#FEF2F2',
                        border: '1px solid #FCA5A5',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        color: '#DC2626',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <AlertCircle size={13} style={{ flexShrink: 0 }} />
                        <span>{tx.actionNote}</span>
                      </div>
                    )}

                    {isProofNeeded && (
                      <div className="record-pending-action-bar">
                        <div className="record-pending-timer">
                          <Clock size={13} />
                          <span>Time Left: <strong>{formatRemaining(tx.autoApproveAt)}</strong></span>
                        </div>
                        <div className="record-pending-btn-group">
                          <button
                            type="button"
                            className="record-pending-cancel-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOrderToCancel(tx)
                            }}
                          >
                            <X size={12} />
                            <span>Cancel</span>
                          </button>
                          <button
                            type="button"
                            className="record-continue-pay-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (onContinueOrder) onContinueOrder(tx)
                            }}
                          >
                            <span>Pay Now</span>
                            <ArrowUpRight size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal Sheet */}
      {selectedTxDetail && (
        <div className="record-modal-backdrop" onClick={() => setSelectedTxDetail(null)}>
          <div className="record-modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '82vh', overflowY: 'auto' }}>
            <div className="record-sheet-handle" />
            <div className="record-sheet-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0F172A' }}>Transaction Details</h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>{selectedTxDetail.id}</span>
              </div>
              <button
                type="button"
                className="record-sheet-close"
                onClick={() => setSelectedTxDetail(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
              {/* Status Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '14px',
                background: selectedTxDetail.status === 'Pending' ? '#FFFBEB' : '#ECFDF5',
                border: selectedTxDetail.status === 'Pending' ? '1px solid #FDE68A' : '1px solid #A7F3D0'
              }}>
                <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '600' }}>Order Status</span>
                <span className={`tx-status-badge ${selectedTxDetail.status ? selectedTxDetail.status.toLowerCase() : ''}`} style={{ fontSize: '12px', padding: '3px 10px' }}>
                  {selectedTxDetail.status}
                </span>
              </div>

              {selectedTxDetail.type === 'sell' && selectedTxDetail.status === 'Pending' && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  color: '#065F46',
                  fontSize: '12.5px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#047857' }}>
                    <Clock size={16} color="#059669" />
                    <span>Payout In Progress • Time Left: {formatRemaining(selectedTxDetail.expiresAt || selectedTxDetail.autoApproveAt)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#065F46', lineHeight: '1.45' }}>
                    Automated payout gateway is attempting to transfer funds to your configured UPI: <strong>{selectedTxDetail.method}</strong>.
                  </p>
                </div>
              )}

              {selectedTxDetail.status === 'Failed' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5'
                }}>
                  <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', color: '#991B1B', fontSize: '13px', marginBottom: '2px' }}>
                      Withdrawal / Order Failed
                    </strong>
                    <span style={{ fontSize: '12px', color: '#B91C1C', lineHeight: '1.4' }}>
                      {selectedTxDetail.actionNote || 'Order failed because of your UPI issue'}
                    </span>
                  </div>
                </div>
              )}

              {selectedTxDetail.type === 'buy' && selectedTxDetail.status === 'Pending' && !selectedTxDetail.proofSubmitted && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: '#FFF7ED',
                  border: '1px solid #FFEDD5'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C2410C', fontSize: '13px', fontWeight: '700' }}>
                    <Clock size={16} color="#EA580C" />
                    <span>Time Left: {formatRemaining(selectedTxDetail.autoApproveAt)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#9A3412', lineHeight: '1.45' }}>
                    You started this order. Tap below to resume and view the bank transfer details to complete your payment.
                  </p>
                  <button
                    type="button"
                    className="record-continue-pay-btn-large"
                    onClick={() => {
                      const orderToResume = selectedTxDetail
                      setSelectedTxDetail(null)
                      if (onContinueOrder) onContinueOrder(orderToResume)
                    }}
                  >
                    <span>Continue to Payment Gateway</span>
                    <ArrowUpRight size={16} />
                  </button>
                  <button
                    type="button"
                    className="record-detail-cancel-btn"
                    onClick={() => {
                      const order = selectedTxDetail
                      setSelectedTxDetail(null)
                      setOrderToCancel(order)
                    }}
                  >
                    <XCircle size={15} />
                    <span>Cancel This Order</span>
                  </button>
                </div>
              )}

              {selectedTxDetail.type === 'buy' && selectedTxDetail.status === 'Pending' && selectedTxDetail.proofSubmitted && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '11px 13px',
                  borderRadius: '12px',
                  background: '#FEF3C7',
                  border: '1px solid #FCD34D',
                  fontSize: '12px',
                  lineHeight: '1.45',
                  color: '#92400E'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <Clock size={16} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ display: 'block', color: '#78350F', marginBottom: '2px' }}>Payment Verification In Progress</strong>
                      System payment details check kar raha hai, please wait... Verification complete hote hi Hero-Coins aapke wallet mein add ho jayenge.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="record-detail-cancel-btn"
                    style={{ marginTop: '4px' }}
                    onClick={() => {
                      const order = selectedTxDetail
                      setSelectedTxDetail(null)
                      setOrderToCancel(order)
                    }}
                  >
                    <XCircle size={15} />
                    <span>Cancel This Order</span>
                  </button>
                </div>
              )}

              {/* Amount Box */}
              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: '700' }}>Transaction Amount</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RewardCoin size={18} />
                  <strong style={{ fontSize: '20px', color: selectedTxDetail.amount.startsWith('+') ? '#10B981' : '#EF4444' }}>
                    {selectedTxDetail.amount} Hero-Coins
                  </strong>
                </div>
              </div>

              {/* Detail Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ color: '#64748B' }}>Status:</span>
                  <span className={`tx-status-badge ${selectedTxDetail.status ? selectedTxDetail.status.toLowerCase() : ''}`}>
                    {selectedTxDetail.status}
                  </span>
                </div>
                {selectedTxDetail.actionNote && !selectedTxDetail.actionNote.toLowerCase().includes('manual') && !selectedTxDetail.actionNote.toLowerCase().includes('admin') && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ color: '#64748B' }}>Note:</span>
                    <strong style={{ color: '#EF4444' }}>{selectedTxDetail.actionNote}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ color: '#64748B' }}>Category:</span>
                  <strong style={{ color: '#0F172A', textTransform: 'capitalize' }}>{selectedTxDetail.type}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ color: '#64748B' }}>Date & Time:</span>
                  <strong style={{ color: '#0F172A' }}>{selectedTxDetail.date}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ color: '#64748B' }}>Method / Ref:</span>
                  <strong style={{ color: '#0F172A' }}>{selectedTxDetail.method}</strong>
                </div>
                {selectedTxDetail.utr && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ color: '#64748B' }}>Submitted UTR:</span>
                    <strong style={{ color: '#4F46E5', fontFamily: 'monospace' }}>{selectedTxDetail.utr}</strong>
                  </div>
                )}
              </div>

              {/* Screenshot Preview if available */}
              {selectedTxDetail.screenshot && (
                <div style={{ marginTop: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                    Attached Payment Screenshot:
                  </span>
                  <img
                    src={selectedTxDetail.screenshot}
                    alt="Receipt Proof"
                    style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '12px', border: '1px solid #CBD5E1', background: '#FFFFFF' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal Sheet */}
      {orderToCancel && (
        <div className="record-modal-backdrop" onClick={() => setOrderToCancel(null)}>
          <div className="record-modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="record-sheet-handle" />
            <div className="payment-cancel-modal-body">
              <div className="payment-cancel-icon-wrap">
                <AlertTriangle size={32} color="#EF4444" />
              </div>
              <h3 className="payment-cancel-title">Cancel This Order?</h3>
              <p className="payment-cancel-desc">
                Are you sure you want to cancel order <strong>#{orderToCancel.txId || orderToCancel.id}</strong>?
              </p>
              <div className="payment-cancel-order-summary">
                <div className="summary-row">
                  <span>Assigned Amount:</span>
                  <strong>{orderToCancel.amount} Coins</strong>
                </div>
                {orderToCancel.pkg?.range && (
                  <div className="summary-row">
                    <span>Package:</span>
                    <span>{orderToCancel.pkg.range}</span>
                  </div>
                )}
              </div>
              <p className="payment-cancel-subdesc">
                This pending transaction will be terminated and marked as Cancelled.
              </p>
              <div className="payment-cancel-actions">
                <button
                  type="button"
                  className="payment-cancel-btn-keep"
                  onClick={() => setOrderToCancel(null)}
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  className="payment-cancel-btn-confirm"
                  onClick={() => {
                    const target = orderToCancel
                    setOrderToCancel(null)
                    if (onCancelOrder) onCancelOrder(target)
                  }}
                >
                  Yes, Cancel Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Filter Modal Sheet */}
      {isDatePickerOpen && (
        <div className="record-modal-backdrop" onClick={() => setIsDatePickerOpen(false)}>
          <div className="record-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="record-sheet-handle" />
            <div className="record-sheet-header">
              <h3>Filter by Date</h3>
              <button
                type="button"
                className="record-sheet-close"
                onClick={() => setIsDatePickerOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="record-date-options">
              {dateOptions.map((opt) => {
                const isSelected = dateFilter === opt
                return (
                  <button
                    key={opt}
                    type="button"
                    className={`record-date-opt-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setDateFilter(opt)
                      setIsDatePickerOpen(false)
                    }}
                  >
                    <span>{opt}</span>
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
    </div>
  )
}
