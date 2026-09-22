import React, { useState, useEffect, useRef } from 'react'
import {
  ChevronLeft,
  Copy,
  Check,
  Building2,
  Smartphone,
  ShieldCheck,
  Clock,
  UploadCloud,
  FileText,
  AlertCircle,
  X,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
  XCircle
} from 'lucide-react'
import RewardCoin from '../components/RewardCoin'
import HeroPayLogo from '../components/HeroPayLogo'
import { useLockScroll } from '../hooks/useLockScroll'
import './PaymentGatewayScreen.css'
import { AUTO_APPROVE_MINUTES, commissionLabel } from '../config'

export default function PaymentGatewayScreen({
  order,
  onBack,
  onSubmitProof,
  onShowToast,
  onCancelOrder
}) {
  const getInitialSeconds = () => {
    if (order?.autoApproveAt) {
      const remaining = Math.floor((new Date(order.autoApproveAt).getTime() - Date.now()) / 1000)
      return Math.max(0, remaining)
    }
    return AUTO_APPROVE_MINUTES * 60
  }

  const [copiedField, setCopiedField] = useState(null)
  const [timeLeft, setTimeLeft] = useState(getInitialSeconds)
  const [isProofModalOpen, setIsProofModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [utrNumber, setUtrNumber] = useState('')
  const [screenshotPreview, setScreenshotPreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState('')
  const fileInputRef = useRef(null)

  // Payment config fetched live from MongoDB or from saved order
  const [payConfig, setPayConfig] = useState(order?.paymentAccount || null)
  const [isLoadingConfig, setIsLoadingConfig] = useState(!order?.paymentAccount)

  // Compute method availability cleanly
  const methodType = payConfig?.methodType || (
    payConfig?.upiId && !payConfig?.accountNumber ? 'upi' :
    payConfig?.accountNumber && !payConfig?.upiId ? 'bank' :
    payConfig?.upiId && payConfig?.accountNumber ? 'both' :
    (order?.paymentAccount?.methodType || null)
  )

  const hasUpi = methodType !== 'bank' && Boolean(payConfig?.upiId && payConfig.upiId.trim() !== '')
  const hasBank = methodType !== 'upi' && Boolean(payConfig?.accountNumber && payConfig.accountNumber.trim() !== '' && payConfig.accountNumber !== '—')

  const isUpiOnly = methodType === 'upi' || (hasUpi && !hasBank)
  const isBankOnly = methodType === 'bank' || (hasBank && !hasUpi)
  const isBoth = (methodType === 'both' || (!methodType && hasBank && hasUpi)) && hasBank && hasUpi

  const [paymentMethod, setPaymentMethod] = useState(() => {
    const acc = order?.paymentAccount
    if (acc?.methodType === 'upi' || (acc?.upiId && !acc?.accountNumber)) return 'upi'
    return 'bank'
  })

  useLockScroll(isProofModalOpen || isCancelModalOpen)

  // Fetch payment config from backend if not already attached to order
  useEffect(() => {
    if (order?.paymentAccount) {
      setPayConfig(order.paymentAccount)
      setIsLoadingConfig(false)
      if (order.paymentAccount.methodType === 'upi' || (order.paymentAccount.upiId && !order.paymentAccount.accountNumber)) {
        setPaymentMethod('upi')
      } else {
        setPaymentMethod('bank')
      }
      return
    }
    setIsLoadingConfig(true)
    fetch('/api/admin/payment-config')
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setPayConfig(data)
          if (data.methodType === 'upi' || (data.upiId && !data.accountNumber)) {
            setPaymentMethod('upi')
          } else if (data.methodType === 'bank' || (data.accountNumber && !data.upiId)) {
            setPaymentMethod('bank')
          }
        }
        setIsLoadingConfig(false)
      })
      .catch(() => {
        setIsLoadingConfig(false)
      })
  }, [order?.paymentAccount])

  // Sync remaining time when order changes
  useEffect(() => {
    if (order?.autoApproveAt) {
      const remaining = Math.max(0, Math.floor((new Date(order.autoApproveAt).getTime() - Date.now()) / 1000))
      setTimeLeft(remaining)
    }
  }, [order?.autoApproveAt])

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Safe fallback if order is null
  const safeOrder = order || {
    pkg: { range: '2000 - 2999' },
    assignedAmount: 2850.00,
    commission: 276.75,
    totalCoins: 3126.75
  }

  // Keep paymentMethod synced with mode
  useEffect(() => {
    if (isUpiOnly) {
      setPaymentMethod('upi')
    } else if (isBankOnly) {
      setPaymentMethod('bank')
    }
  }, [isUpiOnly, isBankOnly])

  // Bank details: only shown if bank is supported
  const bankDetails = {
    bankName:      payConfig?.bankName      || '—',
    accountNumber: payConfig?.accountNumber || '—',
    accountHolder: payConfig?.accountHolder || '—',
    ifscCode:      payConfig?.ifscCode      || '—',
    accountType:   payConfig?.accountType   || 'Current Account',
    branch:        payConfig?.bankBranch    || '—'
  }

  const upiDetails = {
    upiId:        payConfig?.upiId        || '',
    payeeName:    payConfig?.upiPayeeName || 'HeroPay',
    merchantCode: 'HEROPAY-PAY'
  }

  const handleCopy = (text, fieldKey, label) => {
    navigator.clipboard?.writeText?.(text)
    setCopiedField(fieldKey)
    if (onShowToast) {
      onShowToast(`Copied ${label} to clipboard!`)
    }
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setValidationError('File size should be under 10MB')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        setScreenshotPreview(reader.result)
        setValidationError('')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e) => {
    e?.preventDefault?.()
    const cleanUtr = utrNumber.trim()
    if (!cleanUtr) {
      setValidationError('Please enter your 12-digit UTR or Transaction Reference Number')
      return
    }
    if (cleanUtr.length < 6) {
      setValidationError('Please enter a valid Transaction Reference / UTR Number')
      return
    }
    if (!screenshotPreview) {
      setValidationError('Please upload a screenshot of your successful payment')
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setIsProofModalOpen(false)
      if (onSubmitProof) {
        onSubmitProof({
          utr: cleanUtr,
          screenshot: screenshotPreview,
          order: safeOrder
        })
      }
    }, 900)
  }

  return (
    <div className="payment-gateway-root">
      {/* Top Header */}
      <header className="payment-top-header">
        <button
          type="button"
          className="payment-back-btn"
          onClick={onBack}
          aria-label="Back to Buy packages"
        >
          <ChevronLeft size={22} strokeWidth={2.4} />
        </button>

        <div className="payment-header-title-wrap">
          <h1 className="payment-header-title">Payment Transfer</h1>
          <div className="payment-secure-badge">
            <ShieldCheck size={13} color="#10B981" />
            <span>256-bit Encrypted</span>
          </div>
        </div>

        {/* Live Urgency Countdown Timer */}
        <div className="payment-timer-capsule" title="Payment window expires in">
          <Clock size={13} className="timer-icon" />
          <span>{formatTimer(timeLeft)}</span>
        </div>
      </header>

      {/* Main Viewport */}
      <div className="payment-content-viewport">
        {/* Payable Order Hero Card */}
        <div className="payment-order-hero-card">
          <div className="payment-hero-bg-glow" />
          <div className="payment-hero-top-row">
            <span className="payment-order-label">Assigned Payable Amount</span>
            <span className="payment-pkg-tag">{safeOrder.pkg.range} Coins</span>
          </div>

          <div className="payment-hero-amount-row">
            <span className="payment-currency-symbol">₹</span>
            <span className="payment-amount-digits">
              {safeOrder.assignedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="payment-hero-yield-banner">
            <div className="payment-yield-left">
              <span className="yield-label">Income Yield ({commissionLabel})</span>
              <strong className="yield-value">+{safeOrder.commission.toFixed(2)} Hero-Coins</strong>
            </div>
            <div className="payment-yield-divider" />
            <div className="payment-yield-right">
              <span className="yield-label">Total Credited on Approval</span>
              <div className="total-coins-row">
                <RewardCoin size={15} />
                <strong>+{safeOrder.totalCoins.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Method Switcher Tabs (Only shown if BOTH Bank and UPI are configured) */}
        {isBoth && (
          <div className="payment-methods-tabs">
            <button
              type="button"
              className={`payment-method-tab ${paymentMethod === 'bank' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('bank')}
            >
              <Building2 size={16} />
              <span>Bank Account</span>
            </button>

            <button
              type="button"
              className={`payment-method-tab ${paymentMethod === 'upi' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('upi')}
            >
              <Smartphone size={16} />
              <span>UPI Transfer</span>
            </button>
          </div>
        )}

        {/* Method Content Card */}
        {isLoadingConfig && !payConfig ? (
          <div className="payment-details-card payment-details-loading">
            <div className="payment-config-spinner" />
            <span>Fetching payment account details...</span>
          </div>
        ) : (isUpiOnly || (isBoth && paymentMethod === 'upi')) ? (
          <div className="payment-details-card upi-card-active">
            <div className="payment-card-banner upi-banner">
              <Smartphone size={18} color="#FF5000" />
              <span>Direct Instant UPI Payment</span>
            </div>

            {/* UPI ID Row with Copy */}
            <div className="payment-fields-list">
              <div className="payment-field-row">
                <div className="field-info">
                  <span className="field-label">Official UPI VPA ID</span>
                  <span className="field-value highlight">{upiDetails.upiId}</span>
                </div>
                <button
                  type="button"
                  className={`copy-action-btn ${copiedField === 'upi' ? 'copied' : ''}`}
                  onClick={() => handleCopy(upiDetails.upiId, 'upi', 'UPI ID')}
                >
                  {copiedField === 'upi' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedField === 'upi' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Payee Name (if available) */}
              {upiDetails.payeeName && (
                <div className="payment-field-row">
                  <div className="field-info">
                    <span className="field-label">Payee / Merchant Name</span>
                    <span className="field-value">{upiDetails.payeeName}</span>
                  </div>
                  <button
                    type="button"
                    className={`copy-action-btn ${copiedField === 'payee' ? 'copied' : ''}`}
                    onClick={() => handleCopy(upiDetails.payeeName, 'payee', 'Payee Name')}
                  >
                    {copiedField === 'payee' ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedField === 'payee' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* 1-Tap Pay via UPI App Button (Mobile Intent) */}
            {upiDetails.upiId && (
              <a
                href={`upi://pay?pa=${encodeURIComponent(upiDetails.upiId)}&pn=${encodeURIComponent(upiDetails.payeeName || 'HeroPay')}&am=${safeOrder.assignedAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('HeroPay Order ' + (safeOrder.txId || safeOrder.id || ''))}`}
                className="payment-open-upi-btn"
              >
                <Smartphone size={16} />
                <span>Open in UPI App (GPay / PhonePe / Paytm)</span>
              </a>
            )}

            {/* Supported UPI Apps Row */}
            <div className="payment-upi-apps-row">
              <span className="upi-apps-label">Pay using any UPI App:</span>
              <div className="upi-apps-badges">
                <span className="upi-badge-chip">Google Pay</span>
                <span className="upi-badge-chip">PhonePe</span>
                <span className="upi-badge-chip">Paytm</span>
                <span className="upi-badge-chip">BHIM UPI</span>
                <span className="upi-badge-chip">Cred</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="payment-details-card bank-card-active">
            <div className="payment-card-banner">
              <Building2 size={18} color="#FF5000" />
              <span>Official HeroPay Beneficiary Account</span>
            </div>

            <div className="payment-fields-list">
              {/* Account Number */}
              <div className="payment-field-row">
                <div className="field-info">
                  <span className="field-label">Bank Account Number</span>
                  <span className="field-value highlight">{bankDetails.accountNumber}</span>
                </div>
                <button
                  type="button"
                  className={`copy-action-btn ${copiedField === 'acc' ? 'copied' : ''}`}
                  onClick={() => handleCopy(bankDetails.accountNumber, 'acc', 'Account Number')}
                >
                  {copiedField === 'acc' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedField === 'acc' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* IFSC Code */}
              <div className="payment-field-row">
                <div className="field-info">
                  <span className="field-label">IFSC Code</span>
                  <span className="field-value highlight">{bankDetails.ifscCode}</span>
                </div>
                <button
                  type="button"
                  className={`copy-action-btn ${copiedField === 'ifsc' ? 'copied' : ''}`}
                  onClick={() => handleCopy(bankDetails.ifscCode, 'ifsc', 'IFSC Code')}
                >
                  {copiedField === 'ifsc' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedField === 'ifsc' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Beneficiary Name */}
              <div className="payment-field-row">
                <div className="field-info">
                  <span className="field-label">Account Holder Name</span>
                  <span className="field-value">{bankDetails.accountHolder}</span>
                </div>
                <button
                  type="button"
                  className={`copy-action-btn ${copiedField === 'name' ? 'copied' : ''}`}
                  onClick={() => handleCopy(bankDetails.accountHolder, 'name', 'Account Holder Name')}
                >
                  {copiedField === 'name' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedField === 'name' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Bank Name & Type */}
              <div className="payment-field-row">
                <div className="field-info">
                  <span className="field-label">Bank Name</span>
                  <span className="field-value">{bankDetails.bankName} ({bankDetails.accountType})</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3 Step Instruction Guide */}
        <div className="payment-instructions-card">
          <h4 className="instructions-title">Steps to Complete Your Order:</h4>
          <ol className="instructions-list">
            <li>
              <strong>Transfer Exact Amount:</strong> Pay <strong>₹{safeOrder.assignedAmount.toLocaleString('en-IN')}</strong> using the {isUpiOnly ? 'UPI ID' : (isBankOnly ? 'Bank Account' : 'details')} above.
            </li>
            <li>
              <strong>Note the UTR / Ref Number:</strong> Copy the 12-digit transaction ID from your {isUpiOnly ? 'UPI app' : 'banking or UPI'} receipt.
            </li>
            <li>
              <strong>Submit Proof Below:</strong> Enter your UTR and upload the payment screenshot to place your order in <strong>Pending Verification</strong>.
            </li>
          </ol>
        </div>
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="payment-floating-footer">
        <button
          type="button"
          className="payment-confirm-action-btn"
          onClick={() => setIsProofModalOpen(true)}
        >
          <span>Confirm Payment (Submit Proof)</span>
          <ExternalLink size={16} />
        </button>
        <button
          type="button"
          className="payment-cancel-order-btn"
          onClick={() => setIsCancelModalOpen(true)}
        >
          <XCircle size={15} />
          <span>Cancel This Order</span>
        </button>
      </div>

      {/* Payment Proof Submission Modal Sheet */}
      {isProofModalOpen && (
        <div className="payment-modal-backdrop" onClick={() => setIsProofModalOpen(false)}>
          <div className="payment-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="payment-sheet-handle" />

            <div className="payment-sheet-header">
              <div className="payment-sheet-title-box">
                <h3>Submit Payment Proof</h3>
                <p>Order Amount: ₹{safeOrder.assignedAmount.toLocaleString('en-IN')} ({safeOrder.pkg.range} Coins)</p>
              </div>
              <button
                type="button"
                className="payment-sheet-close-btn"
                onClick={() => setIsProofModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="payment-proof-form">
              {/* Validation Error Message */}
              {validationError && (
                <div className="payment-form-error">
                  <AlertCircle size={15} />
                  <span>{validationError}</span>
                </div>
              )}

              {/* 1. UTR / Ref Number Input */}
              <div className="payment-input-group">
                <label className="payment-input-label">
                  <span>12-Digit UTR / Transaction Reference No.</span>
                  <span className="required-star">*</span>
                </label>
                <div className="payment-input-wrapper">
                  <input
                    type="text"
                    className="payment-text-input"
                    placeholder="e.g. 425983719012"
                    value={utrNumber}
                    onChange={(e) => {
                      setUtrNumber(e.target.value.replace(/[^0-9A-Za-z]/g, ''))
                      setValidationError('')
                    }}
                    maxLength={18}
                  />
                  {utrNumber.length >= 10 ? (
                    <span className="utr-valid-check">
                      <CheckCircle2 size={16} color="#10B981" />
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="utr-paste-btn"
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText()
                          if (text) setUtrNumber(text.trim())
                        } catch (err) {}
                      }}
                    >
                      Paste
                    </button>
                  )}
                </div>
                <span className="payment-field-hint">
                  Found on your GPay, PhonePe, Paytm, or NetBanking receipt.
                </span>
              </div>

              {/* 2. Payment Screenshot Upload */}
              <div className="payment-input-group">
                <label className="payment-input-label">
                  <span>Upload Payment Screenshot</span>
                  <span className="required-star">*</span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                {screenshotPreview ? (
                  <div className="screenshot-preview-card">
                    <img src={screenshotPreview} alt="Payment Receipt" className="screenshot-img" />
                    <div className="screenshot-meta">
                      <span className="screenshot-status">
                        <CheckCircle2 size={14} color="#10B981" />
                        Screenshot Attached
                      </span>
                      <button
                        type="button"
                        className="screenshot-change-btn"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="screenshot-dropzone"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud size={28} className="dropzone-icon" />
                    <span className="dropzone-title">Tap to upload receipt screenshot</span>
                    <span className="dropzone-sub">Supports JPG, PNG (Max 10MB)</span>
                  </div>
                )}
              </div>

              {/* Notice */}
              <div className="payment-pending-notice">
                <Clock size={16} color="#F59E0B" className="notice-icon" />
                <p>
                  Your order will be placed in <strong>Pending State</strong>. Hero-Coins will be credited automatically once payment verification is completed.
                </p>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="payment-submit-proof-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Submitting Proof...</span>
                ) : (
                  <span>Submit Payment Proof</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal Sheet */}
      {isCancelModalOpen && (
        <div className="payment-modal-backdrop" onClick={() => setIsCancelModalOpen(false)}>
          <div className="payment-cancel-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="payment-sheet-handle" />
            <div className="payment-cancel-modal-body">
              <div className="payment-cancel-icon-wrap">
                <AlertTriangle size={32} color="#EF4444" />
              </div>
              <h3 className="payment-cancel-title">Cancel This Order?</h3>
              <p className="payment-cancel-desc">
                Are you sure you want to cancel order <strong>#{safeOrder.txId || safeOrder.id || ''}</strong>?
              </p>
              <div className="payment-cancel-order-summary">
                <div className="summary-row">
                  <span>Assigned Amount:</span>
                  <strong>₹{safeOrder.assignedAmount.toLocaleString('en-IN')}</strong>
                </div>
                <div className="summary-row">
                  <span>Package:</span>
                  <span>{safeOrder.pkg.range} Coins</span>
                </div>
              </div>
              <p className="payment-cancel-subdesc">
                This pending order will be terminated and marked as cancelled. You can create a new order anytime.
              </p>
              <div className="payment-cancel-actions">
                <button
                  type="button"
                  className="payment-cancel-btn-keep"
                  onClick={() => setIsCancelModalOpen(false)}
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  className="payment-cancel-btn-confirm"
                  onClick={() => {
                    setIsCancelModalOpen(false)
                    if (onCancelOrder) onCancelOrder(safeOrder)
                  }}
                >
                  Yes, Cancel Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
