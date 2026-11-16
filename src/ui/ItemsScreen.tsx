import { useEffect, useMemo, useState } from 'react'
import { computeCost } from '../domain/calc'
import type { Catalog, Category, Incoterm, Item } from '../domain/types'
import { CATEGORIES, CATEGORY_LABEL, INCOTERMS, uid } from '../domain/types'
import { BackupBar } from './BackupBar'
import { Num, SelectField, TextField } from './Fields'
import { LegalNote } from './LegalNote'
import { moneyAuto } from './format'

function blankItem(manufacturerId: string): Item {
  return {
    id: uid('sku'),
    miccomedSku: '',
    mfrSku: '',
    description: '',
    category: 'botellas',
    uom: 'unidad',
    casePack: 1,
    hts: '',
    origin: '',
    incoterm: 'FOB',
    manufacturerId,
    notes: '',
  }
}

export function ItemsScreen({
  catalog,
  selectedId,
  onSelect,
  onSave,
  onDelete,
  onReplace,
  onReset,
}: {
  catalog: Catalog
  selectedId: string
  onSelect: (id: string) => void
  onSave: (item: Item, isNew: boolean) => void
  onDelete: (id: string) => void
  onReplace: (catalog: Catalog) => void
  onReset: () => void
}) {
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<Item | null>(() => {
    const current = catalog.items.find((item) => item.id === selectedId)
    return current ? { ...current } : null
  })
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    const current = catalog.items.find((item) => item.id === selectedId)
    setDraft(current ? { ...current } : null)
    setCreating(false)
    setError(null)
    setConfirmDelete(false)
  }, [selectedId, catalog.items])

  const costs = useMemo(() => {
    const map = new Map<string, number | null>()
    for (const item of catalog.items) {
      const sheet = catalog.sheets[item.id]
      map.set(item.id, sheet ? computeCost(sheet, item.casePack).ulc : null)
    }
    return map
  }, [catalog])

  function cancelCreate() {
    const current = catalog.items.find((item) => item.id === selectedId)
    setDraft(current ? { ...current } : null)
    setCreating(false)
    setError(null)
    setConfirmDelete(false)
  }

  function startNew() {
    if (catalog.manufacturers.length === 0) {
      setError('Cree un fabricante antes de agregar un artículo.')
      return
    }
    setCreating(true)
    setConfirmDelete(false)
    setError(null)
    setDraft(blankItem(catalog.manufacturers[0].id))
  }

  function save() {
    if (!draft) return
    const next: Item = {
      ...draft,
      miccomedSku: draft.miccomedSku.trim(),
      mfrSku: draft.mfrSku.trim(),
      description: draft.description.trim(),
      uom: draft.uom.trim() || 'unidad',
      origin: draft.origin.trim(),
      hts: draft.hts.trim(),
      notes: draft.notes.trim(),
      casePack: Math.max(1, Math.round(draft.casePack || 1)),
    }
    if (!next.miccomedSku) {
      setError('El SKU MiccoMed es obligatorio.')
      return
    }
    if (!next.description) {
      setError('La descripción es obligatoria.')
      return
    }
    if (!next.manufacturerId) {
      setError('Elija un fabricante.')
      return
    }
    const duplicate = catalog.items.some(
      (item) =>
        item.id !== next.id && item.miccomedSku.toLowerCase() === next.miccomedSku.toLowerCase(),
    )
    if (duplicate) {
      setError('Ese SKU MiccoMed ya existe.')
      return
    }
    setError(null)
    onSave(next, creating)
    setCreating(false)
  }

  const activeId = creating ? null : draft?.id

  return (
    <div className="crud">
      <div className="crud-list">
        <div className="crud-bar">
          <div>
            <h1>Artículos</h1>
            <p className="lede tight">Ficha maestra. El costo vive en el motor.</p>
          </div>
          <button type="button" className="btn" onClick={startNew}>
            Nuevo artículo
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <caption className="sr">Artículos del catálogo</caption>
            <thead>
              <tr>
                <th scope="col">SKU</th>
                <th scope="col">Descripción</th>
                <th scope="col">Origen</th>
                <th scope="col">HTS</th>
                <th scope="col">ULC</th>
              </tr>
            </thead>
            <tbody>
              {catalog.items.map((item) => (
                <tr key={item.id} data-active={item.id === activeId ? 'true' : undefined}>
                  <td>
                    <button type="button" className="linkish" onClick={() => onSelect(item.id)}>
                      {item.miccomedSku}
                    </button>
                  </td>
                  <td>{item.description}</td>
                  <td>
                    {item.origin} · {item.incoterm}
                  </td>
                  <td className="mono">{item.hts || '—'}</td>
                  <td className="mono">{moneyAuto(costs.get(item.id))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {catalog.items.length === 0 ? <p className="empty-line">No hay artículos.</p> : null}
        </div>
        <BackupBar catalog={catalog} onReplace={onReplace} onReset={onReset} />
        <LegalNote />
      </div>
      <div className="crud-form">
        {draft ? (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              save()
            }}
          >
            <h2>{creating ? 'Nuevo artículo' : 'Ficha'}</h2>
            <div className="fields">
              <TextField
                wide
                label="SKU MiccoMed"
                value={draft.miccomedSku}
                maxLength={40}
                onChange={(value) => setDraft({ ...draft, miccomedSku: value })}
              />
              <TextField
                label="SKU fábrica"
                value={draft.mfrSku}
                maxLength={40}
                onChange={(value) => setDraft({ ...draft, mfrSku: value })}
              />
              <SelectField
                label="Categoría"
                value={draft.category}
                onChange={(value) => setDraft({ ...draft, category: value as Category })}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_LABEL[category]}
                  </option>
                ))}
              </SelectField>
              <TextField
                wide
                label="Descripción"
                value={draft.description}
                maxLength={240}
                onChange={(value) => setDraft({ ...draft, description: value })}
              />
              <TextField
                label="Unidad"
                value={draft.uom}
                maxLength={24}
                onChange={(value) => setDraft({ ...draft, uom: value })}
              />
              <Num
                label="Unidades por caja"
                value={draft.casePack}
                step="1"
                max={100000}
                onChange={(value) => setDraft({ ...draft, casePack: value })}
              />
              <TextField
                label="HTS"
                value={draft.hts}
                maxLength={24}
                onChange={(value) => setDraft({ ...draft, hts: value })}
              />
              <TextField
                label="Origen"
                value={draft.origin}
                maxLength={80}
                onChange={(value) => setDraft({ ...draft, origin: value })}
              />
              <SelectField
                label="Incoterm"
                value={draft.incoterm}
                onChange={(value) => setDraft({ ...draft, incoterm: value as Incoterm })}
              >
                {INCOTERMS.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Fabricante"
                value={draft.manufacturerId}
                onChange={(value) => setDraft({ ...draft, manufacturerId: value })}
              >
                {catalog.manufacturers.map((maker) => (
                  <option key={maker.id} value={maker.id}>
                    {maker.name}
                  </option>
                ))}
              </SelectField>
            </div>
            <label className="field wide">
              <span>Notas</span>
              <textarea
                rows={4}
                maxLength={2000}
                value={draft.notes}
                onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
              />
            </label>
            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="form-actions">
              <button type="submit" className="btn">
                Guardar ficha
              </button>
              {!creating ? (
                confirmDelete ? (
                  <>
                    <button type="button" className="btn danger" onClick={() => onDelete(draft.id)}>
                      Sí, eliminar
                    </button>
                    <button type="button" className="btn ghost" onClick={() => setConfirmDelete(false)}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn ghost" onClick={() => setConfirmDelete(true)}>
                    Eliminar
                  </button>
                )
              ) : (
                <button type="button" className="btn ghost" onClick={cancelCreate}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        ) : (
          <p className="empty-line">Seleccione un artículo o cree uno.</p>
        )}
      </div>
    </div>
  )
}
