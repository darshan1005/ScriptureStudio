import fs from 'fs';
import path from 'path';
import { SlideContentDto } from '@scripture-studio/shared-types';
import { createLogger } from '@scripture-studio/logger';

const logger = createLogger('DiskExporter');

export class DiskExporter {
  private outputDirectory: string;

  constructor(outputDirectory: string) {
    this.outputDirectory = outputDirectory;
    this.ensureDirectoryExists();
  }

  setDirectory(newDir: string): void {
    this.outputDirectory = newDir;
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (this.outputDirectory && !fs.existsSync(this.outputDirectory)) {
      try {
        fs.mkdirSync(this.outputDirectory, { recursive: true });
        logger.info(`Created live disk export directory: ${this.outputDirectory}`);
      } catch (err) {
        logger.error(`Failed to create export directory: ${this.outputDirectory}`, err);
      }
    }
  }

  /**
   * Performs an atomic file write using temp file rename to prevent
   * file locking collisions when vMix or OBS reads the file during updates.
   */
  private atomicWrite(targetPath: string, content: string | Buffer): void {
    const tempPath = `${targetPath}.tmp.${Date.now()}`;
    try {
      fs.writeFileSync(tempPath, content);
      fs.renameSync(tempPath, targetPath); // Atomic file replace
    } catch (err) {
      logger.error(`Error during atomic write to ${targetPath}`, err);
      if (fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch {
          // ignore cleanup error
        }
      }
    }
  }

  exportSlide(slide: SlideContentDto | null): void {
    if (!this.outputDirectory || !fs.existsSync(this.outputDirectory)) {
      return;
    }

    const xmlPath = path.join(this.outputDirectory, 'current_verse.xml');
    const textPath = path.join(this.outputDirectory, 'current_verse.txt');

    if (!slide) {
      // Clear files on idle / hide
      this.atomicWrite(xmlPath, '<?xml version="1.0" encoding="UTF-8"?><scripture><reference></reference><text></text><active>0</active></scripture>');
      this.atomicWrite(textPath, '');
      return;
    }

    const textContent = slide.verses.map((v) => v.text).join(' ');

    // 1. Export Clean Text File (for OBS Text Sources)
    const formattedText = `${slide.referenceDisplay} (${slide.versionAbbreviation})\n${textContent}`;
    this.atomicWrite(textPath, formattedText);

    // 2. Export Structured XML File (for vMix Data Sources / Titlers)
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<scripture>
  <reference>${this.escapeXml(slide.referenceDisplay)}</reference>
  <version>${this.escapeXml(slide.versionAbbreviation)}</version>
  <text>${this.escapeXml(textContent)}</text>
  <active>1</active>
</scripture>`;

    this.atomicWrite(xmlPath, xmlContent);
    logger.debug(`Exported live slide to ${xmlPath} and ${textPath}`);
  }

  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

