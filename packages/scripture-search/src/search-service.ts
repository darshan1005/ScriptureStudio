import { DatabaseClient } from '@scripture-studio/database';
import { parseScriptureReference } from '@scripture-studio/bible-engine';
import {
  ParsedReferenceResult,
  SearchFullTextRequest,
  SearchFullTextResponse,
  SearchFullTextResultItem,
} from '@scripture-studio/shared-types';
import { createLogger } from '@scripture-studio/logger';

const logger = createLogger('ScriptureSearchService');

function getTermStem(term: string): string {
  const t = term.toLowerCase();
  if (t.endsWith('ness')) return t.slice(0, -4);
  if (t.endsWith('ing')) return t.slice(0, -3);
  if (t.endsWith('eth')) return t.slice(0, -3);
  if (t.endsWith('est')) return t.slice(0, -3);
  if (t.endsWith('ed')) return t.slice(0, -2);
  if (t.endsWith('es')) return t.slice(0, -2);
  if (t.endsWith('s') && t.length > 3) return t.slice(0, -1);
  return t;
}

export class ScriptureSearchService {
  constructor(private dbClient: DatabaseClient) {}

  parseReference(query: string): ParsedReferenceResult {
    const parsed = parseScriptureReference(query);
    if (!parsed.isValid || !parsed.reference) {
      return parsed;
    }

    try {
      const db = this.dbClient.rawDb;
      const ref = parsed.reference;
      const cleanBook = ref.bookId.replace(/^kjv_/, '');

      const row = db.prepare(`
        SELECT MAX(bv.verse_number) as max_v
        FROM bible_verses bv
        JOIN bible_books bb ON bv.book_id = bb.id AND bv.version_id = bb.version_id
        WHERE bv.chapter_number = ?
          AND (bv.book_id = ? OR bb.name LIKE ? OR bb.abbreviation LIKE ? OR bb.normalized_name LIKE ?)
      `).get(ref.chapterNumber, ref.bookId, `%${cleanBook}%`, `%${cleanBook}%`, `%${cleanBook}%`) as { max_v?: number } | undefined;

      if (row && row.max_v && row.max_v > 0) {
        const maxVerse = row.max_v;
        const bookDisplayName = ref.bookName || 'Chapter';

        if (ref.startVerse > maxVerse) {
          return {
            isValid: false,
            error: `${bookDisplayName} ${ref.chapterNumber} only has ${maxVerse} verses (verse ${ref.startVerse} does not exist).`,
          };
        }

        if (ref.endVerse && ref.endVerse > maxVerse) {
          ref.endVerse = maxVerse;
          parsed.formattedDisplay = `${bookDisplayName} ${ref.chapterNumber}:${ref.startVerse}${maxVerse > ref.startVerse ? `-${maxVerse}` : ''}`;
        }
      }
    } catch (err) {
      logger.warn('Error verifying verse count during reference parsing', err);
    }

    return parsed;
  }

  private buildRangeSql(range?: string): string {
    switch (range) {
      case 'OT':
        return " AND bb.testament = 'OT'";
      case 'NT':
        return " AND bb.testament = 'NT'";
      case 'PENTATEUCH':
        return ' AND bb.book_order BETWEEN 1 AND 5';
      case 'HISTORY':
        return ' AND bb.book_order BETWEEN 6 AND 17';
      case 'POETRY':
        return ' AND bb.book_order BETWEEN 18 AND 22';
      case 'PROPHETS':
        return ' AND bb.book_order BETWEEN 23 AND 39';
      case 'GOSPELS':
        return ' AND bb.book_order BETWEEN 40 AND 44';
      case 'EPISTLES':
        return ' AND bb.book_order BETWEEN 45 AND 66';
      default:
        return '';
    }
  }

