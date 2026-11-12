import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createLogger } from '@scripture-studio/logger';

const logger = createLogger('MediaAssetManager');

export interface MediaAssetMetadata {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  hash: string;
  assetUrl: string; // asset://<fileName>
}

const SUPPORTED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.mp4', '.webm']);

export class MediaAssetManager {
  private assetsDir: string;

  constructor(assetsDir: string) {
    this.assetsDir = assetsDir;
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.assetsDir)) {
      try {
        fs.mkdirSync(this.assetsDir, { recursive: true });
        logger.info(`Initialized media asset directory at: ${this.assetsDir}`);
      } catch (err) {
        logger.error(`Failed to create asset directory: ${this.assetsDir}`, err);
      }
    }
  }

  importAsset(sourcePath: string): MediaAssetMetadata {
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source asset file does not exist: ${sourcePath}`);
    }

    const ext = path.extname(sourcePath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      throw new Error(`Unsupported media extension: ${ext}. Supported: PNG, JPG, WebP, MP4, WebM.`);
    }

    const fileBuffer = fs.readFileSync(sourcePath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const assetId = `asset_${hash.substring(0, 16)}`;
    const destinationFileName = `${assetId}${ext}`;
    const destinationPath = path.join(this.assetsDir, destinationFileName);

    if (!fs.existsSync(destinationPath)) {
      fs.writeFileSync(destinationPath, fileBuffer);
      logger.info(`Imported media asset: ${destinationFileName} (${fileBuffer.length} bytes)`);
    }

    const mimeType = ext === '.mp4' ? 'video/mp4' : ext === '.webm' ? 'video/webm' : `image/${ext.replace('.', '')}`;

    return {
      id: assetId,
      fileName: destinationFileName,
      originalName: path.basename(sourcePath),
      mimeType,
      sizeBytes: fileBuffer.length,
      hash,
      assetUrl: `asset://${destinationFileName}`,
    };
  }

  getAssetPath(fileName: string): string | null {
    const fullPath = path.resolve(this.assetsDir, fileName);
    if (!fullPath.startsWith(path.resolve(this.assetsDir))) {
      logger.warn(`Security check: blocked path traversal attempt for ${fileName}`);
      return null;
    }
    return fs.existsSync(fullPath) ? fullPath : null;
  }
}

