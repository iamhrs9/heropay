import React from 'react'
import './GlassCard.css'

export default function GlassCard({
  children,
  className = '',
  elevated = false,
  interactive = false,
  onClick,
  style = {},
  ...props
}) {
  const cardClasses = [
    'hp-glass-card',
    elevated ? 'hp-glass-card-elevated' : '',
    interactive ? 'hp-glass-card-interactive' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div
      className={cardClasses}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      style={style}
      {...props}
    >
      {children}
    </div>
  )
}
