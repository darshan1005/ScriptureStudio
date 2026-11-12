# Scripture Studio — Feature Parity & Requirements Traceability Matrix

**Document Version:** 1.0.0  
**Status:** Baseline Specification (Milestone M0)  
**Classification Guide:**  
- **Priority:** `P0` (Core Release / Parity Critical), `P1` (Advanced Parity), `P2` (Broadcast / Integration), `P3` (Modernization / Optional Extension)  
- **Verification Status:** `Verified Documented` (Publicly verified BibleShow capability), `Proposed Modernization` (Scripture Studio architectural upgrade), `Unverified/Estimated` (Community workflow requiring validation)

---

## 1. Feature Traceability Matrix

| Feature ID | Feature Name | Priority | BibleShow Baseline | Scripture Studio Specification | Milestone | Verification Status |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- |
| **F01** | Bible Library & Import | P0 | Supports 140+ modules in 50+ languages via custom installer/files. | Open-format Bible import (JSON, OSIS, USFM, Zefania XML), SQLite store, licensing metadata. | M3 | Verified Documented |
| **F02** | Bible Navigation & Reading | P0 | 3-click tree navigation (Book → Chapter → Verse). | Hierarchical navigator, verse range picker, recent references, OT/NT canons. | M3 | Verified Documented |
| **F03** | Reference Search & Parsing | P0 | Quick reference jumping (e.g. `Jn 3:16`, `F5` hotkey). | High-speed grammar-based reference parser with fuzzy book names and verse spans. | M4 | Verified Documented |
| **F04** | Keyword & Phrase Search | P0 | Keyword search within active translation. | SQLite FTS5 engine, exact phrase `"..."`, boolean `AND/OR`, prefix matches, sub-100ms results. | M4 | Verified Documented |
| **F05** | Multi-Version Comparison | P0 | Parallel projection of up to 4 Bible translations. | Up to 4 parallel translations in split-screen/grid with responsive multi-column typography. | M3 | Verified Documented |
| **F06** | Preview & Take Live Workflow | P0 | Separate operator preview and projector output. | Isolated Preview and Live states; Take Live commits preview to audience display. | M5 | Verified Documented |
| **F07** | Freeze, Hide & Clear Controls | P0 | Freeze display while searching; Hide screen (Esc). | Independent state machine controls: Freeze (lock frame), Hide (blank/black), Clear (empty). | M5 | Verified Documented |
| **F08** | Theme & Graphic Styling | P0 | Predefined themes, custom fonts, colors, shadows, borders. | WYSIWYG theme editor, font styler, drop shadows, borders, gradients, images, looping video, lower thirds. | M6 | Verified Documented |
| **F09** | Program & Playlist Manager | P0 | Save lists of verses for sermon/service. | Drag-and-drop playlist, item grouping, reordering, duplicate, import/export. | M6 | Verified Documented |
| **F10** | Presentation History Log | P1 | Audit log of projected verses during a session. | Persistent session timeline, time-stamped log, one-click re-project to Live. | M6 | Verified Documented |
| **F11** | AutoPlay Presentation | P1 | Auto-advance through verse sequence. | Configurable timer per slide, loop/stop triggers, pause on interaction. | M6 | Verified Documented |
| **F12** | Multi-Display Window Manager | P1 | Dual-screen projector support, custom coordinates. | Dynamic Windows display enumeration, up to 4 output surfaces, safe disconnect/reconnect recovery. | M7 | Verified Documented |
| **F13** | Stage Confidence Display | P1 | Secondary monitor output for stage/pulpit. | Current verse, upcoming next verse, large clock, elapsed sermon timer, private speaker notes. | M7 | Verified Documented |
| **F14** | Keyboard-First Shortcuts | P1 | F5 reference jump, Esc hide, Enter live, arrows. | Comprehensive configurable keyboard shortcuts, global hotkey interception via Electron. | M7 | Verified Documented |
| **F15** | Localization & RTL Support | P1 | Multilingual Bible text and Windows UI translations. | Bidirectional text rendering (Hebrew, Arabic, Farsi), i18n UI support. | M7 | Verified Documented |
| **F16** | PNG & XML Real-Time Export | P1 | Auto-save current slide as PNG and XML data feed. | Zero-latency disk export of XML data and PNG transparent graphics for vMix/OBS/Wirecast. | M8 | Verified Documented |
| **F17** | NDI Network Video Streaming | P2 | NewTek NDI output stream and NDI video input. | Modular NDI SDK adapter; streaming video feed over local IP network with alpha channel. | M8 | Verified Documented |
| **F18** | Multi-Instance Execution | P2 | Running separate instances for different rooms. | Support multi-instance profiles with isolated database locks or coordinated control. | M7 | Proposed Modernization |
| **F19** | Optional Cloud Sync & Remote | P2 | Not available in legacy BibleShow. | Optional ASP.NET Core API for theme/program synchronization and mobile web remote. | M9 | Proposed Modernization |
| **F20** | AI Sermon Prep Assistant | P3 | Not available in legacy BibleShow. | Optional local LLM or API integration for thematic cross-referencing and study aids. | M9 | Proposed Modernization |

