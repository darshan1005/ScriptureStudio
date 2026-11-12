# Scripture Studio — Engineering Documentation Index & Discovery Report

**Milestone:** M0 (Product Discovery & Architecture)  
**Status:** Complete & Awaiting Architecture Review Gate Approval  
**Project:** Scripture Studio — Independent BibleShow Replacement for Windows  

---

## 1. Documentation Overview

This directory contains the complete Milestone M0 discovery and architecture blueprint for Scripture Studio. Every document has been authored following clean-room engineering standards, independent functional specification, and strict separation of presentation runtimes from operator interfaces.

| Document | Purpose & Scope |
| :--- | :--- |
| **[PRD.md](PRD.md)** | Product Requirements Document: Vision, objectives, user personas, functional and non-functional requirements. |
| **[FEATURE-MATRIX.md](FEATURE-MATRIX.md)** | Comprehensive feature matrix mapping all BibleShow capabilities (F01–F20) to requirements, user workflows, acceptance criteria, and test strategies. |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | System architecture: Monorepo layout, Electron process model, the 5 core engines, presentation state machine, and multi-display topology. |
| **[AGENT-OWNERSHIP.md](AGENT-OWNERSHIP.md)** | Multi-agent responsibility matrix, file/directory ownership boundaries, collaboration rules, and quality gates. |
| **[DATABASE.md](DATABASE.md)** | SQLite database architecture: Pragmas (WAL), full DDL schema, FTS5 virtual tables, indexing, versification alignment, and transactional migration policies. |
| **[IPC-CONTRACTS.md](IPC-CONTRACTS.md)** | Electron IPC communication contracts: Strongly typed TypeScript request/response interfaces, event bus channels, and preload security bridge. |
| **[UI-SPECIFICATION.md](UI-SPECIFICATION.md)** | UX/UI specification: Control Studio layout, audience projector window, stage confidence monitor, theme editor, lower thirds, and interaction states. |
| **[SECURITY.md](SECURITY.md)** | Desktop security model: Chromium sandboxing, context isolation, Content Security Policy (CSP), custom `asset://` protocol, and license compliance. |
| **[TESTING.md](TESTING.md)** | Comprehensive test plan: Vitest unit tests, Better-SQLite3 integration tests, React component tests, Playwright Electron E2E scenarios, and benchmarks. |
| **[ROADMAP.md](ROADMAP.md)** | Implementation roadmap: Milestones M0 through M10, dependency graph, tasks, and exit criteria. |
| **[RISK-REGISTER.md](RISK-REGISTER.md)** | Technical, Windows-specific, hardware, broadcast, and licensing risk matrix with in-depth mitigation strategies. |
| **[API-CONTRACTS.md](API-CONTRACTS.md)** | Specifications for optional ASP.NET Core cloud synchronization and local Wi-Fi mobile remote WebSocket protocol. |
| **[decisions/ADR-001-modular-monolith-electron.md](decisions/ADR-001-modular-monolith-electron.md)** | Architectural Decision Record on framework selection, modular monolith, and local-first SQLite storage. |

---

## 2. Discovery Methodology & Legal Compliance

1. **Clean-Room Analysis:**
   - Functionality, features, and workflows were derived strictly from publicly available documentation, video demonstrations, and community user guides for BibleShow 5.
   - **Zero reverse engineering, decompilation, or binary inspection** of proprietary executable files (`BibleShow5.exe`, `ThemesCollection01.exe`) was performed.
   - All proprietary assets, themes, icons, and copyrighted database modules are strictly excluded.
2. **Independent Design:**
   - Scripture Studio features an original React 19 UI design system, modern state management via Zustand, a dedicated presentation state machine, and an open SQLite data architecture.
3. **Bible Data Licensing:**
   - Only legally usable, public-domain, or openly licensed translations (e.g. KJV, ASV, WEB, Cornilescu PD) are utilized for tests and default installations, accompanied by immutable licensing and attribution records.

---

## 3. Architecture Review Gate Checklist

Before proceeding to **Milestone M1 (Project Foundation & Desktop Shell)**, verify that all 12 discovery items are satisfied:

- [x] **PRD.md** — Complete product requirements and non-functional targets defined.
- [x] **FEATURE-MATRIX.md** — All 20 features categorized with acceptance criteria and testing approaches.
- [x] **ARCHITECTURE.md** — Modular monolith with 5 decoupled engines and state machine documented.
- [x] **AGENT-OWNERSHIP.md** — Clear directory boundaries and change protocols assigned to subagents.
- [x] **DATABASE.md** — Normalized SQLite schema with WAL pragmas and FTS5 search specified.
- [x] **IPC-CONTRACTS.md** — Strongly typed, context-isolated IPC channels specified.
- [x] **UI-SPECIFICATION.md** — Control room, audience, and stage display layouts defined.
- [x] **SECURITY.md** — Electron sandboxing, CSP, and asset protocol defined.
- [x] **TESTING.md** — 5 critical E2E scenarios, coverage goals, and benchmarks defined.
- [x] **ROADMAP.md** — Milestones M0 through M10 defined with explicit exit gates.
- [x] **RISK-REGISTER.md** — High-impact technical and licensing risks addressed with mitigations.
- [x] **README.md** — Master index and setup documentation completed.

