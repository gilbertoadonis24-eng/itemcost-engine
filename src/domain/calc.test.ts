import { describe, expect, it } from 'vitest'
import { CBP_FY2026, computeCost } from './calc'
import { blankSheet } from './types'

function sheet(patch: Parameters<typeof blankSheet>[1]) {
  return blankSheet('fixture', patch)
}

describe('computeCost', () => {
  it('apila mercancía, CIF, arancel sobre el valor FOB, MPF y HMF', () => {
    const result = computeCost(
      sheet({
        orderedUnits: 1000,
        damagePct: 0,
        fobUnit: 10,
        freightIntl: 100,
        insuranceMode: 'amount',
        insuranceAmount: 50,
        baseDutyPct: 10,
        additionalDutyPct: 5,
        dutyOnCif: false,
        applyMpf: true,
        ocean: true,
        brokerFee: 25,
        inlandMiami: 20,
        other: 5,
        tiers: {
          LIST: { targetMarginPct: 50, minMarginPct: 40 },
          TIER_A: { targetMarginPct: 20, minMarginPct: 30 },
          TIER_B: { targetMarginPct: 0, minMarginPct: 0 },
          CONTRACT: { targetMarginPct: 100, minMarginPct: 10 },
        },
      }),
      10,
    )

    expect(result.merchandise).toBe(10000)
    expect(result.cif).toBe(10150)
    expect(result.dutyBase).toBe(10000)
    expect(result.baseDuty).toBe(1000)
    expect(result.additionalDuty).toBe(500)
    expect(result.mpfRaw).toBeCloseTo(34.64, 6)
    expect(result.mpf).toBeCloseTo(34.64, 6)
    expect(result.mpfBand).toBe('advalorem')
    expect(result.hmf).toBeCloseTo(12.5, 6)
    expect(result.total).toBeCloseTo(10150 + 1500 + 34.64 + 12.5 + 25 + 20 + 5, 6)
    expect(result.lines.reduce((sum, line) => sum + line.amount, 0)).toBeCloseTo(result.total, 6)
    expect(result.ulc).toBeCloseTo(result.total / 1000, 8)
    expect(result.ulcPerCase).toBeCloseTo((result.ulc ?? 0) * 10, 8)

    const list = result.tiers[0]
    expect(list.price).toBeCloseTo((result.ulc ?? 0) / 0.5, 8)
    expect(list.marginOnSellPct).toBeCloseTo(50, 6)
    expect(list.costPlusPct).toBeCloseTo(100, 6)
    expect(list.belowFloor).toBe(false)

    const tierA = result.tiers[1]
    expect(tierA.belowFloor).toBe(true)
    expect(tierA.price).toBeLessThan(tierA.floorPrice ?? 0)

    expect(result.tiers[2].price).toBeCloseTo(result.ulc ?? 0, 8)
    expect(result.tiers[2].belowFloor).toBe(false)
    expect(result.tiers[3].price).toBeNull()
    expect(result.tiers[3].invalid).toBe(true)
    expect(result.warnings.some((warning) => warning.code === 'invalid-margin')).toBe(true)
  })

  it('calcula el arancel sobre el CIF cuando se pide, y el seguro como porcentaje', () => {
    const result = computeCost(
      sheet({
        orderedUnits: 100,
        fobUnit: 10,
        freightIntl: 40,
        insuranceMode: 'percent',
        insurancePct: 10,
        baseDutyPct: 10,
        dutyOnCif: true,
        applyMpf: false,
        ocean: false,
      }),
      1,
    )
    expect(result.insurance).toBeCloseTo(100, 6)
    expect(result.cif).toBeCloseTo(1140, 6)
    expect(result.dutyBase).toBeCloseTo(1140, 6)
    expect(result.baseDuty).toBeCloseTo(114, 6)
    expect(result.mpf).toBe(0)
    expect(result.hmf).toBe(0)
    expect(result.warnings.some((warning) => warning.code === 'duty-base-cif')).toBe(true)
  })

  it('aplica el mínimo y el máximo de MPF y omite HMF sin océano', () => {
    const low = computeCost(
      sheet({
        orderedUnits: 100,
        fobUnit: 1,
        applyMpf: true,
        ocean: false,
        freightIntl: 0,
        insuranceAmount: 0,
        insuranceMode: 'amount',
      }),
      1,
    )
    expect(low.mpfBand).toBe('min')
    expect(low.mpf).toBe(CBP_FY2026.mpfMin)
    expect(low.hmf).toBe(0)
    expect(low.fixedShipment).toBe(CBP_FY2026.mpfMin)
    expect(low.warnings.some((warning) => warning.code === 'mpf-low-value')).toBe(true)

    const high = computeCost(
      sheet({
        orderedUnits: 10000,
        fobUnit: 100,
        applyMpf: true,
        ocean: true,
      }),
      1,
    )
    expect(high.merchandise).toBe(1_000_000)
    expect(high.mpfRaw).toBeCloseTo(3464, 6)
    expect(high.mpf).toBe(CBP_FY2026.mpfMax)
    expect(high.mpfBand).toBe('max')
    expect(high.hmf).toBeCloseTo(1250, 6)
  })

  it('reparte el embarque entre unidades vendibles después de la merma', () => {
    const result = computeCost(
      sheet({
        orderedUnits: 1000,
        damagePct: 10,
        fobUnit: 2,
        freightIntl: 100,
        insuranceMode: 'amount',
        insuranceAmount: 0,
        applyMpf: false,
        ocean: false,
        brokerFee: 0,
        inlandMiami: 0,
        other: 0,
      }),
      1,
    )
    expect(result.sellableUnits).toBe(900)
    expect(result.total).toBe(2100)
    expect(result.ulc).toBeCloseTo(2100 / 900, 8)
    expect(result.lines[0].perUnit).toBeCloseTo(2000 / 900, 8)
  })

  it('no cobra MPF mínimo si no hay mercancía', () => {
    const result = computeCost(sheet({ orderedUnits: 0, fobUnit: 10, applyMpf: true }), 12)
    expect(result.mpf).toBe(0)
    expect(result.ulc).toBeNull()
    expect(result.ulcPerCase).toBeNull()
    expect(result.warnings.map((warning) => warning.code)).toEqual(['no-sellable'])
  })

  it('mantiene la identidad entre margen sobre venta y cost-plus', () => {
    const result = computeCost(
      sheet({
        orderedUnits: 500,
        fobUnit: 0.25,
        freightIntl: 40,
        insuranceMode: 'amount',
        insuranceAmount: 2,
        baseDutyPct: 3,
        additionalDutyPct: 25,
        applyMpf: true,
        ocean: true,
        brokerFee: 15,
        inlandMiami: 10,
        tiers: {
          LIST: { targetMarginPct: 42, minMarginPct: 32 },
          TIER_A: { targetMarginPct: 35, minMarginPct: 28 },
          TIER_B: { targetMarginPct: 30, minMarginPct: 24 },
          CONTRACT: { targetMarginPct: 24, minMarginPct: 18 },
        },
      }),
      24,
    )
    expect(result.ulc).not.toBeNull()
    for (const tier of result.tiers) {
      expect(tier.price).not.toBeNull()
      const price = tier.price ?? 0
      const ulc = result.ulc ?? 0
      expect(tier.marginOnSellPct).toBeCloseTo(((price - ulc) / price) * 100, 6)
      expect(tier.costPlusPct).toBeCloseTo(((price - ulc) / ulc) * 100, 6)
      expect(price).toBeCloseTo(ulc / (1 - (tier.marginOnSellPct ?? 0) / 100), 6)
    }
  })
})
