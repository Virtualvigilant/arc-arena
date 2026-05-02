export type EventStatus = 'upcoming' | 'live' | 'judging' | 'completed' | 'cancelled'
export type EventType = 'collector' | 'user_generated'
export type StakeBand = 'bronze' | 'silver' | 'gold' | 'elite'
export type StakeStatus = 'active' | 'won' | 'gray' | 'lost' | 'refunded'
export type TxType = 'deposit' | 'withdrawal' | 'stake' | 'payout' | 'rake_fee'
export type TxStatus = 'pending' | 'completed' | 'failed'

export interface Profile {
  id: string
  username: string
  full_name: string | null
  phone: string | null
  arc_balance: number
  is_admin: boolean
  created_at: string
}

export interface ArcEvent {
  id: string
  title: string
  description: string
  domain: string
  status: EventStatus
  type: EventType
  active_bands: StakeBand[]
  min_competitors: number
  max_competitors: number
  competition_start: string | null
  competition_end: string | null
  registration_end: string | null
  judging_criteria: string | null
  rake_percent: number
  total_pool: number
  rake_collected: number
  prize_pool: number
  created_at: string
  multipliers?: EventMultiplier[]
  stakes?: Stake[]
}

export interface EventMultiplier {
  id: string
  event_id: string
  position_label: string
  position_rank: number
  multiplier: number
  tier_type: 'winner' | 'gray' | 'loss'
}

export interface Stake {
  id: string
  event_id: string
  user_id: string
  amount: number
  band: StakeBand
  status: StakeStatus
  finishing_position: number | null
  payout: number
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: TxType
  arc_amount: number
  kes_amount: number | null
  reference: string | null
  payment_tracking_id: string | null
  status: TxStatus
  metadata: Record<string, any> | null
  created_at: string
}

export const BAND_RANGES: Record<StakeBand, { min: number; max: number }> = {
  bronze: { min: 50, max: 99 },
  silver: { min: 100, max: 199 },
  gold:   { min: 200, max: 499 },
  elite:  { min: 500, max: 9999 }
}