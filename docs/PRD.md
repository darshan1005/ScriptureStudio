# Scripture Studio — Product Requirements Document (PRD)

**Document Version:** 1.0.0  
**Status:** Approved for Architecture & Discovery (Milestone M0)  
**Target Platform:** Windows 10 / 11 (64-bit Desktop)  
**Architecture:** Offline-First Modular Monolith (Electron + React 19 + TypeScript + SQLite)  

---

## 1. Executive Summary

### 1.1 Vision
**Scripture Studio** is a modern, high-reliability, offline-first church presentation and scripture projection desktop application engineered specifically for Windows environments. It serves as an independent, clean-room replacement for legacy tools such as BibleShow, providing full functional parity with documented live presentation workflows while establishing a resilient, extensible foundation for contemporary multi-screen and live-broadcast operations.

### 1.2 Core Mission
Church presentations occur during live, non-interruptible worship services where any glitch, latency spike, wrong verse projection, or display crash directly impacts the congregation. Scripture Studio separates the operator control environment from audience and stage presentation outputs, guaranteeing deterministic rendering, rapid verse lookup (<100ms), and zero-leak confidence monitoring.

---

## 2. Product Objectives

### 2.1 Objective A — Functional Parity with BibleShow
Scripture Studio implements and enhances the complete set of publicly documented BibleShow capabilities:
1. **Bible Library Management:** Multi-translation registration, metadata tracking, attribution, and license enforcement.
2. **Rapid Scripture Navigation:** Hierarchical 3-click navigation (Book → Chapter → Verse) and keyboard-driven selection.
3. **Multi-Translation Comparison:** Parallel projection and simultaneous comparison of up to 4 translations on a single display canvas.
4. **Instant Reference & Full-Text Search:** Sub-100ms reference parsing, exact phrase search, and SQLite FTS5 full-text queries.
5. **Deterministic Presentation Engine:** Independent Preview and Live outputs with discrete `Freeze`, `Hide`, `Clear`, and `Take Live` controls.
6. **Program & Playlist Manager:** Sermon outline structuring, drag-and-drop verse lists, and configurable AutoPlay cycling.
7. **Advanced Theme Engine:** Granular styling (typography, outlines, drop shadows, safe margins, solid colors, gradients, image backgrounds, and looping video backgrounds).
8. **Multi-Display & Stage Confidence Display:** Dynamic Windows monitor topology detection, multi-window full-screen placement (up to 4 independent output surfaces), and dedicated stage confidence monitor with private speaker notes and timer.
9. **Presentation History & Recall:** Persistent session auditing allowing one-click recall of previously projected scriptures during an active sermon.
10. **Broadcast & Streaming Integrations:** Real-time NDI (Network Device Interface) video feed generation, live XML data export, and PNG transparency export for OBS Studio, vMix, and Wirecast lower-thirds.
11. **Localization & RTL Support:** Bi-directional text rendering (supporting Right-to-Left scripts such as Hebrew and Arabic) alongside complete UI internationalization.

### 2.2 Objective B — Product Modernization & Extensibility
1. **Offline-First Resilience:** Zero cloud dependencies for core Sunday morning operations; fully self-contained local SQLite storage.
2. **Modern Control Room UI:** High-density, keyboard-first dark/light interface designed with ergonomic layout for multi-tasking operators.
3. **Isolated Modular Architecture:** Core domain packages (`bible-engine`, `presentation-engine`) decoupled from UI frameworks to enable future web, mobile remote, or cross-platform targets.
4. **Contract-Driven IPC:** Explicit, allowlisted, strongly typed Electron IPC bridge with strict context isolation and disabled Node.js integration in renderers.
5. **Optional Cloud Synchronization:** Clean abstraction for optional ASP.NET Core cloud synchronization of sermon programs and custom themes without compromising local offline integrity.

---

## 3. User Personas & Workflows

### 3.1 Target Personas
* **Church Media Volunteer (Primary Operator):** Needs simple, bullet-proof controls, fast keyboard shortcuts, and clear distinction between what is being prepped in preview versus what is live on the projector.
* **Senior Pastor / Guest Speaker:** Requires accurate scriptures, confidence monitoring via Stage Display with countdown timers and non-projected notes, and rapid impromptu verse lookups when preaching off-script.
* **Broadcast / Livestream Director:** Demands clean lower-third overlays, transparent PNG/NDI streams with alpha channels, and zero impact on physical in-house projection.
* **Church Administrator / Tech Lead:** Manages translation licensing, theme branding, display profiles across multi-screen venues, and system backups.

