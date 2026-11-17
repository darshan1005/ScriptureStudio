# Graph Report - ScriptureStudio  (2026-11-16)

## Corpus Check
- Large corpus: 144 files · ~3,028,758 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1004 nodes · 1666 edges · 70 communities (53 shown, 17 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 55 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Theme Engine & Styler
- Display & Multi-Window Management
- Display & Multi-Window Management
- Database Schema & SQLite Repositories
- Bible IPC Handlers
- Presentation Engine & IPC Handlers
- Base Service
- Desktop Renderer & UI Layouts
- Presentation Engine & IPC Handlers
- NDI Streaming & Media Looper
- CSS Compiler & Theme Scaler
- Desktop Renderer & UI Layouts
- Database Schema & SQLite Repositories
- Database Schema & SQLite Repositories
- Desktop Renderer & UI Layouts
- Tsconfig Service
- Bible IPC Handlers
- Database Schema & SQLite Repositories
- Shared IPC & Domain DTO Types
- NDI Streaming & Media Looper
- Shared IPC & Domain DTO Types
- Shared IPC & Domain DTO Types
- Display & Multi-Window Management
- Scripture Search UI
- NDI Streaming & Media Looper
- Bible Engine & Reference Parser
- Shared IPC & Domain DTO Types
- Keyboard Shortcuts Registry
- CSS Compiler & Theme Scaler
- Node Service
- Display & Multi-Window Management
- Bible Translation Importers & Downloads
- Display & Multi-Window Management
- Package Service
- Shared IPC & Domain DTO Types
- Keyboard Shortcuts Registry
- Desktop Renderer & UI Layouts
- Bible Engine & Reference Parser
- Bible Translation Importers & Downloads
- Tsconfig Service
- Database Schema & SQLite Repositories
- Tsconfig Service
- Keyboard Shortcuts Registry
- Logger Service
- Tsconfig Service
- Tsconfig Service
- Tsconfig Service
- NDI Streaming & Media Looper
- CSS Compiler & Theme Scaler
- Tsconfig Service
- Shared IPC & Domain DTO Types
- NDI Streaming & Media Looper
- Cloud Sync API & Backend Service
- Scripts Service
- Cloud Sync API & Backend Service
- Mediaassetmanager Service
- Autoplayengine Service
- Index Service
- Desktop Renderer & UI Layouts
- Bible Engine & Reference Parser
- Database Schema & SQLite Repositories
- Manager Service
- Keyboard Shortcuts Registry
- Engine Service
- Engine Service
- CSS Compiler & Theme Scaler
- Desktop Renderer & UI Layouts
- Presentation Engine & IPC Handlers
- Desktop Renderer & UI Layouts

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 26 edges
2. `registerAllIpcHandlers()` - 22 edges
3. `PresentationController` - 22 edges
4. `PresentationActionResponse` - 22 edges
5. `BibleRepository` - 21 edges
6. `PresentationStateDto` - 21 edges
7. `createLogger()` - 19 edges
8. `DatabaseClient` - 18 edges
9. `BibleVersionDto` - 18 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `registerAllIpcHandlers()` --calls--> `ScriptureSearchService`  [EXTRACTED]
  apps/desktop/electron/main/ipc/index.ts → packages/scripture-search/src/search-service.ts
- `PresentationController` --references--> `BibleRepository`  [EXTRACTED]
  apps/desktop/electron/main/ipc/presentation-handlers.ts → packages/database/src/repositories/bible-repository.ts
- `PresentationController` --references--> `HistoryRepository`  [EXTRACTED]
  apps/desktop/electron/main/ipc/presentation-handlers.ts → packages/database/src/repositories/history-repository.ts
- `PresentationController` --references--> `ThemeRepository`  [EXTRACTED]
  apps/desktop/electron/main/ipc/presentation-handlers.ts → packages/database/src/repositories/theme-repository.ts
- `PresentationController` --references--> `ScriptureReference`  [EXTRACTED]
  apps/desktop/electron/main/ipc/presentation-handlers.ts → packages/shared-types/src/bible.ts

## Import Cycles
- None detected.

## Communities (70 total, 17 thin omitted)

### Community 0 - "Theme Engine & Styler"
Cohesion: 0.06
Nodes (53): App(), BibleReaderWorkspace(), BibleReaderWorkspaceProps, HistoryWorkspace(), HistoryWorkspaceProps, MaterialIcon(), MaterialIconProps, cleanScriptureText() (+45 more)

### Community 1 - "Display & Multi-Window Management"
Cohesion: 0.06
Nodes (40): gotSingleInstanceLock, initializeApp(), logger, assignedRoles, broadcastTopologyChange(), getConnectedDisplays(), logger, openOutputWindows() (+32 more)

### Community 2 - "Display & Multi-Window Management"
Cohesion: 0.04
Nodes (8): DownloadBibleVersionResponse, GetBibleBooksResponse, GetBibleVersionsResponse, GetPresentationHistoryResponse, GetVerseRangeResponse, ImportBibleFileResponse, SearchScopeRange, Window

### Community 3 - "Database Schema & SQLite Repositories"
Cohesion: 0.06
Nodes (25): SyncController, SyncProgramDto, SyncProgramItemDto, SyncRequest, SyncResponse, ISyncRepository, SermonProgram, ChurchOrgId (+17 more)

### Community 4 - "Bible IPC Handlers"
Cohesion: 0.16
Nodes (17): registerBibleIpcHandlers(), seedInitialScriptureData(), findCanonicalBook(), AVAILABLE_ONLINE_TRANSLATIONS, DownloadableTranslationInfo, downloadAndInstallTranslation(), logger, importBibleFromJsonFile() (+9 more)

### Community 5 - "Presentation Engine & IPC Handlers"
Cohesion: 0.19
Nodes (5): cleanVerseText(), PresentationController, registerPresentationIpcHandlers(), DomainPresentationController, PresentationActionResponse

### Community 6 - "Base Service"
Cohesion: 0.07
Nodes (27): compilerOptions, alwaysStrict, composite, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, jsx (+19 more)

### Community 7 - "Desktop Renderer & UI Layouts"
Cohesion: 0.09
Nodes (24): author, description, devDependencies, electron-builder@^26.18.0, @types/node@^22.10.1, typescript@^5.7.2, vitest@^3.0.0, @types/node (+16 more)

### Community 8 - "Presentation Engine & IPC Handlers"
Cohesion: 0.15
Nodes (6): registerAllIpcHandlers(), HistoryRepository, ProgramRepository, ThemeRepository, GetThemesResponse, ThemeDto

### Community 9 - "NDI Streaming & Media Looper"
Cohesion: 0.08
Nodes (23): appId, artifactName, copyright, directories, output, electronVersion, files, nsis (+15 more)

### Community 10 - "CSS Compiler & Theme Scaler"
Cohesion: 0.09
Nodes (16): AspectRatioMode, BackgroundType, FontStyleMode, TextAlignment, TextDecorationMode, TextTransform, ThemeBackground, ThemeConfiguration (+8 more)

### Community 11 - "Desktop Renderer & UI Layouts"
Cohesion: 0.12
Nodes (21): dependencies, react@^19.0.0, react-dom@^19.0.0, @scripture-studio/shared-types@*, description, devDependencies, @types/react@^19.0.8, @types/react-dom@^19.0.3 (+13 more)

### Community 12 - "Database Schema & SQLite Repositories"
Cohesion: 0.12
Nodes (20): dependencies, better-sqlite3@^11.8.1, @scripture-studio/bible-engine@*, @scripture-studio/logger@*, @scripture-studio/shared-types@*, description, devDependencies, @types/better-sqlite3@^7.6.12 (+12 more)

### Community 13 - "Database Schema & SQLite Repositories"
Cohesion: 0.13
Nodes (19): dependencies, @scripture-studio/bible-engine@*, @scripture-studio/database@*, @scripture-studio/logger@*, @scripture-studio/shared-types@*, description, devDependencies, typescript@^5.7.2 (+11 more)

### Community 14 - "Desktop Renderer & UI Layouts"
Cohesion: 0.13
Nodes (16): devDependencies, electron@34.5.8, @types/react@^19.0.8, @types/react-dom@^19.0.3, typescript@^5.7.2, vite@^6.1.0, vite-plugin-electron@^0.29.0, vite-plugin-electron-renderer@^0.14.6 (+8 more)

### Community 15 - "Tsconfig Service"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 16 - "Bible IPC Handlers"
Cohesion: 0.19
Nodes (8): CANONICAL_BOOKS, CanonicalBookDefinition, parseScriptureReference(), getTermStem(), logger, ScriptureSearchService, SearchFullTextRequest, SearchFullTextResponse

### Community 17 - "Database Schema & SQLite Repositories"
Cohesion: 0.14
Nodes (17): dependencies, @scripture-studio/database@*, @scripture-studio/logger@*, @scripture-studio/shared-types@*, description, devDependencies, typescript@^5.7.2, @scripture-studio/database (+9 more)

### Community 18 - "Shared IPC & Domain DTO Types"
Cohesion: 0.14
Nodes (17): dependencies, @scripture-studio/logger@*, @scripture-studio/shared-types@*, description, devDependencies, @types/node@^22.10.1, typescript@^5.7.2, @scripture-studio/logger (+9 more)

### Community 19 - "NDI Streaming & Media Looper"
Cohesion: 0.14
Nodes (17): dependencies, @scripture-studio/logger@*, @scripture-studio/shared-types@*, description, devDependencies, @types/node@^22.10.1, typescript@^5.7.2, @scripture-studio/logger (+9 more)

### Community 20 - "Shared IPC & Domain DTO Types"
Cohesion: 0.15
Nodes (15): dependencies, @scripture-studio/logger@*, @scripture-studio/shared-types@*, description, devDependencies, typescript@^5.7.2, @scripture-studio/logger, @scripture-studio/shared-types (+7 more)

### Community 21 - "Shared IPC & Domain DTO Types"
Cohesion: 0.15
Nodes (15): dependencies, @scripture-studio/logger@*, @scripture-studio/shared-types@*, description, devDependencies, typescript@^5.7.2, @scripture-studio/logger, @scripture-studio/shared-types (+7 more)

### Community 22 - "Display & Multi-Window Management"
Cohesion: 0.17
Nodes (13): broadcastDownloadProgress(), logger, api, AssignDisplayRoleRequest, DownloadBibleProgressEvent, DownloadBibleVersionRequest, GetBibleBooksRequest, GetBibleChapterRequest (+5 more)

### Community 23 - "Scripture Search UI"
Cohesion: 0.13
Nodes (15): dependencies, lucide-react@^1.16.0, react@^19.0.0, @scripture-studio/configuration@*, @scripture-studio/logger@*, @scripture-studio/scripture-search@*, @scripture-studio/streaming-engine@*, zustand@^5.0.3 (+7 more)

### Community 24 - "NDI Streaming & Media Looper"
Cohesion: 0.15
Nodes (4): INdiAdapter, logger, NdiAdapterFactory, NullNdiAdapter

### Community 25 - "Bible Engine & Reference Parser"
Cohesion: 0.16
Nodes (13): dependencies, @scripture-studio/shared-types@*, description, devDependencies, typescript@^5.7.2, @scripture-studio/shared-types, typescript, main (+5 more)

### Community 26 - "Shared IPC & Domain DTO Types"
Cohesion: 0.16
Nodes (13): dependencies, @scripture-studio/shared-types@*, description, devDependencies, typescript@^5.7.2, @scripture-studio/shared-types, typescript, main (+5 more)

### Community 27 - "Keyboard Shortcuts Registry"
Cohesion: 0.16
Nodes (13): dependencies, @scripture-studio/logger@*, description, devDependencies, typescript@^5.7.2, @scripture-studio/logger, typescript, main (+5 more)

### Community 28 - "CSS Compiler & Theme Scaler"
Cohesion: 0.16
Nodes (13): dependencies, @scripture-studio/shared-types@*, description, devDependencies, typescript@^5.7.2, @scripture-studio/shared-types, typescript, main (+5 more)

### Community 29 - "Node Service"
Cohesion: 0.15
Nodes (12): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleResolution, outDir, resolveJsonModule (+4 more)

### Community 30 - "Display & Multi-Window Management"
Cohesion: 0.26
Nodes (6): DisplayService, logger, DisplayBounds, DisplayDto, DisplayRole, GetDisplaysResponse

### Community 31 - "Bible Translation Importers & Downloads"
Cohesion: 0.18
Nodes (10): author, @scripture-studio/bible-importer@*, @scripture-studio/shared-types@*, description, @scripture-studio/shared-types, main, name, private (+2 more)

### Community 32 - "Display & Multi-Window Management"
Cohesion: 0.18
Nodes (9): ParsedReferenceResult, DisplayTopologyEvent, GetProgramsResponse, SaveProgramRequest, ScriptureStudioApi, ProgramDto, DiskExportConfigDto, NdiConfigDto (+1 more)

### Community 33 - "Package Service"
Cohesion: 0.20
Nodes (10): description, devDependencies, typescript@^5.7.2, typescript, main, name, scripts, build (+2 more)

### Community 34 - "Shared IPC & Domain DTO Types"
Cohesion: 0.20
Nodes (10): description, devDependencies, typescript@^5.7.2, typescript, main, name, scripts, build (+2 more)

### Community 35 - "Keyboard Shortcuts Registry"
Cohesion: 0.22
Nodes (5): DEFAULT_SHORTCUTS, logger, ShortcutAction, ShortcutDefinition, ShortcutRegistry

### Community 36 - "Desktop Renderer & UI Layouts"
Cohesion: 0.22
Nodes (8): compilerOptions, jsx, outDir, rootDir, extends, include, ../../tsconfig.base.json, references

### Community 37 - "Bible Engine & Reference Parser"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.base.json, references

### Community 38 - "Bible Translation Importers & Downloads"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.base.json, references

### Community 39 - "Tsconfig Service"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.base.json, references

### Community 40 - "Database Schema & SQLite Repositories"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.base.json, references

### Community 41 - "Tsconfig Service"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.base.json, references

### Community 42 - "Keyboard Shortcuts Registry"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.base.json, references

### Community 44 - "Tsconfig Service"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.base.json, references

### Community 45 - "Tsconfig Service"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.base.json, references

### Community 46 - "Tsconfig Service"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.base.json, references

### Community 47 - "NDI Streaming & Media Looper"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.base.json, references

### Community 48 - "CSS Compiler & Theme Scaler"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.base.json, references

### Community 49 - "Tsconfig Service"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.base.json

### Community 50 - "Shared IPC & Domain DTO Types"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.base.json

### Community 52 - "Cloud Sync API & Backend Service"
Cohesion: 0.33
Nodes (4): net9.0, Microsoft.NET.Sdk, net9.0, Microsoft.NET.Sdk

### Community 53 - "Scripts Service"
Cohesion: 0.40
Nodes (5): scripts, build, dev, package, preview

### Community 54 - "Cloud Sync API & Backend Service"
Cohesion: 0.40
Nodes (4): net9.0, Microsoft.AspNetCore.OpenApi (9.0.0), Swashbuckle.AspNetCore (7.0.0), Microsoft.NET.Sdk.Web

## Knowledge Gaps
- **36 isolated node(s):** `net9.0`, `Microsoft.AspNetCore.OpenApi (9.0.0)`, `Swashbuckle.AspNetCore (7.0.0)`, `Microsoft.NET.Sdk.Web`, `net9.0` (+31 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 455 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `electron` connect `Display & Multi-Window Management` to `Desktop Renderer & UI Layouts`, `Display & Multi-Window Management`, `Bible Translation Importers & Downloads`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `registerAllIpcHandlers()` (e.g. with `.clear()` and `.getRecent()`) actually correct?**
  _`registerAllIpcHandlers()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `net9.0`, `Microsoft.AspNetCore.OpenApi (9.0.0)`, `Swashbuckle.AspNetCore (7.0.0)` to the rest of the system?**
  _36 weakly-connected nodes found - possible missing edges._
- **Should `Theme Engine & Styler` be split into smaller, more focused modules?**
  _Cohesion score 0.05679862306368331 - nodes in this community are weakly interconnected._
- **Why does `createLogger()` connect `Display & Multi-Window Management` to `Keyboard Shortcuts Registry`, `Bible IPC Handlers`, `Logger Service`, `Bible IPC Handlers`, `Display & Multi-Window Management`, `NDI Streaming & Media Looper`, `Display & Multi-Window Management`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Should `Display & Multi-Window Management` be split into smaller, more focused modules?**
  _Cohesion score 0.06169772256728778 - nodes in this community are weakly interconnected._
- **Why does `PresentationStateDto` connect `Theme Engine & Styler` to `Display & Multi-Window Management`, `Display & Multi-Window Management`, `Display & Multi-Window Management`, `Presentation Engine & IPC Handlers`, `Display & Multi-Window Management`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._