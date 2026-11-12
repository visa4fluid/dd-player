# device

Bounded context del **dispositivo fisico** host (identità, CPU, RAM, storage, capability; servizi accessori).

Specifiche: [MODULE_CORE.md — device](../../../docs/MODULE_CORE.md#device--host-fisico).  
Naming: [CONVENTIONS.md](../../../docs/CONVENTIONS.md).

```
device/
├── domain/
├── application/      # DeviceInfoInterface
├── infrastructure/
│   ├── HostHelper.ts
│   ├── android/AndroidDeviceInfo.ts
│   ├── tizen/TizenDeviceInfo.ts
│   └── webos/WebosDeviceInfo.ts
└── test/
    └── unit/
        ├── application/
        ├── domain/
        └── infrastructure/
```

I test unitari specchiano i layer del modulo (`test/unit/<layer>/`).  
Presentation: non in questo modulo → `target/` (compone l’adapter della piattaforma).
