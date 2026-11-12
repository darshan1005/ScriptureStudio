import { createLogger } from '@scripture-studio/logger';

const logger = createLogger('AutoPlayEngine');

export interface AutoPlayOptions {
  dwellSeconds: number;
  loop: boolean;
  onAdvance: () => boolean; // Returns false when at end of playlist
}

export class AutoPlayEngine {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private options: AutoPlayOptions | null = null;

  start(options: AutoPlayOptions): void {
    this.stop();
    this.options = options;
    this.isRunning = true;
    logger.info(`Starting AutoPlay with ${options.dwellSeconds}s interval (loop: ${options.loop})`);

    this.scheduleNext();
  }

  private scheduleNext(): void {
    if (!this.isRunning || !this.options) return;

    this.timer = setTimeout(() => {
      if (!this.isRunning || !this.options) return;

      const hasNext = this.options.onAdvance();
      if (!hasNext) {
        if (this.options.loop) {
          logger.debug('AutoPlay reached end; looping to start...');
          this.scheduleNext();
        } else {
          logger.info('AutoPlay completed playlist; stopping.');
          this.stop();
        }
      } else {
        this.scheduleNext();
      }
    }, this.options.dwellSeconds * 1000);
  }

  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    logger.debug('AutoPlay stopped.');
  }

  get active(): boolean {
    return this.isRunning;
  }
}

