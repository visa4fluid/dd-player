# Extension

Le **estensioni** sono moduli caricabili **a runtime** che ampliano Fluid Player senza modificare il core.

Si agganciano ai **Services** dei moduli core (system, communication, auth, …), non alla Persistence interna.

---

## Principi

- Caricamento / scaricamento a runtime
- Contratto stabile verso i Services del core
- Ogni estensione resta owner del proprio dominio sportivo / funzionale
- Uso del cloud solo tramite **communication**, e solo se **auth** ha una sessione Fluid Next valida

---

## Moduli scoreboard

Estensioni per la gestione di una **partita** dello sport di competenza: stato del match ed **eventi** tipici di quel gioco. Possono alimentare le superfici (via Services di **system**) per overlay, ticker, tabelloni, ecc.

| Estensione | Sport | Dominio |
|------------|-------|---------|
| **scoreboard-soccer** | Calcio | Partita di calcio ed eventi correlati |
| **scoreboard-volley** | Pallavolo | Partita di pallavolo ed eventi correlati |
| **scoreboard-basket** | Basket | Partita di basket ed eventi correlati |
| **scoreboard-rugby** | Rugby | Partita di rugby ed eventi correlati |

Ogni estensione scoreboard ha la **stessa struttura a layer** dei moduli core (non cambia il modello modulare):

```
┌─ <scoreboard-*> ────────────────────────┐
│  Services                               │
│   · API dominio sportivo                │
│   · Current Match (partita a runtime)   │
├─────────────────────────────────────────┤
│  Persistence (agnostica)                │
└─────────────────────────────────────────┘
```

Vista delle quattro estensioni:

```
┌─ Estensioni (runtime) ──────────────────────────────────────────────────┐
│                                                                         │
│  ┌─ scoreboard-soccer ──┐  ┌─ scoreboard-volley ──┐                     │
│  │ Services             │  │ Services             │                     │
│  │  · Current Match     │  │  · Current Match     │                     │
│  │ Persistence          │  │ Persistence          │                     │
│  └──────────────────────┘  └──────────────────────┘                     │
│                                                                         │
│  ┌─ scoreboard-basket ──┐  ┌─ scoreboard-rugby ───┐                     │
│  │ Services             │  │ Services             │                     │
│  │  · Current Match     │  │  · Current Match     │                     │
│  │ Persistence          │  │ Persistence          │                     │
│  └──────────────────────┘  └──────────────────────┘                     │
│                                                                         │
│              │ usano i Services del core                                │
│              ▼                                                          │
│     system · auth · communication · …                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Current Match (servizio runtime)

All’interno del layer **Services** di ogni scoreboard, il servizio **Current Match** gestisce la **partita corrente a runtime**:

| Responsabilità | Current Match |
|----------------|---------------|
| Quale partita è attiva ora | Sì (source of truth runtime dell’estensione) |
| Punteggio, periodo/tempo, stato live | Sì |
| Applicazione eventi (goal, ammonizione, canestro, …) | Sì |
| Persistenza storica / cache partita | No → layer **Persistence** dell’estensione |
| Rendering sulle superfici | No → comandi verso **system** |

Flusso tipico:

```
evento / comando regia
        │
        ▼
Current Match (Services)  →  aggiorna stato partita corrente
        │
        ├──► Persistence   (salvataggio agnostico)
        └──► system        (aggiornamento superfici, se necessario)
```

---

## Responsabilità comuni

Ogni scoreboard:

1. **Possiede** il dominio della partita (modello sportivo + eventi)
2. Espone nei **Services** il servizio **Current Match** per lo stato runtime della partita corrente
3. Usa la **Persistence** agnostica per salvare/caricare dati della partita (locale o dopo download cloud)
4. **Non** sostituisce system: per mostrare qualcosa sulle superfici invia comandi tramite i Services di **system**
5. **Può scaricare la partita dal cloud** Fluid Next **solo se l’utente/device è autenticato** (vincolo di **auth** + canale **communication**)
### Download partita da cloud

```
auth (sessione Fluid Next OK?)
        │ no  →  download non disponibile; solo partita locale / manuale
        │ sì
        ▼
communication  ──API autenticate──►  Fluid Next  →  dati partita
        │
        ▼
scoreboard-*  (carica partita nel proprio dominio)
```

Senza login sulle API Fluid Next l’estensione può comunque gestire una partita creata/gestita in locale; il pull dal cloud è opzionale e vincolato all’autenticazione.

---

## Eventi per sport (bozza)

Elenco indicativo — da raffinare con il modello di dominio di ciascun sport.

### scoreboard-soccer

Esempi: goal, autogoal, ammonizione, espulsione, sostituzione, calcio d’angolo, rigore, inizio/fine tempo, recupero, var (se previsto).

### scoreboard-volley

Esempi: punto, set vinto, timeout, sostituzione, cambio pedana/servizio, cartellino, inizio/fine set, tie-break.

### scoreboard-basket

Esempi: canestro (1/2/3 punti), fallo, fallo tecnico, timeout, sostituzione, inizio/fine quarto, overtime, rimessa.

### scoreboard-rugby

Esempi: meta, trasformazione, calcio di punizione, drop, cartellino (giallo/rosso), scrum, touche, inizio/fine tempo, vantaggio.

---

## Relazione con il core

| Core | Uso da parte delle scoreboard |
|------|-------------------------------|
| **system** | Play / pause / stop (o update) di overlay/contenuti sulle superfici |
| **auth** | Verifica sessione prima del download partita da Fluid Next |
| **communication** | Trasporto verso cloud (e, se utile, P2P in sottorete) |
| **settings** | Preferenze locali dell’estensione (se esposte via services) |

---

## Stato

Quattro estensioni distinte con layer Services + Persistence (come il core), servizio **Current Match** a runtime, vincolo download-con-auth. Schema eventi dettagliato e UI di regia: TODO.
