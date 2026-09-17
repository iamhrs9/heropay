import React, { useState } from 'react'
import {
  Clock,
  Info,
  CreditCard,
  ChevronRight,
  TrendingUp,
  Send,
  Users,
  Play,
  Headphones,
  ArrowRight,
  Sparkles,
  ExternalLink,
  X,
  AlertCircle,
  CheckCircle2,
  Wallet
} from 'lucide-react'
import RewardCoin from '../components/RewardCoin'
import GlassCard from '../components/GlassCard'
import HeroPayLogo from '../components/HeroPayLogo'
import { useLockScroll } from '../hooks/useLockScroll'
import './SellScreen.css'
import { commissionLabel } from '../config'

export default function SellScreen({
  balance = 0,
  totalAward = 0.00,
  activeUpiCount = 0,
  todayWithdrawal = 0.00,
  inTransaction = 0.00,
  hasWithdrawalInProgress = false,
  activeWithdrawal = null,
  withdrawalUpis = [],
  sellOrders = [],
  onManageUPI,
  onDeposit,
  onVideoClick,
  onOpenRecord,
  onRequestWithdrawal,
  onNavigateTab,
  onShowToast,
  onOpenSupport,
  user
}) {
  const [activeBannerIndex, setActiveBannerIndex] = useState(0)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [isWithdrawalDetailsOpen, setIsWithdrawalDetailsOpen] = useState(false)

  // Lock background scroll when video modal is open
  useLockScroll(Boolean(selectedVideo) || isWithdrawalDetailsOpen)

  const handleManageSellClick = () => {
    if (balance < 300) {
      if (onShowToast) {
        onShowToast(`⚠️ Minimum withdrawal amount is ₹300. Aapka current balance ₹${Number(balance).toFixed(2)} hai.`)
      }
      return
    }
    if (onManageUPI) {
      onManageUPI()
    }
  }

  const videos = [
    {
      id: 'usdt',
      title: 'How to deposit USDT',
      subtitle: 'Learn how to add USDT to your account',
      duration: '02:45',
      type: 'crypto',
      gradient: 'linear-gradient(135deg, #0d3b36 0%, #17544a 100%)'
    },
    {
      id: 'mobikwik',
      title: 'How to use Mobikwik',
      subtitle: 'Complete guide for Mobikwik payments',
      duration: '03:12',
      type: 'mobikwik',
      gradient: 'linear-gradient(135deg, #153e75 0%, #1e5ba8 100%)'
    }
  ]

  return (
    <div className="sell-screen-root">
      {/* Top App Header */}
      <header className="sell-top-header">
        <div className="sell-brand-meta">
          <HeroPayLogo size={36} className="sell-brand-logo" />
          <div className="sell-brand-text">
            <h1 className="sell-brand-title">HeroPay</h1>
            <p className="sell-brand-subtitle">Earn More, Do More</p>
          </div>
        </div>

        <button
          type="button"
          className="sell-record-btn"
          onClick={onOpenRecord || (() => alert('Opening Transaction Records...'))}
          aria-label="Transaction Record"
        >
          <Clock size={15} strokeWidth={2.2} className="sell-record-icon" />
          <span>Record</span>
        </button>
      </header>

      {/* Hero Balance Card */}
      <div className="sell-hero-card">
        <div className="sell-hero-card-glow" />
        <div className="sell-hero-card-content">
          <div className="sell-hero-left">
            <div className="sell-balance-label-row">
              <span className="sell-balance-label">HeroPay Balance</span>
              <button
                type="button"
                className="sell-info-btn"
                onClick={() => onShowToast ? onShowToast('HeroPay liquid balance available for instant withdrawal.') : null}
                aria-label="Balance info"
              >
                <Info size={14} strokeWidth={2.2} />
              </button>
            </div>

            <div className="sell-balance-value-row">
              <div className="sell-gold-coin-large">
                <span className="sell-coin-g">H</span>
              </div>
              <span className="sell-balance-amount">{Number(balance).toFixed(2)}</span>
            </div>

            <div className="sell-balance-sub-row">
              <span className="sell-income-tag">Income: <strong>{commissionLabel}</strong></span>
              <span className="sell-award-tag">
                Award: <RewardCoin size={15} /> <strong>{Number(totalAward).toFixed(2)}</strong>
              </span>
            </div>
          </div>

          <div className="sell-hero-right">
            {/* Wallet 3D Graphic & Script */}
            <div className="sell-wallet-illustration">
              <div className="sell-wallet-script">More Tasks<br />More Rewards</div>
              <div className="sell-wallet-art">
                <div className="wallet-back" />
                <div className="wallet-card-blue" />
                <div className="wallet-card-orange" />
                <div className="wallet-body">
                  <div className="wallet-clasp" />
                </div>
                <div className="wallet-coin-float" />
                <div className="wallet-crown-float">👑</div>
              </div>
            </div>

            <button
              type="button"
              className="sell-deposit-btn"
              onClick={onDeposit || (() => alert('Opening USDT Deposit Portal...'))}
            >
              <span>USDT Deposit</span>
              <ArrowRight size={14} strokeWidth={2.6} />
            </button>
          </div>
        </div>
      </div>

      {/* Active Withdrawal UPI Card */}
      <div className="sell-withdrawal-card">
        <div className="sell-upi-header">
          <div className="sell-upi-header-left">
            <CreditCard size={17} strokeWidth={2.2} className="sell-upi-card-icon" />
            <span className="sell-upi-title">Active Withdrawal UPIs: <strong>{activeUpiCount}</strong></span>
          </div>
          <button
            type="button"
            className="sell-upi-manage-btn"
            onClick={onManageUPI || (() => alert('Opening UPI Management...'))}
          >
            <span>Manage UPI</span>
            <ChevronRight size={15} strokeWidth={2.4} />
          </button>
        </div>

        <div className="sell-metrics-row">
          <div className="sell-metric-col">
            <span className="sell-metric-value">{Number(todayWithdrawal).toFixed(2)}</span>
            <span className="sell-metric-label">Today Withdrawal</span>
          </div>
          <div className="sell-metric-divider" />
          <div className="sell-metric-col">
            <span className="sell-metric-value">{Number(inTransaction).toFixed(2)}</span>
            <span className="sell-metric-label">In Transaction</span>
          </div>
        </div>

        {hasWithdrawalInProgress ? (
          <div
            className="sell-progress-status"
            onClick={() => setIsWithdrawalDetailsOpen(true)}
            style={{ cursor: 'pointer' }}
            title="Click to view withdrawal details"
          >
            <span className="sell-status-dot" />
            <span>Withdrawal in progress...</span>
          </div>
        ) : activeUpiCount === 0 ? (
          <div
            className="sell-progress-status"
            onClick={onManageUPI}
            style={{ cursor: 'pointer', background: 'rgba(255, 104, 16, 0.08)', borderColor: 'rgba(255, 104, 16, 0.25)', color: '#FF6810' }}
            title="Click to add withdrawal UPI"
          >
            <AlertCircle size={14} strokeWidth={2.4} />
            <span>Add UPI to start receiving instant withdrawals</span>
          </div>
        ) : balance < 300 ? (
          <div
            className="sell-progress-status sell-status-warning"
            style={{ background: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.35)', color: '#D97706', cursor: 'pointer' }}
            onClick={() => onShowToast && onShowToast(`⚠️ Minimum withdrawal amount is ₹300. Aapka current balance ₹${Number(balance).toFixed(2)} hai.`)}
            title="Minimum withdrawal amount is ₹300"
          >
            <AlertCircle size={14} strokeWidth={2.4} />
            <span>Min. withdrawal is ₹300 (Current: ₹{Number(balance).toFixed(2)})</span>
          </div>
        ) : (
          <div
            className="sell-progress-status"
            style={{ background: 'rgba(100, 116, 139, 0.08)', borderColor: 'rgba(100, 116, 139, 0.2)', color: '#64748b' }}
          >
            <Clock size={14} strokeWidth={2.4} />
            <span>Matching next withdrawal batch...</span>
          </div>
        )}

        <button
          type="button"
          className="sell-manage-action-btn"
          onClick={handleManageSellClick}
        >
          <TrendingUp size={18} strokeWidth={2.4} />
          <span>Manage Sell HeroPay</span>
        </button>
      </div>

      {/* Minimum Balance Warning Banner */}
      {balance < 300 && (
        <div className="sell-warning-notice">
          <div className="sell-warning-icon-wrap">
            <AlertCircle size={20} color="#D97706" strokeWidth={2.4} />
          </div>
          <div className="sell-warning-content">
            <h4 className="sell-warning-title">Minimum Withdrawal Limit: ₹300.00</h4>
            <p className="sell-warning-desc">
              Withdrawal lagne ke liye aapke wallet me minimum <strong>₹300.00</strong> balance hona anivarya hai. Aapka current balance <strong>₹{Number(balance).toFixed(2)}</strong> hai.
            </p>
          </div>
        </div>
      )}

      {/* Withdrawal Orders Section (Pending & Failed) */}
      {sellOrders && sellOrders.length > 0 && (
        <div className="sell-orders-card">
          <div className="sell-orders-header">
            <div className="sell-orders-title-group">
              <Clock size={16} color="var(--color-primary)" />
              <span className="sell-orders-title">Withdrawal Orders</span>
            </div>
            <button
              type="button"
              className="sell-orders-all-btn"
              onClick={onOpenRecord}
            >
              <span>View in Record</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="sell-orders-items">
            {sellOrders.slice(0, 3).map((tx) => (
              <div
                key={tx.id}
                className={`sell-order-row ${tx.status === 'Pending' ? 'pending' : 'failed'}`}
                onClick={onOpenRecord}
              >
                <div className="sell-order-row-left">
                  <div className={`sell-order-badge-icon ${tx.status === 'Pending' ? 'pending' : 'failed'}`}>
                    {tx.status === 'Pending' ? (
                      <Clock size={14} color="#059669" />
                    ) : (
                      <AlertCircle size={14} color="#DC2626" />
                    )}
                  </div>
                  <div className="sell-order-info">
                    <div className="sell-order-title-row">
                      <span className="sell-order-text">Payout {tx.amount}</span>
                      <span className={`sell-order-status-pill ${tx.status === 'Pending' ? 'pending' : 'failed'}`}>
                        {tx.status === 'Pending' ? 'In Progress' : 'Failed'}
                      </span>
                    </div>
                    <span className="sell-order-date">
                      {tx.status === 'Failed' && tx.actionNote ? tx.actionNote : tx.method} • {tx.date}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 Quick Action Channels */}
      <div className="sell-channels-grid">
        <button
          type="button"
          className="sell-channel-item"
          onClick={() => window.open('https://t.me', '_blank')}
        >
          <div className="sell-channel-icon-wrap channel-blue">
            <Send size={18} strokeWidth={2.2} className="channel-icon-rotate" />
          </div>
          <span className="sell-channel-label">
            Channel <ChevronRight size={11} strokeWidth={2.4} />
          </span>
        </button>

        <button
          type="button"
          className="sell-channel-item"
          onClick={() => {
            if (onShowToast) onShowToast('Connecting to Official Community Discussion Group...')
            window.open('https://t.me', '_blank')
          }}
        >
          <div className="sell-channel-icon-wrap channel-indigo">
            <Users size={18} strokeWidth={2.2} />
          </div>
          <span className="sell-channel-label">
            Group <ChevronRight size={11} strokeWidth={2.4} />
          </span>
        </button>

        <button
          type="button"
          className="sell-channel-item"
          onClick={() => {
            if (onShowToast) onShowToast('Opening Official YouTube Channel & Guides...')
            window.open('https://youtube.com', '_blank')
          }}
        >
          <div className="sell-channel-icon-wrap channel-red">
            <Play size={18} strokeWidth={2.4} fill="currentColor" />
          </div>
          <span className="sell-channel-label">
            YouTube <ChevronRight size={11} strokeWidth={2.4} />
          </span>
        </button>

        <button
          type="button"
          className="sell-channel-item"
          onClick={() => {
            if (onOpenSupport) {
              onOpenSupport()
            } else if (onShowToast) {
              onShowToast('Connecting to 24/7 VIP Customer Support...')
            }
          }}
        >
          <div className="sell-channel-icon-wrap channel-green">
            <Headphones size={18} strokeWidth={2.2} />
            <span className="sell-support-badge">1</span>
          </div>
          <span className="sell-channel-label">
            Support <ChevronRight size={11} strokeWidth={2.4} />
          </span>
        </button>
      </div>

      {/* Banner 1: Invitation Rewards */}
      <div
        className="sell-promo-banner banner-invitation"
        onClick={() => onNavigateTab && onNavigateTab('team')}
        style={{ cursor: 'pointer' }}
        title="Go to Referral & Team screen"
      >
        <div className="banner-invitation-content">
          <div className="banner-title-row">
            <span className="banner-title-dark">INVITATION</span>
            <span className="banner-title-orange">REWARDS</span>
          </div>
          <p className="banner-sub-text">
            Earn up to <RewardCoin size={15} /> <strong>210</strong> per completed task
          </p>
          <div className="banner-dots">
            <span className={`banner-dot ${activeBannerIndex === 0 ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setActiveBannerIndex(0); }} />
            <span className={`banner-dot ${activeBannerIndex === 1 ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setActiveBannerIndex(1); }} />
          </div>
        </div>

        <div className="banner-gift-illustration">
          <div className="banner-gift-script">Invite<br />Earn<br />Together</div>
          <div className="banner-3d-gift">
            <div className="gift-box">
              <div className="gift-ribbon-v" />
              <div className="gift-ribbon-h" />
              <div className="gift-bow" />
            </div>
            <div className="gift-coin-1" />
            <div className="gift-coin-2" />
          </div>
        </div>
      </div>

      {/* Banner 2: Individual Earnings */}
      <div
        className="sell-promo-banner banner-individual"
        onClick={() => {
          if (onNavigateTab) onNavigateTab('team')
          else if (onShowToast) onShowToast('Individual Earnings: Earn up to 5% commission on team orders.')
        }}
        style={{ cursor: 'pointer' }}
        title="View Team & Commission breakdown"
      >
        <div className="banner-earnings-icon-wrap">
          <div className="chart-3d-art">
            <div className="chart-bar bar-1" />
            <div className="chart-bar bar-2" />
            <div className="chart-bar bar-3" />
            <div className="chart-coin-bubble" />
          </div>
        </div>

        <div className="banner-earnings-text">
          <h4 className="banner-earnings-title">INDIVIDUAL EARNINGS</h4>
          <p className="banner-earnings-sub">
            Up to <span className="text-highlight-orange">5%</span> on order amount
          </p>
        </div>

        <div className="banner-arrow-btn">
          <ChevronRight size={18} strokeWidth={2.4} />
        </div>
      </div>

      {/* Video Guides Section */}
      <section className="sell-videos-section">
        <div className="sell-section-header">
          <div>
            <h3 className="sell-section-title">Watch video to learn</h3>
            <p className="sell-section-sub">Step-by-step guides to get started</p>
          </div>
          <button
            type="button"
            className="sell-view-all-btn"
            onClick={() => {
              if (onShowToast) onShowToast('All tutorial guides are listed below. Tap any video to play.')
            }}
          >
            <span>View All</span>
            <ChevronRight size={13} strokeWidth={2.4} />
          </button>
        </div>

        <div className="sell-videos-list">
          {videos.map((vid) => (
            <div
              key={vid.id}
              className="sell-video-card"
              onClick={() => setSelectedVideo(vid)}
            >
              <div
                className="sell-video-thumb"
                style={{ background: vid.gradient }}
              >
                <div className="sell-video-play-icon">
                  <Play size={14} fill="#ffffff" color="#ffffff" />
                </div>
                <span className="sell-video-duration">{vid.duration}</span>
              </div>

              <div className="sell-video-meta">
                <h4 className="sell-video-title">{vid.title}</h4>
                <p className="sell-video-desc">{vid.subtitle}</p>
              </div>

              <div className="sell-video-action">
                <ChevronRight size={18} strokeWidth={2.2} className="sell-video-chevron" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Video Modal Preview */}
      {selectedVideo && (
        <div className="sell-modal-backdrop" onClick={() => setSelectedVideo(null)}>
          <div className="sell-video-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sell-modal-header">
              <h4>{selectedVideo.title}</h4>
              <button
                type="button"
                className="sell-modal-close"
                onClick={() => setSelectedVideo(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="sell-video-player-box" style={{ background: selectedVideo.gradient }}>
              <div className="sell-player-play-btn">
                <Play size={28} fill="#ffffff" color="#ffffff" />
              </div>
              <span className="sell-player-tag">Tutorial Video Demo • {selectedVideo.duration}</span>
            </div>
            <p className="sell-modal-desc">{selectedVideo.subtitle}</p>
          </div>
        </div>
      )}



      {/* Active Withdrawal Status Modal Sheet */}
      {isWithdrawalDetailsOpen && (
        <div className="sell-modal-backdrop" onClick={() => setIsWithdrawalDetailsOpen(false)}>
          <div className="sell-action-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sell-sheet-handle" />

            <div className="sell-sheet-header">
              <div className="sell-sheet-title-box">
                <h3>Withdrawal In Progress</h3>
                <p>Banking payment network is processing your payout</p>
              </div>
              <button
                type="button"
                className="sell-sheet-close-btn"
                onClick={() => setIsWithdrawalDetailsOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="active-withdrawal-card-modal">
              <div className="active-withdraw-status-badge">
                <span className="sell-status-dot" />
                <span>Processing Bank Transfer...</span>
              </div>

              <div className="active-withdraw-amount-row">
                <RewardCoin size={24} />
                <span className="amount-digits">₹{Number(inTransaction).toFixed(2)}</span>
              </div>

              <div className="active-withdraw-details-list">
                <div className="detail-row">
                  <span>Order Reference:</span>
                  <strong>{activeWithdrawal?.txId || 'TX_PROCESSING'}</strong>
                </div>
                <div className="detail-row">
                  <span>Receiving Account:</span>
                  <strong style={{ color: '#4F46E5' }}>{activeWithdrawal?.method || 'UPI Transfer'}</strong>
                </div>
                <div className="detail-row">
                  <span>Initiated:</span>
                  <span>{activeWithdrawal?.date || 'Today, Just now'}</span>
                </div>
                <div className="detail-row">
                  <span>Estimated Time:</span>
                  <span style={{ color: '#D97706', fontWeight: 600 }}>1–2 Minutes</span>
                </div>
              </div>

              <p className="active-withdraw-note">
                Your withdrawal request has been received. Funds are automatically transferred directly into your configured UPI ID.
              </p>

              <div className="active-withdraw-actions">
                <button
                  type="button"
                  className="active-withdraw-record-btn"
                  onClick={() => {
                    setIsWithdrawalDetailsOpen(false)
                    if (onOpenRecord) onOpenRecord()
                  }}
                >
                  <Clock size={15} />
                  <span>View in Record</span>
                </button>
                <button
                  type="button"
                  className="active-withdraw-close-btn"
                  onClick={() => setIsWithdrawalDetailsOpen(false)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
