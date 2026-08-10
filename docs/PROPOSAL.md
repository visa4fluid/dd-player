# Fluid Player

Software di digital signage / media orchestration per la distribuzione di contenuti multimediali su **superfici porzionabili**.

Supporta immagini, video, audio e HTML dinamico. I contenuti possono essere lanciati singolarmente o tramite playlist, anche in contemporanea su più superfici. Il core è indipendente dall’interfaccia grafica e può essere comandato da dashboard remote.

Funziona **local-first**: il player opera offline con contenuti e configurazioni locali. Opzionalmente si autentica ad API cloud per scaricare asset e sincronizzare dati (playlist, layout, schedule, stato).

---

## Obiettivi

| Requisito | Descrizione |
|-----------|-------------|
| Multi-superficie | Una o più superfici logiche (zone/regioni) sullo stesso display o su display distinti |
| Porzionamento | Suddivisione dello schermo in regioni indipendenti (layout a griglia, template, zone libere) |
| Multimediale | Immagini, video, audio, HTML dinamico (widget, pagine web, app embed) |
| Playlist | Sequenze temporizzate, loop, priorità, fallback |
| Concorrenza | Più risorse attive contemporaneamente su superfici diverse |
| Cross-platform | Linux, macOS, Windows, Tizen, webOS, Android |
| Core ↔ UI | Core headless comandabile da dashboard locali o remote |
| Local-first | Operatività completa senza cloud; rete non obbligatoria |
| Cloud sync (opz.) | Auth verso API remote, download contenuti, sync bidirezionale o pull di metadati |

---

## Proposta architetturale

### Principio: Core headless + client di controllo + sync opzionale

```
┌─────────────────────────────────────────────────────────────┐
│                     Dashboard / UI                          │
│   (Web, desktop, tablet, pannello di sala, mobile)          │
└───────────────────────────┬─────────────────────────────────┘
                            │  API locale (HTTP / WebSocket)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Fluid Core                             │
│  Domini DDD · Scheduler · Session · Local Store             │
└───────────┬─────────────────────────────┬───────────────────┘
            │                             │
            ▼                             ▼ (opzionale)
    ┌───────────────┐           ┌─────────────────────────┐
    │ Platform      │           │ Cloud Sync / Identity   │
    │ Adapters      │           │ Auth · Pull · Push      │
    └───────────────┘           └───────────┬─────────────┘
                                            │
                                            ▼
                                ┌─────────────────────────┐
                                │   Cloud APIs            │
                                │   contents · catalog    │
                                │   playlists · devices   │
                                └─────────────────────────┘
```

- **Core**: logica di dominio, scheduling, stato, API di controllo. Nessuna dipendenza da UI nativa.
- **Dashboard**: client che parla solo con l’API del Core (può girare su un altro device).
- **Cloud**: adattatore esterno; il dominio locale resta la source of truth in runtime offline.

---

## Local-first e Cloud

### Modalità operative

| Modalità | Comportamento |
|----------|----------------|
| **Locale puro** | Asset, playlist, layout e schedule solo su disco/DB locale. Nessuna credenziale cloud. |
| **Locale + Cloud pull** | Dopo auth, scarica/aggiorna catalogo e file; il playback continua a usare la cache locale. |
| **Locale + Sync** | Pull di contenuti/config + push di telemetria/stato device (online, cosa sta andando, errori). |

### Principi

1. **Il runtime non dipende dal cloud** — se la rete cade, playlist e surface continuano.
2. **Il cloud arricchisce, non sostituisce** — i comandi di play/stop restano sull’API locale del Core.
3. **Auth esplicita** — device o operatore si collegano (token OAuth2 / API key / device credentials); senza auth, zero chiamate remote.
4. **Cache durable** — asset scaricati restano disponibili offline fino a purge/policy.
5. **Conflict policy** — in caso di divergenza locale vs cloud: *cloud-wins* su catalogo remoto, *local-wins* su override operatore (configurabile per aggregate).

