# Architecture

Project layout, data flow, and code placement for human reference. For coding rules, see [AGENTS.md](AGENTS.md); for file-level subsystem notes, see [docs/development/](docs/development/index.md).

## Layout map

Path alias `@/*` maps to `src/*` (see `tsconfig.json`).

| Boundary | Path            | Role                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Main     | `src/main/`     | SQLite (`database.ts`, `db-compat.ts`), BLE (`gatt-sidecar-proxy.ts` + coexistence), MQTT (`mqtt-manager.ts`, `meshcore-mqtt-adapter.ts`), logging (`log-service.ts`, `sanitize-log-message.ts`, `mecp-received-log.ts`), offline maps (`offline-maps/` + `ipc/offline-maps-handlers.ts`), IPC handlers (`index.ts` plus namespaced modules in `src/main/ipc/` — TAK, GPS, offline maps, blocked contacts, GATT pairing, …), window, GPS, updater |
| Preload  | `src/preload/`  | `contextBridge` exposing namespaced `electronAPI` only; never expose `ipcRenderer`                                                                                                                                                                                                                                                                                                                                                                |
| Renderer | `src/renderer/` | React 19 + Vite + Zustand: `components/`, `hooks/`, `runtime/` (protocol runtimes, single mount), `stores/`, `lib/`, `locales/`, `workers/`                                                                                                                                                                                                                                                                                                       |

| Shared | `src/shared/` | IPC contracts (`electron-api.types.ts`), protocol-neutral helpers |

**Entry points:** `src/main/index.ts`, `src/preload/index.ts`, `src/renderer/main.tsx`, `src/renderer/App.tsx`.

**Repo root (not exhaustive):** `.github/workflows/`, `scripts/check-*.mjs` (IPC, migrations, log injection, etc.), `docs/`, `resources/`, `vite.config.mts`, `electron-builder.yml`, `package.json`.

## Process boundaries

- **Main:** Node runtime; all privileged I/O and IPC handlers.
- **Preload:** Thin bridge; namespaced channels (`db:*`, `mqtt:*`, `log:*`, `ble:*`, `serial:*`, `session:*`, etc.).
- **Renderer:** UI only; talk to main via `window.electronAPI` from preload.
- **Shared:** Types and safe helpers imported by main and renderer.

**Tests:** Co-located `*.test.ts` / `*.test.tsx`; update `src/main/index.contract.test.ts` when CSP, build config, IPC limits, or log filters change (see [Testing protocols](CONTRIBUTING.md#testing-protocols) in CONTRIBUTING.md).

**Package manager:** `pnpm` only.

## IPC data flow

Adding a cross-boundary feature:

1. Types in `src/shared/electron-api.types.ts`.
2. `ipcMain.handle('namespace:action', ...)` in `src/main/index.ts` — or in a namespaced module under `src/main/ipc/` (e.g. `tak-handlers.ts`, `gps-handlers.ts`, `blocked-contacts-handlers.ts`) registered from `index.ts` when the handler set is large enough to warrant its own file.
3. Expose on `electronAPI` in `src/preload/index.ts` via `ipcRenderer.invoke`.
4. Call from renderer: `window.electronAPI....`

Sanitize user-controlled strings before logs and IPC per [AGENTS.md](AGENTS.md).

## Subsystem reference

Developer quick reference (diagnostics, bug workflow, protocol entry points, lifecycle, database, BLE/serial, MQTT, Rooms, UI, EMCOMM, offline maps) lives in [docs/development/architecture-quick-ref.md](docs/development/architecture-quick-ref.md); symptom lookups are in [docs/development/common-issues.md](docs/development/common-issues.md).
