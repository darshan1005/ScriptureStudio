import { ipcMain, BrowserWindow } from 'electron';
import {
  PresentationActionResponse,
  PresentationStateDto,
  PreviewReferenceRequest,
  SlideContentDto,
  TakeLiveRequest,
  MultiVersionSlot,
  ScriptureReference,
} from '@scripture-studio/shared-types';
import { DatabaseClient, HistoryRepository, BibleRepository, ThemeRepository } from '@scripture-studio/database';
import { createLogger } from '@scripture-studio/logger';
import { getControlStudioWindow } from '../windows/control-studio.js';
import { getAudienceDisplayWindow, closeAudienceDisplayWindow, broadcastOutputStatus } from '../windows/audience-display.js';
import { getStageDisplayWindow } from '../windows/stage-display.js';
import { openOutputWindows } from './display-handlers.js';

const logger = createLogger('PresentationController');

export class PresentationController {
  private state: PresentationStateDto;
  private historyRepo: HistoryRepository;
  private bibleRepo: BibleRepository;
  private themeRepo: ThemeRepository;
  private stagedReference: ScriptureReference | null = null;
  private liveReference: ScriptureReference | null = null;

  constructor(dbClient: DatabaseClient) {
    this.historyRepo = new HistoryRepository(dbClient.rawDb);
    this.bibleRepo = new BibleRepository(dbClient.rawDb);
    this.themeRepo = new ThemeRepository(dbClient.rawDb);

    const defaultTheme = this.themeRepo.getDefaultTheme();

    this.state = {
      mode: 'IDLE',
      isFrozen: false,
      isVisible: true,
      activeThemeId: defaultTheme?.id || 'theme-sanctuary-gold',
      previewSlide: null,
      liveSlide: null,
      currentProgramId: null,
      currentProgramItemIndex: null,
      lastUpdatedTimestamp: Date.now(),
    };
  }

  getState(): PresentationStateDto {
    return { ...this.state };
  }

  private broadcastState(): void {
    this.state.lastUpdatedTimestamp = Date.now();
    const payload = this.getState();

    const windows = [
      getControlStudioWindow(),
      getAudienceDisplayWindow(),
      getStageDisplayWindow(),
    ].filter((w): w is BrowserWindow => w !== null && !w.isDestroyed());

    for (const win of windows) {
      win.webContents.send('presentation:state-changed', payload);
    }
  }

