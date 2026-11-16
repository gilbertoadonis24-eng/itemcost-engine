import { useEffect, useState } from 'react'
import { blankSheet } from './domain/types'
import type { Catalog, CostSheet, Item, Manufacturer } from './domain/types'
import { DEFAULT_ITEM_ID, seedCatalog } from './domain/seed'
import { loadCatalog, saveCatalog } from './domain/store'
import { ItemsScreen } from './ui/ItemsScreen'
import { MakersScreen } from './ui/MakersScreen'
import { Workbench } from './ui/Workbench'

type View = 'motor' | 'items' | 'makers'

export function App() {
  const [catalog, setCatalog] = useState<Catalog>(() => loadCatalog())
  const [view, setView] = useState<View>('motor')
  const [selectedId, setSelectedId] = useState(DEFAULT_ITEM_ID)

  useEffect(() => {
    saveCatalog(catalog)
  }, [catalog])

  useEffect(() => {
    if (catalog.items.some((item) => item.id === selectedId)) return
    setSelectedId(catalog.items[0]?.id ?? '')
  }, [catalog.items, selectedId])

  function updateSheet(itemId: string, sheet: CostSheet) {
    setCatalog((prev) => ({
      ...prev,
      sheets: {
        ...prev.sheets,
        [itemId]: { ...sheet, itemId, updatedAt: new Date().toISOString() },
      },
    }))
  }

  function saveItem(item: Item, isNew: boolean) {
    setCatalog((prev) => {
      const items = isNew ? [...prev.items, item] : prev.items.map((row) => (row.id === item.id ? item : row))
      const sheets = prev.sheets[item.id] ? prev.sheets : { ...prev.sheets, [item.id]: blankSheet(item.id) }
      return { ...prev, items, sheets }
    })
    setSelectedId(item.id)
  }

  function deleteItem(id: string) {
    setCatalog((prev) => {
      const sheets = { ...prev.sheets }
      delete sheets[id]
      return { ...prev, items: prev.items.filter((item) => item.id !== id), sheets }
    })
    setView('items')
  }

  function saveMaker(maker: Manufacturer, isNew: boolean) {
    setCatalog((prev) => ({
      ...prev,
      manufacturers: isNew
        ? [...prev.manufacturers, maker]
        : prev.manufacturers.map((row) => (row.id === maker.id ? maker : row)),
    }))
  }

  function deleteMaker(id: string): string | null {
    if (catalog.items.some((item) => item.manufacturerId === id)) {
      return 'Hay artículos con este fabricante. Reasígnelos antes de borrarlo.'
    }
    setCatalog((prev) => ({
      ...prev,
      manufacturers: prev.manufacturers.filter((maker) => maker.id !== id),
    }))
    return null
  }

  function replaceCatalog(next: Catalog) {
    setCatalog(next)
    setSelectedId((current) => (next.items.some((item) => item.id === current) ? current : (next.items[0]?.id ?? '')))
    setView('motor')
  }

  function resetCatalog() {
    setCatalog(seedCatalog())
    setSelectedId(DEFAULT_ITEM_ID)
    setView('motor')
  }

  return (
    <div className="app">
      <a className="skip" href="#contenido">
        Saltar al contenido
      </a>
      <header className="top">
        <div className="brand">
          <svg className="mark" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="6" fill="#f0a44a" />
            <path
              fill="#081416"
              d="M12 6h8l1 3.4c.6 2 .9 4.1.9 6.2V25c0 .7-.5 1.2-1.2 1.2h-8.4c-.7 0-1.2-.5-1.2-1.2v-9.4c0-2.1.3-4.2.9-6.2L12 6z"
            />
            <rect x="14.2" y="4.2" width="3.6" height="2.1" rx="0.4" fill="#081416" />
          </svg>
          <div>
            <p className="brand-name">MiccoMed</p>
            <p className="brand-product">ItemCost</p>
          </div>
        </div>
        <nav aria-label="Secciones">
          <button type="button" aria-current={view === 'motor' ? 'page' : undefined} onClick={() => setView('motor')}>
            Motor
          </button>
          <button type="button" aria-current={view === 'items' ? 'page' : undefined} onClick={() => setView('items')}>
            Artículos
          </button>
          <button
            type="button"
            aria-current={view === 'makers' ? 'page' : undefined}
            onClick={() => setView('makers')}
          >
            Fabricantes
          </button>
        </nav>
        <p className="place">Miami · USD</p>
      </header>
      <main id="contenido">
        {view === 'motor' ? (
          <Workbench
            catalog={catalog}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChangeSheet={updateSheet}
            onEditItem={(id) => {
              setSelectedId(id)
              setView('items')
            }}
            onReplace={replaceCatalog}
            onReset={resetCatalog}
          />
        ) : null}
        {view === 'items' ? (
          <ItemsScreen
            catalog={catalog}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onSave={saveItem}
            onDelete={deleteItem}
            onReplace={replaceCatalog}
            onReset={resetCatalog}
          />
        ) : null}
        {view === 'makers' ? (
          <MakersScreen
            catalog={catalog}
            onSave={saveMaker}
            onDelete={deleteMaker}
            onReplace={replaceCatalog}
            onReset={resetCatalog}
          />
        ) : null}
      </main>
    </div>
  )
}
