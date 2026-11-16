import type { CostSheet, TierId, TierMargin } from './types'
import { TIER_ORDER } from './types'

/** Formal-entry user fees, CBP fiscal year 2026, effective 1 Oct 2025. */
export const CBP_FY2026 = {
  mpfRate: 0.003464,
  mpfMin: 33.58,
  mpfMax: 651.5,
  hmfRate: 0.00125,
  formalValueHint: 2500,
} as const

export const CBP_NOTE =
  'MPF de entrada formal FY2026: 0.3464% del valor de la mercancía, entre USD 33.58 y USD 651.50 (CBP, desde el 1 oct 2025). HMF: 0.125% si el cargo se carga o descarga de un buque comercial. No es una liquidación aduanera. Confirmar con un broker licenciado.'

export type MpfBand = 'off' | 'min' | 'max' | 'advalorem'

export type LineId =
  | 'merchandise'
  | 'freight'
  | 'insurance'
  | 'baseDuty'
  | 'additionalDuty'
  | 'mpf'
  | 'hmf'
  | 'broker'
  | 'inland'
  | 'other'

export type StackLine = {
  id: LineId
  amount: number
  perUnit: number
}

export type WarningCode = 'no-sellable' | 'mpf-low-value' | 'invalid-margin' | 'duty-base-cif'

export type CostWarning = {
  code: WarningCode
  text: string
}

export type TierQuote = {
  id: TierId
  targetMarginPct: number
  minMarginPct: number
  price: number | null
  floorPrice: number | null
  marginDollars: number | null
  marginOnSellPct: number | null
  costPlusPct: number | null
  belowFloor: boolean
  invalid: boolean
}

export type CostResult = {
  merchandise: number
  freightIntl: number
  insurance: number
  cif: number
  dutyBase: number
  baseDuty: number
  additionalDuty: number
  duty: number
  mpf: number
  mpfRaw: number
  mpfBand: MpfBand
  hmf: number
  brokerFee: number
  inlandMiami: number
  other: number
  total: number
  orderedUnits: number
  sellableUnits: number
  ulc: number | null
  ulcPerCase: number | null
  fixedShipment: number
  fixedPerUnit: number | null
  lines: StackLine[]
  tiers: TierQuote[]
  warnings: CostWarning[]
}

function n(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0
  return value
}

function perUnit(amount: number, sellable: number): number {
  if (sellable <= 0) return 0
  return amount / sellable
}

function quoteTier(ulc: number | null, id: TierId, margin: TierMargin): TierQuote {
  const target = margin.targetMarginPct
  const min = margin.minMarginPct
  const badTarget = target >= 100
  const badMin = min >= 100
  if (ulc == null || badTarget) {
    const floorPrice = ulc != null && !badMin ? ulc / (1 - min / 100) : null
    return {
      id,
      targetMarginPct: target,
      minMarginPct: min,
      price: null,
      floorPrice,
      marginDollars: null,
      marginOnSellPct: null,
      costPlusPct: null,
      belowFloor: false,
      invalid: badTarget || badMin,
    }
  }
  const price = ulc / (1 - target / 100)
  const floorPrice = min >= 100 ? null : ulc / (1 - min / 100)
  const marginDollars = price - ulc
  const marginOnSellPct = price === 0 ? 0 : (marginDollars / price) * 100
  const costPlusPct = ulc === 0 ? 0 : (marginDollars / ulc) * 100
  const belowFloor = floorPrice != null && price + 1e-9 < floorPrice
  return {
    id,
    targetMarginPct: target,
    minMarginPct: min,
    price,
    floorPrice,
    marginDollars,
    marginOnSellPct,
    costPlusPct,
    belowFloor,
    invalid: badMin,
  }
}

