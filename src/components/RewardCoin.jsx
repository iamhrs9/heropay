import React from 'react'
import { Coins } from 'lucide-react'
import './RewardCoin.css'

export default function RewardCoin({ size = 20, className = '' }) {
  return (
    <span className={`hp-reward-coin hp-reward-coin-${size} ${className}`} aria-label="HeroPay Coin">
      <Coins size={size * 0.75} strokeWidth={2.2} />
    </span>
  )
}
