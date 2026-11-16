import { useMemo, useState } from 'react'
import { computeCost } from '../domain/calc'
import type { Catalog, CostSheet } from '../domain/types'
import { CATEGORY_LABEL } from '../domain/types'
import { Assumptions } from './Assumptions'
import { BackupBar } from './BackupBar'
import { LegalNote } from './LegalNote'
import { Ladder } from './Ladder'
import { Stack } from './Stack'
import { money, moneyAuto, pct, qty } from './format'

export function Workbench({
  catalog,
  selectedId,
  onSelect,
  onChangeSheet,
  onEditItem,
  onReplace,
  onReset,
}: {
  catalog: Catalog
  selectedId: string
  onSelect: (id: string) => void
  onChangeSheet: (itemId: string, sheet: CostSheet) => void
  onEditItem: (id: string) => void
  onReplace: (catalog: Catalog) => void
  onReset: () => void
}) {
  const [query, setQuery] = useState('')
  const makers = useMemo(
    () => new Map(catalog.manufacturers.map((maker) => [maker.id, maker])),
    [catalog.manufacturers],
  )
  const costs = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeCost>>()
    for (const item of catalog.items) {
      const sheet = catalog.sheets[item.id]
      if (sheet) map.set(item.id, computeCost(sheet, item.casePack))
    }
    return map
  }, [catalog])

  const needle = query.trim().toLowerCase()
  const visible = catalog.items.filter((item) => {
    if (!needle) return true
    const maker = makers.get(item.manufacturerId)
    return [item.miccomedSku, item.mfrSku, item.description, item.hts, item.origin, maker?.name]
      .join(' ')
      .toLowerCase()
      .includes(needle)
  })

  const item = catalog.items.find((row) => row.id === selectedId) ?? null
  const sheet = item ? catalog.sheets[item.id] : undefined
  const result = item ? costs.get(item.id) : undefined
  const maker = item ? makers.get(item.manufacturerId) : undefined

  return (
    <div className="workspace">
      <aside className="sku-col">
        <label className="search">
          <span>Buscar</span>
          <input
            type="search"
            value={query}
            placeholder="SKU, HTS, origen"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <p className="sku-count">
          {visible.length} de {catalog.items.length}
        </p>
        <div className="sku-list" role="listbox" aria-label="Artículos">
          {visible.map((row) => {
            const cost = costs.get(row.id)
            const under = cost?.tiers.some((tier) => tier.belowFloor) ?? false
            return (
              <button
                key={row.id}
                type="button"
                role="option"
                aria-selected={row.id === selectedId}
                className="sku-row"
                onClick={() => onSelect(row.id)}
              >
                <span className="sku-code">{row.miccomedSku}</span>
                <span className="sku-sub">
                  <span className="sku-desc">{row.description}</span>
                  <span className="sku-ulc">{moneyAuto(cost?.ulc)}</span>
                  {under ? <em className="mini-flag">piso</em> : null}
                </span>
              </button>
            )
          })}
        </div>
      </aside>

      <section className="sheet-col">
        {item && sheet && result ? (
          <>
            <label className="sku-mobile">
              <span>Artículo</span>
              <select value={item.id} onChange={(event) => onSelect(event.target.value)}>
                {catalog.items.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.miccomedSku}
                  </option>
                ))}
              </select>
            </label>
            <header className="identity">
              <p className="eyebrow">
                {CATEGORY_LABEL[item.category]} · {item.origin} · {item.incoterm}
              </p>
              <h1>{item.miccomedSku}</h1>
              <p className="lede">{item.description}</p>
              <p className="meta">
                {maker?.name ?? 'Sin fabricante'} · {maker?.country ?? ''} · HTS {item.hts || 'sin código'} ·{' '}
                {item.casePack} {item.uom}/caja · SKU fábrica {item.mfrSku || '—'}
              </p>
              <button type="button" className="text-btn" onClick={() => onEditItem(item.id)}>
                Editar ficha
              </button>
            </header>

            <div className="ulc-block">
              <p className="ulc-kicker">Costo unitario aterrizado</p>
              <p className="ulc-value">{money(result.ulc, 4)}</p>
              <p className="ulc-aside">
                Caja {money(result.ulcPerCase, 2)} · {qty(result.sellableUnits)} vendibles de{' '}
                {qty(result.orderedUnits)} · merma {pct(sheet.damagePct)}
              </p>
            </div>

            <Stack result={result} />
            <p className="fixed-note">
              Fijos del embarque {money(result.fixedShipment)} · {moneyAuto(result.fixedPerUnit)} por unidad
              vendible a este volumen.
              {result.mpfBand === 'min' ? ' El MPF está en el mínimo, así que no baja al pedir una unidad más.' : ''}
            </p>
            {result.warnings.length > 0 ? (
              <ul className="warnings">
                {result.warnings.map((warning) => (
                  <li key={warning.code}>{warning.text}</li>
                ))}
              </ul>
            ) : null}
            {item.notes ? <p className="item-note">{item.notes}</p> : null}
            <Ladder
              result={result}
              sheet={sheet}
              casePack={item.casePack}
              onChange={(next) => onChangeSheet(item.id, next)}
            />
          </>
        ) : (
          <div className="empty">
            <p>No hay artículos en este navegador.</p>
            <button type="button" className="btn" onClick={onReset}>
              Restaurar muestra
            </button>
          </div>
        )}
      </section>

      <aside className="assume-col">
        {item && sheet && result ? (
          <Assumptions
            item={item}
            sheet={sheet}
            result={result}
            onChange={(next) => onChangeSheet(item.id, next)}
          />
        ) : null}
        <BackupBar catalog={catalog} onReplace={onReplace} onReset={onReset} />
        <LegalNote />
      </aside>
    </div>
  )
}