  previewReference(req: PreviewReferenceRequest): PresentationActionResponse {
    try {
      let chapterData = this.bibleRepo.getChapter(req.versionId, req.bookId, req.chapterNumber);
      if (!chapterData) {
        // Fallback: match book by order, name, or abbreviation within target versionId
        const books = this.bibleRepo.getBooks(req.versionId);
        const matchedBook = books.find(
          (b) =>
            b.id.toLowerCase() === req.bookId.toLowerCase() ||
            (req.bookName && b.name.toLowerCase() === req.bookName.toLowerCase()) ||
            (req.bookName && b.abbreviation.toLowerCase() === req.bookName.toLowerCase())
        );
        if (matchedBook) {
          chapterData = this.bibleRepo.getChapter(req.versionId, matchedBook.id, req.chapterNumber);
        }
      }
      if (!chapterData) {
        return { success: false, newState: this.state, error: 'Chapter not found' };
      }

      const end = req.endVerse || req.startVerse;
      const verses = chapterData.verses.filter(
        (v) => v.verseNumber >= req.startVerse && v.verseNumber <= end
      );

      if (verses.length === 0) {
        return { success: false, newState: this.state, error: 'Verses not found' };
      }

      const version = this.bibleRepo.getVersions().find((v) => v.id === req.versionId);
      const abbr = version?.abbreviation || 'KJV';
      const refDisplay = `${chapterData.book.name} ${req.chapterNumber}:${req.startVerse}${
        end > req.startVerse ? `-${end}` : ''
      }`;

      let multiVersionSlots: MultiVersionSlot[] | undefined = undefined;
      let displayAbbr = abbr;

      if (req.secondaryVersionId && req.secondaryVersionId !== req.versionId) {
        const secVersion = this.bibleRepo.getVersions().find((v) => v.id === req.secondaryVersionId);
        const secBooks = this.bibleRepo.getBooks(req.secondaryVersionId);
        const secBook = secBooks.find(
          (b) =>
            b.abbreviation.toLowerCase() === chapterData.book.abbreviation.toLowerCase() ||
            b.bookOrder === chapterData.book.bookOrder
        );

        if (secBook) {
          const secChapter = this.bibleRepo.getChapter(req.secondaryVersionId, secBook.id, req.chapterNumber);
          if (secChapter) {
            const secVerses = secChapter.verses.filter(
              (v) => v.verseNumber >= req.startVerse && v.verseNumber <= end
            );
            if (secVerses.length > 0) {
              const secAbbr = secVersion?.abbreviation || 'TEL';
              displayAbbr = `${abbr} / ${secAbbr}`;
              multiVersionSlots = [
                {
                  versionAbbreviation: abbr,
                  versionName: version?.name || abbr,
                  text: verses.map((v) => (verses.length > 1 ? `(${v.verseNumber}) ` : '') + v.verseText).join(' '),
                },
                {
                  versionAbbreviation: secAbbr,
                  versionName: secVersion?.name || secAbbr,
                  text: secVerses.map((v) => (secVerses.length > 1 ? `(${v.verseNumber}) ` : '') + v.verseText).join(' '),
                },
              ];
            }
          }
        }
      }

      const scriptureRef: ScriptureReference = {
        versionId: req.versionId,
        secondaryVersionId: req.secondaryVersionId,
        bookId: chapterData.book.id,
        bookName: chapterData.book.name,
        chapterNumber: req.chapterNumber,
        startVerse: req.startVerse,
        endVerse: end,
      };

      this.stagedReference = scriptureRef;

      const slide: SlideContentDto = {
        id: `slide_${Date.now()}`,
        referenceDisplay: refDisplay,
        versionAbbreviation: displayAbbr,
        verses: verses.map((v) => ({ verseNumber: v.verseNumber, text: v.verseText })),
        multiVersionSlots,
        reference: scriptureRef,
      };

      this.state.previewSlide = slide;
      if (req.themeId) {
        this.state.activeThemeId = req.themeId;
      }
      if (this.state.mode === 'IDLE') {
        this.state.mode = 'PREVIEW';
      }

      this.broadcastState();
      return { success: true, newState: this.state };
    } catch (err) {
      logger.error('Error previewing reference', err);
      return { success: false, newState: this.state, error: String(err) };
    }
  }

  takeLive(_req?: TakeLiveRequest): PresentationActionResponse {
    if (!this.state.previewSlide) {
      return { success: false, newState: this.state, error: 'No preview slide staged' };
    }

    this.state.liveSlide = { ...this.state.previewSlide };
    this.state.mode = 'LIVE';
    this.state.isFrozen = false;
    this.state.isVisible = true;
    this.liveReference = this.state.liveSlide.reference || this.stagedReference;

    // Ensure audience display window is opened on projector or preview display
    try {
      const audienceWin = getAudienceDisplayWindow();
      if (!audienceWin || audienceWin.isDestroyed()) {
        openOutputWindows();
      } else {
        audienceWin.show();
      }
      broadcastOutputStatus();
    } catch (winErr) {
      logger.warn('Failed to automatically open output window:', winErr);
    }

    // Persist to presentation history with actual scripture reference
    try {
      const activeRef = this.liveReference;
      const translationId = activeRef?.versionId || 'kjv';
      const bookName = activeRef?.bookName || 'Scripture';
      const displayTitle = this.state.liveSlide.referenceDisplay || `${bookName} ${activeRef?.chapterNumber || 1}:${activeRef?.startVerse || 1}`;

      this.historyRepo.addEntry({
        id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        reference: {
          versionId: translationId,
          secondaryVersionId: activeRef?.secondaryVersionId,
          bookId: activeRef?.bookId || 'kjv_gen',
          bookName: bookName,
          chapterNumber: activeRef?.chapterNumber || 1,
          startVerse: activeRef?.startVerse || 1,
          endVerse: activeRef?.endVerse,
        },
        formattedDisplay: displayTitle,
        translationId: translationId,
        translationAbbr: this.state.liveSlide.versionAbbreviation,
        themeId: this.state.activeThemeId,
        presentedAt: new Date().toISOString(),
      });
    } catch (err) {
      logger.warn('Failed to record presentation history', err);
    }

    this.broadcastState();
    return { success: true, newState: this.state };
  }

