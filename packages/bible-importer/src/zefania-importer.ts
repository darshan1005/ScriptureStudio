import fs from 'fs';
import { BibleRepository, DatabaseClient } from '@scripture-studio/database';
import { createLogger } from '@scripture-studio/logger';
import { BibleBookDto, BibleVerseDto, BibleVersionDto } from '@scripture-studio/shared-types';

const logger = createLogger('ZefaniaBibleImporter');

export function importBibleFromZefaniaXml(
  filePath: string,
  dbClient: DatabaseClient
): { success: boolean; versionId: string; verseCount: number; error?: string } {
  logger.info(`Importing Zefania XML Bible from: ${filePath}`);

  try {
    const xml = fs.readFileSync(filePath, 'utf-8');
    const repo = new BibleRepository(dbClient.rawDb);

    // Extract title & abbreviation
    const titleMatch = xml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : 'Imported Translation';

    const idMatch = xml.match(/<identifier[^>]*>([\s\S]*?)<\/identifier>/i);
    const abbr = idMatch && idMatch[1] ? idMatch[1].trim() : 'IMP';

    const versionId = abbr.toLowerCase();

    const versionDto: BibleVersionDto = {
      id: versionId,
      name: title,
      abbreviation: abbr,
      languageCode: 'en',
      direction: 'ltr',
      licenseType: 'Public Domain',
      copyrightNotice: `${title} (Zefania XML)`,
      isActive: true,
      installedAt: new Date().toISOString(),
    };

    const books: BibleBookDto[] = [];
    const verses: BibleVerseDto[] = [];

    // Parse BIBLEBOOK tags
    const bookRegex = /<biblebook\s+bnumber="(\d+)"(?:\s+bname="([^"]*)")?[^>]*>([\s\S]*?)<\/biblebook>/gi;
    let bMatch: RegExpExecArray | null;

    while ((bMatch = bookRegex.exec(xml)) !== null) {
      const bnum = parseInt(bMatch[1]!, 10);
      const bname = bMatch[2] || `Book ${bnum}`;
      const bookContent = bMatch[3]!;
      const bookId = `${versionId}_b${bnum}`;

      let maxChapter = 1;

      // Parse CHAPTER tags
      const chapterRegex = /<chapter\s+cnumber="(\d+)"[^>]*>([\s\S]*?)<\/chapter>/gi;
      let cMatch: RegExpExecArray | null;

      while ((cMatch = chapterRegex.exec(bookContent)) !== null) {
        const cnum = parseInt(cMatch[1]!, 10);
        if (cnum > maxChapter) maxChapter = cnum;
        const chapterContent = cMatch[2]!;

        // Parse VERS tags
        const versRegex = /<vers\s+vnumber="(\d+)"[^>]*>([\s\S]*?)<\/vers>/gi;
        let vMatch: RegExpExecArray | null;

        while ((vMatch = versRegex.exec(chapterContent)) !== null) {
          const vnum = parseInt(vMatch[1]!, 10);
          const vtext = vMatch[2]!.replace(/<[^>]+>/g, '').trim();

          verses.push({
            id: `${bookId}_${cnum}_${vnum}`,
            versionId,
            bookId,
            chapterNumber: cnum,
            verseNumber: vnum,
            verseText: vtext,
          });
        }
      }

      books.push({
        id: bookId,
        versionId,
        bookOrder: bnum,
        testament: bnum <= 39 ? 'OT' : 'NT',
        name: bname,
        abbreviation: bname.substring(0, 4),
        chapterCount: maxChapter,
      });
    }

    if (verses.length === 0) {
      throw new Error('No verses found in Zefania XML file.');
    }

    repo.insertVersion(versionDto);
    repo.insertBooks(books);
    repo.insertVersesBatch(verses);

    logger.info(`Successfully imported Zefania XML Bible: ${title} (${verses.length} verses)`);
    return { success: true, versionId, verseCount: verses.length };
  } catch (err) {
    logger.error('Error importing Zefania XML:', err);
    return { success: false, versionId: '', verseCount: 0, error: String(err) };
  }
}