---

## 2. Detailed Feature Specifications

### F01: Bible Library & Import
* **Feature ID:** `F01`
* **Description:** Manages the catalog of installed Bible translations, validates imported datasets, and tracks copyright and attribution metadata.
* **User Workflow:**
  1. User navigates to Settings > Bible Library.
  2. Clicks "Import Bible Translation" and selects an open-format file (`.json`, `.xml`, `.usfm`).
  3. System parses and validates translation structure (66 canonical books, chapter integrity).
  4. System prompts user to confirm license details (Public Domain, Creative Commons, or Licensed).
  5. Upon confirmation, data is transactionally inserted into SQLite; version is instantly ready for reading and projection.
* **Functional Requirements:**
  - Support multi-translation SQLite storage with foreign key constraints.
  - Parse metadata: Title, Abbreviation, Language Code, Copyright, Attribution URL.
  - Prevent duplicate version registrations.
  - Allow toggling active/disabled status and deleting user-installed versions.
* **Dependencies:** `packages/database`, `packages/bible-importer`, `packages/bible-engine`.
* **Acceptance Criteria:**
  - A 31,102-verse Bible translation imports completely in < 3.0 seconds.
  - Interrupted or malformed imports roll back cleanly without leaving partial records.
  - Version metadata appears accurately in reader and export modules.
* **Testing Approach:**
  - Unit tests: Parser validation for malformed XML/JSON.
  - Integration tests: Database transaction rollback on simulated import failure.
  - E2E tests: Import a test Bible file via UI and verify its presence in Bible Reader.
* **Implementation Milestone:** `M3`
* **Verification Status:** `Verified Documented`

---

### F02: Bible Navigation & Reading
* **Feature ID:** `F02`
* **Description:** Interactive scripture reader offering rapid book, chapter, and verse browsing across Old and New Testaments.
* **User Workflow:**
  1. User opens the Bible tab in the Control Studio.
  2. Selects Testament (OT / NT), then Book (e.g. Psalms).
  3. Selects Chapter (e.g. 23) and Verse (e.g. 1).
  4. Selected verse appears highlighted; reader displays full chapter context with verse numbers.
  5. User can drag or shift-click to select a verse range (e.g. Verses 1 to 6).
* **Functional Requirements:**
  - Canonical 66-book navigation with standard numbering and book groups (Law, History, Poetry, Prophets, Gospels, Epistles).
  - Continuous verse range selection and discrete verse selection.
  - Instant pagination between consecutive chapters (Next/Previous Chapter buttons).
* **Dependencies:** `packages/bible-engine`, UI components.
* **Acceptance Criteria:**
  - Switching chapters renders in < 50ms.
  - Selecting verse ranges accurately aggregates verse text for presentation.
* **Testing Approach:**
  - Unit tests: Verse aggregation logic for continuous and split ranges.
  - Component tests: Virtualized verse list rendering and keyboard focus management.
* **Implementation Milestone:** `M3`
* **Verification Status:** `Verified Documented`

---