### Flusso sync (bozza)

```
1. Identity     → login / device pairing → access + refresh token
2. Catalog sync → GET /playlists, /layouts, /schedules (delta/etag)
3. Content sync → download asset mancanti o aggiornati (hash/size)
4. Apply        → aggiorna store locale; scheduler riparte se necessario
5. Report       → POST heartbeat / playback status (opzionale)
```

### Cosa si sincronizza

| Dato | Direzione tipica | Dominio |
|------|------------------|---------|
| Asset binari | Cloud → Device | Content Library |
| Metadati asset | Cloud → Device | Content Library |
| Playlist / schedule | Cloud → Device (override locale opz.) | Programming |
| Layout / surface template | Cloud → Device | Surface & Layout |
| Credenziali / tenant | Cloud → Device | Identity & Tenancy |
| Stato player, errori | Device → Cloud | Operations / Telemetry |
| Comandi remoti (opz.) | Cloud → Device (via poll/WS) | Playback Control |

---

## Domini (DDD) — Bounded Context

Il sistema si organizza intorno a bounded context con linguaggio ubiquo condiviso. Ogni cartella di dominio contiene: modello, use case/application service, porte (port) e, all’esterno, adapter.

```
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ Identity &       │   │ Content Library  │   │ Surface & Layout │
│ Tenancy          │   │                  │   │                  │
└────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │                      │                      │
         └──────────┬───────────┴──────────┬───────────┘
                    │                      │
           ┌────────▼────────┐    ┌────────▼────────┐
           │ Programming     │    │ Playback        │
           │ (Playlist /     │    │ Control         │
           │  Schedule)      │    │ (Session/Show)  │
           └────────┬────────┘    └────────┬────────┘
                    │                      │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Sync & Integration  │
                    │ (Cloud, local I/O)  │
                    └─────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Operations          │
                    │ (Health, Telemetry) │
                    └─────────────────────┘
```

### Catalogo dei domini

| Bounded Context | Linguaggio ubiquo | Responsabilità | Non fa |
|-----------------|-------------------|----------------|--------|
| **Identity & Tenancy** | Account, DeviceCredential, Tenant, Token, Pairing | Auth locale dashboard, auth cloud, ruoli, binding device↔tenant | Non gestisce playlist né rendering |
| **Content Library** | Asset, MediaType, ContentRef, CacheEntry, Checksum | Registro asset, storage locale, download, integrità file, purge | Non decide *quando* riprodurre |
| **Surface & Layout** | Surface, Region, Layout, Display, ZOrder, AudioFocus | Porzionamento schermo, template, assegnazione viewport | Non conosce timing delle playlist |
| **Programming** | Playlist, PlaylistItem, Schedule, Transition, LoopPolicy | Composizione sequenze e pianificazione temporale | Non esegue il play reale |
| **Playback Control** | Session, Cue, PlaybackCommand, Priority, Preempt | Runtime: play/pause/stop, concorrenza multi-surface, priorità | Non scarica file; non disegna pixel |
| **Sync & Integration** | SyncJob, Delta, RemoteCatalog, ConflictPolicy | Orchestrazione sync cloud↔locale, mapping DTO↔dominio | Non contiene regole di layout/playback |
| **Operations** | Heartbeat, Health, DeviceStatus, Incident | Monitoring, log strutturati, watchdog | Non altera il modello creativo |

### Relazioni tra contesti

- **Programming** referenzia Asset tramite `ContentRef` (ID + checksum), non possiede i file.
- **Playback Control** riceve comandi e risolve Surface + ContentRef + Playlist → Session attiva.
- **Sync** traduce i contratti cloud negli aggregate di Content / Programming / Layout; scrive solo tramite porte dei rispettivi contesti.
- **Identity** emette credenziali usate da Sync e (opz.) dalla dashboard remota; gli altri contesti non parlano direttamente col cloud.

