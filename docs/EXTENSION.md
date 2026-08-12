# Extension

Le **estensioni** sono moduli caricabili **a runtime** che ampliano Fluid Player senza modificare il core.

Si agganciano all’**application** dei moduli core (system, communication, auth, …), non all’infrastructure interna.

---

## Principi

- Caricamento / scaricamento a runtime
- Contratto stabile verso l’application del core
- Ogni estensione resta owner del proprio dominio sportivo / funzionale
- Uso del cloud solo tramite **communication**, e solo se **auth** ha una sessione Fluid Next valida

---

## Moduli scoreboard

Estensioni per la gestione di una **partita** dello sport di competenza: stato del match ed **eventi** tipici di quel gioco. Possono alimentare le superfici (via application di **system**) per overlay, ticker, tabelloni, ecc.

| Estensione | Sport | Dominio |
|------------|-------|---------|
| **scoreboard-soccer** | Calcio | Partita di calcio ed eventi correlati |
| **scoreboard-volley** | Pallavolo | Partita di pallavolo ed eventi correlati |
| **scoreboard-basket** | Basket | Partita di basket ed eventi correlati |
| **scoreboard-rugby** | Rugby | Partita di rugby ed eventi correlati |

Ogni estensione scoreboard ha la **stessa struttura a layer** dei moduli core:

```
┌─ <scoreboard-*> ────────────────────────┐
│  application                            │
│   · API dominio sportivo                │
│   · Current Match (partita a runtime)   │
├─────────────────────────────────────────┤
│  domain                                 │
├─────────────────────────────────────────┤
│  infrastructure                         │
└─────────────────────────────────────────┘
```

Vista delle quattro estensioni:

```
┌─ Estensioni (runtime) ──────────────────────────────────────────────────┐
│                                                                         │
│  ┌─ scoreboard-soccer ──┐  ┌─ scoreboard-volley ──┐                     │
│  │ application          │  │ application          │                     │
│  │  · Current Match     │  │  · Current Match     │                     │
│  │ domain               │  │ domain               │                     │
│  │ infrastructure       │  │ infrastructure       │                     │
│  └──────────────────────┘  └──────────────────────┘                     │
│                                                                         │
│  ┌─ scoreboard-basket ──┐  ┌─ scoreboard-rugby ───┐                     │
│  │ application          │  │ application          │                     │
│  │  · Current Match     │  │  · Current Match     │                     │
│  │ domain               │  │ domain               │                     │
│  │ infrastructure       │  │ infrastructure       │                     │
│  └──────────────────────┘  └──────────────────────┘                     │
│                                                                         │
│              │ usano l’application del core                             │
│              ▼                                                          │
│     system · auth · communication · …                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Current Match (servizio runtime)

All’interno del layer **application** di ogni scoreboard, il servizio **Current Match** gestisce la **partita corrente a runtime**:

| Responsabilità | Current Match |
|----------------|---------------|
| Quale partita è attiva ora | Sì (source of truth runtime dell’estensione) |
| Punteggio, periodo/tempo, stato live | Sì |
| Applicazione eventi (goal, ammonizione, canestro, …) | Sì |
| Persistenza storica / cache partita | No → **infrastructure** dell’estensione |
| Rendering sulle superfici | No → comandi verso **system** |

Flusso tipico:

```
evento / comando regia
        │
        ▼
Current Match (application)  →  aggiorna stato partita corrente
        │
        ├──► infrastructure / domain   (salvataggio + modello)
        └──► system                    (aggiornamento superfici, se necessario)
```

---

## Responsabilità comuni

Ogni scoreboard:

1. **Possiede** il dominio della partita (modello sportivo + eventi)
2. Espone in **application** il servizio **Current Match** per lo stato runtime della partita corrente
3. Usa **infrastructure** per salvare/caricare dati della partita (locale o dopo download cloud)
4. **Non** sostituisce system: per mostrare qualcosa sulle superfici invia comandi tramite l’application di **system**
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
| **settings** | Preferenze locali dell’estensione (se esposte via application) |

---

## Stato

Quattro estensioni distinte con layer domain / application / infrastructure (come il core), servizio **Current Match** a runtime, vincolo download-con-auth. Schema eventi dettagliato e UI di regia: TODO.
