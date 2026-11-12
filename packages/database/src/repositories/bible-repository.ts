import Database from 'better-sqlite3';
import {
  BibleBookDto,
  BibleChapterDto,
  BibleVerseDto,
  BibleVersionDto,
} from '@scripture-studio/shared-types';

export class BibleRepository {
  constructor(private db: Database.Database) {}

  getVersions(): BibleVersionDto[] {
    const rows = this.db.prepare(`
      SELECT id, name, abbreviation, language_code, direction, license_type, copyright_notice, attribution_url, is_active, installed_at
      FROM bible_versions
      ORDER BY name ASC
    `).all() as any[];

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      abbreviation: r.abbreviation,
      languageCode: r.language_code,
      direction: r.direction as 'ltr' | 'rtl',
      licenseType: r.license_type,
      copyrightNotice: r.copyright_notice || undefined,
      attributionUrl: r.attribution_url || undefined,
      isActive: Boolean(r.is_active),
      installedAt: r.installed_at,
    }));
  }

  getBooks(versionId: string): BibleBookDto[] {
    const rows = this.db.prepare(`
      SELECT id, version_id, book_order, testament, name, abbreviation, chapter_count
      FROM bible_books
      WHERE version_id = ?
      ORDER BY book_order ASC
    `).all(versionId) as any[];

    return rows.map((r) => ({
      id: r.id,
      versionId: r.version_id,
      bookOrder: r.book_order,
      testament: r.testament as 'OT' | 'NT',
      name: r.name,
      abbreviation: r.abbreviation,
      chapterCount: r.chapter_count,
    }));
  }

  getChapter(
    versionId: string,
    bookId: string,
    chapterNumber: number
  ): { book: BibleBookDto; chapter: BibleChapterDto; verses: BibleVerseDto[] } | null {
    const cleanAbbr = bookId.includes('_') ? bookId.split('_')[1]!.toLowerCase() : bookId.toLowerCase();
    const targetBookId = `${versionId.toLowerCase()}_${cleanAbbr}`;

    const bookRow = this.db.prepare(`
      SELECT id, version_id, book_order, testament, name, abbreviation, chapter_count
      FROM bible_books
      WHERE version_id = ? AND (id = ? OR id = ? OR LOWER(abbreviation) = ?)
    `).get(versionId, bookId, targetBookId, cleanAbbr) as any;

    if (!bookRow) return null;

    const versesRows = this.db.prepare(`
      SELECT id, version_id, book_id, chapter_number, verse_number, verse_text
      FROM bible_verses
      WHERE version_id = ? AND book_id = ? AND chapter_number = ?
      ORDER BY verse_number ASC
    `).all(versionId, bookRow.id, chapterNumber) as any[];

    const verses: BibleVerseDto[] = versesRows.map((v) => ({
      id: v.id,
      versionId: v.version_id,
      bookId: v.book_id,
      chapterNumber: v.chapter_number,
      verseNumber: v.verse_number,
      verseText: v.verse_text,
    }));

    const book: BibleBookDto = {
      id: bookRow.id,
      versionId: bookRow.version_id,
      bookOrder: bookRow.book_order,
      testament: bookRow.testament,
      name: bookRow.name,
      abbreviation: bookRow.abbreviation,
      chapterCount: bookRow.chapter_count,
    };

    const chapter: BibleChapterDto = {
      id: `${bookId}_${chapterNumber}`,
      versionId,
      bookId,
      chapterNumber,
      verseCount: verses.length,
    };

    return { book, chapter, verses };
  }

  getVerseRange(
    versionId: string,
    bookId: string,
    chapterNumber: number,
    startVerse: number,
    endVerse: number
  ): BibleVerseDto[] {
    const rows = this.db.prepare(`
      SELECT id, version_id, book_id, chapter_number, verse_number, verse_text
      FROM bible_verses
      WHERE version_id = ? AND book_id = ? AND chapter_number = ? AND verse_number BETWEEN ? AND ?
      ORDER BY verse_number ASC
    `).all(versionId, bookId, chapterNumber, startVerse, endVerse) as any[];

    return rows.map((v) => ({
      id: v.id,
      versionId: v.version_id,
      bookId: v.book_id,
      chapterNumber: v.chapter_number,
      verseNumber: v.verse_number,
      verseText: v.verse_text,
    }));
  }

  insertVersion(version: BibleVersionDto): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO bible_versions (id, name, abbreviation, language_code, direction, license_type, copyright_notice, attribution_url, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      version.id,
      version.name,
      version.abbreviation,
      version.languageCode,
      version.direction,
      version.licenseType,
      version.copyrightNotice || null,
      version.attributionUrl || null,
      version.isActive ? 1 : 0
    );
  }

  insertBooks(books: BibleBookDto[]): void {
    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO bible_books (id, version_id, book_order, testament, name, abbreviation, normalized_name, chapter_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((items: BibleBookDto[]) => {
      for (const b of items) {
        insert.run(
          b.id,
          b.versionId,
          b.bookOrder,
          b.testament,
          b.name,
          b.abbreviation,
          b.name.toLowerCase(),
          b.chapterCount
        );
      }
    });

    insertMany(books);
  }

  insertVersesBatch(verses: BibleVerseDto[]): void {
    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO bible_verses (id, version_id, book_id, chapter_number, verse_number, verse_text)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((items: BibleVerseDto[]) => {
      for (const v of items) {
        insert.run(v.id, v.versionId, v.bookId, v.chapterNumber, v.verseNumber, v.verseText);
      }
    });

    insertMany(verses);
  }

  deleteVersion(versionId: string): void {
    const delVerses = this.db.prepare('DELETE FROM bible_verses WHERE version_id = ?');
    const delChapters = this.db.prepare('DELETE FROM bible_chapters WHERE version_id = ?');
    const delBooks = this.db.prepare('DELETE FROM bible_books WHERE version_id = ?');
    const delVer = this.db.prepare('DELETE FROM bible_versions WHERE id = ?');

    const txn = this.db.transaction(() => {
      delVerses.run(versionId);
      delChapters.run(versionId);
      delBooks.run(versionId);
      delVer.run(versionId);
    });
    txn();
  }
}