### F03: Reference Search & Parsing
* **Feature ID:** `F03`
* **Description:** High-speed natural reference parser resolving standard and abbreviated scripture inputs into canonical book/chapter/verse identifiers.
* **User Workflow:**
  1. Operator presses `F5` or clicks the quick-reference input bar.
  2. Enters reference string: `Rom 8:28`, `1 Cor 13:4-8`, `John 3 16`, `Psa 119:105`.
  3. Hits `Enter` to preview or `Shift+Enter` to take live immediately.
* **Functional Requirements:**
  - Support common abbreviations (e.g., `Mt`, `Matt`, `Matthew`; `1Jn`, `1 John`, `I John`).
  - Tolerate varied delimiters (`:`, `.`, spaces, dashes for ranges).
  - Fallback suggestions when an ambiguous book is typed (e.g., `Ju` -> `Judges` or `Jude`).
* **Dependencies:** `packages/bible-engine`, `packages/scripture-search`.
* **Acceptance Criteria:**
  - Parses 100 benchmark reference patterns with 100% accuracy.
  - Execution time < 5ms for reference resolution.
* **Testing Approach:**
  - Unit tests: Comprehensive test suite with 250+ valid and invalid reference variations.
* **Implementation Milestone:** `M4`
* **Verification Status:** `Verified Documented`

---

### F04: Keyword & Phrase Search
* **Feature ID:** `F04`
* **Description:** Offline full-text search engine indexing all installed Bible versions for instant scripture discovery.
* **User Workflow:**
  1. Operator enters search phrase into search bar: `"For God so loved the world"`.
  2. Selects translation scope (Active version, All versions).
  3. System returns ranked list of matching verses with search term highlighted.
  4. Operator double-clicks a result to preview or take live.
* **Functional Requirements:**
  - Powered by SQLite FTS5 extension.
  - Support exact phrase quoting (`"peace that passes all understanding"`).
  - Support prefix queries (`faith*`) and boolean operators (`grace AND NOT law`).
  - Paginated results showing Book, Chapter, Verse, and snippet text.
* **Dependencies:** `packages/database`, `packages/scripture-search`.
* **Acceptance Criteria:**
  - Search executes across a 31,000-verse Bible in < 100ms.
  - Results strictly match query constraints with highlighted tokens.
* **Testing Approach:**
  - Integration tests: FTS5 query performance benchmarks under concurrent simulated read load.
* **Implementation Milestone:** `M4`
* **Verification Status:** `Verified Documented`

---

### F05: Multi-Version Comparison
* **Feature ID:** `F05`
* **Description:** Parallel rendering of up to 4 Bible translations side-by-side or stacked on a single presentation canvas.
* **User Workflow:**
  1. Operator selects comparison mode in the Bible Reader or Theme settings.
  2. Selects up to 4 installed translations (e.g., KJV, ASV, WEB, ESV).
  3. When a verse is selected, all versions of that verse are rendered concurrently.
  4. Pushing to Live splits the audience canvas into balanced columns or vertical tiles with version labels.
* **Functional Requirements:**
  - Support 2, 3, or 4 simultaneous translations.
  - Handle versification discrepancies gracefully (displaying notice if a verse is absent in a translation).
  - Dynamic layout adjustment preserving font readability and safe margins.
* **Dependencies:** `packages/bible-engine`, `packages/presentation-engine`.
* **Acceptance Criteria:**
  - All selected versions render simultaneously with zero layout distortion.
  - Taking live takes < 100ms for multi-version layouts.
* **Testing Approach:**
  - E2E tests: Configure 4 versions, trigger slide change, assert DOM structure in audience window.
* **Implementation Milestone:** `M3`
* **Verification Status:** `Verified Documented`

---

### F06: Preview & Take Live Workflow
* **Feature ID:** `F06`
* **Description:** Strict two-stage presentation pipeline ensuring content is pre-visualized and validated before public display.
* **User Workflow:**
  1. Operator selects a scripture in the reader, search, or program list.
  2. Selected text renders immediately in the local Preview Panel.
  3. Operator verifies formatting, line breaks, and theme styling.
  4. Operator clicks `Take Live` (or presses `F12` / `Enter`).
  5. The Audience Display updates with the live content via an animated or cut transition.
* **Functional Requirements:**
  - Decoupled preview and live state in `PresentationController`.
  - Preview modifications must never mutate active live output without an explicit `takeLive()` command.
  - Support auto-take-live toggle mode for operators who prefer 1-click direct projection.
