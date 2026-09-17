import React from 'react'
import { Bell } from 'lucide-react'
import { IconButton } from './Buttons'
import './Header.css'

export default function Header({
  title,
  subtitle,
  showLogo = true,
  rightAction,
  onNotificationClick,
  notificationCount
}) {
  return (
    <header className="hp-header">
      <div className="hp-header-left">
        {showLogo && (
          <img
            src="/assets/logo.png"
            alt="HeroPay"
            className="hp-header-logo"
          />
        )}
        {(title || subtitle) && (
          <div className="hp-header-titles">
            {title && <h1 className="hp-header-title">{title}</h1>}
            {subtitle && <p className="hp-header-subtitle">{subtitle}</p>}
          </div>
        )}
      </div>

      <div className="hp-header-right">
        {rightAction || (
          <IconButton
            icon={Bell}
            size="md"
            badge={notificationCount}
            ariaLabel="Notifications"
            onClick={onNotificationClick}
          />
        )}
      </div>
    </header>
  )
}
