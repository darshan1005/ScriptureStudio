import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { DiskExporter } from '../../packages/streaming-engine/src/disk-exporter.js';
import { SlideContentDto } from '../../packages/shared-types/src/index.js';

describe('DiskExporter Zero-Contention Live Export', () => {
  let tempDir: string;
  let exporter: DiskExporter;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scripture-studio-export-test-'));
    exporter = new DiskExporter(tempDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('exports structured XML and text files atomically when slide is taken live', () => {
    const mockSlide: SlideContentDto = {
      id: 'test_1',
      referenceDisplay: 'Romans 8:28',
      versionAbbreviation: 'KJV',
      verses: [
        {
          verseNumber: 28,
          text: 'And we know that all things work together for good...',
        },
      ],
    };

    exporter.exportSlide(mockSlide);

    const xmlPath = path.join(tempDir, 'current_verse.xml');
    const textPath = path.join(tempDir, 'current_verse.txt');

    expect(fs.existsSync(xmlPath)).toBe(true);
    expect(fs.existsSync(textPath)).toBe(true);

    const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
    const textContent = fs.readFileSync(textPath, 'utf-8');

    expect(xmlContent).toContain('<reference>Romans 8:28</reference>');
    expect(xmlContent).toContain('<version>KJV</version>');
    expect(xmlContent).toContain('<active>1</active>');
    expect(textContent).toContain('Romans 8:28 (KJV)');
  });

  it('clears export output files when clear/null is dispatched', () => {
    exporter.exportSlide(null);

    const xmlPath = path.join(tempDir, 'current_verse.xml');
    expect(fs.existsSync(xmlPath)).toBe(true);

    const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
    expect(xmlContent).toContain('<active>0</active>');
  });
});

