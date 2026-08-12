# Fluid Player

Player per il **digital signage**, pensato per riprodurre e orchestrare contenuti multimediali (immagini, video, audio, HTML dinamico) su superfici porzionabili.

Può operare in due modalità complementari — anche sullo stesso dispositivo — e supporta sia il funzionamento **offline** sia quello **online**.

---

## Cos’è

Fluid Player è il runtime di riproduzione della piattaforma Fluid. Non è solo un lettore di playlist: può fungere da **piccola regia** locale per la gestione di flussi audio e video, oppure da **player automatico** quando è agganciato alla piattaforma cloud **Fluid Next**.

| Modalità | Ruolo | Contesto tipico |
|----------|--------|-----------------|
| **Regia** | Gestione attiva di flussi audio/video, superfici e priorità | Controllo locale, interventi in sala, orchestrazione manuale o semi-automatica |
| **Player automatico** | Esecuzione guidata da schedule, playlist e contenuti provenienti da Fluid Next | Digital signage “set and forget”, sync con il cloud |

Le due modalità non sono esclusive: il core resta lo stesso; cambia il grado di autonomia e la fonte dei comandi (operatore locale vs piattaforma cloud).

---

## Offline e online

Il player è progettato per funzionare in **entrambi** i contesti:

| Contesto | Comportamento |
|----------|----------------|
| **Offline** | Riproduzione e regia locale con contenuti e configurazioni già presenti sul dispositivo; nessuna dipendenza dalla rete |
| **Online** | Autenticazione verso Fluid Next, download/sync di contenuti e dati, aggiornamento di playlist e schedule; la riproduzione continua a basarsi sulla cache locale |

In pratica: **local-first** in runtime, cloud come sorgente opzionale di contenuti e automazione.

---

## Composizione del software

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             Fluid Player                                 │
│                                                                          │
│  ┌── Core (DDD) ──────────────────────────────────────────────────────┐  │
│  │                                                                    │  │
│  │  ┌─ device ────────────┐  ┌─ system ────────────┐  ┌─ auth ──────────┐ │  │
│  │  │ application         │  │ application         │  │ application     │ │  │
│  │  │ domain              │  │ domain              │  │ domain          │ │  │
│  │  │ infrastructure      │  │ infrastructure      │  │ infrastructure  │ │  │
│  │  └─────────────────────┘  └─────────────────────┘  └─────────────────┘ │  │
│  │                                                                    │  │
│  │  ┌─ playlist ──────────┐  ┌─ standalone ────────┐  ┌─ settings ────┐ │  │
│  │  │ application         │  │ application         │  │ application   │ │  │
│  │  │ domain              │  │ domain              │  │ domain        │ │  │
│  │  │ infrastructure      │  │ infrastructure      │  │ infrastructure│ │  │
│  │  └─────────────────────┘  └─────────────────────┘  └───────────────┘ │  │
│  │                                                                    │  │
│  │  ┌─ external flows ────┐  ┌─ communication ──────────────────────┐ │  │
│  │  │ application         │  │ application                          │ │  │
│  │  │ domain              │  │ domain                               │ │  │
│  │  │ infrastructure      │  │ infrastructure                       │ │  │
│  │  └─────────────────────┘  └──────────────────────────────────────┘ │  │
│  │                                                                    │  │
│  │  presentation / UIX → apps/ (webos, tizen, …)                      │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌── Estensioni (runtime) ────────────────────────────────────────────┐  │
│  │  si agganciano all’application dei moduli, non all’infrastructure  │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Pattern: DDD

Il core è modellato con **Domain-Driven Design**: moduli = bounded context, ciascuno con dominio proprio e confini espliciti.

### Core — moduli

| Modulo | Ambito |
|--------|--------|
| **device** | Dispositivo fisico host: ID, CPU, RAM, storage, capability; servizi accessori di gestione |
| **system** | **System Manager**: sistema corrente, superfici (play/pause/stop); da cloud scarica schermi + standalone legati e consente il download delle playlist di quel system |
| **auth** | Identità, credenziali, sessioni locali e verso Fluid Next |
| **playlist** | Playlist automatiche; un **manager** conosce cosa gira nel proprio dominio e chiede a system cosa lanciare |
| **standalone** | Contenuti autonomi; stesso schema a **manager** (stato runtime nel modulo, launch verso system) |
| **external flows** | Flussi AV esterni (regia) |
| **settings** | Configurazione del player |
| **communication** | Servizi di rete: peer-to-peer in sottorete; cloud Fluid Next solo se autenticati sulle relative API |

