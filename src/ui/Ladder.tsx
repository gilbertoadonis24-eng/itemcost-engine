import type { CostResult } from '../domain/calc'
import type { CostSheet, TierId } from '../domain/types'
import { TIER_HINT, TIER_LABEL } from '../domain/types'
import { moneyAuto, pct } from './format'

export function Ladder({
  result,
  sheet,
  casePack,
  onChange,
}: {
  result: CostResult
  sheet: CostSheet
  casePack: number
  onChange: (sheet: CostSheet) => void
}) {
  function setMargin(id: TierId, key: 'targetMarginPct' | 'minMarginPct', raw: string) {
    const parsed = raw === '' ? 0 : Number(raw)
    if (!Number.isFinite(parsed) || parsed < 0) return
    const value = Math.min(99.9, parsed)
    onChange({
      ...sheet,
      tiers: {
        ...sheet.tiers,
        [id]: { ...sheet.tiers[id], [key]: value },
      },
    })
  }

  return (
    <div className="ladder-wrap">
      <div className="ladder">
        {result.tiers.map((tier) => {
          const casePrice =
            tier.price != null && casePack > 0 ? tier.price * casePack : null
          return (
            <section
              key={tier.id}
              className={tier.belowFloor ? 'tier is-under' : 'tier'}
              aria-label={TIER_LABEL[tier.id]}
            >
              <header className="tier-head">
                <h3>{TIER_LABEL[tier.id]}</h3>
                <p>{TIER_HINT[tier.id]}</p>
              </header>
              <p className="tier-price">{moneyAuto(tier.price)}</p>
              <p className="tier-case">Caja {moneyAuto(casePrice)}</p>
              {tier.belowFloor ? (
                <p className="flag">Bajo el piso · {moneyAuto(tier.floorPrice)}</p>
              ) : (
                <p className="floor-ok">Piso {moneyAuto(tier.floorPrice)}</p>
              )}
              <dl className="tier-stats">
                <div>
                  <dt>Sobre venta</dt>
                  <dd>{pct(tier.marginOnSellPct)}</dd>
                </div>
                <div>
                  <dt>Cost-plus</dt>
                  <dd>{pct(tier.costPlusPct)}</dd>
                </div>
                <div>
                  <dt>Margen USD</dt>
                  <dd>{moneyAuto(tier.marginDollars)}</dd>
                </div>
              </dl>
              <label className="mini">
                <span>Objetivo %</span>
                <input
                  type="number"
                  min={0}
                  max={99.9}
                  step="0.1"
                  aria-label={`Margen objetivo ${TIER_LABEL[tier.id]}`}
                  value={sheet.tiers[tier.id].targetMarginPct}
                  onChange={(event) => setMargin(tier.id, 'targetMarginPct', event.target.value)}
                />
              </label>
              <label className="mini">
                <span>Piso %</span>
                <input
                  type="number"
                  min={0}
                  max={99.9}
                  step="0.1"
                  aria-label={`Margen piso ${TIER_LABEL[tier.id]}`}
                  value={sheet.tiers[tier.id].minMarginPct}
                  onChange={(event) => setMargin(tier.id, 'minMarginPct', event.target.value)}
                />
              </label>
            </section>
          )
        })}
      </div>
      <p className="formula">
        Precio = costo unitario ÷ (1 − margen sobre venta). Cost-plus = (precio − costo) ÷ costo.
        Bajo el piso no se publica sin autorización.
      </p>
    </div>
  )
}
