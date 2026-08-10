# Fluid Player — shell webOS

Web app LG webOS TV: Vite bundla UI + core comune (`../../src`), poi copia `appinfo.json` e le icone in `dist/` per Simulator / TV.

Workspace npm: `@fluid-player/webos`.

## Struttura

```
apps/webos/
├── appinfo.json      # metadati webOS (id, main, icon, risoluzione)
├── icon.png          # 80×80
├── largeIcon.png     # 130×130
├── index.html
├── package.json
├── vite.config.ts    # alias @fluid → ../../src, copy metadati in dist
├── tsconfig.json
└── src/
    ├── main.ts       # bootstrap (HelloWorld / UI)
    └── style.css
```

Flusso:

```
../../src  +  src  ──Vite──►  dist/  ──ares-launch / Launch App──►  Simulator
                     ▲
              appinfo.json + icone
```

## Requisiti esterni (SDK / tool)

| Componente | Dove | Note |
|------------|------|------|
| **Node.js ≥ 20** | [nodejs.org](https://nodejs.org/) | Build e script npm |
| **`@webos-tools/cli`** | dipendenza root (`npm install`) | `ares-package`, `ares-launch` |
| **webOS TV Simulator** | [Installazione Simulator LG](https://webostv.developer.lge.com/develop/tools/simulator-installation) | **Non** è un pacchetto npm: zip/AppImage LG (es. 23–26) |
| **SDK / docs LG** | [webOS TV Developer](https://webostv.developer.lge.com/) | Developer Mode su TV fisica, packaging `.ipk` |

### Variabili `.env` (root del repo)

Vedi [`.env.example`](../../.env.example):

```bash
WEBOS_SIMULATOR_VERSION=26
WEBOS_SIMULATOR_PATH=/absolute/path/to/webOS_TV_26_Simulator_1.5.0
```

`WEBOS_SIMULATOR_PATH` = cartella che contiene l’AppImage, non il path del file `.AppImage`.

### Linux (AppImage / sandbox)

Su Ubuntu 24+ / elementary l’AppImage spesso fallisce su `chrome-sandbox`. Due opzioni:

1. Avvia il Simulator a mano, poi **File → Launch App** → `apps/webos/dist`.
2. Wrapper minuscolo `*.appimage` nella cartella del Simulator (la CLI cerca il nome in minuscolo) che rilancia l’AppImage con `--ozone-platform=x11 --no-sandbox`. Dettaglio nella [root README](../../README.md#webos).

## Comandi (dalla root del repo)

```bash
npm install
npm run dev:webos        # http://localhost:5173 — iterazione UI senza Simulator
npm run build:webos      # → apps/webos/dist/
npm run preview:webos
npm run typecheck:webos
npm run package:webos    # → apps/webos/pkg/ (.ipk via ares-package)
npm run simulate:webos   # build + ares-launch sul Simulator
```

Oppure dal workspace:

```bash
npm run dev -w @fluid-player/webos
npm run build -w @fluid-player/webos
```

## Note

- Target build Vite: `chrome68`, `base: './'` (path relativi per packaging TV).
- Il Simulator non replica al 100% una TV (Luna, DRM, media). Per validazione finale: TV in Developer Mode.
- Documentazione generale: [README root](../../README.md).
