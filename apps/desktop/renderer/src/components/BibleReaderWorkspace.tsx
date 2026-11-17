import React, { useEffect, useState } from 'react';
import {
  BibleBookDto,
  BibleVerseDto,
  ScriptureReference,
} from '@scripture-studio/shared-types';

interface BibleReaderWorkspaceProps {
  onSelectVerse: (
    versionId: string,
    bookId: string,
    chapter: number,
    verse: number,
    secondaryVersionId?: string
  ) => void;
  onDoubleSelectVerse: (
    versionId: string,
    bookId: string,
    chapter: number,
    verse: number,
    secondaryVersionId?: string
  ) => void;
  activeReference?: ScriptureReference | null;
  activeVerseNumber?: number | null;
  refreshKey?: number;
  primaryVersionId?: string;
  onPrimaryVersionChange?: (versionId: string) => void;
  secondaryVersionId?: string;
  onSecondaryVersionChange?: (versionId: string) => void;
}

export default function BibleReaderWorkspace({
  onSelectVerse,
  onDoubleSelectVerse,
  activeReference,
  activeVerseNumber,
  refreshKey,
  primaryVersionId: propPrimaryVersionId,
  secondaryVersionId: propSecondaryVersionId,
}: BibleReaderWorkspaceProps): React.JSX.Element {
  const [selectedVersionId, setSelectedVersionId] = useState<string>(propPrimaryVersionId || 'kjv');
  const [secondaryVersionId, setSecondaryVersionId] = useState<string>(propSecondaryVersionId || 'tel');

  // Keep primaryVersionId in sync with global parent
  useEffect(() => {
    if (propPrimaryVersionId && propPrimaryVersionId !== selectedVersionId) {
      setSelectedVersionId(propPrimaryVersionId);
    }
  }, [propPrimaryVersionId]);

  // Keep secondaryVersionId in sync with global parent
  useEffect(() => {
    if (propSecondaryVersionId !== undefined && propSecondaryVersionId !== secondaryVersionId) {
      setSecondaryVersionId(propSecondaryVersionId);
    }
  }, [propSecondaryVersionId]);
  const [books, setBooks] = useState<BibleBookDto[]>([]);
  const [selectedBook, setSelectedBook] = useState<BibleBookDto | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [verses, setVerses] = useState<BibleVerseDto[]>([]);
  const [secondaryVerses, setSecondaryVerses] = useState<Map<number, string>>(new Map());
  const [selectedVerseNumber, setSelectedVerseNumber] = useState<number | null>(null);
  const [quickQuery, setQuickQuery] = useState<string>('');

  // Sync selected verse when presentation clears or changes
  useEffect(() => {
    if (activeVerseNumber === null) {
      setSelectedVerseNumber(null);
    } else if (typeof activeVerseNumber === 'number') {
      setSelectedVerseNumber(activeVerseNumber);
    }
  }, [activeVerseNumber]);

  // Smooth scroll to active verse when verse or chapter list updates
  useEffect(() => {
    if (typeof selectedVerseNumber === 'number' && verses.length > 0) {
      const el = document.getElementById(`verse-${selectedVerseNumber}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedVerseNumber, verses]);

  // Sync book & chapter if presentation navigates or recalls from history
  useEffect(() => {
    if (activeReference && books.length > 0) {
      if (activeReference.bookId || activeReference.bookName) {
        const cleanRefAbbr = activeReference.bookId?.includes('_')
          ? activeReference.bookId.split('_').slice(1).join('_').toLowerCase()
          : activeReference.bookId?.toLowerCase();

        const found = books.find(
          (b) =>
            (activeReference.bookId && b.id.toLowerCase() === activeReference.bookId.toLowerCase()) ||
            (activeReference.bookName && b.name.toLowerCase() === activeReference.bookName.toLowerCase()) ||
            (activeReference.bookName && b.abbreviation.toLowerCase() === activeReference.bookName.toLowerCase()) ||
            (cleanRefAbbr && b.abbreviation.toLowerCase() === cleanRefAbbr) ||
            (cleanRefAbbr && b.id.toLowerCase().endsWith(`_${cleanRefAbbr}`))
        );
        if (found && (!selectedBook || selectedBook.id.toLowerCase() !== found.id.toLowerCase())) {
          setSelectedBook(found);
        }
      }
      if (typeof activeReference.chapterNumber === 'number' && activeReference.chapterNumber !== selectedChapter) {
        setSelectedChapter(activeReference.chapterNumber);
      }
      if (typeof activeReference.startVerse === 'number') {
        setSelectedVerseNumber(activeReference.startVerse);
      }
    }
  }, [activeReference, books]);

  // Load versions
  useEffect(() => {
    if (window.scriptureStudioApi) {
      window.scriptureStudioApi.bible.getVersions().then((res) => {
        if (res.versions.length > 0) {
          // Keep current selected if still present; else fallback
          setSelectedVersionId((prev) => {
            if (res.versions.some((v) => v.id === prev)) return prev;
            const defaultPrimary = res.versions.find((v) => v.id === 'kjv') || res.versions[0];
            return defaultPrimary ? defaultPrimary.id : '';
          });

          setSecondaryVersionId((prev) => {
            if (prev && res.versions.some((v) => v.id === prev)) return prev;
            const defaultSecondary = res.versions.find((v) => v.id === 'tel');
            return defaultSecondary ? defaultSecondary.id : '';
          });
        } else {
          setSelectedVersionId('');
          setSecondaryVersionId('');
          setBooks([]);
          setVerses([]);
        }
      });
    }
  }, [refreshKey]);

  // Load books when version changes
  useEffect(() => {
    if (window.scriptureStudioApi && selectedVersionId) {
      window.scriptureStudioApi.bible.getBooks({ versionId: selectedVersionId }).then((res) => {
        setBooks(res.books);
        if (res.books.length > 0 && res.books[0]) {
          let targetBook = res.books[0];
          if (activeReference?.bookId || activeReference?.bookName) {
            const cleanRefAbbr = activeReference.bookId?.includes('_')
              ? activeReference.bookId.split('_').slice(1).join('_').toLowerCase()
              : activeReference.bookId?.toLowerCase();

            const matched = res.books.find(
              (b) =>
                (activeReference.bookId && b.id.toLowerCase() === activeReference.bookId.toLowerCase()) ||
                (activeReference.bookName && b.name.toLowerCase() === activeReference.bookName.toLowerCase()) ||
                (activeReference.bookName && b.abbreviation.toLowerCase() === activeReference.bookName.toLowerCase()) ||
                (cleanRefAbbr && b.abbreviation.toLowerCase() === cleanRefAbbr) ||
                (cleanRefAbbr && b.id.toLowerCase().endsWith(`_${cleanRefAbbr}`))
            );
            if (matched) targetBook = matched;
          } else {
            const genesis = res.books.find((b) => b.name === 'Genesis');
            if (genesis) targetBook = genesis;
          }
          setSelectedBook(targetBook);
          if (activeReference?.chapterNumber) {
            setSelectedChapter(activeReference.chapterNumber);
          } else {
            setSelectedChapter(1);
          }
        }
      });
    }
  }, [selectedVersionId]);

  // Load primary chapter verses without triggering auto-selection side-effects
  useEffect(() => {
    if (window.scriptureStudioApi && selectedBook) {
      window.scriptureStudioApi.bible
        .getChapter({
          versionId: selectedVersionId,
          bookId: selectedBook.id,
          chapterNumber: selectedChapter,
        })
        .then((res) => {
          setVerses(res.verses);
          if (activeVerseNumber) {
            setSelectedVerseNumber(activeVerseNumber);
          }
        })
        .catch(() => {
          setVerses([]);
        });
    }
  }, [selectedBook, selectedChapter, selectedVersionId]);

  // Load secondary chapter verses for parallel bilingual display
  useEffect(() => {
    if (window.scriptureStudioApi && selectedBook && secondaryVersionId && secondaryVersionId !== selectedVersionId) {
      window.scriptureStudioApi.bible
        .getBooks({ versionId: secondaryVersionId })
        .then((secBooksRes) => {
          const targetSecBook = secBooksRes.books.find(
            (b) =>
              b.abbreviation.toLowerCase() === selectedBook.abbreviation.toLowerCase() ||
              b.bookOrder === selectedBook.bookOrder
          );

          if (targetSecBook) {
            return window.scriptureStudioApi.bible.getChapter({
              versionId: secondaryVersionId,
              bookId: targetSecBook.id,
              chapterNumber: selectedChapter,
            });
          }
          return null;
        })
        .then((secChapterRes) => {
          if (secChapterRes && secChapterRes.verses) {
            const map = new Map<number, string>();
            secChapterRes.verses.forEach((v) => map.set(v.verseNumber, v.verseText));
            setSecondaryVerses(map);
          } else {
            setSecondaryVerses(new Map());
          }
        })
        .catch(() => {
          setSecondaryVerses(new Map());
        });
    } else {
      setSecondaryVerses(new Map());
    }
  }, [selectedBook, selectedChapter, secondaryVersionId, selectedVersionId]);

  const handleQuickSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.scriptureStudioApi) return;

    const parsed = await window.scriptureStudioApi.search.parseReference({ query: quickQuery });
    if (parsed.isValid && parsed.reference) {
      const targetBook = books.find(
        (b) =>
          b.name.toLowerCase() === parsed.reference!.bookName?.toLowerCase() ||
          b.abbreviation.toLowerCase() === parsed.reference!.bookName?.toLowerCase()
      );

      if (targetBook) {
        setSelectedBook(targetBook);
        setSelectedChapter(parsed.reference.chapterNumber);
        setSelectedVerseNumber(parsed.reference.startVerse);
        onSelectVerse(
          selectedVersionId,
          targetBook.id,
          parsed.reference.chapterNumber,
          parsed.reference.startVerse,
          secondaryVersionId || undefined
        );
        setTimeout(() => {
          const el = document.getElementById(`verse-${parsed.reference!.startVerse}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-panel)',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
      }}
    >
      {/* Top Bar: Quick Reference & Dual Translation Selector */}
      <div
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          backgroundColor: 'var(--bg-card)',
          flexWrap: 'wrap',
        }}
      >
        <form onSubmit={handleQuickSearch} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            placeholder="Quick Reference (e.g. John 1:1, Gen 1, Ps 23)..."
            style={{ flex: 1, minWidth: '180px' }}
          />
          <button type="submit" className="btn-secondary">
            <span>Lookup</span>
          </button>
        </form>
      </div>

      {/* Navigation Strip: Book, Chapter, and Verse Dropdowns */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          padding: '0.6rem 1rem',
          backgroundColor: 'var(--bg-app)',
          borderBottom: '1px solid var(--border-color)',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* Book Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Book:</span>
          <select
            value={selectedBook?.id || ''}
            onChange={(e) => {
              const b = books.find((x) => x.id === e.target.value);
              if (b) {
                setSelectedBook(b);
                setSelectedChapter(1);
              }
            }}
          >
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.testament})
              </option>
            ))}
          </select>
        </div>

        {/* Chapter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Chapter:</span>
          <select
            value={selectedChapter}
            onChange={(e) => {
              setSelectedChapter(Number(e.target.value));
            }}
          >
            {Array.from({ length: selectedBook?.chapterCount || 1 }, (_, i) => i + 1).map((ch) => (
              <option key={ch} value={ch}>
                Chapter {ch}
              </option>
            ))}
          </select>
        </div>

        {/* Verse Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Verse:</span>
          <select
            value={selectedVerseNumber || 1}
            onChange={(e) => {
              const vNum = Number(e.target.value);
              setSelectedVerseNumber(vNum);
              if (selectedBook) {
                onSelectVerse(
                  selectedVersionId,
                  selectedBook.id,
                  selectedChapter,
                  vNum,
                  secondaryVersionId || undefined
                );
              }
              const el = document.getElementById(`verse-${vNum}`);
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          >
            {verses.map((v) => (
              <option key={v.verseNumber} value={v.verseNumber}>
                Verse {v.verseNumber}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
          Tip: Double-click a verse to project immediately!
        </div>
      </div>

      {/* Verses Scroll List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {verses.length > 0 ? (
          verses.map((v) => {
            const isSelected = selectedVerseNumber === v.verseNumber;
            const hasSecondary = secondaryVerses.has(v.verseNumber);

            return (
              <div
                id={`verse-${v.verseNumber}`}
                key={v.id}
                onClick={() => {
                  setSelectedVerseNumber(v.verseNumber);
                  onSelectVerse(
                    selectedVersionId,
                    selectedBook!.id,
                    selectedChapter,
                    v.verseNumber,
                    secondaryVersionId || undefined
                  );
                }}
                onDoubleClick={() => {
                  setSelectedVerseNumber(v.verseNumber);
                  onDoubleSelectVerse(
                    selectedVersionId,
                    selectedBook!.id,
                    selectedChapter,
                    v.verseNumber,
                    secondaryVersionId || undefined
                  );
                }}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'var(--bg-hover)' : 'transparent',
                  borderLeft: isSelected ? '4px solid var(--primary)' : '4px solid transparent',
                  marginBottom: '6px',
                  transition: 'background 0.15s ease',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <strong style={{ color: '#94A3B8', minWidth: '24px', flexShrink: 0 }}>
                    {v.verseNumber}
                  </strong>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#F1F5F9', fontSize: '1rem' }}>{v.verseText}</div>
                    {hasSecondary && (
                      <div
                        style={{
                          marginTop: '4px',
                          fontSize: '0.92rem',
                          color: '#94A3B8',
                          lineHeight: 1.5,
                          fontWeight: 400,
                        }}
                      >
                        {secondaryVerses.get(v.verseNumber)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
            No verses available for this chapter.
          </div>
        )}
      </div>
    </div>
  );
}
