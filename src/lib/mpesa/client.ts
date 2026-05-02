import axios from 'axios'

// ── Config ──────────────────────────────────────────────────────────
function getConfig() {
  const isSandbox = process.env.MPESA_ENV !== 'production'
  return {
    BASE_URL: isSandbox
      ? 'https://sandbox.safaricom.co.ke'
      : 'https://api.safaricom.co.ke',
    CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY!,
    CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET!,
    PASSKEY: process.env.MPESA_PASSKEY!,
    SHORTCODE: process.env.MPESA_SHORTCODE!,
    CALLBACK_URL: `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`,
  }
}

// ── Types ───────────────────────────────────────────────────────────
export interface STKPushResponse {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage: string
}

export interface STKQueryResponse {
  ResponseCode: string
  ResponseDescription: string
  MerchantRequestID: string
  CheckoutRequestID: string
  ResultCode: string
  ResultDesc: string
}

export interface STKCallbackData {
  Body: {
    stkCallback: {
      MerchantRequestID: string
      CheckoutRequestID: string
      ResultCode: number
      ResultDesc: string
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value: string | number }>
      }
    }
  }
}

// ── OAuth Token ─────────────────────────────────────────────────────
// Daraja uses Basic Auth (base64 of key:secret) → returns Bearer token
let cachedToken: { token: string; expiresAt: number } | null = null

export async function getOAuthToken(): Promise<string> {
  // Reuse cached token if still valid (with 30s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) {
    return cachedToken.token
  }

  const { BASE_URL, CONSUMER_KEY, CONSUMER_SECRET } = getConfig()
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')

  const res = await axios.get(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  )

  if (!res.data.access_token) {
    throw new Error('Daraja OAuth failed — no access_token returned')
  }

  cachedToken = {
    token: res.data.access_token,
    expiresAt: Date.now() + (parseInt(res.data.expires_in || '3599') * 1000),
  }

  return cachedToken.token
}

// ── STK Push (Lipa Na M-Pesa Online) ────────────────────────────────
export async function stkPush(params: {
  phone: string
  amount: number
  accountReference: string
  description: string
}): Promise<STKPushResponse> {
  const { BASE_URL, SHORTCODE, PASSKEY, CALLBACK_URL } = getConfig()
  const token = await getOAuthToken()

  const timestamp = getTimestamp()
  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64')

  const res = await axios.post(
    `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: params.amount,
      PartyA: formatPhone(params.phone),
      PartyB: SHORTCODE,
      PhoneNumber: formatPhone(params.phone),
      CallBackURL: CALLBACK_URL,
      AccountReference: params.accountReference,
      TransactionDesc: params.description,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  )

  return res.data as STKPushResponse
}

// ── STK Query ───────────────────────────────────────────────────────
// Check if an STK push was completed/cancelled/failed
export async function querySTKStatus(
  checkoutRequestId: string
): Promise<STKQueryResponse> {
  const { BASE_URL, SHORTCODE, PASSKEY } = getConfig()
  const token = await getOAuthToken()

  const timestamp = getTimestamp()
  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64')

  const res = await axios.post(
    `${BASE_URL}/mpesa/stkpushquery/v1/query`,
    {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  )

  return res.data as STKQueryResponse
}

// ── Helpers ─────────────────────────────────────────────────────────

// Daraja timestamp format: YYYYMMDDHHmmss
function getTimestamp(): string {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  )
}

// Normalize Kenyan phone: 07xx → 2547xx, +254xx → 254xx
function formatPhone(phone: string): string {
  let cleaned = phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '')

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1)
  }
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1)
  }
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned
  }

  return cleaned
}

// Extract metadata items from STK callback
export function extractCallbackMeta(
  items: Array<{ Name: string; Value: string | number }>
): Record<string, string | number> {
  const meta: Record<string, string | number> = {}
  for (const item of items) {
    meta[item.Name] = item.Value
  }
  return meta
}