* **Dependencies:** `packages/presentation-engine`, `apps/desktop/electron/ipc`.
* **Acceptance Criteria:**
  - Changing preview content results in 0 state mutations on the audience output window until `takeLive()` executes.
* **Testing Approach:**
  - Unit tests: Verify state isolation in presentation store.
  - Desktop integration test: Probe IPC channel payloads for live vs preview.
* **Implementation Milestone:** `M5`
* **Verification Status:** `Verified Documented`

---

### F07: Freeze, Hide & Clear Controls
* **Feature ID:** `F07`
* **Description:** Dedicated real-time display controls critical for live broadcast and church stage management.
* **User Workflow:**
  1. While a scripture is displayed live, operator presses `F9` (`Freeze`).
  2. The audience display retains its exact current visual frame.
  3. Operator freely navigates to different chapters in the control studio.
  4. Operator hits `F10` (`Hide`); audience screen fades to black or transparent, but selected reference remains prepped.
  5. Operator hits `F11` (`Clear`); audience screen is cleared completely.
  6. Operator hits `Unfreeze` or `Take Live` to resume normal projection.
* **Functional Requirements:**
  - `Freeze`: Locks live frame rendering; suppresses live IPC update broadcasts to audience screens.
  - `Hide`: Blanks audience output (black or transparent for keying) while preserving active slide state.
  - `Clear`: Removes active live slide and resets state to `IDLE`.
* **Dependencies:** `packages/presentation-engine`, `apps/desktop/electron`.
* **Acceptance Criteria:**
  - When frozen, no operator navigation changes are visible on audience display.
  - Toggling hide/unhide executes cleanly in < 50ms without visual artifacts.
* **Testing Approach:**
  - E2E Playwright test simulating rapid freeze, navigate, and take-live operations.
* **Implementation Milestone:** `M5`
* **Verification Status:** `Verified Documented`

---

### F08: Theme & Graphic Styling Engine
* **Feature ID:** `F08`
* **Description:** Complete visual styling engine controlling typography, safe margins, backgrounds, and broadcast lower-thirds.
* **User Workflow:**
  1. Operator opens Themes tab and clicks "Create Theme".
  2. Adjusts font (family, size, weight, letter spacing, alignment).
  3. Configures text outline (color, thickness) and drop shadow (blur, offset, color).
  4. Sets background: Solid color, linear/radial gradient, image file, or looping video file.
  5. Configures safe margins (80% or 90% title safe) or selects "Lower Third" mode.
  6. Saves theme; assigns it as default or links it to a specific service program.
* **Functional Requirements:**
  - JSON-serialized theme configurations stored in SQLite.
  - Support CSS Web Animations API and hardware-accelerated video looping.
  - Lower-third mode with custom vertical positioning (bottom 25% of screen).
* **Dependencies:** `packages/theme-engine`, `packages/media-engine`.
* **Acceptance Criteria:**
  - Theme editor reflects style changes in real time (<16ms per frame).
  - High-resolution 1080p/4K video backgrounds loop seamlessly without audio glitches or frame stutter.
* **Testing Approach:**
  - Visual regression testing comparing rendered slides against canvas reference images.
* **Implementation Milestone:** `M6`
* **Verification Status:** `Verified Documented`

---

### F09: Program & Playlist Management
* **Feature ID:** `F09`
* **Description:** Ordered collections of scriptures, sermon references, and announcements organized for a specific service.
* **User Workflow:**
  1. Operator creates a new Program: "Sunday Morning - Oct 25".
  2. Adds scriptures directly from Bible Reader or Search via "Add to Program" button or drag-and-drop.
  3. Drags items to reorder; organizes items into sections ("Opening", "Sermon", "Altar Call").
  4. During service, operator presses `Down Arrow` or `Page Down` to step sequentially through the program.
* **Functional Requirements:**
  - Persisted programs and items with position indices.
  - Duplicate, export (JSON), and import program files.
  - Real-time indicator highlighting current active program item.
* **Dependencies:** `packages/database`, `packages/presentation-engine`.
* **Acceptance Criteria:**
  - Reordering items persists instantly to database.
  - Stepping through program updates preview and stage display synchronously.
