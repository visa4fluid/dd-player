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
┌───────────────────────────────────────────────────────────────────────────────────┐
│                                    Fluid Player                                   │
│                                                                                   │
│  ┌─ Core (DDD) ────────────────────────────────────────────────────────────────┐  │
│  │                                                                             │  │
│  │  ┌─ device ────────────┐  ┌─ system ────────────┐  ┌─ auth ──────────────┐  │  │
│  │  │ application         │  │ application         │  │ application         │  │  │
│  │  │ domain              │  │ domain              │  │ domain              │  │  │
│  │  │ infrastructure      │  │ infrastructure      │  │ infrastructure      │  │  │
│  │  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │  │
│  │                                                                             │  │
│  │  ┌─ playlist ──────────┐  ┌─ standalone ────────┐  ┌─ settings ──────────┐  │  │
│  │  │ application         │  │ application         │  │ application         │  │  │
│  │  │ domain              │  │ domain              │  │ domain              │  │  │
│  │  │ infrastructure      │  │ infrastructure      │  │ infrastructure      │  │  │
│  │  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │  │
│  │                                                                             │  │
│  │  ┌─ external flows ────┐  ┌─ communication ──────────────────────────────┐  │  │
│  │  │ application         │  │ application                                  │  │  │
│  │  │ domain              │  │ domain                                       │  │  │
│  │  │ infrastructure      │  │ infrastructure                               │  │  │
│  │  └─────────────────────┘  └──────────────────────────────────────────────┘  │  │
│  │                                                                             │  │
│  │  presentation / UIX → target/ (webos, tizen, …)                             │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                   │
│  ┌─ Estensioni (runtime) ──────────────────────────────────────────────────────┐  │
│  │ si agganciano all'application dei moduli,                                   │  │
│  │ non all'infrastructure                                                      │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────┘
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

La **presentation** (UIX) sta in `target/`, non dentro il modulo core.

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
| [REQUIREMENTS.md](./docs/REQUIREMENTS.md) | Requisiti funzionali (ibrido online/offline, auth) e tecnici (SDK) |
| [PRESENTATION.pdf](./docs/PRESENTATION.pdf) | Slide dei requisiti funzionali |
| [EXTENSION.md](./docs/EXTENSION.md) | Estensioni runtime (es. scoreboard sportivi) |
| [COMMUNICATION.md](./docs/COMMUNICATION.md) | Peer-to-peer in sottorete e comunicazione cloud |
| [PROPOSAL.md](./docs/PROPOSAL.md) | Proposta architetturale (bozza tecnica) |

---

## Sviluppo

Prerequisiti: [REQUIREMENTS.md](./docs/REQUIREMENTS.md). Minimo per il core: **Node.js ≥ 20**.

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
| `npm run test` | Test unitari (Vitest) |
| `npm run test:watch` | Test unitari in watch |
| `npm run test:coverage` | Test unitari + coverage (testo + `coverage/`) |
| `npm run test:device` | Solo test del modulo `device` |
| `npm run test:device:coverage` | Coverage solo del modulo `device` |
| `npm run build` | Compila `src/` in `dist/` |
| `npm run dev:webos` | Avvia Vite per lo shell webOS (hot reload) |
| `npm run build:webos` | Build produzione in `target/webos/dist/` (pronta per package) |
| `npm run preview:webos` | Anteprima locale del bundle webOS |
| `npm run package:webos` | Build + `ares-package` → `target/webos/pkg/` |
| `npm run simulate:webos` | Build + avvio sul webOS TV Simulator |
| `npm run dev:tizen` | Avvia Vite per lo shell Tizen (hot reload) |
| `npm run build:tizen` | Build produzione in `target/tizen/dist/` |
| `npm run preview:tizen` | Anteprima locale del bundle Tizen |
| `npm run package:tizen` | Build + `.wgt` → `target/tizen/pkg/` |
| `npm run simulate:tizen` | Build + package + avvio Samsung TV Web Simulator |
| `npm run dev:android` | Avvia Vite per lo shell Android (hot reload) |
| `npm run build:android` | Build produzione in `target/android/dist/` |
| `npm run preview:android` | Anteprima locale del bundle Android |
| `npm run typecheck:android` | Controllo tipi dello shell Android |
| `npm run package:android` | Build Vite + copia in `assets` del WebView |
| `npm run simulate:android` | Installa l’APK sull’emulatore e avvia HelloWorld |
| `npm run dev:pc` | Avvia Vite + finestra Electron 45 (hot reload renderer) |
| `npm run build:pc` | Build produzione in `target/pc/dist/` + `dist-electron/` |
| `npm run start:pc` | Avvia il build di produzione in Electron |
| `npm run typecheck:pc` | Controllo tipi dello shell PC |

