# Module Core

Il core di Fluid Player è organizzato secondo **Domain-Driven Design (DDD)**: ogni modulo corrisponde a un bounded context con un proprio modello e responsabilità chiare.

---

## Pattern: DDD

- Ogni modulo core è un **bounded context**
- Il dominio del modulo non dipende da UI, filesystem concreto o vendor di database
- La comunicazione tra moduli avviene tramite contratti espliciti (servizi / eventi), non accedendo allo storage altrui
- Le estensioni a runtime si agganciano ai servizi esposti, non allo storage interno dei moduli

Dettaglio dei singoli domini: da approfondire. Qui si fissa la mappa dei moduli e i layer trasversali.

---

## Moduli core

| Modulo | Ruolo (bozza) |
|--------|----------------|
| **system** | Ciclo di vita, device, bootstrap; **System Manager** (sistema corrente + superfici); sync cloud di schermi/standalone e opzione download playlist del system |
| **auth** | Identità, credenziali, pairing, token/sessioni (locale e Fluid Next) |
| **playlist** | Playlist, item, timing, loop; **Playlist Manager** = stato runtime del dominio + comandi di launch verso system |
| **standalone** | Riproduzione autonoma (fuori playlist); **Standalone Manager** = stato runtime del dominio + comandi di launch verso system |
| **external flows** | Gestione flussi audio/video esterni (regia, ingressi/uscite, routing) |
| **settings** | Configurazione locale del player e preferenze |
| **communication** | Servizi di comunicazione: **peer-to-peer** in sottorete; **cloud** Fluid Next solo se autenticati sulle API Fluid Next |

Il dettaglio funzionale di ciascun modulo sarà definito progressivamente.

### system — System Manager e superfici

**system** include un **System Manager** che gestisce il **sistema corrente** configurato sul player: quale “system” Fluid è attivo in locale, quali schermi/superfici espone, e come si allinea al cloud quando autenticati.

#### Superfici

Le **superfici** sono destinazioni di output (zone/display) che accettano contenuti multimediali attraverso un’interfaccia uniforme:

| Operazione | Significato |
|------------|-------------|
| **play / launch** | Avvia un contenuto sulla superficie |
| **pause** | Mette in pausa la riproduzione corrente |
| **stop** | Interrompe e rilascia la riproduzione sulla superficie |

Playlist e standalone non controllano il rendering in proprio: i rispettivi **manager** chiedono a **system** (via Services) cosa lanciare / mettere in pausa / fermare sulle superfici.

#### System Manager — sistema corrente

| Responsabilità | System Manager |
|----------------|----------------|
| Sistema corrente configurato sul player | Sì (source of truth runtime di system) |
| Elenco / visualizzazione schermi disponibili del system | Sì |
| Interfaccia play / pause / stop sulle superfici | Sì (tramite Services di system) |
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
System Manager
        ├──► system corrente + schermi disponibili
        ├──► scarica tutti gli standalone del system  →  modulo standalone
        └──► propone / consente download playlist del system  →  modulo playlist
```

- Gli asset scaricati vengono consegnati ai moduli di dominio (**standalone**, **playlist**) tramite i rispettivi Services; **system** non diventa owner del modello playlist/standalone.
- Senza autenticazione cloud il System Manager opera solo sul system configurato in locale.

### playlist & standalone — manager di runtime

Ogni modulo di programmazione ha un **manager** che è la source of truth di *cosa sta girando* nel proprio bounded context.

| Responsabilità | Chi |
|----------------|-----|
| Cosa appartiene al dominio a runtime (item correnti, coda, stato sessione, …) | **Manager** del modulo (`playlist` o `standalone`) |
| Cosa sta effettivamente girando (nel senso di dominio: quale playlist/item, quale standalone attivo) | **Manager** del modulo |
| Eseguire play / pause / stop sulla superficie | **system** (superfici), su richiesta del manager |

Flusso tipico:

```
Playlist Manager / Standalone Manager
        │  decide cosa deve andare in onda
        │  (dominio di appartenenza + stato runtime)
        ▼
   system.Services  →  superficie  →  play | pause | stop
