import { EventMultiplier, StakeBand, BAND_RANGES } from '@/types'

export const RAKE_PERCENT = Number(process.env.RAKE_PERCENT ?? 15)

export function calculateRake(totalPool: number): number {
  return Math.floor(totalPool * (RAKE_PERCENT / 100))
}

export function calculatePrizePool(totalPool: number): number {
  return totalPool - calculateRake(totalPool)
}

export function calculatePayout(
  stakeAmount: number,
  multiplier: number
): number {
  return Math.floor(stakeAmount * multiplier)
}

export function validateStakeBand(
  amount: number,
  band: StakeBand
): boolean {
  const range = BAND_RANGES[band]
  return amount >= range.min && amount <= range.max
}

export function getPayoutPreview(
  stakeAmount: number,
  multipliers: EventMultiplier[]
) {
  return multipliers
    .sort((a, b) => a.position_rank - b.position_rank)
    .map(m => ({
      label: m.position_label,
      rank: m.position_rank,
      multiplier: m.multiplier,
      payout: calculatePayout(stakeAmount, m.multiplier),
      tier: m.tier_type
    }))
}

export function isSolvent(
  prizePool: number,
  stakes: { amount: number }[],
  multipliers: EventMultiplier[]
): boolean {
  const sortedMults = [...multipliers].sort((a, b) => b.multiplier - a.multiplier)
  const sortedStakes = [...stakes].sort((a, b) => b.amount - a.amount)
  
  let totalPayout = 0
  const paidMults = sortedMults.filter(m => m.multiplier > 0)
  
  paidMults.forEach((mult, i) => {
    const stake = sortedStakes[i]
    if (stake) {
      totalPayout += calculatePayout(stake.amount, mult.multiplier)
    }
  })
  
  return totalPayout <= prizePool
}