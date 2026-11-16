import { useState } from 'react'
import type { Catalog } from '../domain/types'
import { parseCatalog } from '../domain/store'

export function BackupBar({
  catalog,
  onReplace,
  onReset,
}: {
  catalog: Catalog
  onReplace: (catalog: Catalog) => void
  onReset: () => void
}) {
  const [message, setMessage] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  function exportFile() {
    const blob = new Blob([JSON.stringify(catalog, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'miccomed-itemcost.json'
    link.click()
    URL.revokeObjectURL(url)
    setMessage('Archivo descargado.')
  }

  function importFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = parseCatalog(String(reader.result ?? ''))
      if (!parsed || parsed.items.length === 0) {
        setMessage('No se pudo leer. Use un JSON exportado desde ItemCost.')
        return
      }
      onReplace(parsed)
      setMessage('Datos importados en este navegador.')
      setConfirmReset(false)
    }
    reader.readAsText(file)
  }

  return (
    <details className="backup">
      <summary>Respaldo en este navegador</summary>
      <p>Los cambios se guardan solos aquí. No viajan a otro equipo ni a otro navegador.</p>
      <div className="backup-actions">
        <button type="button" className="btn ghost" onClick={exportFile}>
          Exportar JSON
        </button>
        <label className="btn ghost file-btn">
          Importar JSON
          <input
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              importFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </label>
        {confirmReset ? (
          <>
            <button type="button" className="btn danger" onClick={onReset}>
              Sí, restaurar muestra
            </button>
            <button type="button" className="btn ghost" onClick={() => setConfirmReset(false)}>
              Cancelar
            </button>
          </>
        ) : (
          <button type="button" className="btn ghost" onClick={() => setConfirmReset(true)}>
            Restaurar muestra
          </button>
        )}
      </div>
      {message ? (
        <p className="status" role="status">
          {message}
        </p>
      ) : null}
    </details>
  )
}
