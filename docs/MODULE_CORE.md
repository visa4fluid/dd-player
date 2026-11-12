# Module Core

Il core di Fluid Player è organizzato secondo **Domain-Driven Design (DDD)**: ogni modulo corrisponde a un bounded context con un proprio modello e responsabilità chiare.

**Layout sorgente:** i moduli core vivono in [`src/module/`](../src/module/), ciascuno in una sottocartella minuscola (es. `src/module/device/`, `src/module/system/`). Naming file: [CONVENTIONS.md](./CONVENTIONS.md).

---

## Pattern: DDD

- Ogni modulo core è un **bounded context**
- Il dominio del modulo non dipende da UI, filesystem concreto o vendor di database
- La comunicazione tra moduli avviene tramite contratti espliciti (application services / eventi), non accedendo allo storage altrui
- Le estensioni a runtime si agganciano all’**application** esposta, non all’infrastructure interna dei moduli
- La **presentation** (UIX) vive fuori dal core, tipicamente in `target/`

Dettaglio dei singoli domini: da approfondire. Qui si fissa la mappa dei moduli e i layer trasversali.

---

## Moduli core

| Modulo | Ruolo (bozza) |
|--------|----------------|
| **device** | Dispositivo fisico host: identità HW, CPU/RAM/storage, capability; servizi accessori di gestione del device |
| **system** | Ciclo di vita app / bootstrap logico; **System Manager** (sistema corrente + superfici); sync cloud di schermi/standalone e opzione download playlist del system |
| **auth** | Identità, credenziali, pairing, token/sessioni (locale e Fluid Next) |
| **playlist** | Playlist, item, timing, loop; **Playlist Manager** = stato runtime del dominio + comandi di launch verso system |
| **standalone** | Riproduzione autonoma (fuori playlist); **Standalone Manager** = stato runtime del dominio + comandi di launch verso system |
| **external flows** | Gestione flussi audio/video esterni (regia, ingressi/uscite, routing) |
| **settings** | Configurazione locale del player e preferenze |
| **communication** | Servizi di comunicazione: **peer-to-peer** in sottorete; **cloud** Fluid Next solo se autenticati sulle API Fluid Next |

Il dettaglio funzionale di ciascun modulo sarà definito progressivamente.

### device — host fisico

**device** rappresenta il **dispositivo fisico** su cui gira Fluid Player (PC, webOS TV, Tizen TV, Android, …). Non confondere con **system**: quest’ultimo è il *sistema Fluid* logico (schermi/superfici); **device** è la macchina host.

#### Dati di dominio (profilo hardware)

| Ambito | Esempi |
|--------|--------|
| **Identità** | ID stabile del device, piattaforma (`webos` / `tizen` / `pc` / …), modello, vendor/brand, firmware / OS version |
| **CPU** | Architettura, modello/nome dove disponibile, core (se esposto dalla piattaforma) |
| **RAM** | Memoria totale e disponibile |
| **Storage** | Capacità e spazio libero sulle unità rilevanti al player |
| **Display / AV capability** | Risoluzione, UHD/8K, HDR, tipo pannello (quando la piattaforma lo espone) |
| **Rete (snapshot)** | Tipo collegamento, stato — senza sostituire **communication** |

I valori arrivano da adapter in **infrastructure** (webOS Luna / `webOS.deviceInfo`, Tizen `productinfo` + `systeminfo`, Node su PC, …). Il **domain** resta agnostico rispetto al vendor.

#### Application

| Servizio / use case | Ruolo |
|---------------------|--------|
| **Profilo / snapshot** | Espone il profilo hardware corrente e consente un refresh (probe) |
| **Identità** | Legge/assicura l’identificativo stabile del device |
| **Gestione accessoria** | Operazioni sul device host (reboot, power display, volume, …) delegate a porte implementate in infrastructure |

```
infrastructure (adapter webOS | tizen | pc | …)
        │  probe HW / comandi device / storage
        ▼
device.application  ←──  altri moduli / estensioni
        │
        ▼
device.domain
```

- Gli altri moduli **non** parlano alle API vendor: passano dall’**application** di **device** (es. `DeviceInfoManagerInterface`).
- **communication** resta owner dei canali di rete; **device** può solo riportare uno snapshot dello stato rete come proprietà host.
- **system** usa eventualmente l’application di **device** per telemetria / vincoli (es. risoluzione), non per possedere il modello hardware.

#### Infrastructure (device)

- Adapter di persistenza (snapshot cached, id locale)
- Adapter di piattaforma per probe HW e comandi accessori
- Metadati minimi legati al device (non confondere con **settings** di prodotto)

