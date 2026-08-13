# Moduli core

Questa cartella contiene i **moduli core** di Fluid Player (bounded context DDD).

Ogni modulo vive in una sottocartella minuscola con layer:

```
src/module/<nome>/
├── domain/
├── application/
├── infrastructure/
└── test/unit/{domain,application,infrastructure}/
```

Presentation / UIX: fuori dal core, in `player/`.

Allineato a [MODULE_CORE.md](../../docs/MODULE_CORE.md). Naming: [CONVENTIONS.md](../../docs/CONVENTIONS.md).

```
src/module/
├── device/
├── system/
├── auth/
├── playlist/
├── standalone/
├── …
```