* **Testing Approach:**
  - Integration tests for playlist CRUD operations and transactional reordering.
* **Implementation Milestone:** `M6`
* **Verification Status:** `Verified Documented`

---

### F10: Presentation History Log
* **Feature ID:** `F10`
* **Description:** Persistent audit timeline recording every scripture slide projected during a session.
* **User Workflow:**
  1. Every time a slide is taken live, a timestamped record is added to History.
  2. When a pastor references a scripture projected 15 minutes earlier, operator clicks History tab.
  3. Locates previous verse in chronological list and clicks "Recall to Live".
  4. Slide is immediately restored to preview or live.
* **Functional Requirements:**
  - Stores reference JSON, translation ID, theme ID, and timestamp.
  - "Clear History" action with required confirmation modal.
  - Auto-retention policy (retains last 500 events).
* **Dependencies:** `packages/database`, `packages/presentation-engine`.
* **Acceptance Criteria:**
  - Every `takeLive()` event writes an immutable history entry.
  - Recalled verses restore exact translation and reference state.
* **Testing Approach:**
  - Unit tests verifying history event creation on state machine transitions.
* **Implementation Milestone:** `M6`
* **Verification Status:** `Verified Documented`

---

### F11: AutoPlay Presentation Cycling
* **Feature ID:** `F11`
* **Description:** Automated timer-based presentation cycling through a playlist or verse range without manual intervention.
* **User Workflow:**
  1. Operator selects a series of verses or a program playlist.
  2. Enables AutoPlay and sets interval (e.g. 8 seconds per slide).
  3. Clicks "Start AutoPlay".
  4. Slides automatically transition on schedule until stopped or reaching playlist end.
* **Functional Requirements:**
  - Configurable slide duration (1 to 60 seconds).
  - Configurable end action: Loop continuously or Stop on final slide.
  - Immediate stop on manual operator input (keyboard arrow, Esc, clear).
* **Dependencies:** `packages/presentation-engine`.
* **Acceptance Criteria:**
  - Slide changes trigger precisely at configured time (+/- 50ms).
  - Manual keypress halts AutoPlay timer immediately.
* **Testing Approach:**
  - Fake timer tests in Vitest validating start, tick, transition, and cancel events.
* **Implementation Milestone:** `M6`
* **Verification Status:** `Verified Documented`

---

### F12: Multi-Display Window Manager
* **Feature ID:** `F12`
* **Description:** Detects connected Windows displays and manages full-screen output windows across projectors, TVs, and monitors.
* **User Workflow:**
  1. Operator connects projector to laptop HDMI port.
  2. In Display Settings, Scripture Studio lists all detected displays with names and resolutions.
  3. Operator assigns Display 2 as "Audience Output" and Display 3 as "Stage Display".
  4. Clicks "Open Outputs"; borderless full-screen windows open on the respective physical screens.
  5. If projector is unplugged, app displays notification and safely tears down window without crashing.
* **Functional Requirements:**
  - Utilize Electron `screen` API for display enumeration and event listening (`display-added`, `display-removed`).
  - Window creation with bounds matching target display coordinates.
  - Always-on-top, kiosk/frameless mode for audience output.
  - Support up to 4 concurrent display targets.
* **Dependencies:** `packages/display-manager`, `apps/desktop/electron`.
* **Acceptance Criteria:**
  - Windows open on exact target monitor bounds regardless of DPI scaling differences.
  - Disconnecting external monitor does not freeze or crash the main application.
* **Testing Approach:**
  - Mocked Electron screen tests; manual multi-monitor hardware verification on Windows 10/11.
* **Implementation Milestone:** `M7`
* **Verification Status:** `Verified Documented`

---

### F13: Stage Confidence Display
* **Feature ID:** `F13`
* **Description:** Dedicated monitor feed for speakers, pastors, and worship team on stage.
* **User Workflow:**
  1. Display output assigned to Stage Display window.
  2. Shows current live scripture in high-contrast yellow/white on black.
  3. Shows upcoming next scripture reference and preview text in smaller panel.
  4. Displays real-time 12/24h clock, sermon countdown timer, and private text notes from operator.