export function computeCost(sheet: CostSheet, casePack: number): CostResult {
  const orderedUnits = n(sheet.orderedUnits)
  const damagePct = Math.min(100, n(sheet.damagePct))
  const sellableUnits = orderedUnits * (1 - damagePct / 100)
  const merchandise = n(sheet.fobUnit) * orderedUnits
  const freightIntl = n(sheet.freightIntl)
  const insurance =
    sheet.insuranceMode === 'percent'
      ? merchandise * (n(sheet.insurancePct) / 100)
      : n(sheet.insuranceAmount)
  const cif = merchandise + freightIntl + insurance
  const dutyBase = sheet.dutyOnCif ? cif : merchandise
  const baseDuty = dutyBase * (n(sheet.baseDutyPct) / 100)
  const additionalDuty = dutyBase * (n(sheet.additionalDutyPct) / 100)
  const duty = baseDuty + additionalDuty

  let mpf = 0
  let mpfRaw = 0
  let mpfBand: MpfBand = 'off'
  if (sheet.applyMpf && merchandise > 0) {
    mpfRaw = merchandise * CBP_FY2026.mpfRate
    if (mpfRaw < CBP_FY2026.mpfMin) {
      mpf = CBP_FY2026.mpfMin
      mpfBand = 'min'
    } else if (mpfRaw > CBP_FY2026.mpfMax) {
      mpf = CBP_FY2026.mpfMax
      mpfBand = 'max'
    } else {
      mpf = mpfRaw
      mpfBand = 'advalorem'
    }
  }

  const hmf = sheet.ocean && merchandise > 0 ? merchandise * CBP_FY2026.hmfRate : 0
  const brokerFee = n(sheet.brokerFee)
  const inlandMiami = n(sheet.inlandMiami)
  const other = n(sheet.other)
  const total = cif + duty + mpf + hmf + brokerFee + inlandMiami + other
  const ulc = sellableUnits > 0 ? total / sellableUnits : null
  const ulcPerCase = ulc != null && casePack > 0 ? ulc * casePack : null
  const mpfFixed = mpfBand === 'min' || mpfBand === 'max' ? mpf : 0
  const fixedShipment = freightIntl + brokerFee + inlandMiami + other + mpfFixed
  const fixedPerUnit = sellableUnits > 0 ? fixedShipment / sellableUnits : null

  const amounts: Record<LineId, number> = {
    merchandise,
    freight: freightIntl,
    insurance,
    baseDuty,
    additionalDuty,
    mpf,
    hmf,
    broker: brokerFee,
    inland: inlandMiami,
    other,
  }
  const lineOrder: LineId[] = [
    'merchandise',
    'freight',
    'insurance',
    'baseDuty',
    'additionalDuty',
    'mpf',
    'hmf',
    'broker',
    'inland',
    'other',
  ]
  const lines = lineOrder.map((id) => ({
    id,
    amount: amounts[id],
    perUnit: perUnit(amounts[id], sellableUnits),
  }))

  const tiers = TIER_ORDER.map((id) => quoteTier(ulc, id, sheet.tiers[id]))
  const warnings: CostWarning[] = []
  if (sellableUnits <= 0) {
    warnings.push({
      code: 'no-sellable',
      text: 'No hay unidades vendibles. Revise la cantidad pedida y la merma.',
    })
  }
  if (sheet.applyMpf && merchandise > 0 && merchandise < CBP_FY2026.formalValueHint) {
    warnings.push({
      code: 'mpf-low-value',
      text: 'El valor de la mercancía está bajo USD 2,500. El mínimo de MPF formal puede no aplicar a una entrada informal. Confirmar con el broker.',
    })
  }
  if (sheet.dutyOnCif) {
    warnings.push({
      code: 'duty-base-cif',
      text: 'El arancel usa el CIF equivalente. En una entrada de EE. UU. la base usual es el valor de transacción. Confirmar con el broker.',
    })
  }
  if (tiers.some((tier) => tier.invalid)) {
    warnings.push({
      code: 'invalid-margin',
      text: 'Hay un margen de objetivo o de piso en 100% o más. Ese precio no se puede calcular.',
    })
  }

  return {
    merchandise,
    freightIntl,
    insurance,
    cif,
    dutyBase,
    baseDuty,
    additionalDuty,
    duty,
    mpf,
    mpfRaw,
    mpfBand,
    hmf,
    brokerFee,
    inlandMiami,
    other,
    total,
    orderedUnits,
    sellableUnits,
    ulc,
    ulcPerCase,
    fixedShipment,
    fixedPerUnit,
    lines,
    tiers,
    warnings,
  }
}