### Eventi di dominio (esempi)

| Evento | Emesso da | Consumatori tipici |
|--------|-----------|-------------------|
| `AssetCached` | Content Library | Playback, Operations |
| `PlaylistUpdated` | Programming | Playback (reload), Sync |
| `LayoutApplied` | Surface & Layout | Playback, Renderer |
| `PlaybackStarted` / `Ended` | Playback Control | Operations, Sync (report) |
| `CloudSyncCompleted` | Sync | Content, Programming, Operations |
| `AuthSessionExpired` | Identity | Sync (pausa), Dashboard |

---

## Stack tecnologico proposto

### Opzione A — Consigliata: Core in Rust + renderer WebView

| Layer | Tecnologia | Motivazione |
|-------|------------|-------------|
| Core | **Rust** | Performance, sicurezza memoria, binario nativo multi-OS, ottimo per headless |
| API locale | **HTTP + WebSocket** (o gRPC) | Controllo remoto LAN, eventi real-time |
| Persistenza | SQLite + filesystem asset | Local-first, query su catalogo/playlist |
| Cloud client | HTTP + OAuth2/OIDC (adapter) | Auth e sync senza accoppiare i domini |
| Renderer desktop | **WebView** (Tauri / Wry) o **Chromium Embedded** | HTML dinamico; video/immagine via media element |
| Renderer TV | Browser / WebApp del vendor (Tizen, webOS) | Stesso HTML/JS dove possibile |
| Android | WebView + servizio foreground, Core via FFI/JNI | Full o thin |
| Dashboard | **Web app** (React/Vue/Svelte) | Una sola UI per i dispositivi di controllo |

### Opzione B — Core in Go + Electron/Chromium per desktop

| Layer | Tecnologia |
|-------|------------|
| Core | Go (HTTP API, scheduler) |
| Desktop | Electron o CEF |
| Mobile/TV | WebView / WebApp |

### Opzione C — Tutto-web con runtime nativo minimo

Player = PWA / WebApp + thin native shell. Adatto a prototipi; meno ideale per scheduling affidabile e vincoli TV.

**Raccomandazione**: **Opzione A** (o B se il team è Go), con contratti di dominio e API stabili dal giorno 1.

---

## Modello concettuale (per dominio)

### Surface & Layout

```yaml
surface:
  id: "main-left"
  display: 0
  region: { x: 0, y: 0, w: 0.5, h: 1.0 }  # normalizzato 0–1
  z_index: 1
  audio_focus: true
```

- Fullscreen, porzioni (split, pip), o virtuali (solo audio, ticker).

### Content Library — Asset

| Tipo | Esempi | Note |
|------|--------|------|
| `image` | JPG, PNG, WebP, SVG | Durata in playlist |
| `video` | MP4, WebM, HLS | Loop, mute, fit/fill |
| `audio` | MP3, AAC, WAV | Surface audio dedicata |
| `html` | URL locale/remota, bundle ZIP | Widget / pagine dinamiche |
| `stream` | RTSP / HLS / WebRTC | Fase successiva |

### Programming — Playlist

```yaml
playlist:
  id: "lobby-morning"
  loop: true
  items:
    - asset_ref: "welcome.mp4"
      duration: null
      surfaces: ["main"]
    - asset_ref: "promo.html"
      duration: 30s
      surfaces: ["main", "side"]
```

### Playback Control — Session

Istanze runtime: quali playlist/asset sono attivi, su quali surface, con quale priorità (incluso preempt/alert).

---

## API di controllo locale (bozza)

Esposta dal Core; consumata da dashboard (e da tool di automazione).

