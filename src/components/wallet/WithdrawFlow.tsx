'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ARC = '◈'
const FEE = 2.5

export default function WithdrawFlow({
  balance,
  phone: defaultPhone
}: {
  balance: number
  phone: string
}) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState(defaultPhone)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const amt = parseInt(amount) || 0
  const fee = Math.ceil(amt * (FEE / 100))
  const kesPayable = amt - fee

  async function handleWithdraw() {
    if (amt < 100 || !phone) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/mpesa/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arcAmount: amt, phone })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Withdrawal failed')
        setLoading(false)
        return
      }

      setSuccess(`KES ${kesPayable} will be sent to ${phone} within 24 hours`)
      setAmount('')
      router.refresh()

    } catch (err) {
      setError('Network error — try again')
    }

    setLoading(false)
  }

  return (
    <div className="bg-pm-card border border-pm-border rounded-2xl p-5">
      <h3 className="font-bold text-pm-text text-sm mb-1">Withdraw Arc</h3>
      <p className="text-pm-text-muted text-xs mb-4">To M-Pesa · {FEE}% fee · Min 100 Arc</p>

      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pm-blue text-xs font-mono">{ARC}</span>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          min={100}
          max={balance}
          className="w-full bg-pm-surface border border-pm-border rounded-xl pl-10 pr-4 py-3 font-mono text-sm text-pm-text focus:outline-none focus:border-pm-blue/50 focus:ring-1 focus:ring-pm-blue/20 transition-all placeholder-pm-text-muted"
          placeholder="500"
        />
      </div>

      <input
        type="tel"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        className="w-full bg-pm-surface border border-pm-border rounded-xl px-4 py-3 text-sm text-pm-text font-mono focus:outline-none focus:border-pm-blue/50 focus:ring-1 focus:ring-pm-blue/20 transition-all mb-3 placeholder-pm-text-muted"
        placeholder="0712345678"
      />

      {amt >= 100 && (
        <div className="space-y-1 mb-3 px-1">
          <div className="flex justify-between text-xs text-pm-text-muted">
            <span>Fee ({FEE}%)</span>
            <span className="font-mono">{ARC} {fee} Arc</span>
          </div>
          <div className="flex justify-between text-xs font-medium text-pm-text">
            <span>You receive</span>
            <span className="font-mono text-pm-green">KES {kesPayable.toLocaleString()}</span>
          </div>
        </div>
      )}

      {error && <div className="text-pm-red text-xs mb-3">{error}</div>}
      {success && <div className="text-pm-green text-xs mb-3">{success}</div>}

      <button
        onClick={handleWithdraw}
        disabled={amt < 100 || amt > balance || !phone || loading}
        className="w-full bg-pm-surface text-pm-text rounded-xl py-2.5 text-sm font-semibold hover:bg-pm-card-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-pm-border"
      >
        {loading ? 'Processing...' : 'Withdraw to M-Pesa'}
      </button>
    </div>
  )
}