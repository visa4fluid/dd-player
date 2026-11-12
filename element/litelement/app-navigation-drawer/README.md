# @fluid-element/app-navigation-drawer

Package del monorepo in `element/litelement/app-navigation-drawer`. Pannello laterale LitElement: da [Polymer `app-drawer`](https://github.com/PolymerElements/app-layout/tree/master/app-drawer) opened / persistent / swipe, da [Vuetify `v-navigation-drawer`](https://vuetifyjs.com/en/api/v-navigation-drawer/) rail, permanent, temporary e expand-on-hover.

Si installa come dipendenza workspace:

```bash
npm install @fluid-element/app-navigation-drawer
```

## Avvio demo

Dalla root del repo:

```bash
npm install
npm run demo:app-navigation-drawer
```

Apre `http://localhost:5181` con i controlli sulle proprietà. La demo usa [`@material/web`](https://github.com/material-components/material-web) solo come `devDependency` (list, switch, slider, button).

```bash
npm run test:elements
npm run typecheck -w @fluid-element/app-navigation-drawer
```

## Uso

```html
<script type="module">
  import '@fluid-element/app-navigation-drawer';
</script>

<app-navigation-drawer permanent rail rail-width="56">
  <button title="Host">Host</button>
  <button title="System">System</button>
</app-navigation-drawer>
```

Rail permanente come nel mockup Regista. Per un drawer a comparsa:

```html
<app-navigation-drawer temporary swipe-open>
  <nav>…</nav>
</app-navigation-drawer>
```

## Proprietà

| Attributo | Tipo | Default | Origine |
|-----------|------|---------|---------|
| `opened` | boolean | `false` | Polymer |
| `persistent` | boolean | `false` | Polymer / Vuetify — no close su scrim, Esc, swipe |
| `swipe-open` | boolean | `false` | Polymer |
| `transition-duration` | number | `200` | Polymer |
| `permanent` | boolean | `false` | Vuetify — sempre visibile |
| `temporary` | boolean | `false` | Vuetify — sempre overlay |
| `rail` | boolean | `false` | Vuetify |
| `rail-width` | number | `56` | Vuetify |
| `width` | number | `256` | entrambi |
| `expand-on-hover` | boolean | `false` | Vuetify |
| `expanded` | boolean | `false` | Vuetify — rail a larghezza piena |
| `floating` | boolean | `false` | Vuetify |
| `location` | `start` \| `end` \| `left` \| `right` | `start` | Vuetify (`align` Polymer) |
| `color` | CSS color | `''` | Vuetify |
| `elevation` | 0–5 | `0` | Vuetify |
| `image` | URL | `''` | Vuetify |
| `scrim` | boolean | `true` | Vuetify |
| `mobile` | boolean \| `null` | `null` | Vuetify — `null` = breakpoint |
| `mobile-breakpoint` | number | `1280` | Vuetify |
| `disable-resize-watcher` | boolean | `false` | Vuetify |
| `absolute` | boolean | `false` | Vuetify |
| `modal` | boolean | `false` | Vuetify — scrim sulla rail espansa |
| `force-narrow` | boolean | `false` | Polymer `app-drawer-layout` |

CSS custom property `--app-navigation-drawer-top` (default `0`): offset opzionale sotto una toolbar. In overlay (`temporary`) va lasciata a `0` così pannello e scrim coprono tutta la viewport.

## Slot

| Slot | Ruolo |
|------|--------|
| `prepend` | Intestazione (logo, titolo) |
| default | Voce di menu / contenuto |
| `append` | Piè di drawer |

## Metodi

| Metodo | Ruolo |
|--------|--------|
| `open()` / `close()` / `toggle()` | Apertura Polymer |
| `isOpen()` | `permanent` oppure `opened` |
| `isOverlay()` / `narrow` | Overlay sul contenuto |
| `isRailExpanded()` | Rail allargata da hover o `expanded` |
| `currentWidth()` / `getWidth()` | Larghezza visiva in px |
| `reservedWidth()` | Spazio lasciato al layout |
| `resetLayout(width?)` | Ricalcola overlay dal viewport |
| `syncSwipe(deltaX)` | Apre / chiude da trascinamento |

## Eventi

| Evento | Dettaglio |
|--------|-----------|
| `opened-changed` | `{ value: boolean }` |
| `app-drawer-transitioned` | fine transizione pannello |
