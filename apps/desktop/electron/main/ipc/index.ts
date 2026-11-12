import { ipcMain } from 'electron';
import { DatabaseClient, ThemeRepository, ProgramRepository, HistoryRepository } from '@scripture-studio/database';
import { ScriptureSearchService } from '@scripture-studio/scripture-search';
import { registerBibleIpcHandlers } from './bible-handlers.js';
import { PresentationController, registerPresentationIpcHandlers } from './presentation-handlers.js';
import { registerDisplayIpcHandlers } from './display-handlers.js';
import { createLogger } from '@scripture-studio/logger';
import { SaveProgramRequest, SaveThemeRequest, SearchFullTextRequest } from '@scripture-studio/shared-types';

const logger = createLogger('IpcDispatcher');

export function registerAllIpcHandlers(dbClient: DatabaseClient): PresentationController {
  logger.info('Registering strongly typed Electron IPC channel handlers...');

  // 1. Bible Engine handlers
  registerBibleIpcHandlers(dbClient);

  // 2. Presentation Controller
  const presentationController = new PresentationController(dbClient);
  registerPresentationIpcHandlers(presentationController);

  // 3. Display & Monitor handlers
  registerDisplayIpcHandlers();

  // 4. Themes handlers
  const themeRepo = new ThemeRepository(dbClient.rawDb);
  ipcMain.handle('themes:list', () => {
    return { themes: themeRepo.getThemes() };
  });
  ipcMain.handle('themes:save', (_e, req: SaveThemeRequest) => {
    themeRepo.saveTheme(req.theme);
    return req.theme;
  });
  ipcMain.handle('themes:delete', (_e, id: string) => {
    return themeRepo.deleteTheme(id);
  });
  ipcMain.handle('themes:set-default', (_e, id: string) => {
    const theme = themeRepo.getThemeById(id);
    if (theme) {
      theme.isDefault = true;
      themeRepo.saveTheme(theme);
    }
  });

  // 5. Programs handlers
  const programRepo = new ProgramRepository(dbClient.rawDb);
  ipcMain.handle('programs:list', () => {
    return { programs: programRepo.getPrograms() };
  });
  ipcMain.handle('programs:save', (_e, req: SaveProgramRequest) => {
    programRepo.saveProgram(req.program);
    return req.program;
  });
  ipcMain.handle('programs:delete', (_e, id: string) => {
    return programRepo.deleteProgram(id);
  });

  // 6. Presentation History handlers
  const historyRepo = new HistoryRepository(dbClient.rawDb);
  ipcMain.handle('history:get-recent', (_e, limit?: number) => {
    return { entries: historyRepo.getRecent(limit) };
  });
  ipcMain.handle('history:clear', () => {
    return historyRepo.clear();
  });

  // 7. Scripture Search Engine (FTS & Reference Parser)
  const searchService = new ScriptureSearchService(dbClient);
  ipcMain.handle('search:parse-reference', (_e, { query }: { query: string }) => {
    return searchService.parseReference(query);
  });
  ipcMain.handle('search:full-text', (_e, req: SearchFullTextRequest) => {
    return searchService.searchFullText(req);
  });

  // 8. Streaming status placeholder
  ipcMain.handle('streaming:get-status', () => ({
    ndiActive: false,
    ndiStreamName: 'ScriptureStudio-Output',
    diskExportActive: false,
    diskExportPath: '',
    lastFrameTimestamp: Date.now(),
  }));
  ipcMain.handle('streaming:toggle-ndi', () => {});

  logger.info('All IPC channel handlers successfully registered.');
  return presentationController;
}
