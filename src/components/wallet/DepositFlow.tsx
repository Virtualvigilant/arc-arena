'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const ARC = '◈'

type DepositState = 'idle' | 'sending' | 'waiting' | 'success' | 'failed'

export default function DepositFlow() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState('')
  const [state, setState] = useState<DepositState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [checkoutId, setCheckoutId] = useState<string | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const amt = parseInt(amount) || 0

  // Poll for payment completion after STK push
  useEffect(() => {
    if (state !== 'waiting' || !checkoutId) return

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/mpesa/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkoutRequestId: checkoutId }),
        })
        const data = await res.json()

        if (data.completed) {
          setState('success')
          clearInterval(pollRef.current!)
          // Refresh page data after short delay
          setTimeout(() => router.refresh(), 1500)
        }
      } catch {
        // Silently retry
      }
    }, 5000)

    // Stop polling after 2 minutes
    const timeout = setTimeout(() => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (state === 'waiting') {
        setState('idle')
        setError('Payment timed out. If you completed the payment, click "Sync Pending".')
      }
    }, 120_000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      clearTimeout(timeout)
    }
  }, [state, checkoutId, router])

  async function handleDeposit() {
    if (amt < 1 || !phone) return
    setState('sending')
    setError(null)

    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, phone }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to initiate M-Pesa payment')
        setState('idle')
        return
      }

      // STK push sent — switch to waiting state
      setCheckoutId(data.checkoutRequestId)
      setState('waiting')

    } catch {
      setError('Network error — try again')
      setState('idle')
    }
  }

  function resetFlow() {
    setState('idle')
    setError(null)
    setCheckoutId(null)
    setAmount('')
  }

  // ── Waiting / Success states ──────────────────────────────────────
  if (state === 'waiting') {
    return (
      <div className="bg-stovest-card border border-stovest-border rounded-2xl p-5 text-center">
        <div className="mb-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-stovest-blue/20 mb-3">
            <svg className="w-6 h-6 text-stovest-blue animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <h3 className="font-bold text-white text-sm mb-1">Check Your Phone</h3>
        <p className="text-gray-400 text-xs mb-4">
          An M-Pesa prompt has been sent to <span className="text-white font-mono">{phone}</span>.
          Enter your PIN to complete the payment.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-stovest-blue animate-pulse" />
          Waiting for confirmation...
        </div>
        <button
          onClick={resetFlow}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="bg-stovest-card border border-stovest-border rounded-2xl p-5 text-center">
        <div className="mb-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 mb-3">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h3 className="font-bold text-white text-sm mb-1">Deposit Successful!</h3>
        <p className="text-gray-400 text-xs mb-4">
          {ARC} {amt.toLocaleString()} Arc has been added to your wallet.
        </p>
        <button
          onClick={resetFlow}
          className="text-xs text-stovest-blue-light hover:text-white transition-colors"
        >
          Make another deposit
        </button>
      </div>
    )
  }

  // ── Default idle / input state ────────────────────────────────────
  return (
    <div className="bg-stovest-card border border-stovest-border rounded-2xl p-5">
      <h3 className="font-bold text-white text-sm mb-1">Deposit Arc</h3>
      <p className="text-gray-500 text-xs mb-4">Via M-Pesa · Min KES 1</p>

      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">KES</span>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          min={1}
          step={1}
          className="w-full bg-[#181C2A] border border-[#23293D] rounded-xl pl-12 pr-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-stovest-blue/50 transition-colors placeholder-gray-600"
          placeholder="50"
        />
      </div>

      <input
        type="tel"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        className="w-full bg-[#181C2A] border border-[#23293D] rounded-xl px-4 py-3 text-sm text-gray-300 font-mono focus:outline-none focus:border-stovest-blue/50 transition-colors mb-3 placeholder-gray-600"
        placeholder="07XXXXXXXX"
      />

      {amt >= 1 && (
        <div className="flex justify-between text-xs text-gray-400 mb-3 px-1">
          <span>You receive</span>
          <span className="font-mono text-stovest-blue-light font-medium">
            {ARC} {amt.toLocaleString()} Arc
          </span>
        </div>
      )}

      {error && (
        <div className="text-red-400 text-xs mb-3">{error}</div>
      )}

      <button
        onClick={handleDeposit}
        disabled={amt < 1 || !phone || state === 'sending'}
        className="w-full bg-stovest-blue text-white rounded-xl py-2.5 text-sm font-bold hover:bg-stovest-blue-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_15px_-3px_rgba(29,78,216,0.4)]"
      >
        {state === 'sending' ? 'Sending STK Push...' : 'Deposit via M-Pesa'}
      </button>
    </div>
  )
}