Ogni modulo raggruppa gli stessi tre layer:

1. **domain** — modello e regole del bounded context  
2. **application** — use case / manager / API verso gli altri moduli  
3. **infrastructure** — adapter (persistenza, piattaforma, rete concreta)  

La **presentation** (UIX) sta in `apps/`, non dentro il modulo core.

Dettaglio: [MODULE_CORE.md](./docs/MODULE_CORE.md).

### Estensioni

Moduli caricabili **a runtime** che ampliano le capacità del software senza modificare il core. Si agganciano all’**application** esposta, non all’infrastructure interna dei moduli.

Dettagli: [EXTENSION.md](./docs/EXTENSION.md).

---

## Documentazione

| Documento | Contenuto |
|-----------|-----------|
| [MODULE_CORE.md](./docs/MODULE_CORE.md) | Moduli core DDD (`src/module/` + domain/application/infrastructure) |
| [CONVENTIONS.md](./docs/CONVENTIONS.md) | Naming file (PascalCase tipi, kebab-case UIX) |
| [EXTENSION.md](./docs/EXTENSION.md) | Estensioni runtime (es. scoreboard sportivi) |
| [COMMUNICATION.md](./docs/COMMUNICATION.md) | Peer-to-peer in sottorete e comunicazione cloud |
| [PROPOSAL.md](./docs/PROPOSAL.md) | Proposta architetturale (bozza tecnica) |

---

## Sviluppo

Prerequisito: **Node.js ≥ 20**.

Convenzioni di naming file: [CONVENTIONS.md](./docs/CONVENTIONS.md)  
(regola Cursor: [`.cursor/rules/file-naming.mdc`](./.cursor/rules/file-naming.mdc)).

```bash
npm install
npm run typecheck
npm run lint
npm run build
```

| Script | Ruolo |
|--------|--------|
| `npm run typecheck` | Controllo tipi TypeScript (`src/` → nessun emit) |
| `npm run lint` | ESLint su `src/`, incluse le regole JSDoc |
| `npm run lint:fix` | Come `lint`, con fix automatici dove possibile |
| `npm run build` | Compila `src/` in `dist/` |
| `npm run dev:webos` | Avvia Vite per lo shell webOS (hot reload) |
| `npm run build:webos` | Build produzione in `apps/webos/dist/` (pronta per package) |
| `npm run preview:webos` | Anteprima locale del bundle webOS |
| `npm run package:webos` | Build + `ares-package` → `apps/webos/pkg/` |
| `npm run simulate:webos` | Build + avvio sul webOS TV Simulator |
| `npm run dev:tizen` | Avvia Vite per lo shell Tizen (hot reload) |
| `npm run build:tizen` | Build produzione in `apps/tizen/dist/` |
| `npm run preview:tizen` | Anteprima locale del bundle Tizen |
| `npm run package:tizen` | Build + `.wgt` → `apps/tizen/pkg/` |
| `npm run simulate:tizen` | Build + package + avvio Samsung TV Web Simulator |

### Struttura

| Path | Ruolo |
|------|--------|
| `src/` | Codice comune TypeScript (entry, util condivise) |
| `src/module/` | Moduli core DDD (`device`, `system`, `auth`, …) |
| `apps/` | Shell per piattaforma (`web`, `pc`, `android`, `tizen`, `webos`) |
| `apps/webos/` | Entry point webOS TV (Vite + `appinfo.json`) — [README](./apps/webos/README.md) |
| `apps/tizen/` | Entry point Tizen TV (Vite + `config.xml`) — [README](./apps/tizen/README.md) |
| `docs/` | Documentazione di design |

