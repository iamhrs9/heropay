import React, { useState } from 'react'
import {
  Bell,
  Edit2,
  CheckCircle,
  ChevronRight,
  Lock,
  Smartphone,
  Gift,
  Coins,
  Headphones,
  Send,
  ShieldCheck,
  Mail,
  MessageCircle,
  LogOut,
  X,
  Check
} from 'lucide-react'
import HeroPayLogo from '../components/HeroPayLogo'
import { useLockScroll } from '../hooks/useLockScroll'
import './MeScreen.css'

export default function MeScreen({ onLogout, onNavigateTab, onShowToast, onOpenSupport, user }) {
  const [isGiftCodeModal, setIsGiftCodeModal] = useState(false)
  const [giftCode, setGiftCode] = useState('')
  const [giftRedeemed, setGiftRedeemed] = useState(false)
  const [isPasswordModal, setIsPasswordModal] = useState(false)
  const [isLogoutModal, setIsLogoutModal] = useState(false)

  // Lock background scroll when any modal is open
  useLockScroll(isGiftCodeModal || isPasswordModal || isLogoutModal)

  const menuItems = [
    {
      id: 'password',
      icon: Lock,
      iconColor: '#EA580C',
      iconBg: '#FFEDD5',
      title: 'Change Password',
      subtitle: 'Keep your account secure',
      action: () => setIsPasswordModal(true)
    },
    {
      id: 'login-account',
      icon: Smartphone,
      iconColor: '#2563EB',
      iconBg: '#DBEAFE',
      title: 'Linked Accounts',
      subtitle: 'Manage your login methods',
      action: () => {
        if (onShowToast) onShowToast('Account linked with verified mobile number.')
      }
    },
    {
      id: 'gift',
      icon: Gift,
      iconColor: '#16A34A',
      iconBg: '#DCFCE7',
      title: 'Redeem Gift Code',
      subtitle: 'Claim promotional rewards',
      action: () => {
        setGiftCode('')
        setGiftRedeemed(false)
        setIsGiftCodeModal(true)
      }
    },
    {
      id: 'usdt',
      icon: Coins,
      iconColor: '#D97706',
      iconBg: '#FEF3C7',
      title: 'USDT Deposit',
      subtitle: 'Deposit USDT to your account',
      action: () => {
        if (onShowToast) onShowToast('Opening USDT Deposit Portal...')
      }
    },
    {
      id: 'support',
      icon: Headphones,
      iconColor: '#E11D48',
      iconBg: '#FFE4E6',
      title: 'Customer Service',
      subtitle: 'Get help anytime (24/7)',
      badge: 1,
      action: () => {
        if (onOpenSupport) onOpenSupport()
        else if (onShowToast) onShowToast('Connecting to 24/7 VIP Customer Support...')
      }
    },
    {
      id: 'telegram',
      icon: Send,
      iconColor: '#0284C7',
      iconBg: '#E0F2FE',
      title: 'Telegram Bot',
      subtitle: 'Get updates on Telegram',
      action: () => window.open('https://t.me', '_blank')
    },
    {
      id: 'pin',
      icon: ShieldCheck,
      iconColor: '#7C3AED',
      iconBg: '#EDE9FE',
      title: 'PIN',
      subtitle: 'Set up transaction PIN',
      action: () => {
        if (onShowToast) onShowToast('Transaction PIN security is active.')
      }
    },
    {
      id: 'inbox',
      icon: Mail,
      iconColor: '#EA580C',
      iconBg: '#FFEDD5',
      title: 'Inbox',
      subtitle: 'View your messages',
      action: () => {
        if (onShowToast) onShowToast('Inbox: All systems operational. No unread alerts.')
      }
    },
    {
      id: 'contact',
      icon: MessageCircle,
      iconColor: '#16A34A',
      iconBg: '#DCFCE7',
      title: 'Contact us',
      subtitle: "We're here to help",
      action: () => {
        if (onShowToast) onShowToast('HeroPay VIP Support Desk: support@heropay.vip')
      }
    },
    {
      id: 'logout',
      icon: LogOut,
      iconColor: '#DC2626',
      iconBg: '#FEE2E2',
      title: 'Log out',
      subtitle: 'Sign out from your account',
      action: () => setIsLogoutModal(true)
    }
  ]

  const handleRedeemGift = (e) => {
    e.preventDefault()
    if (!giftCode) return
    setGiftRedeemed(true)
    setTimeout(() => {
      setGiftRedeemed(false)
      setIsGiftCodeModal(false)
      setGiftCode('')
    }, 1800)
  }

  return (
    <div className="me-screen-root">
      {/* Header */}
      <header className="me-top-header">
        <div className="me-brand-meta">
          <HeroPayLogo size={36} className="me-brand-logo" />
          <div className="me-brand-text">
            <div className="me-greeting-row">
              <span className="me-greeting-hello">Hello,</span>
              <h1 className="me-greeting-name">{user?.fullName?.split(' ')[0] || 'Hero'}</h1>
              <span className="me-greeting-wave">👋</span>
            </div>
            <p className="me-brand-subtitle">Manage your account and preferences</p>
          </div>
        </div>

        <button
          type="button"
          className="me-notification-btn"
          onClick={() => alert('Notifications: You have 1 unread bonus notification.')}
          aria-label="Notifications"
        >
          <Bell size={18} strokeWidth={2.2} />
          <span className="me-notif-dot" />
        </button>
      </header>

      {/* Hero Profile Card */}
      <div className="me-hero-card" onClick={() => alert('Viewing User Profile...')}>
        <div className="me-hero-left">
          {/* Avatar with edit pencil */}
          <div className="me-avatar-box">
            <div className="me-avatar-circle">
              <div className="me-avatar-head" />
              <div className="me-avatar-torso" />
            </div>
            <div className="me-avatar-edit-badge">
              <Edit2 size={10} color="#FF6810" strokeWidth={2.6} />
            </div>
          </div>

          <div className="me-user-meta">
            <h2 className="me-user-id">{user?._id?.slice(-6).toUpperCase() || '------'}</h2>
            <p className="me-user-phone">Phone: {user?.phone ? user.phone.replace(user.phone.slice(3, -3), '****') : 'Not set'}</p>
            <div className="me-verified-badge">
              <CheckCircle size={12} color="#10B981" strokeWidth={2.6} />
              <span>Verified User</span>
            </div>
          </div>
        </div>

        <div className="me-hero-right">
          <div className="me-crown-art-wrap">
            <div className="me-crown-script">Small<br />Steps<br />Big Rewards</div>
            <div className="me-crown-icon">👑</div>
          </div>
          <ChevronRight size={18} strokeWidth={2.2} className="me-hero-chevron" />
        </div>
      </div>

      {/* Promo Banner: Increase Your Level */}
      <div
        className="me-promo-banner"
        onClick={() => onNavigateTab ? onNavigateTab('team') : alert('Invite friends to raise your level!')}
      >
        <div className="me-banner-text">
          <div className="me-banner-title-1">INCREASE YOUR LEVEL</div>
          <div className="me-banner-title-2">
            TO GET MORE <span className="text-orange">REWARDS</span>
          </div>
          <p className="me-banner-sub">Invite more friends and grow together</p>
        </div>

        <div className="me-banner-right">
          <div className="me-banner-gift-art">
            <div className="me-gift-box">
              <div className="me-ribbon-v" />
              <div className="me-ribbon-h" />
            </div>
            <div className="me-gift-coin" />
            <div className="me-gift-stairs">↗</div>
          </div>

          <div className="me-banner-arrow-btn">
            <ChevronRight size={18} strokeWidth={2.4} />
          </div>
        </div>
      </div>

      {/* Settings & Account Menu List */}
      <div className="me-menu-card">
        {menuItems.map((item, index) => {
          const Icon = item.icon
          const isLast = index === menuItems.length - 1

          return (
            <div
              key={item.id}
              className={`me-menu-item ${isLast ? 'last' : ''}`}
              onClick={item.action}
            >
              <div
                className="me-item-icon-wrap"
                style={{ background: item.iconBg, color: item.iconColor }}
              >
                <Icon size={18} strokeWidth={2.2} />
              </div>

              <div className="me-item-content">
                <h3 className="me-item-title">{item.title}</h3>
                <p className="me-item-subtitle">{item.subtitle}</p>
              </div>

              <div className="me-item-action-wrap">
                {item.badge !== undefined && (
                  <span className="me-item-badge">{item.badge}</span>
                )}
                <ChevronRight size={17} strokeWidth={2.2} className="me-item-chevron" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Gift Code Modal */}
      {isGiftCodeModal && (
        <div className="me-modal-backdrop" onClick={() => setIsGiftCodeModal(false)}>
          <div className="me-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="me-sheet-handle" />
            <div className="me-sheet-header">
              <h3>Redeem Gift Code</h3>
              <button
                type="button"
                className="me-sheet-close"
                onClick={() => setIsGiftCodeModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            {giftRedeemed ? (
              <div className="me-redeem-success">
                <CheckCircle size={44} color="var(--color-success)" />
                <h4>Gift Code Redeemed!</h4>
                <p>50 HeroPay coins have been credited to your balance.</p>
              </div>
            ) : (
              <form onSubmit={handleRedeemGift} className="me-modal-form">
                <p className="me-modal-desc">
                  Enter your promotional code or influencer voucher to claim rewards.
                </p>
                <input
                  type="text"
                  required
                  placeholder="Enter gift code (e.g. HERO50)"
                  value={giftCode}
                  onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                  className="me-modal-input"
                />
                <button type="submit" className="me-modal-submit-btn">
                  Redeem Now
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModal && (
        <div className="me-modal-backdrop" onClick={() => setIsPasswordModal(false)}>
          <div className="me-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="me-sheet-handle" />
            <div className="me-sheet-header">
              <h3>Change Password</h3>
              <button
                type="button"
                className="me-sheet-close"
                onClick={() => setIsPasswordModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                alert('Password updated successfully!')
                setIsPasswordModal(false)
              }}
              className="me-modal-form"
            >
              <input
                type="password"
                required
                placeholder="Current password"
                className="me-modal-input"
              />
              <input
                type="password"
                required
                placeholder="New password (min 8 chars)"
                className="me-modal-input"
              />
              <button type="submit" className="me-modal-submit-btn">
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {isLogoutModal && (
        <div className="me-modal-backdrop" onClick={() => setIsLogoutModal(false)}>
          <div className="me-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="me-sheet-handle" />
            <div className="me-sheet-header">
              <h3>Sign Out</h3>
              <button
                type="button"
                className="me-sheet-close"
                onClick={() => setIsLogoutModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p className="me-modal-desc" style={{ marginBottom: '18px' }}>
              Are you sure you want to log out of your HeroPay account?
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="me-modal-cancel-btn"
                onClick={() => setIsLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="me-modal-logout-btn"
                onClick={() => {
                  setIsLogoutModal(false)
                  if (onLogout) onLogout()
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