  freeze(): PresentationActionResponse {
    this.state.isFrozen = true;
    this.state.mode = 'FROZEN';
    this.broadcastState();
    return { success: true, newState: this.state };
  }

  unfreeze(): PresentationActionResponse {
    this.state.isFrozen = false;
    this.state.mode = this.state.liveSlide ? 'LIVE' : 'IDLE';
    this.broadcastState();
    return { success: true, newState: this.state };
  }

  hide(): PresentationActionResponse {
    this.state.isVisible = false;
    this.state.mode = 'HIDDEN';
    this.broadcastState();
    return { success: true, newState: this.state };
  }

  unhide(): PresentationActionResponse {
    this.state.isVisible = true;
    this.state.mode = this.state.liveSlide ? 'LIVE' : 'IDLE';
    this.broadcastState();
    return { success: true, newState: this.state };
  }

  clear(): PresentationActionResponse {
    this.state.liveSlide = null;
    this.state.previewSlide = null;
    this.state.mode = 'IDLE';
    this.state.isFrozen = false;
    this.state.isVisible = true;
    this.liveReference = null;
    this.stagedReference = null;

    try {
      closeAudienceDisplayWindow();
    } catch (e) {
      logger.warn('Failed to close audience display window on clear:', e);
    }

    this.broadcastState();
    return { success: true, newState: this.state };
  }

  stopLive(): PresentationActionResponse {
    this.state.liveSlide = null;
    this.state.mode = this.state.previewSlide ? 'PREVIEW' : 'IDLE';
    this.state.isFrozen = false;
    this.liveReference = null;

    try {
      closeAudienceDisplayWindow();
    } catch (e) {
      logger.warn('Failed to close audience display window on stopLive:', e);
    }

    this.broadcastState();
    return { success: true, newState: this.state };
  }

  setTheme(themeId: string): PresentationActionResponse {
    this.state.activeThemeId = themeId;
    this.broadcastState();
    return { success: true, newState: this.state };
  }

  next(): PresentationActionResponse {
    try {
      if (!this.state.previewSlide && !this.state.liveSlide) {
        return { success: false, newState: this.state, error: 'No active slide presented or previewed' };
      }

      const activeRef =
        this.state.previewSlide?.reference ||
        this.state.liveSlide?.reference ||
        this.stagedReference ||
        this.liveReference;

      if (!activeRef) {
        return { success: false, newState: this.state, error: 'No scripture active' };
      }

      const versionId = activeRef.versionId || 'kjv';
      const secondaryVersionId = activeRef.secondaryVersionId;
      const currentChapter = activeRef.chapterNumber || 1;
      const currentVerse = activeRef.endVerse || activeRef.startVerse || 1;

      const chapterData = this.bibleRepo.getChapter(versionId, activeRef.bookId, currentChapter);
      if (!chapterData || chapterData.verses.length === 0) {
        return { success: false, newState: this.state, error: 'Chapter not found' };
      }

      const maxVerse = Math.max(...chapterData.verses.map((v) => v.verseNumber));

      let targetBookId = activeRef.bookId;
      let targetChapter = currentChapter;
      let targetVerse = currentVerse + 1;

      if (targetVerse > maxVerse) {
        // Advance to next chapter
        if (currentChapter < (chapterData.book.chapterCount || 1)) {
          targetChapter = currentChapter + 1;
          targetVerse = 1;
        } else {
          // Reached end of book, advance to next book
          const allBooks = this.bibleRepo.getBooks(versionId);
          const idx = allBooks.findIndex(
            (b) =>
              b.id.toLowerCase() === activeRef.bookId.toLowerCase() ||
              b.abbreviation.toLowerCase() === chapterData.book.abbreviation.toLowerCase()
          );
          if (idx >= 0 && idx < allBooks.length - 1) {
            targetBookId = allBooks[idx + 1]!.id;
            targetChapter = 1;
            targetVerse = 1;
          } else {
            // Reached Revelation 22:21
            return { success: true, newState: this.state };
          }
        }
      }

      const res = this.previewReference({
        versionId,
        secondaryVersionId,
        bookId: targetBookId,
        chapterNumber: targetChapter,
        startVerse: targetVerse,
        themeId: this.state.activeThemeId,
      });

      // If currently LIVE or has liveSlide, take new verse live immediately!
      if (this.state.mode === 'LIVE' || this.state.liveSlide) {
        return this.takeLive();
      }

      return res;
    } catch (err) {
      logger.error('Error navigating to next verse:', err);
      return { success: false, newState: this.state, error: String(err) };
    }
  }

