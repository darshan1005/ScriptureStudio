import {
  PresentationActionResponse,
  PresentationMode,
  PresentationStateDto,
  SlideContentDto,
  TakeLiveRequest,
} from '@scripture-studio/shared-types';
import { createLogger } from '@scripture-studio/logger';

const logger = createLogger('PurePresentationController');

export class DomainPresentationController {
  private state: PresentationStateDto;
  private listeners: Array<(state: PresentationStateDto) => void> = [];
  private commandQueue: Promise<unknown> = Promise.resolve();

  constructor(initialThemeId = 'theme-sanctuary-gold') {
    this.state = {
      mode: 'IDLE',
      isFrozen: false,
      isVisible: true,
      activeThemeId: initialThemeId,
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

  subscribe(listener: (state: PresentationStateDto) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.state.lastUpdatedTimestamp = Date.now();
    const snapshot = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch (err) {
        logger.error('Error notifying state listener', err);
      }
    }
  }

  /**
   * Enqueue a command to execute sequentially in FIFO order.
   */
  enqueue<T>(command: () => T): Promise<T> {
    const nextPromise = this.commandQueue.then(() => command());
    this.commandQueue = nextPromise.catch(() => {});
    return nextPromise;
  }

  setPreviewSlide(slide: SlideContentDto): PresentationActionResponse {
    this.state.previewSlide = { ...slide };
    if (this.state.mode === 'IDLE') {
      this.state.mode = 'PREVIEW';
    }
    this.notify();
    return { success: true, newState: this.getState() };
  }

  takeLive(_req?: TakeLiveRequest): PresentationActionResponse {
    if (!this.state.previewSlide) {
      return { success: false, newState: this.getState(), error: 'No preview slide staged' };
    }

    this.state.liveSlide = { ...this.state.previewSlide };
    this.state.mode = 'LIVE';
    this.state.isFrozen = false;
    this.state.isVisible = true;
    this.notify();
    return { success: true, newState: this.getState() };
  }

  freeze(): PresentationActionResponse {
    this.state.isFrozen = true;
    this.state.mode = 'FROZEN';
    this.notify();
    return { success: true, newState: this.getState() };
  }

  unfreeze(): PresentationActionResponse {
    this.state.isFrozen = false;
    this.state.mode = this.state.liveSlide ? 'LIVE' : 'IDLE';
    this.notify();
    return { success: true, newState: this.getState() };
  }

  hide(): PresentationActionResponse {
    this.state.isVisible = false;
    this.state.mode = 'HIDDEN';
    this.notify();
    return { success: true, newState: this.getState() };
  }

  unhide(): PresentationActionResponse {
    this.state.isVisible = true;
    this.state.mode = this.state.liveSlide ? 'LIVE' : 'IDLE';
    this.notify();
    return { success: true, newState: this.getState() };
  }

  clear(): PresentationActionResponse {
    this.state.liveSlide = null;
    this.state.mode = 'IDLE';
    this.state.isFrozen = false;
    this.state.isVisible = true;
    this.notify();
    return { success: true, newState: this.getState() };
  }

  setActiveTheme(themeId: string): void {
    this.state.activeThemeId = themeId;
    this.notify();
  }
}

