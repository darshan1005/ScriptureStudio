import { BibleRepository, DatabaseClient } from '@scripture-studio/database';
import { createLogger } from '@scripture-studio/logger';
import { BibleBookDto, BibleVerseDto, BibleVersionDto } from '@scripture-studio/shared-types';

const logger = createLogger('BibleDownloader');

export interface DownloadableTranslationInfo {
  code: string;
  name: string;
  language: string;
  direction: 'ltr' | 'rtl';
  license: string;
}

export const AVAILABLE_ONLINE_TRANSLATIONS: DownloadableTranslationInfo[] = [
  { code: 'KJV', name: 'King James Version (1611/1769)', language: 'English', direction: 'ltr', license: 'Public Domain' },
  { code: 'WEB', name: 'World English Bible', language: 'English', direction: 'ltr', license: 'Public Domain' },
  { code: 'ASV', name: 'American Standard Version (1901)', language: 'English', direction: 'ltr', license: 'Public Domain' },
  { code: 'YLT', name: "Young's Literal Translation", language: 'English', direction: 'ltr', license: 'Public Domain' },
  { code: 'VDC', name: 'Dumitru Cornilescu (1924)', language: 'Romanian', direction: 'ltr', license: 'Public Domain' },
  { code: 'RV09', name: 'Reina Valera (1909)', language: 'Spanish', direction: 'ltr', license: 'Public Domain' },
  { code: 'LS1910', name: 'Louis Segond (1910)', language: 'French', direction: 'ltr', license: 'Public Domain' },
  { code: 'LUT', name: 'Luther Bibel (1912)', language: 'German', direction: 'ltr', license: 'Public Domain' },
  { code: 'ALM', name: 'João Ferreira de Almeida', language: 'Portuguese', direction: 'ltr', license: 'Public Domain' },
  { code: 'HIN', name: 'Hindi Holy Bible (ERV)', language: 'Hindi', direction: 'ltr', license: 'Open License' },
  { code: 'TEL', name: 'Telugu Holy Bible (BSI/ERV)', language: 'Telugu', direction: 'ltr', license: 'Open License' },
  { code: 'TAM', name: 'Tamil Holy Bible', language: 'Tamil', direction: 'ltr', license: 'Open License' },
  { code: 'WLC', name: 'Westminster Leningrad Codex (OT)', language: 'Hebrew', direction: 'rtl', license: 'Public Domain' },
  { code: 'TR', name: 'Textus Receptus (NT)', language: 'Greek', direction: 'ltr', license: 'Public Domain' },
];

export async function downloadAndInstallTranslation(
  versionCode: string,
  dbClient: DatabaseClient
): Promise<{ success: boolean; versionId: string; verseCount: number; error?: string }> {
  const versionId = versionCode.toLowerCase();
  const info = AVAILABLE_ONLINE_TRANSLATIONS.find((t) => t.code.toUpperCase() === versionCode.toUpperCase());
  const repo = new BibleRepository(dbClient.rawDb);

  logger.info(`Starting download for translation ${versionCode} (${info?.name || versionCode})...`);

  try {
    // Fetch translation dataset from open public API (bolls.life JSON repository)
    const url = `https://bolls.life/static/translations/${versionCode.toUpperCase()}.json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download translation ${versionCode}: HTTP ${response.status}`);
    }

    const rawData = (await response.json()) as Array<{
      book: number;
      chapter: number;
      verse: number;
      text: string;
    }>;

    logger.info(`Downloaded ${rawData.length} verses for ${versionCode}. Importing into local SQLite...`);

    const versionDto: BibleVersionDto = {
      id: versionId,
      name: info ? info.name : versionCode,
      abbreviation: versionCode.toUpperCase(),
      languageCode: info ? info.language.substring(0, 2).toLowerCase() : 'en',
      direction: info ? info.direction : 'ltr',
      licenseType: info ? info.license : 'Public Domain',
      copyrightNotice: `${info?.name || versionCode} — ${info?.license || 'Public Domain'}`,
      attributionUrl: 'https://bolls.life',
      isActive: true,
      installedAt: new Date().toISOString(),
    };

    // Group verses by book and chapter
    const booksMap = new Map<number, { count: number; maxChapter: number }>();
    for (const item of rawData) {
      const existing = booksMap.get(item.book);
      if (!existing) {
        booksMap.set(item.book, { count: 1, maxChapter: item.chapter });
      } else {
        existing.count++;
        if (item.chapter > existing.maxChapter) {
          existing.maxChapter = item.chapter;
        }
      }
    }

    const books: BibleBookDto[] = [];
    for (const [bookOrder, data] of booksMap.entries()) {
      books.push({
        id: `${versionId}_b${bookOrder}`,
        versionId,
        bookOrder,
        testament: bookOrder <= 39 ? 'OT' : 'NT',
        name: `Book ${bookOrder}`,
        abbreviation: `B${bookOrder}`,
        chapterCount: data.maxChapter,
      });
    }

    const verses: BibleVerseDto[] = rawData.map((v) => ({
      id: `${versionId}_${v.book}_${v.chapter}_${v.verse}`,
      versionId,
      bookId: `${versionId}_b${v.book}`,
      chapterNumber: v.chapter,
      verseNumber: v.verse,
      verseText: v.text,
    }));

    // Atomically insert into SQLite
    repo.insertVersion(versionDto);
    repo.insertBooks(books);
    repo.insertVersesBatch(verses);

    logger.info(`Successfully imported ${versionCode} (${verses.length} verses) for 100% offline use.`);
    return { success: true, versionId, verseCount: verses.length };
  } catch (err) {
    logger.error(`Failed to download and install translation ${versionCode}:`, err);
    return { success: false, versionId, verseCount: 0, error: String(err) };
  }
}

