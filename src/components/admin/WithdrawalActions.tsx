'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function WithdrawalActions({
  transactionId
}: {
  transactionId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function markCompleted() {
    if (!confirm('Confirm you have sent the M-Pesa payment manually?')) return
    setLoading(true)

    await fetch(`/api/admin/withdrawals/${transactionId}/complete`, {
      method: 'PATCH'
    })

    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={markCompleted}
      disabled={loading}
      className="bg-green-800 hover:bg-green-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition-colors disabled:opacity-40"
    >
      {loading ? '...' : 'Mark sent'}
    </button>
  )
}