import React from 'react'
import './Buttons.css'

export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  fullWidth = false,
  size = 'md',
  icon: Icon,
  className = '',
  ...props
}) {
  return (
    <button
      type="button"
      className={`hp-btn hp-btn-primary hp-btn-${size} ${fullWidth ? 'hp-btn-full' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon className="hp-btn-icon" size={size === 'sm' ? 16 : 18} />}
      <span>{children}</span>
    </button>
  )
}

export function SecondaryButton({
  children,
  onClick,
  disabled = false,
  fullWidth = false,
  size = 'md',
  icon: Icon,
  className = '',
  ...props
}) {
  return (
    <button
      type="button"
      className={`hp-btn hp-btn-secondary hp-btn-${size} ${fullWidth ? 'hp-btn-full' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon className="hp-btn-icon" size={size === 'sm' ? 16 : 18} />}
      <span>{children}</span>
    </button>
  )
}

export function IconButton({
  icon: Icon,
  onClick,
  ariaLabel,
  badge,
  size = 'md',
  variant = 'glass',
  className = '',
  ...props
}) {
  return (
    <button
      type="button"
      className={`hp-icon-btn hp-icon-btn-${size} hp-icon-btn-${variant} ${className}`}
      onClick={onClick}
      aria-label={ariaLabel}
      {...props}
    >
      <Icon size={size === 'sm' ? 16 : 20} strokeWidth={2} />
      {badge !== undefined && <span className="hp-icon-btn-badge">{badge}</span>}
    </button>
  )
}
