# @fluid-element/lit-grid

Package del monorepo in `element/litelement/lit-grid`. Griglia LitElement equivalente a [Polymer `paper-grid`](https://github.com/fluidnext/paper-grid): tile trascinabili, ridimensionabili, collisioni, autogrow e placeholder.

Si installa come dipendenza workspace:

```bash
npm install @fluid-element/lit-grid
```

## Avvio demo

Dalla root del repo:

```bash
npm install
npm run demo:lit-grid
```

Apre `http://localhost:5183` con i controlli sulle proprietà. La demo usa [`@material/web`](https://github.com/material-components/material-web) solo come `devDependency`.

```bash
npm run test:elements
npm run typecheck -w @fluid-element/lit-grid
```

## Uso

```html
<script type="module">
  import '@fluid-element/lit-grid';
</script>

<lit-grid draggable resizable cell-width="80" cell-height="64" cell-margin="8" col-count="8" row-count="6">
  <div col="0" row="0" width="2" height="2">Host</div>
  <div col="2" row="0" width="3" height="1">
    Playlist
    <span resize="bottom-right"></span>
  </div>
  <div placeholder></div>
</lit-grid>
```

Ogni figlia diretta è una tile. `col`, `row`, `width` e `height` sono in celle. Le maniglie di resize hanno l'attributo `resize` (`top`, `bottom`, `left`, `right`, `top-left`, `top-right`, `bottom-left`, `bottom-right`).

## Proprietà

| Attributo | Tipo | Default | Origine |
|-----------|------|---------|---------|
| `cell-height` | number | `100` | paper-grid |
| `cell-width` | number | `100` | paper-grid |
| `cell-margin` | number | `0` | paper-grid |
| `min-width` / `min-height` | number | `1` | paper-grid |
| `max-width` / `max-height` | number | `Infinity` | paper-grid |
| `col-count` / `row-count` | number | `10` | paper-grid |
| `col-autogrow` / `row-autogrow` | boolean | `false` | paper-grid |
| `col-no-scroll` / `row-no-scroll` | boolean | `false` | lit-grid — nessun scroll; con autogrow aggiunge col/row per occupare il contenitore |
| `animated` | boolean | `false` | paper-grid |
| `draggable` | boolean | `false` | paper-grid |
| `resizable` | boolean | `false` | paper-grid |
| `overlappable` | boolean | `false` | paper-grid |
| `show-grid` | boolean | `false` | lit-grid — reticolato a puntini delle celle (`cell-width` / `cell-height` / `cell-margin`) |
| `widget-min-width` / `widget-min-height` | number | `0` | lit-grid — size minima in px dei componenti, senza cambiare le celle della griglia |

CSS custom property `--paper-grid-background-placeholder`: colore del placeholder durante drag/resize. `--lit-grid-dot`: colore dei puntini di `show-grid`.

## Metodi

| Metodo | Ruolo |
|--------|--------|
| `computeStyles()` | Ricalcola dimensioni e posizioni |
| `ensureSpace(tile)` | Espande la griglia se autogrow |
| `getCoordinates(tile)` | Legge col/row/width/height |
| `getClosestPosition(x, y, rows?, cols?)` | Cella più vicina a un punto in px |
| `getClosestSize(width, height)` | Dimensione in celle più vicina |
| `getResizerHost(resizer)` | Tile che ospita la maniglia |
| `serialize()` | Stato JSON delle tile |
| `gridWidth()` / `gridHeight()` | Dimensioni in px |
| `visibleColCount()` / `visibleRowCount()` | Celle che stanno nella viewport |
| `clampDragPixels(left, top, w, h)` | Blocca il drag nel perimetro visibile |
| `growToFill()` | Con autogrow + no-scroll riempie il contenitore |
| `minTileCols()` / `minTileRows()` | Celle minime di una tile, inclusi i vincoli widget |
| `enforceWidgetMins()` | Aggiorna a runtime le tile sotto `widget-min-width` / `widget-min-height` |

## Eventi

| Evento | Dettaglio |
|--------|-----------|
| `move` | `{ grid, tile }` dopo un drop |
| `resize` | `{ grid, tile }` dopo un resize |