### Struttura

| Path | Ruolo |
|------|--------|
| `src/` | Codice comune TypeScript (entry, util condivise) |
| `src/module/` | Moduli core DDD (`device`, `system`, `auth`, …) |
| `target/` | Shell per piattaforma (`web`, `pc`, `android`, `tizen`, `webos`) |
| `target/webos/` | Entry point webOS TV (Vite + `appinfo.json`) — [README](./target/webos/README.md) |
| `target/tizen/` | Entry point Tizen TV (Vite + `config.xml`) — [README](./target/tizen/README.md) |
| `target/android/` | Entry point Android WebView (Vite) — [README](./target/android/README.md) |
| `target/pc/` | Entry point desktop Electron 45 (Vite + main/preload) — [README](./target/pc/README.md) |
| `docs/` | Documentazione di design |

Dettaglio piattaforme: [webOS](#webos) · [target/webos/README.md](./target/webos/README.md), [Tizen](#tizen) · [target/tizen/README.md](./target/tizen/README.md), [Android](#android) · [target/android/README.md](./target/android/README.md), [PC](#pc) · [target/pc/README.md](./target/pc/README.md).

### JSDoc (obbligatoria su API pubblica)

L’API pubblica in `src/` va documentata con **JSDoc**. In TypeScript non si ripetono i tipi già presenti nelle signature.

Viene applicata in due modi:

1. **ESLint** — `eslint-plugin-jsdoc` (config: `eslint.config.js`); `npm run lint` fallisce se manca la documentazione richiesta  
2. **Cursor rule** — [`.cursor/rules/jsdoc.mdc`](./.cursor/rules/jsdoc.mdc), attiva sui file `src/**/*.ts` in editor/agent

Cosa documentare: classi ed export pubblici, metodi/funzioni pubblici, tipi/interfacce esportati non autoesplicativi.  
Cosa evitare: JSDoc su dettagli privati ovvi o re-export banali.

---

## webOS

Lo shell LG TV vive in [`target/webos`](./target/webos). È una **web app** packaging-ready: Vite bundla UI + core comune (`src/`), poi `appinfo.json` e le icone vengono copiati in `dist/` per Simulator / TV.

```
target/webos/
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
| **Entry webOS** | `target/webos/src/main.ts` | Punto di ingresso UI sul device/Simulator |
| **`appinfo.json`** | `target/webos/` → copiato in `dist/` | Identità app (`id`, `title`, `main`, icone, risoluzione) |
| **Icone** | `icon.png`, `largeIcon.png` | Richieste da `ares-package` / launcher TV |
| **Vite** | `vite.config.ts` | Dev server, build `chrome68`, `base: './'` |
| **webOS CLI** | `@webos-tools/cli` (devDependency) | `ares-package`, `ares-launch`, … |
| **webOS TV Simulator** | Installazione esterna LG | Ambiente TV sul PC (non è un pacchetto npm) |

Flusso:

```
src/  +  target/webos/src  ──Vite build──►  target/webos/dist/  ──ares-launch -s──►  Simulator
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

   Nel Simulator: **File → Launch App** → seleziona `target/webos/dist`  
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

   Chiudi eventuali finestre Simulator già aperte prima di rilanciare, così parte un’istanza pulita con `target/webos/dist`.

5. **Package `.ipk` (TV fisica)**

   ```bash
   npm run package:webos    # target/webos/pkg/
   ```

> Il Simulator non replica al 100% una TV (DRM, alcuni media e API Luna assenti o diversi). Per validazione finale usare una TV in Developer Mode.

---

## Tizen

Lo shell Samsung TV vive in [`target/tizen`](./target/tizen). Stesso modello di webOS: Vite bundla UI + core (`src/`), poi `config.xml` e l’icona finiscono in `dist/` per Simulator / TV.

```
target/tizen/
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
| **Entry Tizen** | `target/tizen/src/main.ts` | Punto di ingresso UI sul device/Simulator |
| **`config.xml`** | `target/tizen/` → copiato in `dist/` | Identità app (`tizen:application`, privilege, profile) |
| **Vite** | `vite.config.ts` | Dev server porta `5174`, build `chrome69`, `base: './'` |
| **`.wgt`** | `target/tizen/pkg/FluidPlayer.wgt` | Pacchetto web Tizen (zip di `dist/`) |
| **Tizen Studio / TV Simulator** | Installazione esterna Samsung | Ambiente TV sul PC (non è un pacchetto npm) |

Flusso:

```
src/  +  target/tizen/src  ──Vite build──►  target/tizen/dist/  ──zip──►  .wgt  ──Install──►  Simulator
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
   `target/tizen/dist/index.html` via `--file` (senza Install Application manuale).

   Fallback a mano:

   ```bash
   npm run build:tizen
   cd "$TIZEN_STUDIO_PATH/tools/sec-tv-simulator"
   ./simulator --platform tizentv --file "$OLDPWD/target/tizen/dist/index.html"
   ```

4. **Package firmato (TV fisica / Emulator)**

   Serve un certificate profile da Tizen Certificate Manager, poi:

   ```bash
   npm run build:tizen
   tizen package -t wgt -s <profile> -- target/tizen/dist
   tizen install -n FluidPlayer.wgt -- target/tizen/dist
   tizen run -p FluidPlayr.FluidPlayer
   ```

> Il Web Simulator non replica al 100% una TV (API privilegiate, media, DRM). Per validazione finale usare Emulator o TV in Developer Mode.

---

## Android

Lo shell Android vive in [`target/android`](./target/android). Stesso modello di webOS/Tizen: Vite bundla UI + **core** (`src/`, moduli in `src/module/`) in `dist/`. HelloWorld è lo smoke test; `#stage` è la finestra dove arriveranno superfici, HTML dinamico e media. L’host Kotlin carica quel bundle in un WebView a schermo intero (`Fluid Player` sul launcher TV).

```
target/android/
├── index.html
├── package.json      # workspace @fluid-player/android
├── vite.config.ts    # alias @fluid → ../../src
├── tsconfig.json
├── scripts/
│   ├── sync-assets.mjs   # dist/ → native assets
│   └── simulate.mjs      # installDebug + am start
├── native/               # host Kotlin / Gradle (WebView)
└── src/
    ├── main.ts           # bootstrap: HelloWorld dal core
    └── style.css
```

### Componenti

| Componente | Dove | Ruolo |
|------------|------|--------|
| **Core condiviso** | `src/` (alias `@fluid/*`) | Manager, device, playlist, system, communication |
| **Entry Android** | `target/android/src/main.ts` | Punto di ingresso UI (WebView / browser) |
| **Vite** | `vite.config.ts` | Dev server porta `5175`, build `chrome100`, `base: './'` |
| **`dist/`** | `target/android/dist/` | Bundle copiato negli asset del WebView |
| **Host Kotlin** | `target/android/native/` | APK Leanback: WebView + `WebViewAssetLoader` |
| **Android Studio / SDK / AVD** | Installazione esterna Google | Emulatore TV sul PC (non è un pacchetto npm) |

Flusso:

```
src/  +  target/android/src  ──Vite build──►  dist/  ──sync-assets──►  native assets
                                                              │
                                                              └── Gradle installDebug ──►  emulatore
```

### Sviluppo in browser

```bash
npm run dev:android
```

Server su `http://localhost:5175`. Non sostituisce l’emulatore: lì gira l’APK (bundle in `assets/`, non il dev server).

```bash
npm run build:android
npm run preview:android
```

### Far girare l’app sull’emulatore

1. **Prerequisiti**
   - Node.js ≥ 20, `npm install` nella root
   - [Android Studio](https://developer.android.com/studio) + **Android SDK**
   - **JDK 17** con `javac` (Temurin / Adoptium). Gradle 8.11 non accetta il JBR di Studio se è Java 25+; un JRE senza `javac` non basta
   - **KVM** su Linux (`kvm-ok` ok, utente nel gruppo `kvm`) — senza di esso l’immagine x86 dell’emulatore non parte
   - Pacchetti SDK (SDK Manager): **Android SDK Platform**, **Android TV** system image (es. API 36 `android-tv` x86_64), **Platform-Tools**, **Emulator**, **cmdline-tools**

2. **Variabili e path**

   In `.env` (vedi [`.env.example`](./.env.example)) e/o in `~/.bashrc`:

   ```bash
   export ANDROID_HOME="$HOME/Android/Sdk"
   export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
   export JAVA_HOME="/path/to/jdk-17"
   ```

   `simulate:android` usa `ANDROID_HOME` (default `$HOME/Android/Sdk`) e, per Gradle, `~/Program/jdk-17` se c’è `javac`, altrimenti `JAVA_HOME`, altrimenti lo JBR di Studio.

   Opzionale, path SDK per Gradle (file gitignorato):

   ```bash
   echo "sdk.dir=$HOME/Android/Sdk" > target/android/native/local.properties
   ```

3. **Crea un AVD Android TV**

   In Android Studio: **Device Manager → Create Device → TV** (es. 1080p) → system image **Android TV** (API 36).  
   Nome libero (es. `Flud_HD_Tv`). Serve un’immagine **TV**, non un telefono.

4. **Avvia l’emulatore** (`adb devices` deve mostrare `emulator-…. device`)

   ```bash
   emulator -avd Flud_HD_Tv -gpu host
   ```

   Sostituisci `Flud_HD_Tv` con il nome del tuo AVD (`emulator -list-avds`).

5. **Build, installa, avvia HelloWorld**

   ```bash
   npm run simulate:android
   ```

   Build Vite → copia in `native/app/src/main/assets/public/` → `installDebug` → `am start` su `com.fluidplayer.app/.MainActivity`.

   Solo bundle + copia asset, senza install:

   ```bash
   npm run package:android
   ```

6. **Debug WebView (sorgenti)**

   Con l’app già sull’emulatore, Chrome sul PC → `chrome://inspect/#devices` → inspect su `com.fluidplayer.app`.  
   Origine: `https://appassets.androidplatform.net/assets/public/` (non `file://`). I `.map` in `dist/` collegano il bundle ai TypeScript.

> L’emulatore TV non replica al 100% un device (HDMI, storage, API vendor). Per validazione finale usare un Android TV / stick fisico.

---

## PC

Lo shell desktop vive in [`target/pc`](./target/pc). Vite bundla UI + core (`src/`); **Electron 45** apre il bundle in una finestra nativa (Windows / Linux / macOS). HelloWorld è lo smoke test, come sulle altre piattaforme.

```
target/pc/
├── electron/
│   ├── main.ts       # processo principale
│   └── preload.cjs   # bridge isolato verso il renderer
├── index.html
├── package.json      # workspace @fluid-player/pc
├── vite.config.ts    # alias @fluid → ../../src
├── scripts/dev.mjs   # tsc main + Vite + Electron
└── src/
    ├── main.ts       # bootstrap renderer
    └── style.css
```

```bash
npm run dev:pc
npm run build:pc
npm run start:pc
```

Dettaglio: [target/pc/README.md](./target/pc/README.md).

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
