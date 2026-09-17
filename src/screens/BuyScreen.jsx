import React, { useState } from 'react'
import {
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Sparkles,
  CheckCircle,
  ShieldCheck,
  Zap,
  Lock,
  HelpCircle,
  Calculator,
  ArrowRight,
  X
} from 'lucide-react'
import RewardCoin from '../components/RewardCoin'
import HeroPayLogo from '../components/HeroPayLogo'
import { useLockScroll } from '../hooks/useLockScroll'
import './BuyScreen.css'
import { calcCommission, calcTotalCoins, commissionLabel, MAX_STOCK_AMOUNT, MIN_ORDER_AMOUNT } from '../config'

export default function BuyScreen({
  balance = 0,
  packagesStock,
  onProceedToPayment,
  onBuyOrderSuccess,
  onShowToast,
  onRefreshStock
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeOrder, setActiveOrder] = useState(null)
  const [isSuccessModal, setIsSuccessModal] = useState(false)
  const [customAmount, setCustomAmount] = useState('2500')
  const [openFaqIndex, setOpenFaqIndex] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefreshStock = () => {
    setIsRefreshing(true)
    if (onRefreshStock) {
      onRefreshStock()
    }
    if (onShowToast) {
      onShowToast('Stock units refreshed with live market inventory!')
    }
    setTimeout(() => {
      setIsRefreshing(false)
    }, 600)
  }

  // Lock background scroll when modal is open
  useLockScroll(Boolean(activeOrder) || isSuccessModal)

  const categories = ['All', 'Popular', 'High Value', 'Custom']

  // Helper to pick a random clean amount within range (e.g. 2850 for 2000 - 2999)
  const getAssignedAmount = (rangeStr) => {
    const cleanStr = String(rangeStr).replace(/,/g, '')
    const parts = cleanStr.split('-').map((s) => parseInt(s.trim().replace(/[^0-9]/g, ''), 10))
    const min = parts[0] || 1000
    const max = parts[1] || min
    const diff = max - min
    if (diff <= 0) return min
    const step = diff >= 500 ? 50 : 10
    const totalSteps = Math.floor(diff / step)
    const randomStep = Math.floor(Math.random() * (totalSteps + 1))
    return min + randomStep * step
  }

  // Realistic package catalog: Stock units available up to 9,000; strictly 0 for packages > 9,000
  const basePackages = [
    { id: 1,  range: '500 - 999',       defaultCount: 12, income: commissionLabel, defaultAmount: 523.50,   categories: ['All', 'Popular'] },
    { id: 2,  range: '1000 - 1999',     defaultCount: 28, income: commissionLabel, defaultAmount: 1041.00,  categories: ['All', 'Popular'] },
    { id: 3,  range: '2000 - 2999',     defaultCount: 16, income: commissionLabel, defaultAmount: 2076.00,  categories: ['All', 'Popular'] },
    { id: 4,  range: '3000 - 4999',     defaultCount: 9,  income: commissionLabel, defaultAmount: 3111.00,  categories: ['All', 'Popular'] },
    { id: 5,  range: '5000 - 7499',     defaultCount: 14, income: commissionLabel, defaultAmount: 5181.00,  categories: ['All', 'Popular'] },
    { id: 6,  range: '7500 - 9999',     defaultCount: 8,  income: commissionLabel, defaultAmount: 7768.50,  categories: ['All', 'Popular'] },
    // Packages > 9,000 have stock strictly set to 0
    { id: 7,  range: '10000 - 14999',   defaultCount: 0,  income: commissionLabel, defaultAmount: 10356.00, categories: ['All', 'Popular', 'High Value'] },
    { id: 8,  range: '15000 - 24999',   defaultCount: 0,  income: commissionLabel, defaultAmount: 15531.00, categories: ['All', 'Popular', 'High Value'] },
    { id: 9,  range: '25000 - 34999',   defaultCount: 0,  income: commissionLabel, defaultAmount: 25960.00, categories: ['All', 'High Value'] },
    { id: 10, range: '35000 - 49999',   defaultCount: 0,  income: commissionLabel, defaultAmount: 36342.00, categories: ['All', 'High Value'] },
    { id: 11, range: '50000 - 59999',   defaultCount: 0,  income: commissionLabel, defaultAmount: 52020.00, categories: ['All', 'High Value'] },
    { id: 12, range: '60000 - 75000',   defaultCount: 0,  income: commissionLabel, defaultAmount: 62425.00, categories: ['All', 'High Value'] }
  ]

  // Map packages with live stock state
  const packages = basePackages.map((pkg) => {
    const liveCount = packagesStock && packagesStock[pkg.id] !== undefined
      ? packagesStock[pkg.id]
      : pkg.defaultCount
    return {
      ...pkg,
      count: liveCount,
      amount: pkg.defaultAmount
    }
  })

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch = pkg.range.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pkg.amount.toString().includes(searchQuery)
    if (!matchesSearch) return false
    if (activeCategory === 'All') return true
    if (activeCategory === 'Custom') return true
    return pkg.categories.includes(activeCategory)
  })

  const handleBuyClick = (pkg) => {
    if (pkg.count <= 0) {
      if (onShowToast) {
        onShowToast('Stock is 0 for this package! Available up to 9,000 only.')
      } else {
        alert('Stock is 0 for this package! Available up to 9,000 only.')
      }
      return
    }

    // Pick random assigned amount within range e.g. 2850 for 2000 - 2999
    const assignedAmount = getAssignedAmount(pkg.range)
    const commission = calcCommission(assignedAmount)
    const totalCoins = calcTotalCoins(assignedAmount)

    setActiveOrder({
      pkg,
      assignedAmount,
      commission,
      totalCoins
    })
  }

  const handleBuyCustom = () => {
    let numericAmount = parseFloat(customAmount) || MIN_ORDER_AMOUNT
    if (numericAmount > MAX_STOCK_AMOUNT) {
      if (onShowToast) onShowToast(`Orders above ₹${MAX_STOCK_AMOUNT.toLocaleString('en-IN')} have 0 stock right now!`)
      numericAmount = MAX_STOCK_AMOUNT
      setCustomAmount(String(MAX_STOCK_AMOUNT))
    }
    if (numericAmount < MIN_ORDER_AMOUNT) {
      numericAmount = MIN_ORDER_AMOUNT
      setCustomAmount(String(MIN_ORDER_AMOUNT))
    }
    const commission = calcCommission(numericAmount)
    const totalCoins = calcTotalCoins(numericAmount)

    setActiveOrder({
      pkg: {
        id: 'custom-' + Date.now(),
        range: `Custom ₹${numericAmount.toLocaleString('en-IN')}`,
        count: 1,
        income: '9.5% + 6',
        amount: numericAmount,
        isCustom: true
      },
      assignedAmount: numericAmount,
      commission,
      totalCoins
    })
  }

  const confirmPurchase = () => {
    if (!activeOrder) return

    if (onProceedToPayment) {
      const orderCopy = { ...activeOrder }
      setActiveOrder(null)
      onProceedToPayment(orderCopy)
      return
    }

    // Fallback if no payment gateway handler
    setIsSuccessModal(true)
    if (onBuyOrderSuccess) {
      onBuyOrderSuccess({
        pkg: activeOrder.pkg,
        assignedAmount: activeOrder.assignedAmount,
        commission: activeOrder.commission,
        totalCoins: activeOrder.totalCoins
      })
    }

    setTimeout(() => {
      setIsSuccessModal(false)
      setActiveOrder(null)
    }, 1400)
  }

  const quickCustomPresets = [500, 1000, 2500, 5000, 7500, 9000]

  const faqs = [
    {
      q: 'How quickly are Hero-Coins credited?',
      a: 'Coins are credited instantly within 60 seconds after your UPI or USDT transaction is verified by our automated system.'
    },
    {
      q: 'How does daily income (9.5% + 6) work?',
      a: 'Your active Hero-Coins generate 9.5% base return plus an additional 6 Hero-Coins reward credited directly to your balance daily.'
    },
    {
      q: 'Is my payment protected?',
      a: 'Yes, 100% of transactions are covered under HeroPay Escrow Buyer Guarantee. Funds remain secure until your coins are confirmed.'
    }
  ]

  return (
    <div className="buy-screen-root">
      {/* Screen Header */}
      <header className="buy-top-header">
        <div className="buy-brand-meta">
          <HeroPayLogo size={36} className="buy-brand-logo" />
          <div className="buy-brand-text">
            <h1 className="buy-brand-title">Buy</h1>
            <p className="buy-brand-subtitle">Purchase Coins Instantly</p>
          </div>
        </div>

        {/* User Balance Capsule */}
        <div className="buy-balance-capsule">
          <div className="buy-coin-icon-mini">
            <span>H</span>
          </div>
          <span className="buy-balance-value">{Number(balance).toFixed(2)}</span>
        </div>
      </header>

      {/* Search, Filter & Live Controls Section */}
      <div className="buy-filter-section">
        <div className="buy-search-row">
          <div className="buy-search-box">
            <Search size={18} strokeWidth={2.2} className="buy-search-icon" />
            <input
              type="text"
              className="buy-search-input"
              placeholder="Search coin packages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="buy-search-clear"
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="buy-actions-cluster">
            <button
              type="button"
              className="buy-filter-btn"
              onClick={() => {
                if (onShowToast) {
                  onShowToast('Showing all active packages')
                } else {
                  alert('Showing all active packages')
                }
              }}
              title="Filter Packages"
              aria-label="Filter packages"
            >
              <Filter size={18} strokeWidth={2.2} />
            </button>

            <button
              type="button"
              className={`buy-refresh-btn ${isRefreshing ? 'is-spinning' : ''}`}
              onClick={handleRefreshStock}
              title="Refresh Stock Units (Random Live Inventory)"
              aria-label="Refresh stock units"
            >
              <RefreshCw size={17} strokeWidth={2.2} className={isRefreshing ? 'spin-icon' : ''} />
            </button>
          </div>
        </div>

        {/* Category Horizontal Pill Tabs inside Filter Section */}
        <div className="buy-category-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`buy-category-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Custom Calculator (Visible when Custom is active) */}
      {activeCategory === 'Custom' && (
        <div className="buy-custom-calculator-card">
          <div className="buy-calc-header">
            <div className="buy-calc-title-row">
              <Calculator size={18} color="var(--color-primary)" />
              <span className="buy-calc-title">Custom Coin Calculator</span>
            </div>
            <span className="buy-calc-rate-badge">+9.5% + 6 Income</span>
          </div>

          <div className="buy-calc-input-box">
            <span className="buy-calc-currency">₹</span>
            <input
              type="number"
              className="buy-calc-input"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Enter amount (500 - 9,000)"
              min="500"
              max="9000"
            />
            <RewardCoin size={16} />
          </div>

          <div className="buy-calc-presets">
            {quickCustomPresets.map((amt) => (
              <button
                key={amt}
                type="button"
                className={`buy-preset-chip ${customAmount === amt.toString() ? 'selected' : ''}`}
                onClick={() => setCustomAmount(amt.toString())}
              >
                ₹{amt >= 1000 ? `${amt / 1000}k` : amt}
              </button>
            ))}
          </div>

          <div className="buy-calc-summary-row">
            <div className="buy-calc-stat">
              <span className="buy-calc-stat-label">Estimated Daily Return (9.5% + 6)</span>
              <span className="buy-calc-stat-val">
                +{(parseFloat(customAmount || 0) * 0.095 + 6).toFixed(2)} Hero-Coins
              </span>
            </div>
            <button
              type="button"
              className="buy-calc-buy-btn"
              onClick={handleBuyCustom}
            >
              <span>Buy Now</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Coin Packages List */}
      <div className="buy-packages-list">
        {filteredPackages.map((pkg) => (
          <div key={pkg.id} className="buy-package-card">
            {/* Left: Coin & Range */}
            <div className="buy-pkg-left">
              <div className="buy-pkg-coin">
                <span>H</span>
              </div>

              <div className="buy-pkg-info">
                <div className="buy-pkg-range-row">
                  <span className="buy-pkg-range">{pkg.range}</span>
                  <span className={`buy-pkg-badge ${pkg.count === 0 ? 'out-of-stock' : ''}`}>
                    {pkg.count}
                  </span>
                </div>
                <span className="buy-pkg-income">Income: {pkg.income}</span>
              </div>
            </div>

            {/* Middle: Amount in selective royal indigo */}
            <div className="buy-pkg-middle">
              <span className="buy-pkg-amount-label">Amount:</span>
              <div className="buy-pkg-amount-val-row">
                <RewardCoin size={14} />
                <span className="buy-pkg-amount-val">{pkg.amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Right: Buy Button */}
            <div className="buy-pkg-right">
              <button
                type="button"
                className={`buy-pkg-action-btn ${pkg.count === 0 ? 'disabled' : ''}`}
                onClick={() => handleBuyClick(pkg)}
                disabled={pkg.count === 0}
              >
                {pkg.count === 0 ? 'Sold Out' : 'Buy'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Promo Banner: Bigger Purchase Higher Rewards */}
      <div
        className="buy-promo-banner"
        onClick={() => alert('VIP Tier Benefits: Purchases between 50,000 - 75,000 Coins qualify for VIP 4.0% daily dividend!')}
      >
        <div className="buy-banner-gift-art">
          <div className="buy-3d-gift-box">
            <div className="buy-gift-ribbon-v" />
            <div className="buy-gift-ribbon-h" />
            <div className="buy-gift-bow" />
          </div>
          <div className="buy-gift-coin-float" />
        </div>

        <div className="buy-banner-text">
          <div className="buy-banner-headline">
            <span className="headline-dark">Bigger Purchase</span>
            <span className="headline-orange">Higher Rewards!</span>
          </div>
          <p className="buy-banner-sub">Get more coins and unlock more income</p>
        </div>

        <div className="buy-banner-arrow-btn">
          <ChevronRight size={18} strokeWidth={2.4} />
        </div>
      </div>

      {/* Trust & Escrow Guarantee Card */}
      <div className="buy-trust-card">
        <div className="buy-trust-item">
          <div className="buy-trust-icon-box shield">
            <ShieldCheck size={18} />
          </div>
          <div className="buy-trust-info">
            <h4>100% Escrow Protected</h4>
            <p>Funds released only upon verified coin confirmation</p>
          </div>
        </div>

        <div className="buy-trust-divider" />

        <div className="buy-trust-item">
          <div className="buy-trust-icon-box zap">
            <Zap size={18} />
          </div>
          <div className="buy-trust-info">
            <h4>Instant 60s Credit</h4>
            <p>Automated balance deposit via UPI & TRC20</p>
          </div>
        </div>

        <div className="buy-trust-divider" />

        <div className="buy-trust-item">
          <div className="buy-trust-icon-box lock">
            <Lock size={18} />
          </div>
          <div className="buy-trust-info">
            <h4>Bank Grade 256-bit Security</h4>
            <p>Zero fraud guarantee with verified UPI VPA validation</p>
          </div>
        </div>
      </div>

      {/* 3-Step How Buying Works */}
      <div className="buy-steps-section">
        <h3 className="buy-section-title">How Buying Works</h3>
        <div className="buy-steps-grid">
          <div className="buy-step-card">
            <div className="buy-step-num">1</div>
            <span className="buy-step-title">Select Package</span>
            <span className="buy-step-desc">Choose from 500 to 75,000 Hero-Coins</span>
          </div>
          <div className="buy-step-card">
            <div className="buy-step-num">2</div>
            <span className="buy-step-title">Pay with UPI</span>
            <span className="buy-step-desc">GPay, PhonePe, Paytm or USDT</span>
          </div>
          <div className="buy-step-card">
            <div className="buy-step-num">3</div>
            <span className="buy-step-title">Earn Daily</span>
            <span className="buy-step-desc">Receive 9.5% + 6 coins every 24h</span>
          </div>
        </div>
      </div>

      {/* FAQs Section */}
      <div className="buy-faq-section">
        <h3 className="buy-section-title">Frequently Asked Questions</h3>
        <div className="buy-faq-list">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx
            return (
              <div
                key={idx}
                className={`buy-faq-card ${isOpen ? 'open' : ''}`}
                onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
              >
                <div className="buy-faq-question-row">
                  <div className="buy-faq-q-left">
                    <HelpCircle size={15} color="var(--color-primary)" />
                    <span className="buy-faq-question">{faq.q}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`buy-faq-chevron ${isOpen ? 'rotate' : ''}`}
                  />
                </div>
                {isOpen && <p className="buy-faq-answer">{faq.a}</p>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Purchase Confirmation Sheet / Modal */}
      {activeOrder && (
        <div className="buy-modal-backdrop" onClick={() => setActiveOrder(null)}>
          <div className="buy-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="buy-sheet-drag-handle" />

            {isSuccessModal ? (
              <div className="buy-sheet-success">
                <CheckCircle size={48} color="var(--color-success)" strokeWidth={2} />
                <h3>Order Submitted!</h3>
                <p style={{ marginTop: '6px', fontSize: '13px', color: '#64748B' }}>
                  Assigned: <strong>₹{activeOrder.assignedAmount.toLocaleString('en-IN')}</strong> • Commission: <strong>+{activeOrder.commission.toFixed(2)}</strong>
                </p>
                <div style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '6px 14px', borderRadius: '20px', fontWeight: '700', fontSize: '13px' }}>
                  <RewardCoin size={15} />
                  <span>+{activeOrder.totalCoins.toFixed(2)} Hero-Coins Credited!</span>
                </div>
              </div>
            ) : (
              <>
                <div className="buy-sheet-header">
                  <div className="buy-sheet-title-group">
                    <h3>Confirm Buy Order</h3>
                    <p>Package {activeOrder.pkg.range} Coins</p>
                  </div>
                  <button
                    type="button"
                    className="buy-sheet-close"
                    onClick={() => setActiveOrder(null)}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="buy-sheet-summary">
                  <div className="buy-summary-row">
                    <span>Package Range</span>
                    <strong>{activeOrder.pkg.range} Coins</strong>
                  </div>

                  <div className="buy-summary-row">
                    <span>Assigned Order Amount</span>
                    <strong style={{ color: '#0F172A', fontSize: '15px' }}>
                      ₹{activeOrder.assignedAmount.toLocaleString('en-IN')}
                    </strong>
                  </div>

                  <div className="buy-summary-row">
                    <span>Commission (9.5% + ₹6)</span>
                    <strong style={{ color: 'var(--color-success)', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '8px' }}>
                      +{activeOrder.commission.toFixed(2)} Hero-Coins
                    </strong>
                  </div>

                  <div className="buy-summary-row">
                    <span>Available Stock</span>
                    <strong>{activeOrder.pkg.count} units left</strong>
                  </div>

                  <div className="buy-summary-divider" />

                  <div className="buy-summary-row">
                    <span style={{ fontSize: '12.5px', color: '#64748B' }}>You Only Pay:</span>
                    <strong style={{ color: '#FF5000', fontSize: '15px' }}>
                      ₹{activeOrder.assignedAmount.toLocaleString('en-IN')}
                    </strong>
                  </div>

                  <div className="buy-summary-row total">
                    <span>Total Coins Credited</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <RewardCoin size={18} />
                      <strong style={{ color: '#4F46E5', fontSize: '18px' }}>
                        +{activeOrder.totalCoins.toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="buy-sheet-confirm-btn"
                  onClick={confirmPurchase}
                >
                  Proceed to Pay ₹{activeOrder.assignedAmount.toLocaleString('en-IN')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
