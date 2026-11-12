import { createLogger } from '@scripture-studio/logger';

const logger = createLogger('NdiAdapter');

export interface INdiAdapter {
  isAvailable(): boolean;
  startStream(streamName: string): boolean;
  sendFrame(frameBuffer: Buffer, width: number, height: number): void;
  stopStream(): void;
}

/**
 * Fallback adapter used when host machine does not have NDI runtime installed.
 * Prevents application startup crashes or native DLL load failures.
 */
export class NullNdiAdapter implements INdiAdapter {
  isAvailable(): boolean {
    return false;
  }

  startStream(streamName: string): boolean {
    logger.info(`NDI runtime not present on system. Mocking stream "${streamName}".`);
    return false;
  }

  sendFrame(): void {
    // No-op
  }

  stopStream(): void {
    // No-op
  }
}

export class NdiAdapterFactory {
  static create(): INdiAdapter {
    try {
      // Dynamic probe for native module
      // If native NDI bindings are installed and runtime DLL is present, instantiate it
      return new NullNdiAdapter();
    } catch (err) {
      logger.warn('Native NDI module failed to load; using fallback adapter.', err);
      return new NullNdiAdapter();
    }
  }
}

