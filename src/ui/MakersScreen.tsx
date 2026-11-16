import { useEffect, useState } from 'react'
import type { Catalog, Manufacturer } from '../domain/types'
import { uid } from '../domain/types'
import { BackupBar } from './BackupBar'
import { TextField } from './Fields'
import { LegalNote } from './LegalNote'

function blankMaker(): Manufacturer {
  return { id: uid('mfr'), name: '', country: '', notes: '' }
}

export function MakersScreen({
  catalog,
  onSave,
  onDelete,
  onReplace,
  onReset,
}: {
  catalog: Catalog
  onSave: (maker: Manufacturer, isNew: boolean) => void
  onDelete: (id: string) => string | null
  onReplace: (catalog: Catalog) => void
  onReset: () => void
}) {
  const [selectedId, setSelectedId] = useState(catalog.manufacturers[0]?.id ?? '')
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<Manufacturer | null>(catalog.manufacturers[0] ?? null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    const current = catalog.manufacturers.find((maker) => maker.id === selectedId)
    setDraft(current ? { ...current } : null)
    setCreating(false)
    setError(null)
    setConfirmDelete(false)
  }, [selectedId, catalog.manufacturers])

  function cancelCreate() {
    const current = catalog.manufacturers.find((maker) => maker.id === selectedId)
    setDraft(current ? { ...current } : null)
    setCreating(false)
    setError(null)
    setConfirmDelete(false)
  }

  function startNew() {
    setCreating(true)
    setError(null)
    setConfirmDelete(false)
    setDraft(blankMaker())
  }

  function save() {
    if (!draft) return
    const next = {
      ...draft,
      name: draft.name.trim(),
      country: draft.country.trim(),
      notes: draft.notes.trim(),
    }
    if (!next.name) {
      setError('El nombre es obligatorio.')
      return
    }
    if (!next.country) {
      setError('El país es obligatorio.')
      return
    }
    setError(null)
    onSave(next, creating)
    setSelectedId(next.id)
    setCreating(false)
  }

  function remove() {
    if (!draft) return
    const message = onDelete(draft.id)
    if (message) {
      setError(message)
      setConfirmDelete(false)
      return
    }
    setSelectedId(catalog.manufacturers.find((maker) => maker.id !== draft.id)?.id ?? '')
  }

  const activeId = creating ? null : draft?.id

  return (
    <div className="crud">
      <div className="crud-list">
        <div className="crud-bar">
          <div>
            <h1>Fabricantes</h1>
            <p className="lede tight">Quién cotiza y desde qué país sale la mercancía.</p>
          </div>
          <button type="button" className="btn" onClick={startNew}>
            Nuevo fabricante
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <caption className="sr">Fabricantes</caption>
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">País</th>
                <th scope="col">Artículos</th>
              </tr>
            </thead>
            <tbody>
              {catalog.manufacturers.map((maker) => {
                const count = catalog.items.filter((item) => item.manufacturerId === maker.id).length
                return (
                  <tr key={maker.id} data-active={maker.id === activeId ? 'true' : undefined}>
                    <td>
                      <button type="button" className="linkish" onClick={() => setSelectedId(maker.id)}>
                        {maker.name}
                      </button>
                    </td>
                    <td>{maker.country}</td>
                    <td className="mono">{count}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {catalog.manufacturers.length === 0 ? <p className="empty-line">No hay fabricantes.</p> : null}
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
            <h2>{creating ? 'Nuevo fabricante' : 'Ficha'}</h2>
            <div className="fields">
              <TextField
                wide
                label="Nombre"
                value={draft.name}
                maxLength={160}
                onChange={(value) => setDraft({ ...draft, name: value })}
              />
              <TextField
                wide
                label="País"
                value={draft.country}
                maxLength={80}
                onChange={(value) => setDraft({ ...draft, country: value })}
              />
            </div>
            <label className="field wide">
              <span>Notas</span>
              <textarea
                rows={5}
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
                Guardar
              </button>
              {!creating ? (
                confirmDelete ? (
                  <>
                    <button type="button" className="btn danger" onClick={remove}>
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
          <p className="empty-line">Agregue un fabricante para colgarle artículos.</p>
        )}
      </div>
    </div>
  )
}
