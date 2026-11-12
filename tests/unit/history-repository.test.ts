import { describe, it, expect, beforeEach } from 'vitest';
import { HistoryRepository } from '../../packages/database/src/repositories/history-repository.js';

describe('HistoryRepository — 24hr Retention & Book Name Mapping', () => {
  let mockRows: any[];
  let booksRows: any[];
  let repo: HistoryRepository;

  beforeEach(() => {
    mockRows = [];
    booksRows = [
      { id: 'kjv_gen', version_id: 'kjv', name: 'Genesis', abbreviation: 'Gen' },
      { id: 'kjv_jhn', version_id: 'kjv', name: 'John', abbreviation: 'Jn' },
      { id: 'kjv_rom', version_id: 'kjv', name: 'Romans', abbreviation: 'Rom' },
      { id: 'tel_gen', version_id: 'tel', name: 'ఆదికాండము', abbreviation: 'Gen' },
    ];

    const mockDb: any = {
      prepare: (sql: string) => {
        if (sql.includes('DELETE FROM presentation_history')) {
          return {
            run: (...args: any[]) => {
              const cutoffIso = args[0];
              const beforeCount = mockRows.length;
              mockRows = mockRows.filter((r) => {
                if (r.presented_at < cutoffIso) return false;
                if (r.reference_json.includes('"bookId":"book"')) return false;
                if (r.reference_json.includes('"formattedDisplay":"book 1:1')) return false;
                return true;
              });
              return { changes: beforeCount - mockRows.length };
            },
          };
        }

        if (sql.includes('SELECT name FROM bible_books')) {
          return {
            get: (id1: string, id2: string, cleanAbbr: string, versionId: string) => {
              const match = booksRows.find(
                (b) =>
                  (b.id === id1 || b.id === id2 || b.abbreviation.toLowerCase() === cleanAbbr.toLowerCase()) &&
                  b.version_id === versionId
              ) || booksRows.find(
                (b) => b.id === id1 || b.id === id2 || b.abbreviation.toLowerCase() === cleanAbbr.toLowerCase()
              );
              return match ? { name: match.name } : undefined;
            },
          };
        }

        if (sql.includes('SELECT id, presented_at, reference_json')) {
          return {
            get: () => {
              if (mockRows.length === 0) return undefined;
              return [...mockRows].sort((a, b) => (b.presented_at > a.presented_at ? 1 : -1))[0];
            },
          };
        }

        if (sql.includes('UPDATE presentation_history')) {
          return {
            run: (...args: any[]) => {
              const id = args[args.length - 1];
              const presentedAt = args[0];
              const row = mockRows.find((r) => r.id === id);
              if (row) {
                row.presented_at = presentedAt;
              }
              return { changes: 1 };
            },
          };
        }

        if (sql.includes('SELECT id, reference_json, translation_id')) {
          return {
            all: (transId?: string) => {
              if (transId) {
                return mockRows.filter((r) => r.translation_id === transId);
              }
              return [...mockRows];
            },
          };
        }

        if (sql.includes('INSERT INTO presentation_history')) {
          return {
            run: (id: string, refJson: string, transId: string, themeId: string | null, presentedAt: string) => {
              mockRows.push({
                id,
                reference_json: refJson,
                translation_id: transId,
                theme_id: themeId,
                presented_at: presentedAt,
                translation_abbr: transId.toUpperCase(),
              });
              return { changes: 1 };
            },
          };
        }

        if (sql.includes('SELECT ph.id, ph.reference_json')) {
          return {
            all: (cutoffIso: string, limit: number) => {
              return mockRows
                .filter((r) => r.presented_at >= cutoffIso)
                .sort((a, b) => (b.presented_at > a.presented_at ? 1 : -1))
                .slice(0, limit);
            },
          };
        }

        return {
          run: () => ({ changes: 0 }),
          all: () => [],
          get: () => undefined,
        };
      },
      transaction: (fn: any) => fn,
    };

    repo = new HistoryRepository(mockDb);
  });

  it('correctly maps book names from bookId and canonical tables', () => {
    expect(repo.resolveBookName('kjv', 'kjv_gen', 'Genesis')).toBe('Genesis');
    expect(repo.resolveBookName('kjv', 'kjv_rom')).toBe('Romans');
    expect(repo.resolveBookName('kjv', 'jhn')).toBe('John');
    expect(repo.resolveBookName('tel', 'tel_gen')).toBe('ఆదికాండము');
  });

  it('records presentation history with accurate book name and formatted display', () => {
    const nowIso = new Date().toISOString();
    repo.addEntry({
      id: 'h1',
      reference: {
        versionId: 'kjv',
        bookId: 'kjv_gen',
        bookName: 'Genesis',
        chapterNumber: 1,
        startVerse: 5,
      },
      formattedDisplay: 'Genesis 1:5',
      translationId: 'kjv',
      translationAbbr: 'KJV',
      presentedAt: nowIso,
    });

    const recent = repo.getRecent();
    expect(recent.length).toBe(1);
    expect(recent[0].formattedDisplay).toBe('Genesis 1:5');
    expect(recent[0].reference.bookName).toBe('Genesis');
    expect(recent[0].translationAbbr).toBe('KJV');
  });

  it('enforces 24-hour retention window: purges items older than 24 hours', () => {
    const now = Date.now();
    const twentyFiveHoursAgo = new Date(now - 25 * 60 * 60 * 1000).toISOString();
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();
    const tenMinutesAgo = new Date(now - 10 * 60 * 1000).toISOString();

    mockRows.push({
      id: 'old_1',
      reference_json: JSON.stringify({ bookId: 'kjv_gen', bookName: 'Genesis', chapterNumber: 1, startVerse: 1, formattedDisplay: 'Genesis 1:1' }),
      translation_id: 'kjv',
      translation_abbr: 'KJV',
      presented_at: twentyFiveHoursAgo,
    });

    mockRows.push({
      id: 'recent_1',
      reference_json: JSON.stringify({ bookId: 'kjv_jhn', bookName: 'John', chapterNumber: 3, startVerse: 16, formattedDisplay: 'John 3:16' }),
      translation_id: 'kjv',
      translation_abbr: 'KJV',
      presented_at: twoHoursAgo,
    });

    mockRows.push({
      id: 'recent_2',
      reference_json: JSON.stringify({ bookId: 'kjv_rom', bookName: 'Romans', chapterNumber: 8, startVerse: 28, formattedDisplay: 'Romans 8:28' }),
      translation_id: 'kjv',
      translation_abbr: 'KJV',
      presented_at: tenMinutesAgo,
    });

    const entries = repo.getRecent();
    expect(entries.length).toBe(2);
    expect(entries[0].formattedDisplay).toBe('Romans 8:28');
    expect(entries[1].formattedDisplay).toBe('John 3:16');
  });

  it('automatically purges legacy placeholder "bookId: book" rows', () => {
    mockRows.push({
      id: 'bogus_1',
      reference_json: JSON.stringify({ bookId: 'book', chapterNumber: 1, startVerse: 1, formattedDisplay: 'book 1:1' }),
      translation_id: 'kjv',
      translation_abbr: 'KJV',
      presented_at: new Date().toISOString(),
    });

    const entries = repo.getRecent();
    expect(entries.length).toBe(0);
  });

  it('prevents rapid double-click duplicate spam within 8 seconds', () => {
    const t1 = new Date(Date.now() - 2000).toISOString();
    const t2 = new Date().toISOString();

    repo.addEntry({
      id: 'click_1',
      reference: {
        versionId: 'kjv',
        bookId: 'kjv_gen',
        bookName: 'Genesis',
        chapterNumber: 1,
        startVerse: 5,
      },
      formattedDisplay: 'Genesis 1:5',
      translationId: 'kjv',
      translationAbbr: 'KJV',
      presentedAt: t1,
    });

    repo.addEntry({
      id: 'click_2',
      reference: {
        versionId: 'kjv',
        bookId: 'kjv_gen',
        bookName: 'Genesis',
        chapterNumber: 1,
        startVerse: 5,
      },
      formattedDisplay: 'Genesis 1:5',
      translationId: 'kjv',
      translationAbbr: 'KJV',
      presentedAt: t2,
    });

    const entries = repo.getRecent();
    expect(entries.length).toBe(1);
    expect(entries[0].presentedAt).toBe(t2);
  });
});
