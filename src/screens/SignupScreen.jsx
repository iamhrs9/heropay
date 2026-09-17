import React, { useState } from 'react'
import {
  ChevronLeft,
  Globe,
  ChevronDown,
  User,
  Smartphone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Gift,
  ArrowRight,
  CheckCircle2,
  Check
} from 'lucide-react'
import HeroPayLogo from '../components/HeroPayLogo'
import './SignupScreen.css'

export default function SignupScreen({ onSignupSuccess, onNavigateLogin }) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Language Dropdown
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState('English')

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.')
      return
    }

    if (!phone.trim()) {
      setErrorMsg('Please enter your mobile number.')
      return
    }

    if (!agreeTerms) {
      setErrorMsg('Please accept the Terms & Conditions to proceed.')
      return
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
          referralCode: referralCode.trim()
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.message || 'Registration failed. Please try again.')
        return
      }
      // Save token and user data
      localStorage.setItem('hp_token', data.token)
      localStorage.setItem('hp_user', JSON.stringify(data.user))
      onSignupSuccess?.(data.user)
    } catch (err) {
      setErrorMsg('Could not connect to server. Make sure the backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="signup-screen-root">
      {/* Top Header: Back Button & Language Selector */}
      <div className="signup-top-bar">
        <button
          type="button"
          className="signup-back-btn"
          onClick={onNavigateLogin}
          aria-label="Back to Login"
        >
          <ChevronLeft size={22} strokeWidth={2.4} />
        </button>

        {/* Language Selector Pill */}
        <div className="lang-selector-container">
          <button
            type="button"
            className="lang-selector-btn"
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
          >
            <Globe size={14} strokeWidth={2.2} className="lang-icon" />
            <span className="lang-text">{currentLang}</span>
            <ChevronDown
              size={13}
              strokeWidth={2.2}
              className={`lang-chevron ${isLangMenuOpen ? 'open' : ''}`}
            />
          </button>

          {isLangMenuOpen && (
            <div className="lang-dropdown-menu">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  className={`lang-menu-item ${currentLang === lang.label ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentLang(lang.label)
                    setIsLangMenuOpen(false)
                  }}
                >
                  <span>{lang.native}</span>
                  {currentLang === lang.label && <Check size={14} strokeWidth={2.6} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hero Branding Section */}
      <div className="signup-hero-section">
        <div className="signup-logo-container">
          <HeroPayLogo size={68} className="signup-brand-icon" />
        </div>
        <div className="signup-brand-name-row">
          <span className="signup-brand-hero">Hero</span>
          <span className="signup-brand-pay">Pay</span>
          <sup className="signup-brand-reg">®</sup>
        </div>
        <p className="signup-brand-tagline">Earn More, Do More</p>
      </div>

      {/* Heading Row with Decorative "Good Things Ahead" */}
      <div className="signup-heading-row">
        <div className="signup-heading-left">
          <h2 className="signup-main-title">Create Your Account</h2>
          <p className="signup-main-subtitle">Join HeroPay and start earning today</p>
        </div>
        <div className="signup-sticker-badge">
          <span>Good</span>
          <span>Things</span>
          <span>Ahead</span>
        </div>
      </div>

      {/* Signup Form Card */}
      <div className="signup-card">
        <form onSubmit={handleSubmit} className="signup-form">
          {errorMsg && (
            <div className="signup-error-banner">
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Full Name */}
          <div className="signup-input-field-wrap">
            <div className="signup-input-box">
              <div className="signup-field-icon-wrap">
                <User size={18} strokeWidth={2.2} />
              </div>
              <div className="signup-field-content">
                <label className="signup-field-label">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="signup-native-input"
                />
              </div>
            </div>
          </div>

          {/* 2. Phone Number */}
          <div className="signup-input-field-wrap">
            <div className="signup-input-box">
              <div className="signup-field-icon-wrap">
                <Smartphone size={18} strokeWidth={2.2} />
              </div>
              <div className="signup-field-content">
                <label className="signup-field-label">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="signup-native-input"
                />
              </div>
            </div>
          </div>

          {/* 3. Email Address (Optional) */}
          <div className="signup-input-field-wrap">
            <div className="signup-input-box">
              <div className="signup-field-icon-wrap">
                <Mail size={18} strokeWidth={2.2} />
              </div>
              <div className="signup-field-content">
                <label className="signup-field-label">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="signup-native-input"
                />
              </div>
            </div>
          </div>

          {/* 4. Create Password */}
          <div className="signup-input-field-wrap">
            <div className="signup-input-box">
              <div className="signup-field-icon-wrap">
                <Lock size={18} strokeWidth={2.2} />
              </div>
              <div className="signup-field-content">
                <label className="signup-field-label">Create Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="signup-native-input"
                />
              </div>
              <button
                type="button"
                className="signup-eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff size={18} strokeWidth={2} />
                ) : (
                  <Eye size={18} strokeWidth={2} />
                )}
              </button>
            </div>
          </div>

          {/* 5. Confirm Password */}
          <div className="signup-input-field-wrap">
            <div className="signup-input-box">
              <div className="signup-field-icon-wrap">
                <Lock size={18} strokeWidth={2.2} />
              </div>
              <div className="signup-field-content">
                <label className="signup-field-label">Confirm Password</label>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="signup-native-input"
                />
              </div>
              <button
                type="button"
                className="signup-eye-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} strokeWidth={2} />
                ) : (
                  <Eye size={18} strokeWidth={2} />
                )}
              </button>
            </div>
          </div>

          {/* 6. Referral Code (Optional) */}
          <div className="signup-input-field-wrap">
            <div className="signup-input-box">
              <div className="signup-field-icon-wrap">
                <Gift size={18} strokeWidth={2.2} />
              </div>
              <div className="signup-field-content">
                <label className="signup-field-label">Referral Code (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter referral code"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="signup-native-input"
                />
              </div>
            </div>
          </div>

          {/* Terms & Conditions Checkbox */}
          <div
            className="signup-terms-row"
            onClick={() => setAgreeTerms(!agreeTerms)}
          >
            <div className={`signup-custom-checkbox ${agreeTerms ? 'checked' : ''}`}>
              {agreeTerms ? (
                <CheckCircle2 size={19} fill="#FF6810" color="#FFFFFF" strokeWidth={2.2} />
              ) : (
                <div className="signup-unchecked-circle" />
              )}
            </div>
            <span className="signup-terms-text">
              I agree to the{' '}
              <span
                className="terms-link-highlight"
                onClick={(e) => {
                  e.stopPropagation()
                  alert('HeroPay Terms & Conditions: Fast, transparent and secure transactions.')
                }}
              >
                Terms & Conditions
              </span>{' '}
              and{' '}
              <span
                className="terms-link-highlight"
                onClick={(e) => {
                  e.stopPropagation()
                  alert('HeroPay Privacy Policy: Your financial security is our highest priority.')
                }}
              >
                Privacy Policy
              </span>
            </span>
          </div>

          {/* Primary Submit Button: Create Account */}
          <button
            type="submit"
            className="signup-submit-btn"
            disabled={isLoading}
          >
            <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
            <ArrowRight size={18} strokeWidth={2.6} className="signup-btn-arrow" />
          </button>

          {/* OR Divider */}
          <div className="signup-divider">
            <div className="signup-divider-line" />
            <span className="signup-divider-text">OR</span>
            <div className="signup-divider-line" />
          </div>

          {/* Already have an account? Log In */}
          <div className="signup-login-switch">
            <span className="signup-login-prompt">Already have an account?</span>
            <button
              type="button"
              className="signup-login-link-btn"
              onClick={onNavigateLogin}
            >
              Log In
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
