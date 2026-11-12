# app-header

Barra superiore LitElement in TypeScript. Prende da [Polymer `app-header`](https://github.com/PolymerElements/app-layout/tree/master/app-header) i comportamenti di scroll e da [Vuetify `v-app-bar`](https://vuetifyjs.com/en/api/v-app-bar/) density, elevation, title e slot.

Workspace: `@fluid-element/litelement`.

## Avvio demo

Dalla root del repo:

```bash
npm install
npm run demo:app-header
```

Apre `http://localhost:5180` con i controlli sulle proprietà.

```bash
npm run test:elements
npm run typecheck -w @fluid-element/litelement
```

## Uso

```html
<script type="module">
  import '@fluid-element/litelement/app-header';
</script>

<app-header title="Regista" fixed elevation="2" density="default">
  <button slot="start">Menu</button>
  <button slot="end">Auth</button>
</app-header>
```

## Proprietà

| Attributo | Tipo | Default | Origine |
|-----------|------|---------|---------|
| `title` | string | `''` | Vuetify |
| `fixed` | boolean | `false` | Polymer |
| `reveals` | boolean | `false` | Polymer — some nascosta in giù, visibile in su |
| `condenses` | boolean | `false` | Polymer — l’altezza scende verso 64px |
| `effects` | string | `''` | Polymer — `waterfall` = ombra dopo lo scroll |
| `density` | `compact` \| `comfortable` \| `default` \| `prominent` | `default` | Vuetify (48 / 56 / 64 / 128) |
| `elevation` | 0–5 | `2` | Vuetify |
| `flat` | boolean | `false` | Vuetify — nessuna ombra |
| `color` | CSS color | `''` | Vuetify |
| `height` | number | `0` | Vuetify — override density |
| `image` | URL | `''` | Vuetify |
| `location` | `top` \| `bottom` | `top` | Vuetify |
| `scroll-behavior` | `hide` `elevate` | `''` | Vuetify, valori separati da spazio |
| `scroll-target` | selettore | `''` | Vuetify — default `window` |
| `scroll-threshold` | number | `0` | Vuetify |

## Slot

| Slot | Ruolo |
|------|--------|
| `start` | Azioni a sinistra (menu, back) |
| default | Titolo extra o contenuto centrale |
| `end` | Azioni a destra |
| `extension` | Seconda riga (tab, filtri) |

## Metodi

| Metodo | Ruolo |
|--------|--------|
| `restingHeight()` | Altezza di riposo in px |
| `condensedHeight()` | Altezza minima se `condenses` |
| `syncScroll(y)` | Aggiorna hide / elevate / condenses (anche per i test) |
