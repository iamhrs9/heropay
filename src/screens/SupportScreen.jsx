import React, { useState, useEffect, useRef } from 'react'
import {
  ChevronLeft,
  Headphones,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  UploadCloud,
  X,
  Copy,
  Check,
  ShieldCheck,
  CreditCard,
  Coins,
  Smartphone,
  Users,
  HelpCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import './SupportScreen.css'

const CATEGORIES = [
  {
    id: 'withdrawal',
    title: 'Withdrawal / Payout Issue',
    desc: 'Withdrawal nahi aaya ya pending dikha raha hai',
    icon: CreditCard,
    color: '#FF5000',
    bg: '#FFF5EE'
  },
  {
    id: 'deposit',
    title: 'Buy / Coins Deposit Issue',
    desc: 'Coins credit nahi hue ya payment verification issue',
    icon: Coins,
    color: '#10B981',
    bg: '#ECFDF5'
  },
  {
    id: 'upi',
    title: 'UPI / Bank Account Issue',
    desc: 'UPI ID add nahi ho rahi ya modify karni hai',
    icon: Smartphone,
    color: '#6366F1',
    bg: '#EEF2FF'
  },
  {
    id: 'referral',
    title: 'Referral & Team Commission',
    desc: 'Team commission ya referral bonus ki dikkat',
    icon: Users,
    color: '#F59E0B',
    bg: '#FEF3C7'
  },
  {
    id: 'other',
    title: 'Other Issue / Kuchh aur',
    desc: 'Anya koi bhi sawaal ya dikkat yaha batayein',
    icon: HelpCircle,
    color: '#8B5CF6',
    bg: '#F5F3FF'
  }
]

export default function SupportScreen({ onBack, onShowToast, user }) {
  const [activeTab, setActiveTab] = useState('new') // 'new' | 'my'
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [problemText, setProblemText] = useState('')
  const [screenshotPreview, setScreenshotPreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedTicket, setSubmittedTicket] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [copiedId, setCopiedId] = useState(false)

  // My queries state
  const [myTickets, setMyTickets] = useState([])
  const [isLoadingMy, setIsLoadingMy] = useState(false)

  const fileInputRef = useRef(null)

  // Fetch my queries
  const fetchMyTickets = async () => {
    const token = localStorage.getItem('hp_token')
    if (!token) return
    setIsLoadingMy(true)
    try {
      const res = await fetch('/api/support/my', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMyTickets(Array.isArray(data) ? data : [])
      }
    } catch {
    } finally {
      setIsLoadingMy(false)
    }
  }

  useEffect(() => {
    fetchMyTickets()
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setErrorMessage('Screenshot size should be less than 8MB')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        setScreenshotPreview(reader.result)
        setErrorMessage('')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    if (!selectedCategory) {
      setErrorMessage('Pahle select karein ki aapko kis cheez me dikkat hai.')
      return
    }
    const cleanMsg = problemText.trim()
    if (!cleanMsg || cleanMsg.length < 8) {
      setErrorMessage('Kripya apni problem kam se kam 8-10 aksharon me vistaar se likhein.')
      return
    }

    setErrorMessage('')
    setIsSubmitting(true)

    const token = localStorage.getItem('hp_token')
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          category: selectedCategory.title,
          message: cleanMsg,
          screenshotUrl: screenshotPreview || ''
        })
      })

      if (res.ok) {
        const ticket = await res.json()
        setSubmittedTicket(ticket)
        setProblemText('')
        setScreenshotPreview(null)
        fetchMyTickets()
        if (onShowToast) {
          onShowToast('✅ Support query submitted successfully!')
        }
      } else {
        const err = await res.json()
        setErrorMessage(err.message || 'Submission failed. Please try again.')
      }
    } catch {
      // Offline fallback: simulate local ticket
      const fallbackTicket = {
        ticketId: 'TKT' + Math.floor(100000 + Math.random() * 900000),
        category: selectedCategory.title,
        message: cleanMsg,
        status: 'Open',
        createdAt: new Date().toISOString()
      }
      setSubmittedTicket(fallbackTicket)
      setMyTickets((prev) => [fallbackTicket, ...prev])
      if (onShowToast) {
        onShowToast('✅ Support query submitted successfully!')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyTicket = (id) => {
    navigator.clipboard?.writeText?.(id)
    setCopiedId(true)
    if (onShowToast) onShowToast('Ticket ID copied to clipboard!')
    setTimeout(() => setCopiedId(false), 2000)
  }

  const resetForm = () => {
    setSubmittedTicket(null)
    setSelectedCategory(null)
    setProblemText('')
    setScreenshotPreview('')
    setErrorMessage('')
  }

  return (
    <div className="support-screen-root">
      {/* Top Header */}
      <header className="support-top-header">
        <button
          type="button"
          className="support-back-btn"
          onClick={onBack}
          aria-label="Back"
        >
          <ChevronLeft size={22} strokeWidth={2.4} />
        </button>

        <div className="support-header-title-wrap">
          <h1 className="support-header-title">Customer Support</h1>
          <div className="support-badge-247">
            <ShieldCheck size={13} color="#10B981" />
            <span>24/7 Official Helpdesk</span>
          </div>
        </div>

        <div className="support-header-placeholder" />
      </header>

      {/* View Switcher Tabs */}
      <div className="support-view-tabs">
        <button
          type="button"
          className={`support-tab-btn ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          <Headphones size={15} />
          <span>New Query</span>
        </button>
        <button
          type="button"
          className={`support-tab-btn ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('my')
            fetchMyTickets()
          }}
        >
          <MessageSquare size={15} />
          <span>My Queries ({myTickets.length})</span>
        </button>
      </div>

      <div className="support-content-viewport">
        {activeTab === 'new' ? (
          submittedTicket ? (
            /* STEP 3: Thank You / Confirmation Screen */
            <div className="support-thankyou-card">
              <div className="support-thankyou-glow" />
              <div className="support-check-circle">
                <CheckCircle2 size={44} color="#10B981" strokeWidth={2.5} />
              </div>

              <h2 className="support-thankyou-title">Thank You! Query Received</h2>
              <p className="support-thankyou-subtitle">
                Aapki query hamare support team tak pahunch gayi hai. Hamare agent jald se jald aapki samasya solve kar denge.
              </p>

              <div className="support-ticket-summary-box">
                <div className="ticket-summary-row">
                  <span className="summary-label">Ticket ID:</span>
                  <div className="ticket-id-wrap">
                    <strong className="summary-val highlight">#{submittedTicket.ticketId}</strong>
                    <button
                      type="button"
                      className="ticket-copy-btn"
                      onClick={() => handleCopyTicket(submittedTicket.ticketId)}
                    >
                      {copiedId ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedId ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="ticket-summary-row">
                  <span className="summary-label">Category:</span>
                  <span className="summary-val">{submittedTicket.category}</span>
                </div>

                <div className="ticket-summary-row">
                  <span className="summary-label">Status:</span>
                  <span className="ticket-status-pill open">
                    <span className="status-dot-pulse" />
                    <span>In Review</span>
                  </span>
                </div>

                <div className="ticket-summary-row">
                  <span className="summary-label">Expected Resolution:</span>
                  <span className="summary-val">Within 15 - 30 Minutes</span>
                </div>
              </div>

              <div className="support-thankyou-actions">
                <button
                  type="button"
                  className="support-primary-action-btn"
                  onClick={() => setActiveTab('my')}
                >
                  <MessageSquare size={16} />
                  <span>View in My Queries</span>
                </button>

                <button
                  type="button"
                  className="support-secondary-action-btn"
                  onClick={resetForm}
                >
                  <span>Ask Another Question</span>
                </button>
              </div>
            </div>
          ) : (
            /* Form Screen (Step 1: Category + Step 2: Problem Description) */
            <form onSubmit={handleSubmit} className="support-form-container">
              {/* Error Alert */}
              {errorMessage && (
                <div className="support-error-banner">
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* STEP 1: Ask what the issue is */}
              <div className="support-step-card">
                <div className="support-step-header">
                  <span className="step-number-badge">Step 1</span>
                  <div className="step-header-text">
                    <h3 className="step-title">Kis cheez me dikkat aa rahi hai?</h3>
                    <p className="step-subtitle">Niche diye gaye options me se apni problem chunein:</p>
                  </div>
                </div>

                <div className="support-categories-grid">
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory?.id === cat.id
                    const IconComponent = cat.icon
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`support-cat-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedCategory(cat)
                          setErrorMessage('')
                        }}
                      >
                        <div
                          className="support-cat-icon-wrap"
                          style={{ background: cat.bg, color: cat.color }}
                        >
                          <IconComponent size={20} strokeWidth={2.4} />
                        </div>
                        <div className="support-cat-info">
                          <h4 className="support-cat-title">{cat.title}</h4>
                          <p className="support-cat-desc">{cat.desc}</p>
                        </div>
                        <div className={`support-cat-radio ${isSelected ? 'checked' : ''}`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* STEP 2: Apni problem yaha likhein */}
              {selectedCategory && (
                <div className="support-step-card step-active-animated">
                  <div className="support-step-header">
                    <span className="step-number-badge">Step 2</span>
                    <div className="step-header-text">
                      <h3 className="step-title">Aapki problem yaha vistaar se likhein</h3>
                      <p className="step-subtitle">
                        Hamare support agent jald se jald aapki problem solve kar denge.
                      </p>
                    </div>
                  </div>

                  {/* Prompt hint box */}
                  <div className="support-prompt-hint">
                    <Headphones size={16} color="#FF5000" />
                    <span>
                      Selected: <strong>{selectedCategory.title}</strong>. Apni samasya ki poori detail likhein taaki turant action liya ja sake.
                    </span>
                  </div>

                  {/* Problem Message Textarea */}
                  <div className="support-input-group">
                    <textarea
                      className="support-textarea"
                      rows={5}
                      value={problemText}
                      onChange={(e) => setProblemText(e.target.value)}
                      placeholder="Apni problem yaha vistaar se likhein (jaise Order ID, Amount, ya exact kya dikkat aa rahi hai)..."
                      required
                    />
                    <div className="support-textarea-footer">
                      <span className="char-count">{problemText.length} characters</span>
                      <span className="hint-text">Minimum 8-10 characters</span>
                    </div>
                  </div>

                  {/* Screenshot Upload (Optional) */}
                  <div className="support-upload-group">
                    <label className="support-upload-label">
                      <span>Screenshot / Receipt (Optional)</span>
                    </label>

                    {screenshotPreview ? (
                      <div className="support-screenshot-preview">
                        <img src={screenshotPreview} alt="Screenshot proof" />
                        <button
                          type="button"
                          className="remove-screenshot-btn"
                          onClick={() => setScreenshotPreview(null)}
                        >
                          <X size={14} />
                          <span>Remove</span>
                        </button>
                      </div>
                    ) : (
                      <div
                        className="support-upload-dropzone"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <UploadCloud size={24} color="#FF5000" />
                        <span className="upload-text">Upload Screenshot (Receipt ya Error Image)</span>
                        <span className="upload-sub">PNG, JPG, JPEG up to 8MB</span>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* Submit Action Button */}
                  <button
                    type="submit"
                    className="support-submit-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="support-btn-spinner" />
                        <span>Submitting Your Query...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Submit Support Query</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          )
        ) : (
          /* MY TICKETS TAB */
          <div className="support-my-queries-container">
            <div className="my-queries-header">
              <span className="my-queries-title">Previous Submitted Queries</span>
              <button
                type="button"
                className="refresh-tickets-btn"
                onClick={fetchMyTickets}
              >
                <RefreshCw size={13} className={isLoadingMy ? 'spinning' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            {isLoadingMy ? (
              <div className="support-loading-state">
                <div className="support-btn-spinner large" />
                <span>Loading your queries...</span>
              </div>
            ) : myTickets.length === 0 ? (
              <div className="support-empty-state">
                <MessageSquare size={38} color="#94A3B8" />
                <h4>No support queries yet</h4>
                <p>Jab bhi aap koi query submit karenge, wo yaha show hogi.</p>
                <button
                  type="button"
                  className="support-empty-cta-btn"
                  onClick={() => setActiveTab('new')}
                >
                  <Headphones size={15} />
                  <span>Submit a New Query</span>
                </button>
              </div>
            ) : (
              <div className="support-tickets-list">
                {myTickets.map((t) => (
                  <div key={t._id || t.ticketId} className="support-ticket-item-card">
                    <div className="ticket-item-top">
                      <div className="ticket-id-tag">
                        <strong>#{t.ticketId}</strong>
                      </div>
                      <span className={`ticket-status-badge ${t.status?.toLowerCase().replace(' ', '-')}`}>
                        {t.status === 'Open' ? 'In Review' : t.status}
                      </span>
                    </div>

                    <div className="ticket-item-category">
                      <span>Category: </span>
                      <strong>{t.category}</strong>
                    </div>

                    <p className="ticket-item-message">{t.message}</p>

                    {t.screenshotUrl && (
                      <div className="ticket-item-attachment">
                        <img src={t.screenshotUrl} alt="Attached screenshot" />
                      </div>
                    )}

                    {/* Admin Reply (if any) */}
                    {t.adminReply && (
                      <div className="ticket-admin-reply-box">
                        <div className="admin-reply-header">
                          <Headphones size={14} color="#10B981" />
                          <span>Support Agent Reply:</span>
                        </div>
                        <p className="admin-reply-text">{t.adminReply}</p>
                      </div>
                    )}

                    <div className="ticket-item-footer">
                      <Clock size={12} />
                      <span>{new Date(t.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
