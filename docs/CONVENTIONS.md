# Convenzioni di progetto

## Naming dei file

| Contesto | Convenzione | Esempi |
|----------|-------------|--------|
| **Classi e interfacce** (domain, application, infrastructure) | **PascalCase** (camelCase con iniziale maiuscola); il nome del file coincide con il tipo principale esportato | `DeviceInfoManagerInterface.ts`, `HelloWorld.ts` |
| **UIX / componenti grafici** (presentation) | **kebab-case** (tutto minuscolo, parole separate da `-`) | `play-button.ts`, `surface-grid.tsx`, `status-bar.css` |

### Classi e interfacce

- Un file per tipo principale pubblico (classe o interfaccia).
- Estensione tipica: `.ts` (o `.tsx` solo se il file contiene davvero JSX legato al tipo).
- Barrel/`index.ts` restano in minuscolo (`index.ts`).

### UIX e componenti grafici

- Vale per componenti UI, fogli di stile dedicati al componente, story/fixture di presentazione in `apps/`.
- Non usare PascalCase nei path UIX anche se il simbolo esportato in codice è PascalCase (es. file `play-button.tsx` → export `PlayButton`).

### Struttura moduli core

```
src/module/<nome>/
├── domain/
├── application/
└── infrastructure/
```

Presentation: `apps/…` (non dentro il modulo). Dettaglio: [MODULE_CORE.md](./MODULE_CORE.md).

### Fuori scope

- Cartella moduli core: `src/module/`, sottocartelle modulo in minuscolo (`device/`, `playlist/`).
- Script di tooling: kebab-case o come già in repo (`package-wgt.mjs`).
- Asset statici: kebab-case preferito (`large-icon.png`).
