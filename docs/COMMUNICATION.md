# Communication

Modulo core che fornisce i **servizi di comunicazione** di Fluid Player verso l’esterno.

Non contiene la business logic di playlist, superfici o auth: espone canali e API di trasporto/sessione usati dagli altri moduli e dalle estensioni.

---

## Ambito

Due piani di comunicazione:

| Piano | Destinatari | Scopo |
|-------|-------------|--------|
| **Peer-to-peer** | Altri software installati nella stessa **sottorete** | Funzionalità collaborative locali tra peer |
| **Cloud** | Piattaforma **Fluid Next** | Collegamento online **solo se autenticati** sulle API Fluid Next |

```
                         ┌─────────────────────┐
                         │   Fluid Player      │
                         │   communication     │
                         └──────────┬──────────┘
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
         ┌──────────────────┐            ┌──────────────────┐
         │  Peer-to-peer    │            │  auth            │
         │  (stessa         │            │  (credenziali /  │
         │   sottorete)     │            │   token)         │
         └──────────────────┘            └────────┬─────────┘
                                                  │ autenticazione
                                                  │ sulle API Fluid Next
                                                  ▼
                                         ┌──────────────────┐
                                         │  Cloud           │
                                         │  Fluid Next      │
                                         │  (solo se OK)    │
                                         └──────────────────┘
```

---

## Peer-to-peer (sottorete)

Servizi per far comunicare istanze del player (o altri software compatibili) sulla stessa rete locale / sottorete, senza passare dal cloud.

Direzione funzionale (da dettagliare):

- discovery dei peer
- scambio di messaggi / comandi / stato
- collaborazione locale (es. sincronizzazione leggera, regia distribuita)

Protocolli e modello di sicurezza: TODO.

---

## Cloud (Fluid Next)

Servizi per la comunicazione online con la piattaforma cloud.

### Vincolo di autenticazione

La comunicazione con Fluid Next è **vincolata all’autenticazione sulle API Fluid Next**.

- Nessuna chiamata cloud senza sessione/credenziali valide gestite da **auth**
- **communication** usa l’application di **auth** per ottenere e applicare i token alle richieste
- Se l’autenticazione manca o scade, il piano cloud è sospeso (nessun sync/comando remoto) fino a un nuovo login/refresh riuscito
- Il piano **peer-to-peer** non dipende da questo vincolo

```
auth (credenziali / token Fluid Next)
        │
        ▼
communication  ──API autenticate──►  Fluid Next
```

### Funzioni (da dettagliare)

- download / sync di contenuti e metadati
- invio stato / heartbeat / telemetria
- ricezione comandi remoti (se previsto)

Il funzionamento **offline** del player non dipende da questo piano: in assenza di rete o di auth restano attivi i flussi locali e, se presenti, i peer in sottorete.

---

## Relazione con gli altri moduli

| Modulo | Relazione |
|--------|-----------|
| **auth** | Unica source of truth per l’autenticazione Fluid Next; senza auth valida communication non apre il canale cloud |
| **system** / manager | Possono ricevere o pubblicare eventi/comandi tramite i canali di communication |
| **playlist** / **standalone** / … | Usano i servizi di communication solo dove serve I/O di rete; restano owner del dominio |

---

## Layer del modulo

Come gli altri moduli core (`domain` / `application` / `infrastructure`):

1. **domain** — concetti di sessione/canale se modellati nel BC  
2. **application** — API di invio/ricezione, discovery P2P, client cloud  
3. **infrastructure** — transport concreto, persistenza peer/sessioni, config canali  

---

## Stato

Ambito P2P + cloud fissato. Contratti, protocolli e payload: TODO.
