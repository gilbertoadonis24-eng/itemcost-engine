import type { LineId, MpfBand } from '../domain/calc'

const cache = new Map<number, Intl.NumberFormat>()

function usd(digits: number): Intl.NumberFormat {
  const existing = cache.get(digits)
  if (existing) return existing
  const format = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
  cache.set(digits, format)
  return format
}

export function money(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return usd(digits).format(value)
}

export function moneyAuto(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return money(value, Math.abs(value) < 1 ? 4 : 2)
}

export function qty(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)
}

export function pct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return `${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)}%`
}

export const LINE_LABEL: Record<LineId, string> = {
  merchandise: 'Mercancía',
  freight: 'Flete internacional',
  insurance: 'Seguro',
  baseDuty: 'Arancel base',
  additionalDuty: 'Arancel adicional',
  mpf: 'MPF',
  hmf: 'HMF',
  broker: 'Broker',
  inland: 'Inland Miami',
  other: 'Otros',
}

export const MPF_BAND_LABEL: Record<MpfBand, string> = {
  off: 'no aplica',
  min: 'mínimo',
  max: 'máximo',
  advalorem: 'ad valorem',
}
