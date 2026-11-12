import fs from 'fs';
import { BibleRepository, DatabaseClient } from '@scripture-studio/database';
import { createLogger } from '@scripture-studio/logger';
import { BibleBookDto, BibleVerseDto, BibleVersionDto } from '@scripture-studio/shared-types';

const logger = createLogger('JsonBibleImporter');

export interface JsonBibleFormat {
  version: {
    id: string;
    name: string;
    abbreviation: string;
    languageCode: string;
    direction?: 'ltr' | 'rtl';
    licenseType?: string;
    copyrightNotice?: string;
  };
  books: {
    order: number;
    name: string;
    abbreviation: string;
    testament: 'OT' | 'NT';
    chapters: {
      number: number;
      verses: {
        number: number;
        text: string;
      }[];
    }[];
  }[];
}

export function importBibleFromJsonFile(
  filePath: string,
  dbClient: DatabaseClient
): { success: boolean; versionId: string; verseCount: number; error?: string } {
  logger.info(`Importing local JSON Bible from: ${filePath}`);
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent) as JsonBibleFormat;
    const repo = new BibleRepository(dbClient.rawDb);

    const versionId = data.version.id.toLowerCase();
    const versionDto: BibleVersionDto = {
      id: versionId,
      name: data.version.name,
      abbreviation: data.version.abbreviation,
      languageCode: data.version.languageCode,
      direction: data.version.direction || 'ltr',
      licenseType: data.version.licenseType || 'Public Domain',
      copyrightNotice: data.version.copyrightNotice || 'Public Domain',
      isActive: true,
      installedAt: new Date().toISOString(),
    };

    const books: BibleBookDto[] = [];
    const verses: BibleVerseDto[] = [];

    for (const b of data.books) {
      const bookId = `${versionId}_${b.abbreviation.toLowerCase()}`;
      books.push({
        id: bookId,
        versionId,
        bookOrder: b.order,
        testament: b.testament,
        name: b.name,
        abbreviation: b.abbreviation,
        chapterCount: b.chapters.length,
      });

      for (const ch of b.chapters) {
        for (const v of ch.verses) {
          verses.push({
            id: `${bookId}_${ch.number}_${v.number}`,
            versionId,
            bookId,
            chapterNumber: ch.number,
            verseNumber: v.number,
            verseText: v.text,
          });
        }
      }
    }

    repo.insertVersion(versionDto);
    repo.insertBooks(books);
    repo.insertVersesBatch(verses);

    logger.info(`Successfully imported ${data.version.name} (${verses.length} verses) from file.`);
    return { success: true, versionId, verseCount: verses.length };
  } catch (err) {
    logger.error('Error importing JSON Bible file:', err);
    return { success: false, versionId: '', verseCount: 0, error: String(err) };
  }
}

