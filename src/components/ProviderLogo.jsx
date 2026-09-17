import React from 'react'
import './ProviderLogo.css'

export default function ProviderLogo({ provider = 'upi', size = 'md', className = '' }) {
  const norm = String(provider).toLowerCase().trim()

  if (norm.includes('paytm')) {
    return (
      <div className={`provider-logo-pill provider-logo-pill--paytm size-${size} ${className}`} title="Paytm">
        <svg viewBox="0 0 68 24" className="provider-svg" xmlns="http://www.w3.org/2000/svg">
          {/* Authentic Paytm Mark: 'pay' in #002E6E navy + 'tm' in #00BAF2 cyan */}
          <text
            x="2"
            y="17"
            fill="#002E6E"
            fontFamily="'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="900"
            fontSize="18"
            letterSpacing="-0.6"
          >
            pay
          </text>
          <text
            x="36"
            y="17"
            fill="#00BAF2"
            fontFamily="'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="900"
            fontSize="18"
            letterSpacing="-0.6"
          >
            tm
          </text>
        </svg>
      </div>
    )
  }

  if (norm.includes('gpay') || norm.includes('google')) {
    return (
      <div className={`provider-logo-pill provider-logo-pill--gpay size-${size} ${className}`} title="Google Pay">
        <svg viewBox="0 0 74 24" className="provider-svg" xmlns="http://www.w3.org/2000/svg">
          {/* Official Google 4-color G */}
          <g transform="translate(1, 2) scale(0.85)">
            <path d="M20.6 11.2c0-.7-.1-1.5-.2-2.2H10.5v4.2h5.7c-.2 1.3-1 2.5-2.2 3.3v2.7h3.5c2.1-1.9 3.1-4.8 3.1-8z" fill="#4285F4"/>
            <path d="M10.5 21.5c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.2 1.1-3.8 1.1-2.9 0-5.3-2-6.2-4.6H.7v2.8C2.5 19 6.2 21.5 10.5 21.5z" fill="#34A853"/>
            <path d="M4.3 12.6c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V5.2H.7C0 6.6 0 8.2 0 10.3s0 3.7.7 5.1l3.6-2.8z" fill="#FBBC05"/>
            <path d="M10.5 3.9c1.6 0 3.1.6 4.3 1.7l3.2-3.2C16 0.7 13.5 0 10.5 0 6.2 0 2.5 2.5.7 6.1l3.6 2.8c.9-2.7 3.3-5 6.2-5z" fill="#EA4335"/>
          </g>
          {/* Pay Text */}
          <text
            x="24"
            y="17"
            fill="#5F6368"
            fontFamily="'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="600"
            fontSize="16"
            letterSpacing="-0.3"
          >
            Pay
          </text>
        </svg>
      </div>
    )
  }

  if (norm.includes('phonepe')) {
    return (
      <div className={`provider-logo-pill provider-logo-pill--phonepe size-${size} ${className}`} title="PhonePe">
        <svg viewBox="0 0 88 24" className="provider-svg" xmlns="http://www.w3.org/2000/svg">
          {/* PhonePe Purple Circle Emblem */}
          <circle cx="12" cy="12" r="11" fill="#5F259F" />
          <text
            x="12"
            y="16.5"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="'Outfit', sans-serif"
            fontWeight="900"
            fontSize="12.5"
          >
            पे
          </text>
          {/* Brand Wordmark */}
          <text
            x="28"
            y="17"
            fill="#5F259F"
            fontFamily="'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="800"
            fontSize="14.5"
            letterSpacing="-0.3"
          >
            PhonePe
          </text>
        </svg>
      </div>
    )
  }

  if (norm.includes('mobikwik') || norm.includes('mobi')) {
    return (
      <div className={`provider-logo-pill provider-logo-pill--mobikwik size-${size} ${className}`} title="MobiKwik">
        <svg viewBox="0 0 92 24" className="provider-svg" xmlns="http://www.w3.org/2000/svg">
          {/* MobiKwik Blue Badge Emblem */}
          <rect x="1" y="2" width="20" height="20" rx="5" fill="#00A8E8" />
          <text
            x="11"
            y="16.5"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="'Outfit', sans-serif"
            fontWeight="900"
            fontSize="12.5"
          >
            M
          </text>
          {/* Brand Wordmark */}
          <text
            x="26"
            y="17"
            fill="#00A8E8"
            fontFamily="'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="800"
            fontSize="14"
            letterSpacing="-0.2"
          >
            MobiKwik
          </text>
        </svg>
      </div>
    )
  }

  // Default UPI Official Mark
  return (
    <div className={`provider-logo-pill provider-logo-pill--upi size-${size} ${className}`} title="UPI">
      <svg viewBox="0 0 64 24" className="provider-svg" xmlns="http://www.w3.org/2000/svg">
        {/* Dual Triangles NCPI UPI Mark */}
        <path d="M7 4L15 12L7 20H1.5L9.5 12L1.5 4H7Z" fill="#ED7D31" />
        <path d="M13.5 4L21.5 12L13.5 20H8L16 12L8 4H13.5Z" fill="#097939" />
        <text
          x="25"
          y="17"
          fill="#002E6E"
          fontFamily="'Outfit', sans-serif"
          fontWeight="900"
          fontStyle="italic"
          fontSize="14"
        >
          UPI
        </text>
      </svg>
    </div>
  )
}
