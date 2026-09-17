/**
 * HeroPay App Configuration
 * All tunable values come from Vite env vars (.env).
 * Change .env to update without touching source code.
 */

// Commission: percentage as decimal (e.g. 0.095 = 9.5%)
export const COMMISSION_RATE = parseFloat(import.meta.env.VITE_COMMISSION_RATE) || 0.095

// Fixed commission fee in rupees added on top of percentage (e.g. 6)
export const COMMISSION_FIXED = parseFloat(import.meta.env.VITE_COMMISSION_FIXED) || 6

// Auto-approve delay in minutes (e.g. 15)
export const AUTO_APPROVE_MINUTES = parseInt(import.meta.env.VITE_AUTO_APPROVE_MINUTES) || 15

// Max order amount allowed with stock > 0
export const MAX_STOCK_AMOUNT = parseInt(import.meta.env.VITE_MAX_STOCK_AMOUNT) || 9000

// Min custom order amount
export const MIN_ORDER_AMOUNT = parseInt(import.meta.env.VITE_MIN_ORDER_AMOUNT) || 500

// Stock auto-fluctuation interval in ms
export const STOCK_FLUCTUATE_MS = parseInt(import.meta.env.VITE_STOCK_FLUCTUATE_MS) || 80000

/** Compute commission for a given amount */
export const calcCommission = (amount) =>
  Number(((amount * COMMISSION_RATE) + COMMISSION_FIXED).toFixed(2))

/** Compute total coins (amount + commission) */
export const calcTotalCoins = (amount) => {
  const commission = calcCommission(amount)
  return Number((amount + commission).toFixed(2))
}

/** Human-readable commission label e.g. "9.5% + ₹6" */
export const commissionLabel = `${(COMMISSION_RATE * 100).toFixed(1).replace(/\.0$/, '')}% + ₹${COMMISSION_FIXED}`
