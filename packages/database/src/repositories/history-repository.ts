import Database from 'better-sqlite3';
import { PresentationHistoryEntryDto } from '@scripture-studio/shared-types';

export class HistoryRepository {
  constructor(private db: Database.Database) {}

  /**
   * Automatically purges presentation history entries older than 24 hours,
   * removes test placeholders, and deduplicates existing repeated verses
   * so only the most recent presentation timestamp is kept.
   */
  purgeOldEntries(): void {
    try {
      const cutoffIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      this.db.prepare(`
        DELETE FROM presentation_history
        WHERE presented_at < ?
           OR datetime(presented_at) < datetime('now', '-24 hours')
           OR reference_json LIKE '%"bookId":"book"%'
           OR reference_json LIKE '%"formattedDisplay":"book 1:1%'
      `).run(cutoffIso);

      // Clean up any historical duplicate entries: keep only the newest row for each verse
      const rows = this.db.prepare(`
        SELECT id, reference_json, translation_id, presented_at
        FROM presentation_history
        ORDER BY presented_at DESC
      `).all() as Array<{ id: string; reference_json: string; translation_id: string; presented_at: string }>;

      const seen = new Set<string>();
      const idsToDelete: string[] = [];

      for (const row of rows) {
        try {
          const parsed = JSON.parse(row.reference_json);
          const key = `${row.translation_id}_${parsed.formattedDisplay || `${parsed.bookId}_${parsed.chapterNumber}_${parsed.startVerse}`}`.toLowerCase();
          if (seen.has(key)) {
            idsToDelete.push(row.id);
          } else {
            seen.add(key);
          }
        } catch {
          // ignore parsing error
        }
      }

      if (idsToDelete.length > 0) {
        const stmt = this.db.prepare('DELETE FROM presentation_history WHERE id = ?');
        const deleteMany = this.db.transaction((ids: string[]) => {
          for (const id of ids) stmt.run(id);
        });
        deleteMany(idsToDelete);
      }
    } catch (err) {
      // Non-fatal if table is empty or locked
    }
  }

  /**
   * Resolves canonical book name from bookId or translation books table.
   */
  resolveBookName(versionId: string, bookId?: string, bookName?: string): string {
    if (bookName && bookName !== 'book' && bookName.trim() !== '' && bookName !== 'Scripture') {
      return bookName;
    }

    if (!bookId || bookId === 'book') {
      return 'Scripture';
    }

    try {
      const cleanAbbr = bookId.includes('_') ? bookId.split('_')[1]!.toLowerCase() : bookId.toLowerCase();
      const targetId = `${(versionId || 'kjv').toLowerCase()}_${cleanAbbr}`;

      const row = this.db.prepare(`
        SELECT name FROM bible_books
        WHERE id = ? OR id = ? OR LOWER(abbreviation) = ?
        ORDER BY (CASE WHEN version_id = ? THEN 0 ELSE 1 END) ASC
        LIMIT 1
      `).get(bookId, targetId, cleanAbbr, versionId || 'kjv') as { name: string } | undefined;

      if (row?.name) {
        return row.name;
      }
    } catch {
      // Fallback
    }

    const simple = bookId.replace(/^[a-z]+_/, '');
    return simple.charAt(0).toUpperCase() + simple.slice(1);
  }

  getRecent(limit = 100): PresentationHistoryEntryDto[] {
    this.purgeOldEntries();

    const cutoffIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const rows = this.db.prepare(`
      SELECT ph.id, ph.reference_json, ph.translation_id, ph.theme_id, ph.presented_at, bv.abbreviation as translation_abbr
      FROM presentation_history ph
      LEFT JOIN bible_versions bv ON ph.translation_id = bv.id
      WHERE ph.presented_at >= ? OR datetime(ph.presented_at) >= datetime('now', '-24 hours')
      ORDER BY ph.presented_at DESC
      LIMIT ?
    `).all(cutoffIso, limit) as any[];

    return rows.map((r) => {
      let ref: any = {};
      try {
        ref = JSON.parse(r.reference_json);
      } catch {
        ref = {};
      }

      const bookName = this.resolveBookName(r.translation_id, ref.bookId, ref.bookName);

      let formatted = ref.formattedDisplay;
      if (!formatted || formatted.startsWith('book ') || formatted === 'Scripture') {
        const versePart = ref.endVerse && ref.endVerse > ref.startVerse
          ? `${ref.startVerse}-${ref.endVerse}`
          : `${ref.startVerse || 1}`;
        formatted = `${bookName} ${ref.chapterNumber || 1}:${versePart}`;
      }

      return {
        id: r.id,
        reference: {
          versionId: ref.versionId || r.translation_id,
          secondaryVersionId: ref.secondaryVersionId,
          bookId: ref.bookId || 'kjv_gen',
          bookName: bookName,
          chapterNumber: ref.chapterNumber || 1,
          startVerse: ref.startVerse || 1,
          endVerse: ref.endVerse,
        },
        formattedDisplay: formatted,
        translationId: r.translation_id,
        translationAbbr: r.translation_abbr || ref.translationAbbr || 'KJV',
        themeId: r.theme_id || undefined,
        presentedAt: r.presented_at,
      };
    });
  }

  addEntry(entry: PresentationHistoryEntryDto): void {
    this.purgeOldEntries();

    const bookName = this.resolveBookName(entry.translationId, entry.reference?.bookId, entry.reference?.bookName);
    const enrichedReference = {
      ...entry.reference,
      bookName,
      formattedDisplay: entry.formattedDisplay,
      translationAbbr: entry.translationAbbr,
    };

    // If this verse was presented earlier, do not create a duplicate row.
    // Instead, update the order (presented_at timestamp) to bring it to the top!
    try {
      const allRows = this.db.prepare(`
        SELECT id, reference_json, translation_id
        FROM presentation_history
        WHERE translation_id = ?
      `).all(entry.translationId) as Array<{ id: string; reference_json: string; translation_id: string }>;

      const targetTitle = (entry.formattedDisplay || '').trim().toLowerCase();
      const existing = allRows.find((r) => {
        try {
          const parsed = JSON.parse(r.reference_json);
          const rowTitle = (parsed.formattedDisplay || '').trim().toLowerCase();
          if (rowTitle && targetTitle && rowTitle === targetTitle) {
            return true;
          }
          if (
            parsed.bookId === enrichedReference.bookId &&
            Number(parsed.chapterNumber) === Number(enrichedReference.chapterNumber) &&
            Number(parsed.startVerse) === Number(enrichedReference.startVerse) &&
            Number(parsed.endVerse || 0) === Number(enrichedReference.endVerse || 0)
          ) {
            return true;
          }
        } catch {
          return false;
        }
        return false;
      });

      if (existing) {
        // Verse already exists: update presented_at to move it to the top of history
        this.db.prepare(`
          UPDATE presentation_history
          SET presented_at = ?,
              reference_json = ?,
              theme_id = ?,
              translation_id = ?
          WHERE id = ?
        `).run(
          entry.presentedAt,
          JSON.stringify(enrichedReference),
          entry.themeId || null,
          entry.translationId,
          existing.id
        );
        return;
      }
    } catch {
      // Proceed with insert if check fails
    }

    this.db.prepare(`
      INSERT INTO presentation_history (id, reference_json, translation_id, theme_id, presented_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      entry.id,
      JSON.stringify(enrichedReference),
      entry.translationId,
      entry.themeId || null,
      entry.presentedAt
    );
  }

  clear(): boolean {
    const res = this.db.prepare('DELETE FROM presentation_history').run();
    return res.changes >= 0;
  }
}