### system — System Manager e superfici

**system** include un **System Manager** (layer **application**) che gestisce il **sistema corrente** configurato sul player: quale “system” Fluid è attivo in locale, quali schermi/superfici espone, e come si allinea al cloud quando autenticati.

#### Superfici

Le **superfici** sono destinazioni di output (zone/display) che accettano contenuti multimediali attraverso un’interfaccia uniforme:

| Operazione | Significato |
|------------|-------------|
| **play / launch** | Avvia un contenuto sulla superficie |
| **pause** | Mette in pausa la riproduzione corrente |
| **stop** | Interrompe e rilascia la riproduzione sulla superficie |

Playlist e standalone non controllano il rendering in proprio: i rispettivi **manager** (application) chiedono a **system** cosa lanciare / mettere in pausa / fermare sulle superfici.

#### System Manager — sistema corrente

| Responsabilità | System Manager |
|----------------|----------------|
| Sistema corrente configurato sul player | Sì (source of truth runtime di system) |
| Elenco / visualizzazione schermi disponibili del system | Sì |
| Interfaccia play / pause / stop sulle superfici | Sì (tramite application di system) |
| Cosa sta girando in playlist / standalone | No → manager dei rispettivi moduli |

#### Download dal cloud (system → contenuti legati)

Se il system (e i relativi **schermi**) viene **scaricato dal cloud** Fluid Next (auth + communication), il System Manager orchestra anche il pull dei contenuti preparati su quel system:

| Azione | Comportamento |
|--------|----------------|
| Download system / schermi | Obbligato dal sync del system corrente dal cloud |
| Download **standalone** preparati sul cloud per quel system | **Automatico** insieme al download del system |
| Download **playlist** preparate sul cloud per quel system | **Opzionale** — il player offre la possibilità di scaricarle (scelta operatore / policy) |

```
auth (sessione Fluid Next OK)
        │
        ▼
communication ──► Fluid Next
        │
        ▼
System Manager (application)
        ├──► system corrente + schermi disponibili
        ├──► scarica tutti gli standalone del system  →  modulo standalone
        └──► propone / consente download playlist del system  →  modulo playlist
```

- Gli asset scaricati vengono consegnati ai moduli di dominio (**standalone**, **playlist**) tramite la rispettiva **application**; **system** non diventa owner del modello playlist/standalone.
- Senza autenticazione cloud il System Manager opera solo sul system configurato in locale.

### playlist & standalone — manager di runtime

Ogni modulo di programmazione ha un **manager** (application) che è la source of truth di *cosa sta girando* nel proprio bounded context.

| Responsabilità | Chi |
|----------------|-----|
| Cosa appartiene al dominio a runtime (item correnti, coda, stato sessione, …) | **Manager** del modulo (`playlist` o `standalone`) |
| Cosa sta effettivamente girando (nel senso di dominio: quale playlist/item, quale standalone attivo) | **Manager** del modulo |
| Eseguire play / pause / stop sulla superficie | **system** (superfici), su richiesta del manager |

Flusso tipico:

```
Playlist Manager / Standalone Manager  (application)
        │  decide cosa deve andare in onda
        │  (dominio di appartenenza + stato runtime)
        ▼
   system.application  →  superficie  →  play | pause | stop
```

- **system** esegue l’operazione sulla superficie; non mantiene il modello di business “quale playlist / quale standalone è attivo”.
- Il **manager** aggiorna e espone lo stato runtime del proprio dominio (anche dopo feedback da system, se previsto).

### communication — canali di rete

**communication** espone (in **application**) i servizi che permettono al software di parlare con l’esterno su due piani:

| Piano | Ambito | Uso tipico |
|-------|--------|------------|
| **Peer-to-peer** | Altri software nella stessa **sottorete** | Discovery, scambio comandi/stato, collaborazione locale tra peer |
| **Cloud** | Piattaforma **Fluid Next** | Sync, telemetria, comandi remoti — **solo con autenticazione valida** sulle API Fluid Next (via **auth**) |

Il modulo fornisce i **canali e i servizi di trasporto/sessione**; la logica di business resta nei moduli di dominio che li consumano. Dettaglio: [COMMUNICATION.md](./COMMUNICATION.md).

---

## Layer interni (per ogni modulo)

Ogni modulo core segue lo stesso stack (dipendenze verso l’interno):

