# Fluid Player — shell Tizen

Web app Samsung Tizen TV: Vite bundla UI + core comune (`../../src`, moduli in `../../src/module`), poi copia `config.xml` e l’icona in `dist/` per Web Simulator / TV (pacchetto `.wgt`).

Workspace npm: `@fluid-player/tizen`.

## Struttura

```
apps/tizen/
├── config.xml        # metadati Tizen (application id, privilege, profile tv-samsung)
├── icon.png          # launcher ~117×117
├── index.html
├── package.json
├── vite.config.ts    # alias @fluid → ../../src, copy metadati in dist
├── tsconfig.json
├── scripts/
│   ├── package-wgt.mjs   # zip dist → pkg/FluidPlayer.wgt
│   └── simulate.mjs      # build/package + avvio Simulator con --file
└── src/
    ├── main.ts       # bootstrap (HelloWorld / UI)
    └── style.css
```

Flusso:

```
../../src  +  src  ──Vite──►  dist/  ──zip──►  pkg/*.wgt
                     ▲              │
                config.xml + icon   └── Simulator (--file dist/index.html)
```

## Requisiti esterni (SDK / tool)

| Componente | Dove | Note |
|------------|------|------|
| **Node.js ≥ 20** | [nodejs.org](https://nodejs.org/) | Build e script npm |
| **`zip`** | pacchetto di sistema (`apt install zip`) | Usato da `package-wgt.mjs` |
| **Tizen Studio** | [Download Tizen Studio](https://developer.tizen.org/development/tizen-studio/download) | IDE + CLI (`tizen`, `sdb`); installer `.bin` su Linux |
| **TV Extension / Samsung TV SDK** | [TV Extension download](https://developer.samsung.com/smarttv/develop/tools/tv-extension/download.html) + Package Manager | Profilo TV, tool Samsung |
| **Samsung TV Web Simulator** | incluso via Package Manager (`tools/sec-tv-simulator/`) | **Non** è npm; serve per UI / smoke test |
| **Certificate Extension** | Package Manager Tizen Studio | Necessaria per `.wgt` firmati (TV / Emulator) |
| **Docs Samsung** | [Installing TV SDK](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/installing-tv-sdk.html) | Setup completo SDK |

Dopo l’installazione di Tizen Studio, nel **Package Manager** installa almeno:

- TV Extensions / `TV-SAMSUNG-Public` (o equivalente per la tua versione)
- Samsung TV Web Simulator (`sec-tv-simulator`)
- Samsung Certificate Extension (per deploy su device)

### Ubuntu 24.04 / elementary OS 8

L’installer Tizen può chiedere pacchetti con nomi vecchi (`libcurl3-gnutls`, `libglib2.0-0`, `libv4l-0`, `python3.8`, `libncurses5`, …). I runtime equivalenti sono spesso già presenti come `*t64*` / Python 3.12: servono pacchetti dummy o PPA (es. deadsnakes per Python 3.8 reale) se l’installer non prosegue.

### Variabili `.env` (root del repo)

Vedi [`.env.example`](../../.env.example):

```bash
TIZEN_STUDIO_PATH=/absolute/path/to/tizen-studio
```

Deve contenere `tools/sec-tv-simulator/simulator` (o `simulator.sh`).

## Comandi (dalla root del repo)

```bash
npm install
npm run dev:tizen        # http://localhost:5174 — iterazione UI senza Simulator
npm run build:tizen      # → apps/tizen/dist/
npm run preview:tizen
npm run typecheck:tizen
npm run package:tizen    # → apps/tizen/pkg/FluidPlayer.wgt (unsigned)
npm run simulate:tizen   # build + .wgt + Simulator con app automatica (--file)
```

Oppure dal workspace:

```bash
npm run dev -w @fluid-player/tizen
npm run build -w @fluid-player/tizen
npm run package -w @fluid-player/tizen
```

### Simulator

`npm run simulate:tizen` apre il Web Simulator e passa `--file` su `dist/index.html` così l’app parte senza Install Application manuale.

Fallback:

```bash
cd "$TIZEN_STUDIO_PATH/tools/sec-tv-simulator"
./simulator --platform tizentv --file /absolute/path/to/apps/tizen/dist/index.html
```

Errori tipo `Cannot open ZIP archive './child.js'` sono rumore interno NW.js del Simulator, non del progetto.

### Package firmato (TV / Emulator)

Il `.wgt` di `package:tizen` è **unsigned** (ok per Web Simulator). Per TV fisica / Emulator:

```bash
npm run build:tizen
tizen package -t wgt -s <certificate-profile> -- apps/tizen/dist
tizen install -n FluidPlayer.wgt -- apps/tizen/dist
tizen run -p FluidPlayr.FluidPlayer
```

(`FluidPlayr.FluidPlayer` = `tizen:application id` in `config.xml`.)

## Note

- Target build Vite: `chrome69`, `base: './'`.
- Runtime sul device: browser TV + API `tizen.*`, **non** Node.js.
- Web Simulator ≠ Emulator TV: il primo va bene per UI/smoke test; validazione API/media su Emulator o TV in Developer Mode.
- Documentazione generale: [README root](../../README.md).
