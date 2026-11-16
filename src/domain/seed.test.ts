import { describe, expect, it } from 'vitest'
import { computeCost } from './calc'
import { seedCatalog } from './seed'
import { parseCatalog } from './store'

describe('muestra MiccoMed', () => {
  const catalog = seedCatalog()

  it('trae fabricantes, ocho SKU y una hoja por artículo', () => {
    expect(catalog.manufacturers).toHaveLength(4)
    expect(catalog.items).toHaveLength(8)
    const skus = catalog.items.map((item) => item.miccomedSku)
    expect(new Set(skus).size).toBe(skus.length)
    for (const item of catalog.items) {
      expect(catalog.sheets[item.id]?.itemId).toBe(item.id)
      expect(catalog.manufacturers.some((maker) => maker.id === item.manufacturerId)).toBe(true)
    }
  })

  it('calcula un ULC positivo y deja el contrato del papel bajo el piso', () => {
    const bottle = catalog.items.find((item) => item.id === 'sku-bot-8')
    expect(bottle).toBeTruthy()
    const bottleCost = computeCost(catalog.sheets['sku-bot-8'], bottle?.casePack ?? 1)
    expect(bottleCost.ulc).not.toBeNull()
    expect(bottleCost.ulc ?? 0).toBeGreaterThan(0.15)
    expect(bottleCost.ulc ?? 0).toBeLessThan(0.45)
    expect(bottleCost.mpfBand).toBe('advalorem')
    expect(bottleCost.tiers.every((tier) => !tier.belowFloor)).toBe(true)

    const paper = catalog.items.find((item) => item.id === 'sku-paper')
    const paperCost = computeCost(catalog.sheets['sku-paper'], paper?.casePack ?? 1)
    expect(paperCost.duty).toBe(0)
    expect(paperCost.mpf).toBe(0)
    expect(paperCost.hmf).toBe(0)
    const contract = paperCost.tiers.find((tier) => tier.id === 'CONTRACT')
    expect(contract?.belowFloor).toBe(true)

    const smallBottle = computeCost(catalog.sheets['sku-bot-4'], 360)
    expect(smallBottle.mpfBand).toBe('min')
    const carton = computeCost(catalog.sheets['sku-ctn'], 25)
    expect(carton.hmf).toBe(0)
    expect(carton.duty).toBe(0)
  })

  it('sobrevive un ciclo de exportar e importar', () => {
    const restored = parseCatalog(JSON.stringify(catalog))
    expect(restored?.items.map((item) => item.miccomedSku)).toEqual(
      catalog.items.map((item) => item.miccomedSku),
    )
    expect(restored?.sheets['sku-bot-8'].fobUnit).toBe(0.155)
    expect(parseCatalog('{')).toBeNull()
    expect(parseCatalog('{"manufacturers":[],"items":[]}')?.items).toEqual([])
  })
})
