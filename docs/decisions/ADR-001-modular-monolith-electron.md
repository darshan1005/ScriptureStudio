# ADR-001: Selection of Electron, Modular Monolith Architecture, and Offline-First Storage

**Status:** Accepted  
**Date:** 2026-11-11  
**Deciders:** Principal Software Architect, REA Orchestrator  

---

## Context
Scripture Studio is designed as an independent replacement for legacy BibleShow software. The application must run on Windows 10/11 desktops in live church production environments, managing multiple high-resolution physical displays (operator UI, audience projector, stage monitor), streaming 1080p video feeds via NDI, playing hardware-accelerated video background loops, and providing sub-100ms scripture lookups across large Bible corpora (>31,000 verses per translation).

We evaluated two architectural patterns and desktop runtime environments:
1. **Desktop Framework:** Electron vs Tauri vs .NET MAUI / WPF.
2. **System Structure:** Modular Monolith vs Microservices vs Monolithic Desktop.
3. **Storage:** Embedded SQLite with WAL vs Client-Server PostgreSQL vs File-based JSON.

---

## Decision

### 1. Electron Framework Selected
We selected **Electron** (Chromium + Node.js) over Tauri and WPF for the initial desktop application because:
- **Mature Multi-Monitor & Window Management:** Electron provides rock-solid, multi-window coordinate management (`screen` API, frameless kiosk windows, independent `BrowserWindow` instances) across mixed-DPI Windows displays.
- **Media & Chromium Web Animations:** Modern church presentations demand seamless looping video backgrounds, CSS transitions, text outlines, and Web Animations API, which Chromium renders with mature GPU acceleration.
- **Broadcast Integrations:** Node.js native addon support provides clean C++ bindings for the NewTek NDI Advanced SDK and native filesystem operations for real-time OBS/vMix XML/PNG disk streaming.

### 2. Modular Monolith Architecture
We selected a **Modular Monolith** using `pnpm` workspaces:
- Microservices introduce extreme complexity, network latency, and operational fragility unsuitable for single-workstation live church use.
- A loose monolith leads to tangled spaghetti code where UI components directly query the database or manipulate presentation windows.
- The Modular Monolith decouples core domain packages (`bible-engine`, `presentation-engine`, `theme-engine`, `display-manager`, `streaming-engine`) behind strict TypeScript interfaces, enabling independent testing, zero circular dependencies, and future reusability on mobile or web platforms.

### 3. Local-First SQLite Storage with WAL Mode
We selected **embedded SQLite** running in the Electron main process:
- Sunday morning operations must never fail due to internet dropouts or remote server outages.
- With Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) and memory-mapped I/O (`mmap_size`), SQLite easily achieves sub-10ms verse queries and sub-50ms full-text searches via FTS5.
- ACID transactions guarantee that incomplete Bible imports or unexpected power interruptions leave the database completely uncorrupted.

---

## Consequences
- **Positive:** Maximum reliability during live services, sub-100ms latency, rich UI with React 19, modular packages easily tested in Vitest.
- **Trade-off:** Electron applications have a higher baseline memory footprint (~150MB-250MB) compared to native C++ or Rust binaries. This is mitigated through aggressive asset management and window lifecycle discipline.