```
POST   /api/v1/surfaces
GET    /api/v1/surfaces
POST   /api/v1/assets
GET    /api/v1/assets
POST   /api/v1/playlists
POST   /api/v1/playlists/{id}/play
POST   /api/v1/play
POST   /api/v1/stop
POST   /api/v1/pause
GET    /api/v1/status
WS     /api/v1/events

# Identity & Cloud (opzionali)
POST   /api/v1/auth/login
POST   /api/v1/auth/device-pair
POST   /api/v1/sync/start
GET    /api/v1/sync/status
DELETE /api/v1/auth/session
```

Autenticazione LAN dashboard: token locale / pairing QR-PIN. Cloud: credenziali separate, gestite solo da **Identity**.

---

## Porzionamento delle superfici

1. **Layout template** — preset (`split-h`, `split-v`, `quad`, `pip`)
2. **Region editor** — zone in percentuale
3. **HTML container** — ogni surface è viewport (iframe/WebView); compositor CSS Grid/Flex

Il compositor (adapter di rendering) applica Region, z-order, audio focus e transizioni; la logica resta in **Surface & Layout** + **Playback Control**.

---

## Strategia multi-piattaforma

| Piattaforma | Approccio |
|-------------|-----------|
| **Linux / macOS / Windows** | Core + shell WebView (Tauri) oppure Core servizio + browser kiosk |
| **Android** | App host + Core FFI/JNI; player in WebView |
| **Tizen / webOS** | Thin client WebApp verso Core in rete, oppure Full se il device lo consente |

```
[Full]  PC / Android box     → Core + Renderer + Store locale (+ Sync opz.)
[Thin]  Smart TV             → Renderer; Core su altro device in LAN/cloud edge
```

---

## Dashboard

Web app / PWA. Parla **solo** con l’API del Core.

- Layout e superfici, libreria asset, editor playlist
- Live control e monitoring
- Login cloud / pairing device (delega a Identity via Core)
- Stato sync e spazio cache
- Ruoli: admin / operatore / sola lettura

---

## Struttura repository (ottica DDD)

Monorepo organizzato per **bounded context** nel Core; UI, shell e adapter restano ai bordi (hexagonal / ports & adapters).

```
fluid-player/
├── README.md
├── docs/
│   ├── architecture.md
│   ├── domains.md              # linguaggio ubiquo, contesti, eventi
│   ├── api-local.md
│   ├── api-cloud.md            # contratti attesi verso il cloud
│   └── platforms.md
│
├── protocols/                  # contratti condivisi (non dominio)
│   ├── local-openapi/
│   ├── cloud-openapi/          # o JSON Schema / proto verso SaaS
│   └── events/                 # schema eventi di dominio / integrazione
│
├── core/                       # Application + Domain (headless)
│   ├── shared-kernel/          # tipi trasversali minimi (Id, Instant, Result…)
│   │
│   ├── identity/               # BC: Identity & Tenancy
│   │   ├── domain/
│   │   ├── application/        # use case: login, pair, refresh
│   │   └── port/               # TokenStore, CloudAuthPort
│   │
│   ├── content/                # BC: Content Library
│   │   ├── domain/             # Asset, Checksum, MediaType
│   │   ├── application/        # register, cache, purge
│   │   └── port/               # AssetRepository, BlobStore, ContentDownloader
│   │
│   ├── surface/                # BC: Surface & Layout
│   │   ├── domain/
│   │   ├── application/
│   │   └── port/
│   │
│   ├── programming/            # BC: Playlist & Schedule
│   │   ├── domain/
│   │   ├── application/
│   │   └── port/
│   │
│   ├── playback/               # BC: Playback Control
│   │   ├── domain/             # Session, Cue, Priority
│   │   ├── application/        # play, stop, preempt
│   │   └── port/               # RendererPort, Clock
│   │
│   ├── sync/                   # BC: Sync & Integration
│   │   ├── domain/             # SyncJob, ConflictPolicy
│   │   ├── application/        # pull catalog, download, report
│   │   └── port/               # CloudCatalogPort, CloudContentPort
│   │
│   ├── operations/             # BC: Health & Telemetry
│   │   ├── domain/
│   │   ├── application/
│   │   └── port/
│   │
│   └── bootstrap/              # composition root: wiring use case ↔ adapter
│
├── adapters/                   # Infrastructure (implementa le port)
│   ├── persistence/            # SQLite, filesystem blob
│   ├── http-local/             # REST/WS → application services
│   ├── cloud-http/             # client API cloud (auth, catalog, download)
│   ├── renderer-bridge/        # comandi verso compositor
│   └── platform/               # fs, power, paths per OS
│
├── renderer/                   # compositing UI (web) — anti-corruption verso Playback
├── dashboard/                  # UI di controllo (altro bounded context di presentation)
├── shell/                      # host nativi
│   ├── desktop/                # Tauri / Wry
│   ├── android/
│   ├── tizen/
│   └── webos/
│
└── tools/                      # script CI, codegen OpenAPI, seed locali
```

