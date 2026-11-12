# Fluid Player — shell PC (Electron)

App desktop Windows / Linux / macOS: Vite bundla UI + core comune (`../../src`), Electron 45 la apre in una finestra nativa.

Workspace npm: `@fluid-player/pc`.

## Struttura

```
target/pc/
├── electron/
│   ├── main.ts       # processo principale Electron
│   └── preload.cjs   # bridge isolato verso il renderer
├── index.html
├── package.json
├── vite.config.ts    # alias @fluid → ../../src
├── tsconfig.json
├── tsconfig.electron.json
├── scripts/
│   └── dev.mjs       # tsc main + Vite + Electron
└── src/
    ├── main.ts       # bootstrap renderer (HelloWorld)
    └── style.css
```

Flusso:

```
../../src  +  src  ──Vite──►  dist/  ──Electron 45──►  finestra desktop
electron/main.ts ──tsc──► dist-electron/
```

## Requisiti

| Componente | Dove | Note |
|------------|------|------|
| **Node.js ≥ 20** | [nodejs.org](https://nodejs.org/) | Build e script npm |
| **Electron 45** | dipendenza del workspace | Installata con `npm install` |

Su Linux lo shell avvia Electron con `--no-sandbox` (lo `chrome-sandbox` SUID non è configurato nel tree npm).

## Comandi (dalla root del repo)

```bash
npm install
npm run dev:pc         # Vite + finestra Electron (hot reload renderer)
npm run build:pc       # → target/pc/dist/ + dist-electron/
npm run start:pc       # avvia il build di produzione
npm run typecheck:pc
```

Oppure dal workspace:

```bash
npm run dev -w @fluid-player/pc
npm run build -w @fluid-player/pc
```