```

- **system** esegue l’operazione sulla superficie; non mantiene il modello di business “quale playlist / quale standalone è attivo”.
- Il **manager** aggiorna e espone lo stato runtime del proprio dominio (anche dopo feedback da system, se previsto).

### communication — canali di rete

**communication** espone i servizi che permettono al software di parlare con l’esterno su due piani:

| Piano | Ambito | Uso tipico |
|-------|--------|------------|
| **Peer-to-peer** | Altri software nella stessa **sottorete** | Discovery, scambio comandi/stato, collaborazione locale tra peer |
| **Cloud** | Piattaforma **Fluid Next** | Sync, telemetria, comandi remoti — **solo con autenticazione valida** sulle API Fluid Next (via **auth**) |

Il modulo fornisce i **canali e i servizi di trasporto/sessione**; la logica di business resta nei moduli di dominio che li consumano. Dettaglio: [COMMUNICATION.md](./COMMUNICATION.md).

---

## Layer interni (per ogni modulo)

Ogni modulo core raggruppa gli stessi due layer (dal basso verso l’alto):

```
┌─ <nome modulo> ─────────────────────────┐
│  Services                               │
│  (API del modulo + funzioni cross)      │
├─────────────────────────────────────────┤
│  Persistence (agnostica)                │
│  (dati del modulo, porte astratte)      │
└─────────────────────────────────────────┘
```

Vista d’insieme dei moduli:

```
┌─ system ────────┐  ┌─ auth ──────────┐  ┌─ playlist ──────┐
│ Services        │  │ Services        │  │ Services        │
│ Persistence     │  │ Persistence     │  │ Persistence     │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─ standalone ────┐  ┌─ external flows ┐  ┌─ settings ──────┐
│ Services        │  │ Services        │  │ Services        │
│ Persistence     │  │ Persistence     │  │ Persistence     │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─ communication ─────────────────────────────────────────────┐
│ Services                                                    │
│ Persistence                                                 │
└─────────────────────────────────────────────────────────────┘
```

### Persistence (agnostica)

- Responsabile di **persistere e rileggere** i dati del modulo
- Espone porte/repository astratti (interfacce), non implementazioni concrete
- L’implementazione reale (SQLite, filesystem, key-value, …) vive negli adapter di infrastruttura
- Ogni modulo possiede il proprio spazio di persistenza; non scrive nello storage di un altro modulo

### Services (sopra la persistenza del modulo)

- Espone le funzionalità del modulo verso gli altri moduli e verso le estensioni
- Mette a disposizione anche capacità **cross** riusabili dall’intero core
- Non espone la Persistence interna: gli altri moduli e le estensioni passano dai Services
- Usa la Persistence del proprio modulo tramite porte

---

## Regole di dipendenza

1. Il **dominio** di un modulo non importa adapter concreti  
2. La **persistenza** del modulo è dietro porte; gli adapter la implementano  
3. I **services** cross sono l’unico strato condiviso sopra la persistenza per funzionalità comuni  
4. Un modulo non legge/scrive direttamente lo storage di un altro modulo  
5. **communication** fornisce i canali di rete (P2P sottorete + cloud); non contiene la business logic degli altri contesti  
6. **auth** possiede credenziali e sessioni; **communication** le consuma tramite i Services di auth; il canale cloud Fluid Next è **inibito** senza autenticazione valida sulle API Fluid Next  
7. **system** possiede System Manager, superfici e l’interfaccia play / pause / stop; gli altri moduli di riproduzione usano le superfici solo tramite i Services di system  
8. **playlist** e **standalone** hanno ciascuno un **manager** che possiede lo stato runtime del proprio dominio; **system** riceve solo i comandi di launch/pause/stop, non la ownership di “cosa sta girando” a livello di business  
9. Il download cloud del **system** implica il pull automatico degli **standalone** di quel system e la possibilità di scaricare le **playlist** associate; i dati restano nei moduli standalone/playlist

---

## Stato

Mappa moduli e layer definita. Responsabilità dettagliate, aggregate ed eventi di dominio: TODO.
