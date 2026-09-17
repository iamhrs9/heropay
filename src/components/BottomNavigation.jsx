import React from 'react'
import { Coins, ShoppingBag, Plus, Users, User } from 'lucide-react'
import './BottomNavigation.css'

export default function BottomNavigation({ activeTab, onTabChange }) {
  const navItems = [
    { id: 'sell', label: 'Sell', icon: Coins },
    { id: 'buy', label: 'Buy', icon: ShoppingBag },
    { id: 'upi', label: 'UPI', icon: Plus, isCenter: true },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'me', label: 'Me', icon: User },
  ]

  return (
    <div className="bottom-nav-wrapper">
      <nav className="bottom-nav-container" aria-label="Main Navigation">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          if (item.isCenter) {
            return (
              <div key={item.id} className="bottom-nav-center-action">
                <button
                  type="button"
                  className="bottom-nav-center-btn"
                  onClick={() => onTabChange(item.id)}
                  aria-label="UPI Quick Action"
                >
                  <Plus size={28} strokeWidth={2.6} />
                </button>
                <span className="bottom-nav-center-label">UPI</span>
              </div>
            )
          }

          return (
            <button
              key={item.id}
              type="button"
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="bottom-nav-icon-wrapper">
                <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
              </div>
              <span className="bottom-nav-label">{item.label}</span>
              {isActive && <div className="bottom-nav-indicator" />}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
