# device

Bounded context del **dispositivo fisico** host (identità, CPU, RAM, storage, capability; servizi accessori).

Specifiche: [MODULE_CORE.md — device](../../../docs/MODULE_CORE.md#device--host-fisico).  
Naming: [CONVENTIONS.md](../../../docs/CONVENTIONS.md).

```
device/
├── domain/           # modello hardware / identità
├── application/      # use case (es. DeviceInfoManagerInterface)
└── infrastructure/   # adapter persistenza + piattaforma (webOS, Tizen, …)
```

Presentation: non in questo modulo → `apps/`.  
Nessuna implementazione TypeScript in queste cartelle per ora.
