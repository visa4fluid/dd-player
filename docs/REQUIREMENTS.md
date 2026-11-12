# Requisiti

1. **Funzionali** — cosa offre il software.
2. **Tecnici** — tool e SDK. Passi operativi nel [README](../README.md). Variabili: [`.env.example`](../.env.example).
3. **Operativi** — convalida dei requisiti funzionali in esercizio.

---

## Requisiti funzionali

- Definizione delle piattaforme target (Windows, Linux, macOS, webOS, Tizen, Android)
- Online e offline
- Gestione di più flussi video con hardware dedicato
- Personalizzazione della matrice colore e gestione dei flussi audio
- Struttura modulare
- Integrazione di sistemi esterni (Nova, Stream Deck, Bertelè)

### Piattaforme target

- Windows
- Linux
- macOS
- webOS
- Tizen
- Android

### Online e offline

Il player può sfruttare il servizio cloud oppure no.

- Senza rete: riproduzione e regia usano solo ciò che è già sul dispositivo.
- Con rete ma senza login: il player resta operativo; **nessun** accesso ai dati cloud dell’organizzazione.
- Con rete e login: l’utente vede e sincronizza i dati del proprio tenant. Il playback resta sulla cache locale.
- Se la rete cade dopo un sync, si continua offline sui dati già scaricati.

### Gestione di più flussi video con hardware dedicato

Più video contemporanei, su schermi diversi o sullo stesso, con hardware dedicato.

- Play / pause / stop indipendenti per flusso.
- Sorgenti: file in cache, stream, ingressi di regia.

### Matrice colore e flussi audio

Regolazioni sul **singolo contenuto** lanciato su quello schermo, non sul display intero.

- Matrice colore (RGB, luminosità / contrasto) per quel lancio.
- Canali audio: volume, mute, bilanciamento, routing verso le uscite.
- Lo stesso file su due schermi può avere colore e mix diversi.

### Struttura modulare

Il core è a **moduli** (bounded context DDD) in `src/module/`. Ogni modulo ha `domain`, `application`, `infrastructure`. La UIX sta in `target/`, non nel modulo.

Ogni modulo è owner del proprio dominio e include:

- **CRUD** dei dati di competenza
- **manager** e **scheduler** relativi a quel dominio

I moduli si parlano via **application**, non toccando l’infrastructure altrui.

**Moduli aggiuntivi** si possono caricare a **runtime** per estendere le funzionalità, senza toccare il core. Si agganciano all’application dei moduli già presenti.

- **device** — host fisico
- **system** — sistema corrente e superfici
- **auth** — identità e sessioni
- **playlist** / **standalone** — contenuti in sequenza o singoli
- **external flows** — flussi AV esterni
- **settings** — configurazione locale
- **communication** — P2P e cloud (solo con login)

Dettaglio core: [MODULE_CORE.md](./MODULE_CORE.md). Estensioni runtime: [EXTENSION.md](./EXTENSION.md).

### Integrazione di sistemi esterni

Il player si integra con hardware e software di regia / controllo esterni, tra cui:

- **Nova**
- **Stream Deck**
- **Bertelè**

---

## Requisiti tecnici

Cosa serve per il core e per Simulator / emulatore.

### Core (sempre)

Serve per `npm install`, typecheck, lint, test, `build` e i `dev:*` / `build:*` in browser.

| Requisito | Versione / note |
|-----------|-----------------|
| **Node.js** | ≥ 20 (`engines` in `package.json`) |
| **npm** | quello bundled con Node 20+ |
| **Git** | clone del repo |

```bash
npm install
```

Non servono SDK TV/Android per lavorare sul TypeScript in `src/` o per aprire Vite nel browser.

### Matrice per obiettivo

| Obiettivo | Core | Extra |
|-----------|------|--------|
| Test / lint / typecheck | sì | — |
| `dev:webos` / `dev:tizen` / `dev:android` (browser) | sì | — |
| `simulate:webos` | sì | webOS TV Simulator + CLI |
| `simulate:tizen` | sì | Tizen Studio + `zip` |
| `simulate:android` | sì | Android SDK, AVD TV, JDK 17, KVM (Linux) |
| Package TV / APK | sì | tool della piattaforma (sotto) |

### webOS

