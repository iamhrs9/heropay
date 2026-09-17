import React, { useState } from 'react'
import {
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Globe,
  ChevronDown,
  ShieldCheck,
  Zap,
  Gift,
  Check
} from 'lucide-react'
import HeroPayLogo from '../components/HeroPayLogo'
import InputField from '../components/InputField'
import './LoginScreen.css'

export default function LoginScreen({ onLoginSuccess, onCreateAccount }) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [language, setLanguage] = useState('English')
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const languages = ['English', 'Español', 'हिन्दी', 'বাংলা', 'తెలుగు']

  const handleLogin = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    if (!phoneNumber || !password) {
      setErrorMsg('Please enter your phone number and password.')
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber.trim(), password })
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.message || 'Login failed. Please try again.')
        return
      }
      // Save JWT and user info to localStorage
      localStorage.setItem('hp_token', data.token)
      localStorage.setItem('hp_user', JSON.stringify(data.user))
      if (onLoginSuccess) onLoginSuccess(data.user)
    } catch (err) {
      setErrorMsg('Could not connect to server. Make sure the backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-screen-root">
      {/* Top Header with Language Selector */}
      <div className="login-top-bar">
        <div className="login-top-spacer" />
        <div className="lang-selector-container">
          <button
            type="button"
            className="lang-selector-btn"
            onClick={() => setIsLangOpen(!isLangOpen)}
            aria-label="Select Language"
          >
            <Globe size={14} strokeWidth={2.2} className="lang-icon" />
            <span className="lang-text">{language}</span>
            <ChevronDown
              size={13}
              strokeWidth={2.2}
              className={`lang-chevron ${isLangOpen ? 'open' : ''}`}
            />
          </button>

          {isLangOpen && (
            <div className="lang-dropdown-menu">
              {languages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  className={`lang-menu-item ${language === lang ? 'active' : ''}`}
                  onClick={() => {
                    setLanguage(lang)
                    setIsLangOpen(false)
                  }}
                >
                  <span>{lang}</span>
                  {language === lang && <Check size={14} color="var(--color-primary)" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hero Branding Section */}
      <div className="login-hero-section">
        <div className="login-logo-container">
          <HeroPayLogo size={68} className="login-brand-icon" />
        </div>

        <div className="login-brand-name-row">
          <span className="login-brand-hero">Hero</span>
          <span className="login-brand-pay">Pay</span>
          <span className="login-brand-reg">®</span>
        </div>

        <p className="login-tagline">Earn More, Do More</p>

        <div className="login-welcome-wrapper">
          <h2 className="login-welcome-title">Welcome Back</h2>
          <p className="login-welcome-sub">Login to your HeroPay account</p>
        </div>
      </div>

      {/* Main Login Form Glass Card */}
      <div className="login-form-card">
        <form onSubmit={handleLogin} className="login-form">
          {/* Phone Number Field */}
          <InputField
            label="Phone Number"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            icon={Smartphone}
            placeholder="Enter mobile number"
            autoComplete="tel"
            required
          />

          {/* Password Field */}
          <div className="login-password-field-wrap">
            <InputField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              placeholder="Enter password"
              autoComplete="current-password"
              required
              rightAction={
                <button
                  type="button"
                  className="hp-input-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <Eye size={19} strokeWidth={2} />
                  ) : (
                    <EyeOff size={19} strokeWidth={2} />
                  )}
                </button>
              }
            />

            <div className="forgot-password-row">
              <button
                type="button"
                className="forgot-password-link"
                onClick={() => alert('Password reset link sent to your phone!')}
              >
                Forgot Password?
              </button>
            </div>
          </div>

          {/* Primary Action Button: Log In */}
          {errorMsg && (
            <div className="login-error-msg">{errorMsg}</div>
          )}
          <button
            type="submit"
            className="login-submit-btn"
            disabled={isLoading}
          >
            <span>{isLoading ? 'Logging In...' : 'Log In'}</span>
            <ArrowRight size={18} strokeWidth={2.6} className="login-btn-arrow" />
          </button>

          {/* OR Divider */}
          <div className="login-divider">
            <div className="login-divider-line" />
            <span className="login-divider-text">OR</span>
            <div className="login-divider-line" />
          </div>

          {/* Create Account Section */}
          <p className="login-create-hint">New to HeroPay?</p>
          <button
            type="button"
            className="login-create-btn"
            onClick={onCreateAccount}
          >
            Create an Account
          </button>
        </form>
      </div>

      {/* Bottom Value / Trust Pillars */}
      <div className="login-trust-pillars">
        <div className="trust-pillar-item">
          <div className="trust-pillar-icon-wrap">
            <ShieldCheck size={20} strokeWidth={2.4} className="trust-icon" />
          </div>
          <span className="trust-pillar-title">Secure</span>
          <span className="trust-pillar-sub">Your data is safe</span>
        </div>

        <div className="trust-pillar-item">
          <div className="trust-pillar-icon-wrap">
            <Zap size={20} strokeWidth={2.4} className="trust-icon" />
          </div>
          <span className="trust-pillar-title">Fast</span>
          <span className="trust-pillar-sub">Instant access</span>
        </div>

        <div className="trust-pillar-item">
          <div className="trust-pillar-icon-wrap">
            <Gift size={20} strokeWidth={2.4} className="trust-icon" />
          </div>
          <span className="trust-pillar-title">Rewarding</span>
          <span className="trust-pillar-sub">More rewards for you</span>
        </div>
      </div>
    </div>
  )
}
