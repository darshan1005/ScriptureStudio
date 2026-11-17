import {
  BibleBookDto,
  BibleChapterDto,
  BibleVerseDto,
  BibleVersionDto,
  ParsedReferenceResult,
} from './bible.js';
import { PresentationStateDto, TransitionType } from './presentation.js';
import { ThemeDto } from './theme.js';
import { DisplayDto, DisplayRole, DisplayTopologyEvent } from './display.js';
import { ProgramDto } from './program.js';
import { PresentationHistoryEntryDto } from './history.js';
import { StreamingStatusDto } from './streaming.js';

// ==========================================
// IPC Request & Response Types
// ==========================================

// Bible Channels
export interface GetBibleVersionsResponse {
  versions: BibleVersionDto[];
}

export interface GetBibleBooksRequest {
  versionId: string;
}

export interface GetBibleBooksResponse {
  books: BibleBookDto[];
}

export interface GetBibleChapterRequest {
  versionId: string;
  bookId: string;
  chapterNumber: number;
}

export interface GetBibleChapterResponse {
  book: BibleBookDto;
  chapter: BibleChapterDto;
  verses: BibleVerseDto[];
}

export interface GetVerseRangeRequest {
  versionId: string;
  bookId: string;
  chapterNumber: number;
  startVerse: number;
  endVerse: number;
}

export interface GetVerseRangeResponse {
  verses: BibleVerseDto[];
}

export interface ImportBibleFileRequest {
  filePath: string;
}

export interface ImportBibleFileResponse {
  success: boolean;
  versionId?: string;
  verseCount?: number;
  error?: string;
}

export interface DownloadBibleVersionRequest {
  languageCode: string;
  versionCode: string;
}

export interface DownloadBibleVersionResponse {
  success: boolean;
  versionId?: string;
  verseCount?: number;
  error?: string;
}

export interface DownloadBibleProgressEvent {
  versionCode: string;
  progress: number;
  stage: string;
}

// Search Channels
export interface ParseReferenceRequest {
  query: string;
}

export type SearchScopeRange =
  | 'ALL'
  | 'OT'
  | 'NT'
  | 'PENTATEUCH'
  | 'HISTORY'
  | 'POETRY'
  | 'PROPHETS'
  | 'GOSPELS'
  | 'EPISTLES';

export interface SearchFullTextRequest {
  query: string;
  versionId?: string;
  limit?: number;
  offset?: number;
  range?: SearchScopeRange;
  wholeWordsOnly?: boolean;
  accentSensitive?: boolean;
  useWildcards?: boolean;
}

export interface SearchFullTextResultItem {
  verseId: string;
  versionId: string;
  versionAbbr: string;
  bookId: string;
  bookName: string;
  chapterNumber: number;
  verseNumber: number;
  verseText: string;
  snippet: string;
}

export interface SearchFullTextResponse {
  totalCount: number;
  results: SearchFullTextResultItem[];
}

// Presentation Channels
export interface PreviewReferenceRequest {
  versionId: string;
  secondaryVersionId?: string;
  bookId: string;
  bookName?: string;
  chapterNumber: number;
  startVerse: number;
  endVerse?: number;
  themeId?: string;
}

export interface TakeLiveRequest {
  transitionType?: TransitionType;
  durationMs?: number;
}

export interface PresentationActionResponse {
  success: boolean;
  newState: PresentationStateDto;
  error?: string;
}

// Display Channels
export interface GetDisplaysResponse {
  displays: DisplayDto[];
}

export interface AssignDisplayRoleRequest {
  displayId: string;
  role: DisplayRole;
}

// Theme Channels
export interface GetThemesResponse {
  themes: ThemeDto[];
}

export interface SaveThemeRequest {
  theme: ThemeDto;
}

// Program Channels
export interface GetProgramsResponse {
  programs: ProgramDto[];
}

export interface SaveProgramRequest {
  program: ProgramDto;
}

// History Channels
export interface GetPresentationHistoryResponse {
  entries: PresentationHistoryEntryDto[];
}

