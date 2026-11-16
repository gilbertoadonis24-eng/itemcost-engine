import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/anybody/700.css'
import '@fontsource/anybody/800.css'
import '@fontsource/figtree/400.css'
import '@fontsource/figtree/500.css'
import '@fontsource/figtree/600.css'
import '@fontsource/figtree/700.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import { App } from './App'
import './styles.css'

const root = document.getElementById('root')
if (!root) throw new Error('Falta el nodo raíz')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