Dettaglio piattaforme: [webOS](#webos) · [apps/webos/README.md](./apps/webos/README.md), [Tizen](#tizen) · [apps/tizen/README.md](./apps/tizen/README.md).

### JSDoc (obbligatoria su API pubblica)

L’API pubblica in `src/` va documentata con **JSDoc**. In TypeScript non si ripetono i tipi già presenti nelle signature.

Viene applicata in due modi:

1. **ESLint** — `eslint-plugin-jsdoc` (config: `eslint.config.js`); `npm run lint` fallisce se manca la documentazione richiesta  
2. **Cursor rule** — [`.cursor/rules/jsdoc.mdc`](./.cursor/rules/jsdoc.mdc), attiva sui file `src/**/*.ts` in editor/agent

Cosa documentare: classi ed export pubblici, metodi/funzioni pubblici, tipi/interfacce esportati non autoesplicativi.  
Cosa evitare: JSDoc su dettagli privati ovvi o re-export banali.

---

## webOS

Lo shell LG TV vive in [`apps/webos`](./apps/webos). È una **web app** packaging-ready: Vite bundla UI + core comune (`src/`), poi `appinfo.json` e le icone vengono copiati in `dist/` per Simulator / TV.

```
apps/webos/
├── appinfo.json      # metadati obbligatori webOS (id, main, icon, …)
├── icon.png          # icona 80×80
├── largeIcon.png     # icona 130×130
├── index.html        # entry HTML (`main` in appinfo)
├── package.json      # workspace @fluid-player/webos
├── vite.config.ts    # build, alias @fluid → ../../src, copy metadati in dist
├── tsconfig.json
└── src/
    ├── main.ts       # bootstrap: monta l’app e usa il core
    └── style.css
```

### Componenti

| Componente | Dove | Ruolo |
|------------|------|--------|
| **Core condiviso** | `src/` (alias `@fluid/*`) | Logica TypeScript comune a tutte le piattaforme |
| **Entry webOS** | `apps/webos/src/main.ts` | Punto di ingresso UI sul device/Simulator |
| **`appinfo.json`** | `apps/webos/` → copiato in `dist/` | Identità app (`id`, `title`, `main`, icone, risoluzione) |
| **Icone** | `icon.png`, `largeIcon.png` | Richieste da `ares-package` / launcher TV |
| **Vite** | `vite.config.ts` | Dev server, build `chrome68`, `base: './'` |
| **webOS CLI** | `@webos-tools/cli` (devDependency) | `ares-package`, `ares-launch`, … |
| **webOS TV Simulator** | Installazione esterna LG | Ambiente TV sul PC (non è un pacchetto npm) |

Flusso:

```
src/  +  apps/webos/src  ──Vite build──►  apps/webos/dist/  ──ares-launch -s──►  Simulator
                              ▲
                    appinfo.json + icone
```

### Sviluppo in browser

Per iterare senza Simulator:

```bash
npm run dev:webos
```

Server su `http://localhost:5173` (anche in LAN). Non sostituisce il Simulator per API Luna / telecomando / comportamento TV.

### Far girare l’app sul Simulator

1. **Prerequisiti**
   - Node.js ≥ 20
   - `npm install` nella root del repo
   - [webOS TV Simulator](https://webostv.developer.lge.com/develop/tools/simulator-installation) installato (es. versione 23, 24, …)

2. **Linux: avvia il Simulator con i flag sandbox**

   Su molte distro (specie Ubuntu 24+) l’AppImage abortisce con errori su `chrome-sandbox` / SUID.  
   `ares-launch` **non** può passare i flag necessari: avvia il Simulator a mano, poi lancia l’app.

   ```bash
   # dalla cartella dove hai scompattato lo zip LG (adatta nome/versione)
   chmod +x webOS_TV_*_Simulator_*.AppImage
   ./webOS_TV_26_Simulator_1.5.0.AppImage --ozone-platform=x11 --no-sandbox
   ```

   Stesso approccio vale per le versioni 23/24/25: aggiungi `--no-sandbox` (e su Wayland anche `--ozone-platform=x11`).

3. **Build dell’app**

   ```bash
   npm run build:webos
   ```

4. **Apri l’app nel Simulator già avviato**

   Nel Simulator: **File → Launch App** → seleziona `apps/webos/dist`  
   (deve contenere `appinfo.json`).

   Oppure, se il tuo ambiente non ha il problema sandbox:

   ```bash
   npm run simulate:webos
   ```

   In `.env` (vedi [`.env.example`](./.env.example)) imposta:

   - `WEBOS_SIMULATOR_VERSION` — es. `26`
   - `WEBOS_SIMULATOR_PATH` — cartella del Simulator (quella con l’AppImage), obbligatoria se `ares-launch` chiede `--simulator-path`

   Su Linux servono due accorgimenti nella cartella del Simulator (`WEBOS_SIMULATOR_PATH`):

   1. `@webos-tools/cli` cerca `*.appimage` (minuscolo), mentre LG fornisce `*.AppImage`.
   2. `ares-launch` non passa `--no-sandbox`; senza wrapper l’AppImage abortisce sul `chrome-sandbox`.

   Crea uno script wrapper (stesso nome che cerca la CLI):

   ```bash
   cd "$WEBOS_SIMULATOR_PATH"
   cat > webOS_TV_26_Simulator_1.5.0.appimage << 'EOF'
   #!/usr/bin/env bash
   set -euo pipefail
   DIR="$(cd "$(dirname "$0")" && pwd)"
   # "--" evita che i flag Electron oscurino APP_DIR passato da ares-launch
   exec "$DIR/webOS_TV_26_Simulator_1.5.0.AppImage" --ozone-platform=x11 --no-sandbox -- "$@"
   EOF
   chmod +x webOS_TV_26_Simulator_1.5.0.appimage
   ```

   Adatta il nome file alla versione installata (es. `1.5.0` / `26`).

   Un solo comando per **Simulator + app**:

   ```bash
   npm run simulate:webos
   ```

   Chiudi eventuali finestre Simulator già aperte prima di rilanciare, così parte un’istanza pulita con `apps/webos/dist`.

5. **Package `.ipk` (TV fisica)**

   ```bash
   npm run package:webos    # apps/webos/pkg/
   ```

> Il Simulator non replica al 100% una TV (DRM, alcuni media e API Luna assenti o diversi). Per validazione finale usare una TV in Developer Mode.

---

## Tizen

Lo shell Samsung TV vive in [`apps/tizen`](./apps/tizen). Stesso modello di webOS: Vite bundla UI + core (`src/`), poi `config.xml` e l’icona finiscono in `dist/` per Simulator / TV.

```
apps/tizen/
├── config.xml        # metadati obbligatori Tizen (id, content, privilege, …)
├── icon.png          # icona launcher (117×117)
├── index.html        # entry HTML (`content` in config.xml)
├── package.json      # workspace @fluid-player/tizen
├── vite.config.ts    # build, alias @fluid → ../../src, copy metadati in dist
├── tsconfig.json
├── scripts/
│   ├── package-wgt.mjs
│   └── simulate.mjs
└── src/
    ├── main.ts       # bootstrap: monta l’app e usa il core
    └── style.css
```

### Componenti

| Componente | Dove | Ruolo |
|------------|------|--------|
| **Core condiviso** | `src/` (alias `@fluid/*`) | Logica TypeScript comune |
| **Entry Tizen** | `apps/tizen/src/main.ts` | Punto di ingresso UI sul device/Simulator |
| **`config.xml`** | `apps/tizen/` → copiato in `dist/` | Identità app (`tizen:application`, privilege, profile) |
| **Vite** | `vite.config.ts` | Dev server porta `5174`, build `chrome69`, `base: './'` |
| **`.wgt`** | `apps/tizen/pkg/FluidPlayer.wgt` | Pacchetto web Tizen (zip di `dist/`) |
| **Tizen Studio / TV Simulator** | Installazione esterna Samsung | Ambiente TV sul PC (non è un pacchetto npm) |

Flusso:

```
src/  +  apps/tizen/src  ──Vite build──►  apps/tizen/dist/  ──zip──►  .wgt  ──Install──►  Simulator
                              ▲
                         config.xml + icon
```

### Sviluppo in browser

```bash
npm run dev:tizen
```

Server su `http://localhost:5174`. Non sostituisce il Simulator per API `tizen.*` / telecomando.

### Far girare l’app sul Simulator

1. **Prerequisiti**
   - Node.js ≥ 20, `zip` in PATH
   - `npm install` nella root
   - [Tizen Studio](https://developer.tizen.org/development/tizen-studio/download) + **TV Extension** + **Samsung TV Web Simulator** (Package Manager)

2. **`.env`**

   ```bash
   TIZEN_STUDIO_PATH=/absolute/path/to/tizen-studio
   ```

3. **Build + Simulator (app in automatico)**

   ```bash
   npm run simulate:tizen
   ```

   Build, crea il `.wgt`, apre il Samsung TV Web Simulator e lancia
   `apps/tizen/dist/index.html` via `--file` (senza Install Application manuale).

   Fallback a mano:

   ```bash
   npm run build:tizen
   cd "$TIZEN_STUDIO_PATH/tools/sec-tv-simulator"
   ./simulator --platform tizentv --file "$OLDPWD/apps/tizen/dist/index.html"
   ```

4. **Package firmato (TV fisica / Emulator)**

   Serve un certificate profile da Tizen Certificate Manager, poi:

   ```bash
   npm run build:tizen
   tizen package -t wgt -s <profile> -- apps/tizen/dist
   tizen install -n FluidPlayer.wgt -- apps/tizen/dist
   tizen run -p FluidPlayr.FluidPlayer
   ```

> Il Web Simulator non replica al 100% una TV (API privilegiate, media, DRM). Per validazione finale usare Emulator o TV in Developer Mode.

---

## Principi

1. **Digital signage first** — superfici, contenuti, playlist, schedule  
2. **Regia o automatico** — stesso player, due modi d’uso  
3. **Offline e online** — operatività continua; cloud opzionale via Fluid Next  
4. **DDD** — moduli core come bounded context  
5. **Persistenza agnostica + services cross** — storage dietro porte; servizi condivisi sopra  
6. **Core stabile + estensioni** — base definita; funzionalità aggiuntive a runtime  
7. **UIX e core disaccoppiati** — due stili di integrazione (vedi sotto); i comandi li esegue sempre il core  

---

## Stili di gestione dell’interfaccia (UIX)

La UI è sempre **slegata** dalla logica di business del core: recupera i dati dal core e invia azioni; è il **core** a eseguire i comandi. Cambiano packaging e canale di comunicazione.

| | **A — UIX esterna (agnostica)** | **B — UIX incorporata nel runtime** |
|--|--------------------------------|-------------------------------------|
| **Relazione col core** | Processo / app separata; nessun embedding nel core | Consegna insieme al player, ma layer UI distinto dal dominio |
| **Ruolo UIX** | Solo presentazione: legge stato, invia intent/comandi | Stesso ruolo: legge stato, invia intent/comandi |
| **Esecuzione** | Sempre il **core** | Sempre il **core** |
| **Canale** | **REST API** (e tipicamente eventi WS correlati) | Protocollo di comunicazione **più semplice** / meno verboso di REST (es. IPC, bridge nativo, messaggi tipizzati locali) |
| **Quando ha senso** | Dashboard remote, altri device, client web indipendenti | Shell nativa, pannello locale sul device player |

```
  Stile A — UIX esterna                         Stile B — UIX incorporata
  ─────────────────────                         ────────────────────────

  ┌──────────┐     REST API      ┌──────────┐   ┌─────────────────────────┐
  │   UIX    │ ───────────────►  │   Core   │   │  Runtime player         │
  │ agnostica│ ◄── dati/stato ── │ (esegue) │   │  ┌─────┐  protocollo    │
  └──────────┘                   └──────────┘   │  │ UIX │  semplificato  │
                                                │  └──┬──┘       │        │
                                                │     │    ┌─────▼─────┐  │
                                                │     └───►│   Core    │  │
                                                │          │ (esegue)  │  │
                                                │          └───────────┘  │
                                                └─────────────────────────┘
```

In entrambi i casi:

1. La UIX **non** implementa regole di playlist, system, auth, scoreboard, ecc.  
2. La UIX **interroga** il core per i dati da mostrare  
3. Le azioni utente diventano **comandi** verso il core; solo il core li applica  

I due approcci possono coesistere (es. shell locale in stile B + dashboard remota in stile A sullo stesso core).

---

## Stato

Documentazione in allestimento. Core, estensioni e comunicazione verranno dettagliati nei rispettivi file.