  searchFullText(req: SearchFullTextRequest): SearchFullTextResponse {
    const rawQuery = req.query.trim();
    const limit = req.limit || 50;
    const offset = req.offset || 0;
    const versionId = req.versionId || 'kjv';
    const rangeSql = this.buildRangeSql(req.range);
    const useWildcards = Boolean(req.useWildcards);
    const accentSensitive = Boolean(req.accentSensitive);

    if (!rawQuery) {
      return { totalCount: 0, results: [] };
    }

    logger.debug(`Executing full-text search for "${rawQuery}" in version: ${versionId}, range: ${req.range || 'ALL'}`);

    // If query matches a reference pattern and no wildcard is used, prioritize reference resolution
    if (!useWildcards) {
      const parsedRef = parseScriptureReference(rawQuery);
      if (parsedRef.isValid && parsedRef.reference) {
        const refRes = this.searchByReference(
          parsedRef.reference.bookId,
          parsedRef.reference.chapterNumber,
          parsedRef.reference.startVerse,
          parsedRef.reference.endVerse,
          versionId
        );
        if (refRes.totalCount > 0) {
          return refRes;
        }
      }
    }

    const db = this.dbClient.rawDb;

    // Handle wildcards if enabled
    if (useWildcards && (rawQuery.includes('*') || rawQuery.includes('?'))) {
      const sqlLikePattern = rawQuery.replace(/\*/g, '%').replace(/\?/g, '_');
      const rows = db.prepare(`
        SELECT 
          bv.id as verse_id,
          bv.version_id,
          ver.abbreviation as version_abbr,
          bv.book_id,
          bb.name as book_name,
          bv.chapter_number,
          bv.verse_number,
          bv.verse_text
        FROM bible_verses bv
        JOIN bible_books bb ON bv.book_id = bb.id AND bv.version_id = bb.version_id
        JOIN bible_versions ver ON bv.version_id = ver.id
        WHERE bv.version_id = ? AND bv.verse_text LIKE ? ${rangeSql}
        ORDER BY bb.book_order ASC, bv.chapter_number ASC, bv.verse_number ASC
      `).all(versionId, sqlLikePattern) as any[];

      const regexPattern = rawQuery.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
      const highlightRegex = new RegExp(`(${regexPattern})`, accentSensitive ? 'g' : 'gi');

      const results: SearchFullTextResultItem[] = rows
        .slice(offset, offset + limit)
        .map((r) => ({
          verseId: r.verse_id,
          versionId: r.version_id,
          versionAbbr: r.version_abbr,
          bookId: r.book_id,
          bookName: r.book_name,
          chapterNumber: r.chapter_number,
          verseNumber: r.verse_number,
          verseText: r.verse_text,
          snippet: r.verse_text.replace(highlightRegex, '<mark>$1</mark>'),
        }));

      return {
        totalCount: rows.length,
        results,
      };
    }

    // 1. Exact Continuous Phrase Search First
    const cleanPhrase = rawQuery.replace(/["';,.:!?]/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanPhrase.length >= 3) {
      const exactRows = db.prepare(`
        SELECT 
          bv.id as verse_id,
          bv.version_id,
          ver.abbreviation as version_abbr,
          bv.book_id,
          bb.name as book_name,
          bv.chapter_number,
          bv.verse_number,
          bv.verse_text
        FROM bible_verses bv
        JOIN bible_books bb ON bv.book_id = bb.id AND bv.version_id = bb.version_id
        JOIN bible_versions ver ON bv.version_id = ver.id
        WHERE bv.version_id = ? AND bv.verse_text LIKE ? ${rangeSql}
        ORDER BY bb.book_order ASC, bv.chapter_number ASC, bv.verse_number ASC
      `).all(versionId, `%${cleanPhrase}%`) as any[];

      if (exactRows.length > 0) {
        logger.debug(`Found ${exactRows.length} phrase matches for "${cleanPhrase}" in range ${req.range || 'ALL'}`);
        const escapedPhrase = cleanPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const phraseRegex = new RegExp(`(${escapedPhrase})`, accentSensitive ? 'g' : 'gi');

        const results: SearchFullTextResultItem[] = exactRows
          .slice(offset, offset + limit)
          .map((r) => ({
            verseId: r.verse_id,
            versionId: r.version_id,
            versionAbbr: r.version_abbr,
            bookId: r.book_id,
            bookName: r.book_name,
            chapterNumber: r.chapter_number,
            verseNumber: r.verse_number,
            verseText: r.verse_text,
            snippet: r.verse_text.replace(phraseRegex, '<mark>$1</mark>'),
          }));

        return {
          totalCount: exactRows.length,
          results,
        };
      }
    }

    // 2. Multi-term Keyword Matching (with Stop-Word awareness and root-stem matching)
    const rawTerms = rawQuery
      .split(/[\s,;:.!?—\-]+/)
      .map((t) => t.replace(/[^a-zA-Z0-9]/g, ''))
      .filter(Boolean);

    if (rawTerms.length === 0) {
      return { totalCount: 0, results: [] };
    }

    // Comprehensive stop words for multi-word full-verse input
    const STOP_WORDS = new Set([
      'the', 'and', 'that', 'with', 'for', 'this', 'unto', 'from', 'they', 'them', 'their',
      'there', 'which', 'what', 'when', 'then', 'into', 'have', 'shall', 'shalt', 'thou',
      'thee', 'thy', 'hath', 'upon', 'were', 'am', 'is', 'are', 'was', 'be', 'an', 'a',
      'in', 'of', 'to', 'or', 'by', 'at', 'it', 'you', 'your', 'yours', 'my', 'mine',
      'me', 'we', 'us', 'our', 'ours', 'he', 'she', 'him', 'her', 'his', 'will', 'ye'
    ]);

    const meaningfulTerms = rawTerms.filter((t) => !STOP_WORDS.has(t.toLowerCase()));
    const searchTerms = meaningfulTerms.length > 0 ? meaningfulTerms : rawTerms;

    // Try strict AND match
    const andClauses: string[] = ['bv.version_id = ?'];
    const andParams: (string | number)[] = [versionId];

    for (const term of searchTerms) {
      const stem = getTermStem(term);
      andClauses.push('(bv.verse_text LIKE ? OR bv.verse_text LIKE ?)');
      andParams.push(`%${term}%`, `%${stem}%`);
    }

    const andSql = andClauses.join(' AND ') + rangeSql;

    const candidateRows = db.prepare(`
      SELECT 
        bv.id as verse_id,
        bv.version_id,
        ver.abbreviation as version_abbr,
        bv.book_id,
        bb.name as book_name,
        bv.chapter_number,
        bv.verse_number,
        bv.verse_text
      FROM bible_verses bv
      JOIN bible_books bb ON bv.book_id = bb.id AND bv.version_id = bb.version_id
      JOIN bible_versions ver ON bv.version_id = ver.id
      WHERE ${andSql}
      ORDER BY bb.book_order ASC, bv.chapter_number ASC, bv.verse_number ASC
    `).all(...andParams) as any[];

    let matchingRows = candidateRows;

    // 3. Fallback: Smart Scored Overlap Ranking (Handles translations like NIV/NKJV pasted into KJV)
    if (matchingRows.length === 0 && searchTerms.length >= 2) {
      const orClauses: string[] = [];
      const orParams: (string | number)[] = [versionId];

      for (const term of searchTerms) {
        const stem = getTermStem(term);
        orClauses.push('bv.verse_text LIKE ?');
        orParams.push(`%${stem}%`);
      }

      const orSql = `bv.version_id = ? AND (${orClauses.join(' OR ')}) ${rangeSql}`;

      const candidateOrRows = db.prepare(`
        SELECT 
          bv.id as verse_id,
          bv.version_id,
          ver.abbreviation as version_abbr,
          bv.book_id,
          bb.name as book_name,
          bv.chapter_number,
          bv.verse_number,
          bv.verse_text
        FROM bible_verses bv
        JOIN bible_books bb ON bv.book_id = bb.id AND bv.version_id = bb.version_id
        JOIN bible_versions ver ON bv.version_id = ver.id
        WHERE ${orSql}
        ORDER BY bb.book_order ASC, bv.chapter_number ASC, bv.verse_number ASC
        LIMIT 600
      `).all(...orParams) as any[];

      // Score each candidate by how many distinct search terms or stems appear
      const scored = candidateOrRows.map((r) => {
        let matchCount = 0;
        const textLower = r.verse_text.toLowerCase();
        for (const term of searchTerms) {
          const stem = getTermStem(term);
          if (textLower.includes(term.toLowerCase()) || textLower.includes(stem)) {
            matchCount++;
          }
        }
        return {
          row: r,
          score: matchCount,
          percent: Math.round((matchCount / searchTerms.length) * 100),
        };
      });

      // Require matching at least 2 key terms or 25% of terms
      const minMatches = Math.max(2, Math.floor(searchTerms.length * 0.25));
      const qualified = scored
        .filter((s) => s.score >= minMatches)
        .sort((a, b) => b.score - a.score);

      matchingRows = qualified.map((q) => q.row);
    }

    const results: SearchFullTextResultItem[] = matchingRows
      .slice(offset, offset + limit)
      .map((r) => {
        let snippet = r.verse_text;
        // Highlight terms & stems
        for (const term of searchTerms) {
          const stem = getTermStem(term);
          const pattern = stem.length >= 3 ? `${term}|${stem}[a-z]*` : term;
          const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b(${escaped})\\b`, accentSensitive ? 'g' : 'gi');
          snippet = snippet.replace(regex, '<mark>$1</mark>');
        }

        return {
          verseId: r.verse_id,
          versionId: r.version_id,
          versionAbbr: r.version_abbr,
          bookId: r.book_id,
          bookName: r.book_name,
          chapterNumber: r.chapter_number,
          verseNumber: r.verse_number,
          verseText: r.verse_text,
          snippet,
        };
      });

    return {
      totalCount: matchingRows.length,
      results,
    };
  }

  private searchByReference(
    bookId: string,
    chapter: number,
    startVerse: number,
    endVerse?: number,
    versionId = 'kjv'
  ): SearchFullTextResponse {
    const db = this.dbClient.rawDb;
    const end = endVerse || startVerse;
    const cleanBook = bookId.replace(/^kjv_/, '');

    const rows = db.prepare(`
      SELECT 
        bv.id as verse_id,
        bv.version_id,
        ver.abbreviation as version_abbr,
        bv.book_id,
        bb.name as book_name,
        bv.chapter_number,
        bv.verse_number,
        bv.verse_text
      FROM bible_verses bv
      JOIN bible_books bb ON bv.book_id = bb.id AND bv.version_id = bb.version_id
      JOIN bible_versions ver ON bv.version_id = ver.id
      WHERE bv.version_id = ? AND bv.chapter_number = ? AND bv.verse_number BETWEEN ? AND ?
      AND (bv.book_id = ? OR bb.name LIKE ? OR bb.abbreviation LIKE ? OR bb.normalized_name LIKE ?)
      ORDER BY bv.verse_number ASC
    `).all(versionId, chapter, startVerse, end, bookId, `%${cleanBook}%`, `%${cleanBook}%`, `%${cleanBook}%`) as any[];

    const results: SearchFullTextResultItem[] = rows.map((r) => ({
      verseId: r.verse_id,
      versionId: r.version_id,
      versionAbbr: r.version_abbr,
      bookId: r.book_id,
      bookName: r.book_name,
      chapterNumber: r.chapter_number,
      verseNumber: r.verse_number,
      verseText: r.verse_text,
      snippet: r.verse_text,
    }));

    return {
      totalCount: results.length,
      results,
    };
  }
}