### Regole di dipendenza

```
domain  →  (niente infrastruttura)
application  →  domain + port (interfacce)
adapters  →  application/port  (implementazioni)
bootstrap  →  collega adapters alle port
dashboard / renderer  →  solo API locale / bridge, mai domain interni
sync adapters  →  non bypassano i use case di content/programming
```

### Shared kernel

Solo primitive stabili e poveri di significato di business (`AssetId`, `SurfaceId`, errori comuni). Evitare un “modello unico” gigante: meglio riferimenti tra contesti (`ContentRef`) e anti-corruption layer in **Sync** verso i DTO cloud.

---

## Roadmap proposta

### Fase 0 — Fondamenta

- [ ] Mappa domini + linguaggio ubiquo (`docs/domains.md`)
- [ ] Contratti API locale e (stub) cloud
- [ ] Core: Content + Surface + Playback (1 surface, play asset)
- [ ] Persistenza locale SQLite/fs
- [ ] Dashboard skeleton play/stop

### Fase 1 — MVP local-first

- [ ] Multi-surface + Programming (playlist)
- [ ] Tipi image/video/audio/html locale
- [ ] Operations base (status, eventi WS)
- [ ] Packaging desktop

### Fase 2 — Cloud opzionale

- [ ] Identity (device pair / OAuth)
- [ ] Sync pull catalog + download asset
- [ ] Policy offline e conflict
- [ ] Report heartbeat → cloud

### Fase 3 — Piattaforme e operatività

- [ ] Android; thin Tizen/webOS
- [ ] Sync multi-schermo, watchdog, telemetria avanzata
- [ ] Comandi remoti da cloud (opz.)

---

## Vincoli e decisioni aperte

1. **Linguaggio del Core** — Rust vs Go
2. **Scheduler su TV** — Full locale vs Thin + Core remoto
3. **Packaging HTML** — cartella, ZIP firmato, CSP
4. **Audio** — exclusive focus vs mix
5. **Conflict sync** — cloud-wins vs merge per aggregate
6. **Modello auth cloud** — OAuth utente vs device credential vs entrambi
7. **Licenza / OTA / rete** — LAN only vs VPN vs cloud relay

---

## Criteri di successo (MVP)

- Core locale: 2 surface con video + HTML in parallelo, senza cloud
- Playlist in loop da store locale
- Dashboard su altro device comanda play/stop via LAN
- Con credenziali cloud: sync scarica asset/playlist e il player li usa offline dopo il pull
- Contesti DDD separati: Sync non richiama il renderer; Playback non scarica file

---

## Prossimi passi

1. Congelare stack (A/B) e bounded context v0
2. Scrivere `docs/domains.md` + OpenAPI locale
3. Prototipo: Content + Playback + adapter persistence + dashboard
4. Aggiungere Identity + Sync come porta opzionale

---

## Nome e branding

**Fluid Player** — orchestrazione fluida su superfici flessibili. Alternative: *Fluid Surface*, *Fluid Signage*.

---

*Documento di proposta — local-first, cloud opzionale, repository per domini DDD.*