Dettaglio comandi: [README — webOS](../README.md#webos), [target/webos/README.md](../target/webos/README.md).

| Requisito | Dove | Note |
|-----------|------|------|
| **`@webos-tools/cli`** | `npm install` in root | `ares-package`, `ares-launch` |
| **webOS TV Simulator** | [Installazione LG](https://webostv.developer.lge.com/develop/tools/simulator-installation) | Zip/AppImage (es. 23–26), non è npm |

| Variabile | Ruolo |
|-----------|--------|
| `WEBOS_SIMULATOR_VERSION` | Versione installata (es. `26`) |
| `WEBOS_SIMULATOR_PATH` | Cartella che contiene l’AppImage, non il path del file |

Su Linux (Ubuntu 24+ / elementary) l’AppImage spesso fallisce su `chrome-sandbox`: avvio a mano con `--no-sandbox` (e `--ozone-platform=x11` su Wayland), oppure wrapper `*.appimage` minuscolo. Vedi README.

TV fisica: Developer Mode LG; `npm run package:webos` produce l’`.ipk`.

### Tizen

Dettaglio comandi: [README — Tizen](../README.md#tizen), [target/tizen/README.md](../target/tizen/README.md).

| Requisito | Dove | Note |
|-----------|------|------|
| **`zip`** | pacchetto di sistema | Usato da `package-wgt.mjs` |
| **Tizen Studio** | [Download](https://developer.tizen.org/development/tizen-studio/download) | CLI `tizen`, `sdb` |
| **TV Extension** | Package Manager / [TV Extension](https://developer.samsung.com/smarttv/develop/tools/tv-extension/download.html) | Profilo TV |
| **Samsung TV Web Simulator** | Package Manager (`tools/sec-tv-simulator/`) | Smoke test UI |
| **Certificate Extension** | Package Manager | Solo `.wgt` firmati (TV / Emulator) |

Dopo Tizen Studio, nel Package Manager installa almeno: TV Extensions (`TV-SAMSUNG-Public` o equivalente), Samsung TV Web Simulator, Certificate Extension se fai deploy su device.

| Variabile | Ruolo |
|-----------|--------|
| `TIZEN_STUDIO_PATH` | Root di Tizen Studio (`tools/sec-tv-simulator/simulator` o `simulator.sh`) |

Su Ubuntu 24.04 / elementary OS 8 l’installer può chiedere pacchetti con nomi vecchi (`libcurl3-gnutls`, `libncurses5`, `python3.8`, …). Spesso servono equivalenti `*t64*` o PPA.

Il `.wgt` di `package:tizen` è unsigned (ok Web Simulator). TV / Emulator: certificate profile + `tizen package -t wgt -s <profile>`.

### Android

Dettaglio comandi: [README — Android](../README.md#android), [target/android/README.md](../target/android/README.md).

`dev:android` / `build:android` / `preview:android` usano solo Node + Vite. Per l’emulatore e l’APK servono i tool sotto.

| Requisito | Dove | Note |
|-----------|------|------|
| **Android Studio** | [Download](https://developer.android.com/studio) | SDK Manager, Device Manager |
| **Android SDK** | di solito `$HOME/Android/Sdk` | `platform-tools` (`adb`), `emulator` |
| **SDK Platform + Build-Tools** | SDK Manager | Allineati al `compileSdk` del host (oggi 36) |
| **System image Android TV** | SDK Manager | Es. API 36, `android-tv`, x86_64 — **non** un’immagine telefono |
| **cmdline-tools** | SDK Manager | `sdkmanager` da CLI |
| **JDK 17** con `javac` | [Temurin 17](https://adoptium.net/) | Gradle 8.11: niente JRE-only né JBR Java 25+ |
| **KVM** (Linux) | `qemu-kvm`, gruppo `kvm` | Obbligatorio per AVD x86 (`kvm-ok`) |
| **AVD TV** | Device Manager | Es. 1080p + system image Android TV |

| Variabile | Ruolo |
|-----------|--------|
| `ANDROID_HOME` | Root SDK (`platform-tools/`, `emulator/`). Default script: `$HOME/Android/Sdk` |
| `JAVA_HOME` | JDK 17. `simulate:android` prova prima `~/Program/jdk-17` se c’è `javac`, poi questa, poi lo JBR di Studio |
| `PATH` | Deve includere `$ANDROID_HOME/emulator` e `$ANDROID_HOME/platform-tools` |

Opzionale (gitignorato):

```bash
echo "sdk.dir=$HOME/Android/Sdk" > target/android/native/local.properties
```

`npm run simulate:android` richiede un emulatore già in `adb devices` (`emulator-…. device`). `emulator -avd` da solo non installa l’APK.

Output: APK **debug** in `target/android/native/app/build/outputs/apk/debug/app-debug.apk` (non firmato per Play Store).

Debug WebView: Chrome → `chrome://inspect/#devices`. Origine `https://appassets.androidplatform.net/assets/public/` (non `file://`).

### Device fisici (validazione)

Simulator ed emulatore non coprono DRM, alcune API vendor, HDMI, storage reale.

| Piattaforma | Cosa serve in più |
|-------------|-------------------|
| **webOS TV** | Developer Mode, `.ipk` da `package:webos` |
| **Tizen TV** | Developer Mode, `.wgt` firmato, `sdb` |
| **Android TV / stick** | Debug USB / origini sconosciute, APK debug o release firmato |

---

## Requisiti operativi

- Convalida dei requisiti funzionali e integrazione più dettagliata dei comandi da implementare
- Studio delle UIX di software di regia (OBS) e generazione di mockup per proporre soluzioni grafiche
- Definizione delle tecnologie e dell’architettura
- Sviluppo agile del player e adeguamento API cloud

| Fase | Durata | Quando | Figure |
|------|--------|--------|--------|
| Convalida funzionali e comandi | 1 settimana | per primo | Dev, Project Manager |
| Studio UIX (OBS) e mockup | variabile | in parallelo dopo 01 | UIX Designer |
| Tecnologie e architettura | 1 settimana | in parallelo con 02 | Dev |
| Sviluppo agile e API cloud | variabile | dopo 02 e 03 | Dev, Tester, Project Manager |

In esercizio si verifica che i requisiti funzionali tengano:

- **Online e offline** — riproduzione in sala senza rete; con login, sync del tenant; senza login, nessun dato cloud.
- **Più flussi video** — più video contemporanei con hardware dedicato, play / pause / stop indipendenti.
- **Matrice colore e audio** — regolazioni per singolo contenuto su quello schermo.
- **Struttura modulare** — core + extra a runtime; CRUD, manager e scheduler per dominio.