### 3.2 Key Operational Workflows

#### Workflow 1: Impromptu Scripture Lookup & Take Live
1. Pastor speaks: *"Turn with me to Romans 8:28."*
2. Operator presses `Ctrl+F` or `F5` to focus reference input.
3. Operator types `Rom 8:28` (or `Ro 8:28` or clicks Book > Romans, Chapter > 8, Verse > 28) and hits `Enter`.
4. The reference parses instantly (<20ms); Preview pane displays Romans 8:28 rendered with the active theme.
5. Operator inspects the text in Preview.
6. Operator hits `F12` or clicks `Take Live`.
7. Audience Display transitions smoothly to Romans 8:28. Stage Display updates current verse and shows Romans 8:29 in the "Next Verse" box.
8. Presentation History records Romans 8:28 with timestamp and active translation ID.

#### Workflow 2: Freeze & Search Ahead
1. Congregation is singing or meditating on a scripture currently live on screen.
2. Operator clicks `Freeze` (or presses `F9`).
3. Audience Display locks its current graphical frame.
4. Operator browses to 1 Corinthians 13 in the Bible Reader, edits themes, or modifies the program list without altering the audience view.
5. Operator selects the next verse in Preview and clicks `Unfreeze` / `Take Live` when ready.

#### Workflow 3: Multi-Translation Comparison
1. Pastor compares King James Version (KJV) and American Standard Version (ASV).
2. Operator selects dual-view mode in Bible Reader.
3. Both versions are displayed side-by-side or stacked in Preview.
4. Operator pushes dual-view live; Audience Display dynamically computes balanced multi-column typography within safe margins.

---

## 4. Functional Requirements

### FR-01: Bible Library & Import
* **FR-01.1:** Support import of open-format Bible modules (JSON, XML/Zefania, OSIS, USFM) into SQLite.
* **FR-01.2:** Maintain immutable records for `bible_versions` including ID, full name, abbreviation, language code, license type, attribution URL, and copyright text.
* **FR-01.3:** Enforce validation on import: book count, chapter boundaries, verse completeness, and integrity hashing.
* **FR-01.4:** Allow enabling, disabling, reordering, and deletion of installed versions.

### FR-02: Bible Navigation & Reading
* **FR-02.1:** Full canonical ordering for Old Testament (39 books) and New Testament (27 books) with extensible support for Deuterocanonical/Apocryphal books where licensed.
* **FR-02.2:** Multi-verse continuous and discontinuous range selection (e.g., `John 3:16-18`, `Psalm 23:1,3,5`).
* **FR-02.3:** Persistent history of recent lookups across the last 100 queries.

### FR-03: Scripture Search Engine
* **FR-03.1:** Reference parser accepting standard Bible abbreviations, chapter/verse separators (`:`, `.`, space), and verse spans.
* **FR-03.2:** SQLite FTS5 index for full-text search across all installed translations.
* **FR-03.3:** Support exact phrase matching (`"kingdom of God"`), prefix matching (`light*`), and boolean operators (`grace AND truth`).
* **FR-03.4:** Return paginated, scored results with highlighted matches under 100ms execution time.

### FR-04: Presentation Controller & State Machine
* **FR-04.1:** Centralized state model: `IDLE`, `PREVIEW`, `LIVE`, `FROZEN`, `HIDDEN`.
* **FR-04.2:** Atomic state transitions: `previewReference()`, `takeLive()`, `freeze()`, `unfreeze()`, `hide()`, `unhide()`, `clear()`.
* **FR-04.3:** Serialized command queue preventing race conditions from rapid operator keystrokes.
* **FR-04.4:** Independent synchronization broadcasts across all open window renderers via IPC event bus.

### FR-05: Program & Playlist Management
* **FR-05.1:** Create, save, rename, duplicate, export, and delete service programs.
* **FR-05.2:** Drag-and-drop item reordering and grouping (e.g., "Sermon Opening", "Scripture Reading", "Benediction").
* **FR-05.3:** AutoPlay engine with configurable per-slide dwell time (default: 5 seconds) and loop/stop modes.