* **Functional Requirements:**
  - Private notes and timer data must never leak to Audience Display.
  - Dynamic font scaling to guarantee text fills available stage monitor screen.
* **Dependencies:** `packages/presentation-engine`, `packages/display-manager`.
* **Acceptance Criteria:**
  - Stage window updates in lockstep with audience window (<16ms skew).
  - Private notes remain strictly isolated from audience renderers.
* **Testing Approach:**
  - E2E assertion verifying DOM contents of audience window vs stage window.
* **Implementation Milestone:** `M7`
* **Verification Status:** `Verified Documented`

---

### F14: Keyboard-First Shortcuts
* **Feature ID:** `F14`
* **Description:** Ergonomic hotkey system allowing complete software operation without mouse dependency.
* **User Workflow:**
  - `F5` / `Ctrl+F`: Jump to Scripture Reference input.
  - `Enter` / `F12`: Take Live.
  - `Page Down` / `Down Arrow` / `Space`: Next Verse.
  - `Page Up` / `Up Arrow`: Previous Verse.
  - `F9`: Freeze / Unfreeze toggle.
  - `F10` / `Esc`: Hide / Restore output.
  - `F11`: Clear output.
* **Functional Requirements:**
  - Local renderer shortcut handling with input focus awareness (preventing accidental slide change while typing).
  - Optional global shortcut registration via Electron `globalShortcut`.
  - Configurable hotkey preferences stored in SQLite.
* **Dependencies:** `packages/keyboard-shortcuts`, `apps/desktop/electron`.
* **Acceptance Criteria:**
  - Pressing shortcuts executes presentation commands in < 20ms.
  - Typing inside text inputs does not trigger navigation shortcuts.
* **Testing Approach:**
  - Vitest keyboard event tests simulating modifier keys and input focus states.
* **Implementation Milestone:** `M7`
* **Verification Status:** `Verified Documented`

---

### F15: Localization & RTL Support
* **Feature ID:** `F15`
* **Description:** Comprehensive bi-directional rendering and UI internationalization.
* **User Workflow:**
  1. User selects Hebrew Old Testament or Arabic translation.
  2. Reader and Audience Display automatically render text Right-to-Left (RTL) with proper text alignment and punctuation placement.
  3. User can switch application UI language (English, Romanian, Spanish, French, German).
* **Functional Requirements:**
  - CSS `direction: rtl` and unicode-bidi support for scripture renderers.
  - i18n translation bundles for all UI strings.
* **Dependencies:** `packages/bible-engine`, `packages/ui-library`.
* **Acceptance Criteria:**
  - RTL verses display correctly without reversed punctuation or broken glyphs.
  - UI language switch takes effect immediately across all open windows.
* **Testing Approach:**
  - Visual regression testing with sample Hebrew and Arabic verses.
* **Implementation Milestone:** `M7`
* **Verification Status:** `Verified Documented`

---