```
┌─ <nome modulo> ─────────────────────────────────────────────┐
│  application                                                │
│  (use case, manager, interfacce pubbliche del BC)           │
├─────────────────────────────────────────────────────────────┤
│  domain                                                     │
│  (modello, regole, value object / aggregate del BC)         │
├─────────────────────────────────────────────────────────────┤
│  infrastructure                                             │
│  (adapter: persistenza, piattaforma, rete concreta, …)      │
└─────────────────────────────────────────────────────────────┘

presentation (UIX)  →  fuori dal modulo core, tipicamente in target/
```

Layout cartelle:

```
src/module/<nome>/
├── domain/
├── application/
├── infrastructure/
└── test/unit/{domain,application,infrastructure}/
```

Vista d’insieme dei moduli:

```
┌─ device ────────────┐  ┌─ system ────────────┐  ┌─ auth ──────────────┐
│ application         │  │ application         │  │ application         │
│ domain              │  │ domain              │  │ domain              │
│ infrastructure      │  │ infrastructure      │  │ infrastructure      │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘

┌─ playlist ──────────┐  ┌─ standalone ────────┐  ┌─ external flows ────┐
│ application         │  │ application         │  │ application         │
│ domain              │  │ domain              │  │ domain              │
│ infrastructure      │  │ infrastructure      │  │ infrastructure      │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘

┌─ settings ──────────┐  ┌─ communication ─────────────────────────────┐
│ application         │  │ application                                 │
│ domain              │  │ domain                                      │
│ infrastructure      │  │ infrastructure                              │
└─────────────────────┘  └─────────────────────────────────────────────┘

presentation / UIX  →  target/webos, target/tizen, …
```

### domain

- Modello del bounded context (entità, value object, regole)
- Nessuna dipendenza da UI, DB, filesystem o API vendor
- Non conosce gli adapter di infrastructure

### application

- Use case e **manager** del modulo (API verso altri BC e verso le estensioni)
- Dipende dal **domain**; dichiara porte (interfacce) implementate da infrastructure
- Esempio in device: `DeviceInfoManagerInterface`
- Capacità **cross** riusabili dall’intero core passano da qui

### infrastructure

- Implementazioni concrete: repository, filesystem, adapter webOS/Tizen/PC, client HTTP, …
- Implementa le porte definite in application (o porte di dominio, se presenti)
- Ogni modulo possiede il proprio spazio di persistenza; non scrive nello storage di un altro modulo

### presentation

- **Non** fa parte del package del modulo core
- Shell e UIX in `target/` (webOS, Tizen, …) e eventuali dashboard remote
- Consuma solo i contratti **application** del core

---

## Regole di dipendenza

1. **domain** non importa application, infrastructure né presentation  
2. **application** dipende da domain e da porte astratte; non da adapter concreti  
3. **infrastructure** implementa le porte e può usare domain; non è consumata direttamente dagli altri moduli  
4. Gli altri moduli e le estensioni entrano solo da **application**  
5. **presentation** (in `target/`) parla al core solo tramite application  
6. Un modulo non legge/scrive direttamente lo storage di un altro modulo  
7. **communication** fornisce i canali di rete (P2P sottorete + cloud); non contiene la business logic degli altri contesti  
8. **auth** possiede credenziali e sessioni; **communication** le consuma tramite l’application di auth; il canale cloud Fluid Next è **inibito** senza autenticazione valida sulle API Fluid Next  
9. **system** possiede System Manager, superfici e l’interfaccia play / pause / stop; gli altri moduli di riproduzione usano le superfici solo tramite l’application di system  
10. **playlist** e **standalone** hanno ciascuno un **manager** (application) che possiede lo stato runtime del proprio dominio; **system** riceve solo i comandi di launch/pause/stop  
11. Il download cloud del **system** implica il pull automatico degli **standalone** di quel system e la possibilità di scaricare le **playlist** associate; i dati restano nei moduli standalone/playlist  
12. **device** possiede il modello del dispositivo fisico host; non confonderlo con **system**. Gli adapter di piattaforma stanno in infrastructure; gli altri moduli consumano solo l’application di device  

---

## Naming dei file

Convenzione di progetto (dettaglio: [CONVENTIONS.md](./CONVENTIONS.md)):

| Contesto | File |
|----------|------|
| Classi / interfacce (domain, application, infrastructure) | **PascalCase** — es. `DeviceInfoManagerInterface.ts` |
| UIX / componenti grafici (presentation) | **kebab-case** — es. `play-button.tsx` |

---

## Stato

Mappa moduli e layer `domain` / `application` / `infrastructure` (+ presentation in `target/`) definita. Responsabilità dettagliate, aggregate ed eventi di dominio: TODO.
