# MiccoMed ItemCost

Motor en español para el costo aterrizado en Miami y los precios B2B del catálogo de MiccoMed. Arma la hoja de un embarque y muestra, en el mismo pantallazo, el costo unitario y la escalera Lista / Nivel A / Nivel B / Contrato.

## Qué hace

- Fabricantes: nombre, país y notas.
- Artículos: SKU MiccoMed, SKU de fábrica, descripción, categoría, unidad, unidades por caja, HTS, origen e Incoterm.
- Hoja por artículo: FOB, flete internacional, seguro, arancel base, arancel adicional, MPF, HMF si es océano, broker, inland a Miami y otros.
- Costo unitario aterrizado (ULC) = costo del embarque ÷ unidades vendibles, después de la merma.
- Precio del nivel = ULC ÷ (1 − margen sobre venta).
- Ocho SKU de muestra. Los cambios quedan en este navegador (`localStorage`, clave `miccomed.itemcost.v1`).

No es una liquidación ni asesoría legal: HTS, Sección 301 y el tipo de entrada hay que confirmarlos con un broker.

## Cómo correrlo

```bash
npm install
npm test
npm run dev
```

Abre http://127.0.0.1:5173/

`npm run build` genera el sitio estático en `dist/`.