// ==========================================
// Preload Bridge API Contract (window.scriptureStudioApi)
// ==========================================

export interface ScriptureStudioApi {
  bible: {
    getVersions(): Promise<GetBibleVersionsResponse>;
    getBooks(req: GetBibleBooksRequest): Promise<GetBibleBooksResponse>;
    getChapter(req: GetBibleChapterRequest): Promise<GetBibleChapterResponse>;
    getVerseRange(req: GetVerseRangeRequest): Promise<GetVerseRangeResponse>;
    importFile(req: ImportBibleFileRequest): Promise<ImportBibleFileResponse>;
    downloadVersion(req: DownloadBibleVersionRequest): Promise<DownloadBibleVersionResponse>;
    deleteVersion(versionId: string): Promise<boolean>;
    onDownloadProgress?(callback: (evt: DownloadBibleProgressEvent) => void): () => void;
  };
  search: {
    parseReference(req: ParseReferenceRequest): Promise<ParsedReferenceResult>;
    searchFullText(req: SearchFullTextRequest): Promise<SearchFullTextResponse>;
  };
  presentation: {
    getState(): Promise<PresentationStateDto>;
    previewReference(req: PreviewReferenceRequest): Promise<PresentationActionResponse>;
    takeLive(req?: TakeLiveRequest): Promise<PresentationActionResponse>;
    freeze(): Promise<PresentationActionResponse>;
    unfreeze(): Promise<PresentationActionResponse>;
    hide(): Promise<PresentationActionResponse>;
    unhide(): Promise<PresentationActionResponse>;
    clear(): Promise<PresentationActionResponse>;
    stopLive?(): Promise<PresentationActionResponse>;
    setTheme?(themeId: string): Promise<PresentationActionResponse>;
    next(): Promise<PresentationActionResponse>;
    prev(): Promise<PresentationActionResponse>;
    capturePreview?(options?: { width?: number; height?: number } | { x?: number; y?: number; width?: number; height?: number }): Promise<{ success: boolean; dataUrl?: string; error?: string }>;
    savePreviewImage?(req: { dataUrl: string; defaultFilename?: string }): Promise<{ success: boolean; filePath?: string; filename?: string; canceled?: boolean; error?: string }>;
    showItemInFolder?(filePath: string): Promise<void>;
    onStateChanged(callback: (state: PresentationStateDto) => void): () => void;
  };
  display: {
    getDisplays(): Promise<GetDisplaysResponse>;
    assignRole(req: AssignDisplayRoleRequest): Promise<void>;
    openOutputs(): Promise<void>;
    closeOutputs(): Promise<void>;
    getOutputStatus(): Promise<{ isOpen: boolean }>;
    onOutputStatusChanged?(callback: (status: { isOpen: boolean }) => void): () => void;
    onTopologyChanged(callback: (evt: DisplayTopologyEvent) => void): () => void;
  };
  themes: {
    list(): Promise<GetThemesResponse>;
    save(req: SaveThemeRequest): Promise<ThemeDto>;
    delete(id: string): Promise<boolean>;
    setDefault(id: string): Promise<void>;
  };
  programs: {
    list(): Promise<GetProgramsResponse>;
    save(req: SaveProgramRequest): Promise<ProgramDto>;
    delete(id: string): Promise<boolean>;
  };
  history: {
    getRecent(limit?: number): Promise<GetPresentationHistoryResponse>;
    clear(): Promise<boolean>;
  };
  streaming: {
    getStatus(): Promise<StreamingStatusDto>;
    toggleNdi(enabled: boolean): Promise<void>;
  };
  help?: {
    openExternal(url: string): Promise<boolean>;
    getAppVersion(): Promise<string>;
    onOpenHelp?(callback: (tab: 'guide' | 'bug' | 'enhancement' | 'qa') => void): () => void;
  };
}

declare global {
  interface Window {
    scriptureStudioApi: ScriptureStudioApi;
  }
}