### F16: PNG & XML Real-Time Export
* **Feature ID:** `F16`
* **Description:** Real-time generation of XML metadata and transparent PNG slide graphics for broadcast software interoperability (vMix, OBS, Wirecast).
* **User Workflow:**
  1. Operator enables "Live Disk Export" in Integration Settings.
  2. Sets export directory (e.g. `C:\ScriptureStudio\LiveOutput\`).
  3. Every time a slide is taken live, Scripture Studio writes:
     - `current_verse.xml`: XML structure with reference, translation, text, and book.
     - `current_slide.png`: 1920x1080 transparent PNG with rendered text and lower-third graphic.
  4. vMix / OBS monitors the folder and automatically updates broadcast titles in real time.
* **Functional Requirements:**
  - Debounced file writing to prevent read locks from broadcast software.
  - Valid XML conforming to standard schema.
  - High-resolution offscreen canvas rendering to PNG buffer.
* **Dependencies:** `packages/streaming-engine`, `apps/desktop/electron`.
* **Acceptance Criteria:**
  - XML and PNG files update within 150ms of `takeLive()` execution.
  - Files are written atomically using temp file rename to prevent read contention.
* **Testing Approach:**
  - Integration test verifying file modification timestamps and schema validity on slide transition.
* **Implementation Milestone:** `M8`
* **Verification Status:** `Verified Documented`

---

### F17: NDI Network Video Streaming
* **Feature ID:** `F17`
* **Description:** Native IP-based video transmission of live scripture graphics directly to the local network using the NewTek NDI protocol.
* **User Workflow:**
  1. In Broadcast Settings, operator enables "NDI Output" and names stream: `ScriptureStudio-Output`.
  2. Enables "Alpha Channel (Transparency)" for lower-third overlay.
  3. OBS Studio or vMix on the same LAN discovers the NDI source and adds it directly as a video input.
* **Functional Requirements:**
  - Clean C++ / native Node addon adapter wrapping NDI Advanced SDK.
  - Send 1080p60 frames with BGRA color format for full transparency.
  - Graceful fallback: If NDI runtime is not installed on host machine, software disables NDI gracefully without error popups.
* **Dependencies:** `packages/streaming-engine`, native NDI binary adapter.
* **Acceptance Criteria:**
  - NDI stream is discoverable by NDI Studio Monitor / OBS NDI plugin.
  - Framerate maintains steady 60 FPS with < 1 frame network latency.
* **Testing Approach:**
  - Mocked NDI adapter tests on standard CI; native integration validation on Windows hardware.
* **Implementation Milestone:** `M8`
* **Verification Status:** `Verified Documented`

---

### F18: Multi-Instance Execution
* **Feature ID:** `F18`
* **Description:** Support running multiple independent instances of Scripture Studio (e.g., Main Sanctuary and Youth Hall) on a single workstation.
* **User Workflow:**
  1. User launches second instance with `--profile=YouthHall` command line argument.
  2. Second instance connects to isolated database profile and manages its own displays and presentation state.
* **Functional Requirements:**
  - Profile-based SQLite database and configuration isolation.
  - Single-instance lock per profile name.
* **Dependencies:** `apps/desktop/electron`.
* **Acceptance Criteria:**
  - Multiple instances run concurrently without database lock collisions.
* **Testing Approach:**
  - Automated desktop launch tests verifying profile isolation.
* **Implementation Milestone:** `M7`
* **Verification Status:** `Proposed Modernization`

---

### F19: Optional Cloud Sync & Mobile Remote
* **Feature ID:** `F19`
* **Description:** Optional cloud backend integration for synchronizing sermon programs and themes, plus local LAN mobile web remote for pastors.
* **User Workflow:**
  1. Pastor creates sermon program at home on laptop; program syncs to cloud.
  2. Church presentation computer syncs program upon opening.
  3. Pastor uses smartphone on church Wi-Fi to step through verses during sermon.
* **Functional Requirements:**
  - ASP.NET Core REST API with JWT authentication.
  - Local WebSocket server in Electron main process for zero-cloud LAN remote control.
* **Dependencies:** `backend/ScriptureStudio.Api`, `apps/desktop/electron`.
* **Acceptance Criteria:**
  - Loss of internet connection has zero effect on local desktop presentation.
  - Mobile remote triggers slide transitions in < 50ms over local Wi-Fi.
* **Testing Approach:**
  - Integration tests for ASP.NET Core endpoints; Playwright mobile viewport tests.
* **Implementation Milestone:** `M9`
* **Verification Status:** `Proposed Modernization`

---

### F20: AI Sermon Preparation Assistant
* **Feature ID:** `F20`
* **Description:** Optional local or API-assisted study companion helping operators and pastors discover relevant cross-references and themes.
* **User Workflow:**
  1. Operator is building a sermon program around "Forgiveness".
  2. Enters topic into AI assistant panel.
  3. AI suggests canonical scripture references verified against the installed local Bible database.
  4. Operator clicks "Add to Program" to insert verified verses.
* **Functional Requirements:**
  - Strict validation: AI suggestions are parsed and checked against local Bible SQLite database before display to prevent hallucinations.
* **Dependencies:** `packages/scripture-search`, `backend`.
* **Acceptance Criteria:**
  - Only valid canonical references matching installed text are suggested.
* **Testing Approach:**
  - Unit tests asserting validation pipeline rejects non-existent verse references.
* **Implementation Milestone:** `M9`
* **Verification Status:** `Proposed Modernization`

