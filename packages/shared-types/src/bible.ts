export type BibleDirection = 'ltr' | 'rtl';

export type BibleTestament = 'OT' | 'NT';

export interface BibleVersionDto {
  id: string;
  name: string;
  abbreviation: string;
  languageCode: string;
  direction: BibleDirection;
  licenseType: string;
  copyrightNotice?: string;
  attributionUrl?: string;
  isActive: boolean;
  installedAt: string;
}

export interface BibleBookDto {
  id: string;
  versionId: string;
  bookOrder: number;
  testament: BibleTestament;
  name: string;
  abbreviation: string;
  chapterCount: number;
}

export interface BibleChapterDto {
  id: string;
  versionId: string;
  bookId: string;
  chapterNumber: number;
  verseCount: number;
}

export interface BibleVerseDto {
  id: string;
  versionId: string;
  bookId: string;
  chapterNumber: number;
  verseNumber: number;
  verseText: string;
}

export interface ScriptureReference {
  versionId?: string;
  secondaryVersionId?: string;
  bookId: string;
  bookName?: string;
  chapterNumber: number;
  startVerse: number;
  endVerse?: number;
}

export interface ParsedReferenceResult {
  isValid: boolean;
  reference?: ScriptureReference;
  formattedDisplay?: string;
  error?: string;
}