### FR-06: Theme & Graphic Template Engine
* **FR-06.1:** Real-time WYSIWYG theme editor with live preview.
* **FR-06.2:** Typography controls: Font family, size, line-height, letter-spacing, text alignment, weight, and casing.
* **FR-06.3:** Visual effects: Multi-layer drop shadows, outline/stroke color and width, safe margins (title-safe 80%/90%), and bounding boxes.
* **FR-06.4:** Background layers: Solid colors, linear/radial gradients, local image assets (PNG, JPEG, WebP), and looping video backgrounds (MP4, WebM) with hardware acceleration.
* **FR-06.5:** Lower-third templates tailored for live broadcast overlay with customizable heights, padding, and backdrop opacity.

### FR-07: Display & Window Management
* **FR-07.1:** Enumerate all connected physical Windows displays with coordinates, resolutions, and refresh rates via Electron `screen` API.
* **FR-07.2:** Dedicated output assignment: Primary Operator UI, Audience Projector, Stage Confidence Monitor, Secondary Relay.
* **FR-07.3:** Frameless, borderless, always-on-top full-screen audience windows assigned to specific display bounds.
* **FR-07.4:** Safe disconnect recovery: If an external projector is unplugged, audience window closes cleanly without terminating the application or crashing presentation state. On reconnect, automatic prompt to restore output.

### FR-08: Stage Confidence Display
* **FR-08.1:** Dedicated stage window rendering high-contrast, large-format text optimized for podium view.
* **FR-08.2:** Dual-segment layout: Current Live Scripture and Upcoming Next Verse.
* **FR-08.3:** Integrated clock, elapsed sermon timer, and custom non-projected speaker notes.

### FR-09: Broadcast Integrations & Export
* **FR-09.1:** Real-time XML file export updated on every slide transition for dynamic vMix/OBS title integration.
* **FR-09.2:** Automated PNG snapshot export with alpha channel transparency for broadcast graphics.
* **FR-09.3:** NDI SDK modular adapter allowing direct IP-based network video transmission of live scripture feeds.

### FR-10: Localization & Bi-Directional Rendering
* **FR-10.1:** Full RTL layout support for Hebrew, Arabic, and Farsi scriptures.
* **FR-10.2:** Application UI i18n support for major languages (English, Spanish, Romanian, Portuguese, French, German).

---

## 5. Non-Functional Requirements

### 5.1 Performance Targets
* **Cold App Startup:** < 2.5 seconds to fully interactive control studio.
* **Scripture Lookup & Verse Query:** < 100 ms warm database lookup for 1 to 50 verses.
* **Full-Text FTS5 Search:** < 150 ms for complex queries across full Bible text (>31,000 verses).
* **Slide Take-Live Transition:** < 100 ms latency from keystroke to audience window paint.
* **Memory Footprint:** Baseline < 180 MB RAM in idle state; < 350 MB RAM during 1080p video background playback.
* **Framerate:** 60 FPS locked presentation transitions with zero frame drops during video looping.

### 5.2 Reliability & Fault Tolerance
* **Offline Independence:** Complete feature set operates 100% offline without network adapters enabled.
* **Crash Resilience:** Database operations wrapped in ACID transactions with SQLite WAL (Write-Ahead Logging) mode.
* **Data Recovery:** Automatic state reconstruction upon unexpected power loss.

### 5.3 Security & Sandbox Compliance
* **Renderer Isolation:** `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` across all Electron browser windows.
* **Preload Allowlist:** No raw IPC emitters exposed; strictly typed method bridge (`window.scriptureStudioApi`).
* **Content Security Policy (CSP):** Strict CSP headers disallowing remote script injection (`script-src 'self'`).

---

## 6. Legal & Intellectual Property Compliance
1. **Clean-Room Implementation:** Zero decompilation, disassembly, or asset extraction of proprietary BibleShow binaries or databases.
2. **Independent Codebase:** Original React/TypeScript architecture and modern UI design system.
3. **Bible Data Licensing:** Use of validated public-domain or openly licensed translations (e.g., King James Version, World English Bible, American Standard Version, Romanian Cornilescu Public Domain). Clear attribution metadata recorded for all imported modules.
4. **Attribution & Rights Management:** Clear user warnings and licensing flags regarding copyrighted translations.

