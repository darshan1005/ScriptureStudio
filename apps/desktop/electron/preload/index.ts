import { contextBridge, ipcRenderer } from 'electron';
import {
  AssignDisplayRoleRequest,
  DownloadBibleProgressEvent,
  DownloadBibleVersionRequest,
  GetBibleBooksRequest,
  GetBibleChapterRequest,
  GetVerseRangeRequest,
  ImportBibleFileRequest,
  ParseReferenceRequest,
  PresentationStateDto,
  PreviewReferenceRequest,
  SaveProgramRequest,
  SaveThemeRequest,
  SearchFullTextRequest,
  TakeLiveRequest,
  ScriptureStudioApi,
  DisplayTopologyEvent,
} from '@scripture-studio/shared-types';

const api: ScriptureStudioApi = {
  bible: {
    getVersions: () => ipcRenderer.invoke('bible:get-versions'),
    getBooks: (req: GetBibleBooksRequest) => ipcRenderer.invoke('bible:get-books', req),
    getChapter: (req: GetBibleChapterRequest) => ipcRenderer.invoke('bible:get-chapter', req),
    getVerseRange: (req: GetVerseRangeRequest) => ipcRenderer.invoke('bible:get-verse-range', req),
    importFile: (req: ImportBibleFileRequest) => ipcRenderer.invoke('bible:import-file', req),
    downloadVersion: (req: DownloadBibleVersionRequest) =>
      ipcRenderer.invoke('bible:download-version', req),
    deleteVersion: (versionId: string) => ipcRenderer.invoke('bible:delete-version', versionId),
    onDownloadProgress: (callback: (evt: DownloadBibleProgressEvent) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, evt: DownloadBibleProgressEvent) => {
        callback(evt);
      };
      ipcRenderer.on('bible:download-progress', listener);
      return () => {
        ipcRenderer.removeListener('bible:download-progress', listener);
      };
    },
  },
  search: {
    parseReference: (req: ParseReferenceRequest) => ipcRenderer.invoke('search:parse-reference', req),
    searchFullText: (req: SearchFullTextRequest) => ipcRenderer.invoke('search:full-text', req),
  },
  presentation: {
    getState: () => ipcRenderer.invoke('presentation:get-state'),
    previewReference: (req: PreviewReferenceRequest) =>
      ipcRenderer.invoke('presentation:preview-reference', req),
    takeLive: (req?: TakeLiveRequest) => ipcRenderer.invoke('presentation:take-live', req),
    freeze: () => ipcRenderer.invoke('presentation:freeze'),
    unfreeze: () => ipcRenderer.invoke('presentation:unfreeze'),
    hide: () => ipcRenderer.invoke('presentation:hide'),
    unhide: () => ipcRenderer.invoke('presentation:unhide'),
    clear: () => ipcRenderer.invoke('presentation:clear'),
    stopLive: () => ipcRenderer.invoke('presentation:stop-live'),
    setTheme: (themeId: string) => ipcRenderer.invoke('presentation:set-theme', themeId),
    next: () => ipcRenderer.invoke('presentation:next'),
    prev: () => ipcRenderer.invoke('presentation:prev'),
    capturePreview: (options?: { width?: number; height?: number } | { x?: number; y?: number; width?: number; height?: number }) =>
      ipcRenderer.invoke('presentation:capture-preview', options),
    savePreviewImage: (req: { dataUrl: string; defaultFilename?: string }) =>
      ipcRenderer.invoke('presentation:save-preview-image', req),
    showItemInFolder: (filePath: string) => ipcRenderer.invoke('presentation:show-in-folder', filePath),
    onStateChanged: (callback: (state: PresentationStateDto) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, state: PresentationStateDto) => {
        callback(state);
      };
      ipcRenderer.on('presentation:state-changed', listener);
      return () => {
        ipcRenderer.removeListener('presentation:state-changed', listener);
      };
    },
  },
  display: {
    getDisplays: () => ipcRenderer.invoke('display:get-displays'),
    assignRole: (req: AssignDisplayRoleRequest) => ipcRenderer.invoke('display:assign-role', req),
    openOutputs: () => ipcRenderer.invoke('display:open-outputs'),
    closeOutputs: () => ipcRenderer.invoke('display:close-outputs'),
    getOutputStatus: () => ipcRenderer.invoke('display:get-output-status'),
    onOutputStatusChanged: (callback: (status: { isOpen: boolean }) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, status: { isOpen: boolean }) => {
        callback(status);
      };
      ipcRenderer.on('display:output-status-changed', listener);
      return () => {
        ipcRenderer.removeListener('display:output-status-changed', listener);
      };
    },
    onTopologyChanged: (callback: (evt: DisplayTopologyEvent) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, evt: DisplayTopologyEvent) => {
        callback(evt);
      };
      ipcRenderer.on('display:topology-changed', listener);
      return () => {
        ipcRenderer.removeListener('display:topology-changed', listener);
      };
    },
  },
  themes: {
    list: () => ipcRenderer.invoke('themes:list'),
    save: (req: SaveThemeRequest) => ipcRenderer.invoke('themes:save', req),
    delete: (id: string) => ipcRenderer.invoke('themes:delete', id),
    setDefault: (id: string) => ipcRenderer.invoke('themes:set-default', id),
  },
  programs: {
    list: () => ipcRenderer.invoke('programs:list'),
    save: (req: SaveProgramRequest) => ipcRenderer.invoke('programs:save', req),
    delete: (id: string) => ipcRenderer.invoke('programs:delete', id),
  },
  history: {
    getRecent: (limit?: number) => ipcRenderer.invoke('history:get-recent', limit),
    clear: () => ipcRenderer.invoke('history:clear'),
  },
  streaming: {
    getStatus: () => ipcRenderer.invoke('streaming:get-status'),
    toggleNdi: (enabled: boolean) => ipcRenderer.invoke('streaming:toggle-ndi', enabled),
  },
};

contextBridge.exposeInMainWorld('scriptureStudioApi', api);