  prev(): PresentationActionResponse {
    try {
      if (!this.state.previewSlide && !this.state.liveSlide) {
        return { success: false, newState: this.state, error: 'No active slide presented or previewed' };
      }

      const activeRef =
        this.state.previewSlide?.reference ||
        this.state.liveSlide?.reference ||
        this.stagedReference ||
        this.liveReference;

      if (!activeRef) {
        return { success: false, newState: this.state, error: 'No scripture active' };
      }

      const versionId = activeRef.versionId || 'kjv';
      const secondaryVersionId = activeRef.secondaryVersionId;
      const currentChapter = activeRef.chapterNumber || 1;
      const currentVerse = activeRef.startVerse || 1;

      let targetBookId = activeRef.bookId;
      let targetChapter = currentChapter;
      let targetVerse = currentVerse - 1;

      if (targetVerse < 1) {
        // Move to previous chapter
        if (currentChapter > 1) {
          targetChapter = currentChapter - 1;
          const prevChData = this.bibleRepo.getChapter(versionId, targetBookId, targetChapter);
          if (prevChData && prevChData.verses.length > 0) {
            targetVerse = Math.max(...prevChData.verses.map((v) => v.verseNumber));
          } else {
            targetVerse = 1;
          }
        } else {
          // Beginning of book, check previous book
          const allBooks = this.bibleRepo.getBooks(versionId);
          const idx = allBooks.findIndex((b) => b.id.toLowerCase() === activeRef.bookId.toLowerCase());
          if (idx > 0) {
            const prevBook = allBooks[idx - 1]!;
            targetBookId = prevBook.id;
            targetChapter = prevBook.chapterCount || 1;
            const prevBookChData = this.bibleRepo.getChapter(versionId, targetBookId, targetChapter);
            if (prevBookChData && prevBookChData.verses.length > 0) {
              targetVerse = Math.max(...prevBookChData.verses.map((v) => v.verseNumber));
            } else {
              targetVerse = 1;
            }
          } else {
            // At Genesis 1:1
            return { success: true, newState: this.state };
          }
        }
      }

      const res = this.previewReference({
        versionId,
        secondaryVersionId,
        bookId: targetBookId,
        chapterNumber: targetChapter,
        startVerse: targetVerse,
        themeId: this.state.activeThemeId,
      });

      // If currently LIVE or has liveSlide, take new verse live immediately!
      if (this.state.mode === 'LIVE' || this.state.liveSlide) {
        return this.takeLive();
      }

      return res;
    } catch (err) {
      logger.error('Error navigating to prev verse:', err);
      return { success: false, newState: this.state, error: String(err) };
    }
  }
}

export function registerPresentationIpcHandlers(controller: PresentationController): void {
  ipcMain.handle('presentation:get-state', () => controller.getState());
  ipcMain.handle('presentation:preview-reference', (_e, req: PreviewReferenceRequest) =>
    controller.previewReference(req)
  );
  ipcMain.handle('presentation:take-live', (_e, req?: TakeLiveRequest) => controller.takeLive(req));
  ipcMain.handle('presentation:freeze', () => controller.freeze());
  ipcMain.handle('presentation:unfreeze', () => controller.unfreeze());
  ipcMain.handle('presentation:hide', () => controller.hide());
  ipcMain.handle('presentation:unhide', () => controller.unhide());
  ipcMain.handle('presentation:clear', () => controller.clear());
  ipcMain.handle('presentation:stop-live', () => controller.stopLive());
  ipcMain.handle('presentation:set-theme', (_e, themeId: string) => controller.setTheme(themeId));
  ipcMain.handle('presentation:next', () => controller.next());
  ipcMain.handle('presentation:prev', () => controller.prev());
}

