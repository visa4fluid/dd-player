# lit-tooltip

Tooltip LitElement in TypeScript. Replica [Polymer `paper-tooltip`](https://github.com/PolymerElements/paper-tooltip): ancora per `for` o sul genitore, direzioni, delay e animazioni fade/scale.

Workspace: `@fluid-element/lit-tooltip`.

## Avvio demo

Dalla root del repo:

```bash
npm install
npm run demo:lit-tooltip
```

Apre `http://localhost:5184`.

```bash
npm run test -w @fluid-element/lit-tooltip
npm run typecheck -w @fluid-element/lit-tooltip
```

## Uso

```html
<script type="module">
  import '@fluid-element/lit-tooltip';
</script>

<button id="save">Salva</button>
<lit-tooltip for="save">Salva la playlist</lit-tooltip>

<span>
  Icona
  <lit-tooltip position="bottom">Ancorato al genitore</lit-tooltip>
</span>
```

## Proprietà

| Attributo | Tipo | Default | Origine |
|-----------|------|---------|---------|
| `for` | string | `''` | Polymer — id ancora |
| `manual-mode` | boolean | `false` | Polymer — solo API |
| `position` | `top` \| `right` \| `bottom` \| `left` | `bottom` | Polymer |
| `fit-to-visible-bounds` | boolean | `false` | Polymer |
| `offset` | number | `14` | Polymer |
| `animation-delay` | number | `500` | Polymer |
| `animation-entry` | string | `''` | Polymer — classe CSS |
| `animation-exit` | string | `''` | Polymer — classe CSS |

## Metodi

| Metodo | Ruolo |
|--------|--------|
| `show()` | Mostra il tooltip |
| `hide()` | Nasconde il tooltip |
| `updatePosition()` | Ricalcola left/top |
| `playAnimation('entry'\|'exit')` | Compatibilità paper-tooltip |
| `cancelAnimation()` | Interrompe l'animazione |
| `isShowing()` | Stato visibile |

## Token CSS

`--lit-tooltip-background`, `--lit-tooltip-text-color`, `--lit-tooltip-opacity`, `--lit-tooltip-delay-in`, `--lit-tooltip-duration-in`. Restano validi anche i token `--paper-tooltip-*`.
