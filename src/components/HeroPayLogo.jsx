import React, { useState } from 'react'
import logoSrc from '../assets/logo.png'

export default function HeroPayLogo({ size = 36, className = '', alt = 'HeroPay Logo' }) {
  const [hasError, setHasError] = useState(false)

  // Height is `size`, width maintains ~1.35 aspect ratio
  const width = Math.round(size * 1.35)

  if (hasError) {
    // Vector fallback matching the HeroPay diagonal 3-bar brand mark
    return (
      <svg
        width={width}
        height={size}
        viewBox="0 0 135 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
        aria-label={alt}
      >
        <circle cx="32" cy="18" r="14" fill="url(#hp-logo-orange-grad)" />
        <rect x="2" y="78" width="110" height="20" rx="10" transform="rotate(-45 2 78)" fill="#111827" />
        <rect x="52" y="88" width="64" height="20" rx="10" transform="rotate(-45 52 88)" fill="#111827" />
        <rect x="88" y="92" width="56" height="20" rx="10" transform="rotate(-45 88 92)" fill="url(#hp-logo-orange-grad)" />
        <defs>
          <linearGradient id="hp-logo-orange-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF7A1A" />
            <stop offset="100%" stopColor="#FF5100" />
          </linearGradient>
        </defs>
      </svg>
    )
  }

  return (
    <img
      src={logoSrc}
      alt={alt}
      width={width}
      height={size}
      className={className}
      onError={() => setHasError(true)}
      style={{
        display: 'inline-block',
        height: `${size}px`,
        width: 'auto',
        maxHeight: `${size}px`,
        objectFit: 'contain',
        flexShrink: 0
      }}
    />
  )
}
