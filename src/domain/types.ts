export type TierId = 'LIST' | 'TIER_A' | 'TIER_B' | 'CONTRACT'

export const TIER_ORDER: TierId[] = ['LIST', 'TIER_A', 'TIER_B', 'CONTRACT']

export type Category = 'botellas' | 'tapas' | 'cajas' | 'oficina' | 'kits'

export type Incoterm = 'EXW' | 'FOB' | 'CFR' | 'CIF' | 'FCA' | 'DDP' | 'DOMESTICO'

export type InsuranceMode = 'percent' | 'amount'

export type Manufacturer = {
  id: string
  name: string
  country: string
  notes: string
}

export type Item = {
  id: string
  miccomedSku: string
  mfrSku: string
  description: string
  category: Category
  uom: string
  casePack: number
  hts: string
  origin: string
  incoterm: Incoterm
  manufacturerId: string
  notes: string
}

export type TierMargin = {
  targetMarginPct: number
  minMarginPct: number
}

export type CostSheet = {
  itemId: string
  orderedUnits: number
  damagePct: number
  fobUnit: number
  freightIntl: number
  insuranceMode: InsuranceMode
  insurancePct: number
  insuranceAmount: number
  baseDutyPct: number
  additionalDutyPct: number
  dutyOnCif: boolean
  applyMpf: boolean
  ocean: boolean
  brokerFee: number
  inlandMiami: number
  other: number
  tiers: Record<TierId, TierMargin>
  note: string
  updatedAt: string
}

export type Catalog = {
  version: 1
  manufacturers: Manufacturer[]
  items: Item[]
  sheets: Record<string, CostSheet>
}

export const CATEGORY_LABEL: Record<Category, string> = {
  botellas: 'Botellas',
  tapas: 'Tapas',
  cajas: 'Cajas',
  oficina: 'Consultorio',
  kits: 'Kits',
}

export const INCOTERMS: Incoterm[] = ['EXW', 'FOB', 'CFR', 'CIF', 'FCA', 'DDP', 'DOMESTICO']

export const CATEGORIES: Category[] = ['botellas', 'tapas', 'cajas', 'oficina', 'kits']

export const TIER_LABEL: Record<TierId, string> = {
  LIST: 'Lista',
  TIER_A: 'Nivel A',
  TIER_B: 'Nivel B',
  CONTRACT: 'Contrato',
}

export const TIER_HINT: Record<TierId, string> = {
  LIST: 'Cuenta nueva',
  TIER_A: 'Cuenta activa',
  TIER_B: 'Volumen',
  CONTRACT: 'Acuerdo',
}

export const INCOTERM_HINT: Record<Incoterm, string> = {
  EXW: 'EXW: el flete debe incluir el tramo de la fábrica al puerto y el tramo internacional.',
  FOB: 'FOB: la mercancía es el valor en origen. Sume flete internacional y seguro hasta el puerto de EE. UU.',
  CFR: 'CFR: el flete ya va en el precio. No lo duplique. El seguro todavía falta.',
  CIF: 'CIF: flete y seguro ya van en el precio. Déjelos en cero si no quiere contarlos dos veces.',
  FCA: 'FCA: sume el transporte desde el punto de entrega hasta el almacén de Miami.',
  DDP: 'DDP: si el precio ya incluye arancel y flete, no los vuelva a sumar.',
  DOMESTICO: 'Compra en EE. UU.: sin arancel, sin MPF y sin HMF. El inland es flete doméstico.',
}

export const DEFAULT_TIERS: Record<TierId, TierMargin> = {
  LIST: { targetMarginPct: 42, minMarginPct: 32 },
  TIER_A: { targetMarginPct: 35, minMarginPct: 28 },
  TIER_B: { targetMarginPct: 30, minMarginPct: 24 },
  CONTRACT: { targetMarginPct: 24, minMarginPct: 18 },
}

const SEED_STAMP = '2026-11-16T15:00:00.000Z'

export function blankSheet(itemId: string, patch: Partial<CostSheet> = {}): CostSheet {
  const tiers = { ...DEFAULT_TIERS }
  if (patch.tiers) {
    for (const id of TIER_ORDER) {
      const next = patch.tiers[id]
      if (next) tiers[id] = { ...tiers[id], ...next }
    }
  }
  const rest: Partial<CostSheet> = { ...patch }
  delete rest.tiers
  delete rest.itemId
  return {
    itemId,
    orderedUnits: 0,
    damagePct: 0,
    fobUnit: 0,
    freightIntl: 0,
    insuranceMode: 'percent',
    insurancePct: 0.35,
    insuranceAmount: 0,
    baseDutyPct: 0,
    additionalDutyPct: 0,
    dutyOnCif: false,
    applyMpf: true,
    ocean: true,
    brokerFee: 0,
    inlandMiami: 0,
    other: 0,
    note: '',
    updatedAt: SEED_STAMP,
    ...rest,
    tiers,
  }
}

export function uid(prefix: string): string {
  const bytes = crypto.randomUUID().replace(/-/g, '').slice(0, 8)
  return `${prefix}-${bytes}`
}
