# Fluid Player — shell Android

Web app Android (WebView): Vite bundla UI + **core comune** (`../../src`, moduli in `../../src/module`) in `dist/`. Lo stesso bundle servirà superfici, HTML dinamico, media e i manager (device, playlist, system, communication, storage).

Workspace npm: `@fluid-player/android`.

Oggi lo shell mostra HelloWorld (smoke test, come webOS/Tizen). L’host nativo Kotlin carica `dist/` in un WebView a schermo intero (`Fluid Player` sul launcher TV).

## Struttura

```
target/android/
├── index.html
├── package.json
├── vite.config.ts    # alias @fluid → ../../src
├── tsconfig.json
├── scripts/
│   ├── sync-assets.mjs   # dist/ → native/app/src/main/assets/public/
│   └── simulate.mjs      # Gradle installDebug + am start
├── native/               # APK Kotlin (WebView, Leanback)
└── src/
    ├── main.ts           # bootstrap (HelloWorld; qui si collegheranno i manager)
    └── style.css         # #stage = finestra / future superfici
```

Flusso:

```
../../src  +  src  ──Vite──►  dist/  ──sync-assets──►  native assets  ──installDebug──►  emulatore
                     ▲
              core: device, playlist, system, …
```

## Requisiti esterni (SDK / tool)

| Componente | Dove | Note |
|------------|------|------|
| **Node.js ≥ 20** | [nodejs.org](https://nodejs.org/) | Build e script npm |
| **Android Studio** | [Download Studio](https://developer.android.com/studio) | SDK Manager, Device Manager, AVD |
| **Android SDK** | di solito `$HOME/Android/Sdk` | `platform-tools` (`adb`), `emulator` |
| **System image Android TV** | SDK Manager → SDK Platforms | Es. API 36, `android-tv`, x86_64 — **non** un’immagine telefono |
| **JDK 17** (`javac`) | [Temurin 17](https://adoptium.net/) | Gradle 8.11; niente JRE-only né JBR Java 25+ |
| **KVM** (Linux) | `qemu-kvm`, gruppo `kvm` | Obbligatorio per l’emulatore x86 |
| **Docs Google** | [Android TV emulator](https://developer.android.com/training/tv/start/hardware#emulator) | Setup AVD TV |

`dev:android` / `build:android` / `preview:android` **non** richiedono Studio: bastano Node e Vite. Per l’emulatore servono SDK + AVD + JDK.

### Variabili `.env` / shell (root del repo)

Vedi [`.env.example`](../../.env.example):

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
export JAVA_HOME="/path/to/jdk-17"
```

`simulate:android` cerca `adb` in `$ANDROID_HOME/platform-tools` (default `$HOME/Android/Sdk`). Per Gradle: `~/Program/jdk-17` se esiste `bin/javac`, altrimenti `JAVA_HOME`, altrimenti lo JBR di Studio.

Opzionale (gitignorato):

```bash
echo "sdk.dir=$HOME/Android/Sdk" > native/local.properties
```

### Linux (KVM)

Senza `/dev/kvm` l’emulatore x86 esce con *hardware acceleration*. Verifica:

```bash
kvm-ok
groups   # deve comparire kvm (poi ri-login)
```

## Comandi (dalla root del repo)

```bash
npm install
npm run dev:android        # http://localhost:5175 — iterazione UI senza emulatore
npm run build:android      # → target/android/dist/
npm run preview:android    # http://localhost:4175
npm run typecheck:android
npm run package:android    # build Vite + copia in assets del WebView
npm run simulate:android   # package + APK debug sull’emulatore già acceso
```

Oppure dal workspace:

```bash
npm run dev -w @fluid-player/android
npm run build -w @fluid-player/android
```

### Emulatore

1. Crea un AVD **TV** in Android Studio (Device Manager → TV → system image Android TV).
2. Avvialo e aspetta `adb devices` → `emulator-….	device`:

   ```bash
   emulator -avd Flud_HD_Tv -gpu host
   ```

   (`emulator -list-avds` elenca i nomi; `Flud_HD_Tv` è un esempio.)

3. Installa e avvia l’app:

   ```bash
   npm run simulate:android
   ```

   `emulator -avd` da solo **non** installa l’APK.

### Debug WebView

Con l’APK debug sull’emulatore: Chrome → `chrome://inspect/#devices` → inspect su `com.fluidplayer.app`.  
Origine: `https://appassets.androidplatform.net/assets/public/` (i moduli ES da `file://` sono bloccati da CORS).

## Note

- Target build Vite: `chrome100`, `base: './'` (path relativi). Il WebView li serve da `https://appassets.androidplatform.net/assets/public/`.
- `#stage` è la finestra del player: le porzioni / superfici e i `<video>` andranno qui; `#app` è lo slot attuale (HelloWorld).
- I moduli core restano in `src/module/` e si importano con `@fluid/…` da `main.ts` (es. `AndroidDeviceInfo`).
- Storage file, kiosk, servizio foreground e seconda uscita HDMI restano nel guscio Kotlin, non in questo bundle.
- Documentazione generale: [README root](../../README.md#android).
