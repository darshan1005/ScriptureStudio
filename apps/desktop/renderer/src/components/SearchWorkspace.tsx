import React, { useState, useEffect, useRef } from 'react';
import { BibleVersionDto, SearchFullTextResultItem, SearchScopeRange } from '@scripture-studio/shared-types';

interface SearchWorkspaceProps {
  onStageResult: (item: SearchFullTextResultItem) => void;
  onTakeLiveResult: (item: SearchFullTextResultItem) => void;
}

const DEFAULT_SHORTCUTS = [
  'John 1:1',
  'John 3:16',
  'Psalm 23:1',
  'Romans 8:28',
  'Genesis 1:1',
  'Matthew 5:3',
  'peace',
  'light',
  'love',
];

const SHORTCUTS_STORAGE_KEY = 'scripture_studio_search_shortcuts';

export const SearchWorkspace: React.FC<SearchWorkspaceProps> = ({
  onStageResult,
  onTakeLiveResult,
}) => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchFullTextResultItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [range, setRange] = useState<SearchScopeRange>('ALL');
  const [wholeWordsOnly, setWholeWordsOnly] = useState<boolean>(true);
  const [useWildcards, setUseWildcards] = useState<boolean>(false);
  const [accentSensitive, setAccentSensitive] = useState<boolean>(false);
  const [versions, setVersions] = useState<BibleVersionDto[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('kjv');

  useEffect(() => {
    if (window.scriptureStudioApi) {
      window.scriptureStudioApi.bible.getVersions().then((res) => {
        if (res.versions && res.versions.length > 0) {
          setVersions(res.versions);
          if (!res.versions.some((v) => v.id === selectedVersionId)) {
            setSelectedVersionId(res.versions[0]?.id || 'kjv');
          }
        }
      });
    }
  }, []);
  const [shortcuts, setShortcuts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load saved shortcuts from localStorage', e);
    }
    return DEFAULT_SHORTCUTS;
  });
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newShortcutText, setNewShortcutText] = useState<string>('');
  const debounceTimerRef = useRef<any>(null);

  const handleAddShortcut = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!shortcuts.includes(trimmed)) {
      const updated = [...shortcuts, trimmed];
      setShortcuts(updated);
      try {
        localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    setNewShortcutText('');
    setIsAdding(false);
  };

  const handleRemoveShortcut = (itemToRemove: string) => {
    const updated = shortcuts.filter((s) => s !== itemToRemove);
    setShortcuts(updated);
    try {
      localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetDefaults = () => {
    setShortcuts(DEFAULT_SHORTCUTS);
    try {
      localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(DEFAULT_SHORTCUTS));
    } catch (e) {
      console.error(e);
    }
  };

  const performSearch = async (
    searchQuery: string,
    searchRange = range,
    wholeWords = wholeWordsOnly,
    wildcards = useWildcards,
    accent = accentSensitive,
    verId = selectedVersionId
  ) => {
    const q = searchQuery.trim();
    if (!q) {
      setResults([]);
      setTotalCount(0);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    if (!window.scriptureStudioApi) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await window.scriptureStudioApi.search.searchFullText({
        query: q,
        versionId: verId,
        limit: 100,
        range: searchRange,
        wholeWordsOnly: wholeWords,
        useWildcards: wildcards,
        accentSensitive: accent,
      });
      setResults(res.results);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error('Search error', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Instant Auto-search on input with 200ms debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setTotalCount(0);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceTimerRef.current = setTimeout(() => {
      performSearch(query, range, wholeWordsOnly, useWildcards, accentSensitive, selectedVersionId);
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, selectedVersionId, range, wholeWordsOnly, useWildcards, accentSensitive]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    performSearch(query);
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
      {/* Top Search Bar with Auto-Search */}
      <div
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type reference or keyword for instant auto-search (e.g. 'john 1:1', 'psalm 23', 'grace')..."
              style={{
                width: '100%',
                fontSize: '0.95rem',
                paddingRight: '2rem',
              }}
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
                title="Clear input"
              >
                ✕
              </button>
            )}
          </div>
          <button type="submit" className="btn-primary" disabled={isSearching}>
            <span>{isSearching ? '⚡ Searching...' : '🔍 Search'}</span>
          </button>
        </form>

        {/* Search Options Panel (Range, Whole Words, Wildcards, Accent Sensitivity) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            padding: '0.4rem 0.6rem',
            backgroundColor: 'var(--bg-app)',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
          }}
        >
          {/* Left Group: Version & Range Dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {versions.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Version:
                </span>
                <select
                  value={selectedVersionId}
                  onChange={(e) => setSelectedVersionId(e.target.value)}
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.2rem 0.5rem',
                    backgroundColor: 'var(--bg-card)',
                    color: '#F59E0B',
                    fontWeight: 700,
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                  }}
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.abbreviation} — {v.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Range:
              </span>
              <select
                value={range}
                onChange={(e) => setRange(e.target.value as SearchScopeRange)}
                style={{
                  fontSize: '0.8rem',
                  padding: '0.2rem 0.5rem',
                  backgroundColor: 'var(--bg-card)',
                  color: '#F1F5F9',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                }}
              >
                <option value="ALL">Entire Bible (All 66 Books)</option>
                <option value="OT">Old Testament (39 Books)</option>
                <option value="NT">New Testament (27 Books)</option>
                <option value="PENTATEUCH">Pentateuch / Law (Genesis - Deut)</option>
                <option value="HISTORY">Historical Books (Joshua - Esther)</option>
                <option value="POETRY">Poetry & Wisdom (Job - Song)</option>
                <option value="PROPHETS">Prophets (Isaiah - Malachi)</option>
                <option value="GOSPELS">Gospels & Acts (Matt - Acts)</option>
                <option value="EPISTLES">Epistles & Revelation (Rom - Rev)</option>
              </select>
            </div>
          </div>

          {/* Center Group: Filter Checkboxes Matching Classic Search Options */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={wholeWordsOnly}
                onChange={(e) => setWholeWordsOnly(e.target.checked)}
              />
              <span>Find whole words only</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useWildcards}
                onChange={(e) => setUseWildcards(e.target.checked)}
              />
              <span>Use wildcards (*, ?)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={accentSensitive}
                onChange={(e) => setAccentSensitive(e.target.checked)}
              />
              <span>Accent sensitive</span>
            </label>
          </div>

          {/* Right Group: Found Count Badge */}
          {hasSearched && (
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: totalCount > 0 ? '#10B981' : '#EF4444',
                backgroundColor: totalCount > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                padding: '2px 8px',
                borderRadius: '12px',
                border: totalCount > 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              Found: {totalCount}
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginRight: '4px' }}>
            Instant shortcuts:
          </span>

          {shortcuts.map((s) => (
            <div
              key={s}
              onClick={() => setQuery(s)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.2rem 0.5rem',
                fontSize: '0.75rem',
                backgroundColor: query.toLowerCase() === s.toLowerCase() ? 'var(--primary)' : 'var(--bg-app)',
                color: query.toLowerCase() === s.toLowerCase() ? '#FFFFFF' : 'var(--text-muted)',
                border: query.toLowerCase() === s.toLowerCase() ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                borderRadius: '4px',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.15s ease',
              }}
              title={`Click to search "${s}"`}
            >
              <span>{s}</span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveShortcut(s);
                }}
                title={`Remove shortcut "${s}"`}
                style={{
                  fontSize: '0.75rem',
                  color: query.toLowerCase() === s.toLowerCase() ? 'rgba(255,255,255,0.7)' : 'var(--text-dim)',
                  cursor: 'pointer',
                  marginLeft: '2px',
                  padding: '0 2px',
                  borderRadius: '2px',
                  lineHeight: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#EF4444';
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = query.toLowerCase() === s.toLowerCase() ? 'rgba(255,255,255,0.7)' : 'var(--text-dim)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                ✕
              </span>
            </div>
          ))}

          {/* Inline Add Shortcut Input / Button */}
          {isAdding ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <input
                type="text"
                value={newShortcutText}
                onChange={(e) => setNewShortcutText(e.target.value)}
                placeholder="e.g. John 14:6 or grace"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddShortcut(newShortcutText);
                  } else if (e.key === 'Escape') {
                    setIsAdding(false);
                  }
                }}
                style={{
                  padding: '0.15rem 0.45rem',
                  fontSize: '0.75rem',
                  height: '24px',
                  borderRadius: '4px',
                  width: '130px',
                  border: '1px solid var(--primary)',
                  backgroundColor: 'var(--bg-app)',
                  color: '#F1F5F9',
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => handleAddShortcut(newShortcutText)}
                style={{
                  padding: '0.15rem 0.5rem',
                  fontSize: '0.75rem',
                  height: '24px',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                style={{
                  padding: '0.15rem 0.4rem',
                  fontSize: '0.75rem',
                  height: '24px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-dim)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setNewShortcutText(query.trim() || '');
                setIsAdding(true);
              }}
              style={{
                padding: '0.2rem 0.55rem',
                fontSize: '0.75rem',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                color: '#38BDF8',
                border: '1px dashed #38BDF8',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontWeight: 600,
              }}
              title={query.trim() ? `Add current search "${query.trim()}" as a shortcut` : 'Create a custom search shortcut'}
            >
              <span>+ Add Shortcut</span>
            </button>
          )}

          {shortcuts.length === 0 && (
            <button
              type="button"
              onClick={handleResetDefaults}
              style={{
                padding: '0.2rem 0.5rem',
                fontSize: '0.75rem',
                backgroundColor: 'transparent',
                color: 'var(--text-dim)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Restore Defaults
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      {hasSearched && (
        <div
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--bg-app)',
            borderBottom: '1px solid var(--border-color)',
            fontSize: '0.85rem',
            color: 'var(--text-dim)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>
            Found <strong style={{ color: '#F1F5F9' }}>{totalCount}</strong> matching verses for "{query}"
          </span>
          {isSearching && (
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Updating results...</span>
          )}
        </div>
      )}

      {/* Results List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {results.length > 0 ? (
          results.map((r) => (
            <div
              key={r.verseId}
              onClick={() => onStageResult(r)}
              onDoubleClick={() => onTakeLiveResult(r)}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                marginBottom: '0.5rem',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.25rem',
                }}
              >
                <span style={{ fontWeight: 700, color: '#F59E0B' }}>
                  {r.bookName} {r.chapterNumber}:{r.verseNumber}{' '}
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 600 }}>
                    ({r.versionAbbr})
                  </span>
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn-secondary"
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStageResult(r);
                    }}
                  >
                    👁 Preview
                  </button>
                  <button
                    className="btn-primary"
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTakeLiveResult(r);
                    }}
                  >
                    ⚡ Take Live
                  </button>
                </div>
              </div>
              <div
                style={{ color: '#E2E8F0', fontSize: '0.9rem', lineHeight: 1.4 }}
                dangerouslySetInnerHTML={{ __html: r.snippet }}
              />
            </div>
          ))
        ) : hasSearched && !isSearching ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
            No matching scriptures found. Try different search terms or check spelling.
          </div>
        ) : !hasSearched ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#94A3B8' }}>
              ⚡ Instant Scripture Auto-Search
            </div>
            <div>Start typing any reference (e.g. <em>John 1:1</em>, <em>Psalm 23</em>) or keyword (<em>light</em>, <em>love</em>) above.</div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
