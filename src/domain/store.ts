import { blankSheet, uid } from './types'
import type { Catalog, Category, CostSheet, Incoterm, InsuranceMode, Item, Manufacturer, TierId } from './types'
import { CATEGORIES, INCOTERMS, TIER_ORDER } from './types'
import { seedCatalog } from './seed'

export const STORAGE_KEY = 'miccomed.itemcost.v1'

const MAX_IMPORT_CHARS = 1_000_000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function str(value: unknown, max = 500): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

function num(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  if (!Number.isFinite(n) || n < 0) return fallback
  return n
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}

function parseMaker(value: unknown): Manufacturer | null {
  if (!isRecord(value)) return null
  const name = str(value.name, 160)
  if (!name) return null
  return {
    id: str(value.id, 80) || uid('mfr'),
    name,
    country: str(value.country, 80),
    notes: str(value.notes, 2000),
  }
}

function parseItem(value: unknown, makerIds: Set<string>): Item | null {
  if (!isRecord(value)) return null
  const miccomedSku = str(value.miccomedSku, 40)
  const description = str(value.description, 240)
  const manufacturerId = str(value.manufacturerId, 80)
  if (!miccomedSku || !description || !makerIds.has(manufacturerId)) return null
  const casePack = Math.max(1, Math.round(num(value.casePack, 1)))
  return {
    id: str(value.id, 80) || uid('sku'),
    miccomedSku,
    mfrSku: str(value.mfrSku, 40),
    description,
    category: oneOf<Category>(value.category, CATEGORIES, 'botellas'),
    uom: str(value.uom, 24) || 'unidad',
    casePack,
    hts: str(value.hts, 24),
    origin: str(value.origin, 80),
    incoterm: oneOf<Incoterm>(value.incoterm, INCOTERMS, 'FOB'),
    manufacturerId,
    notes: str(value.notes, 2000),
  }
}

function parseSheet(value: unknown, itemId: string): CostSheet {
  const base = blankSheet(itemId)
  if (!isRecord(value)) return base
  const tiers = { ...base.tiers }
  if (isRecord(value.tiers)) {
    for (const id of TIER_ORDER) {
      const row = value.tiers[id]
      if (!isRecord(row)) continue
      tiers[id as TierId] = {
        targetMarginPct: Math.min(99.9, num(row.targetMarginPct, tiers[id as TierId].targetMarginPct)),
        minMarginPct: Math.min(99.9, num(row.minMarginPct, tiers[id as TierId].minMarginPct)),
      }
    }
  }
  return {
    ...base,
    itemId,
    orderedUnits: num(value.orderedUnits),
    damagePct: Math.min(100, num(value.damagePct)),
    fobUnit: num(value.fobUnit),
    freightIntl: num(value.freightIntl),
    insuranceMode: oneOf<InsuranceMode>(value.insuranceMode, ['percent', 'amount'], 'percent'),
    insurancePct: num(value.insurancePct, base.insurancePct),
    insuranceAmount: num(value.insuranceAmount),
    baseDutyPct: num(value.baseDutyPct),
    additionalDutyPct: num(value.additionalDutyPct),
    dutyOnCif: bool(value.dutyOnCif, false),
    applyMpf: bool(value.applyMpf, true),
    ocean: bool(value.ocean, true),
    brokerFee: num(value.brokerFee),
    inlandMiami: num(value.inlandMiami),
    other: num(value.other),
    tiers,
    note: str(value.note, 2000),
    updatedAt: str(value.updatedAt, 40) || base.updatedAt,
  }
}

export function parseCatalog(raw: string): Catalog | null {
  if (raw.length > MAX_IMPORT_CHARS) return null
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isRecord(data) || !Array.isArray(data.manufacturers) || !Array.isArray(data.items)) return null
  if (data.manufacturers.length > 200 || data.items.length > 500) return null
  const manufacturers = data.manufacturers.map(parseMaker).filter((row): row is Manufacturer => row !== null)
  const makerIds = new Set(manufacturers.map((maker) => maker.id))
  const items = data.items.map((row) => parseItem(row, makerIds)).filter((row): row is Item => row !== null)
  const seen = new Set<string>()
  const uniqueItems: Item[] = []
  for (const item of items) {
    const key = item.miccomedSku.toLowerCase()
    if (seen.has(key) || seen.has(item.id)) continue
    seen.add(key)
    seen.add(item.id)
    uniqueItems.push(item)
  }
  const sheets: Record<string, CostSheet> = {}
  const sourceSheets = isRecord(data.sheets) ? data.sheets : {}
  for (const item of uniqueItems) {
    sheets[item.id] = parseSheet(sourceSheets[item.id], item.id)
  }
  return { version: 1, manufacturers, items: uniqueItems, sheets }
}

export function loadCatalog(): Catalog {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedCatalog()
    return parseCatalog(raw) ?? seedCatalog()
  } catch {
    return seedCatalog()
  }
}

export function saveCatalog(catalog: Catalog): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog))
  } catch {
    /* private mode or a full disk: the session still works in memory */
  }
}
