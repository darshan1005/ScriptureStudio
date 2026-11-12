import React, { useEffect, useState } from 'react';
import { PresentationHistoryEntryDto, PresentationStateDto, ProgramItemDto, SearchFullTextResultItem, ThemeDto } from '@scripture-studio/shared-types';
import BibleReaderWorkspace from '../components/BibleReaderWorkspace.js';
import { SearchWorkspace } from '../components/SearchWorkspace.js';
import { ProgramEditorWorkspace } from '../components/ProgramEditorWorkspace.js';
import { ThemeEditorWorkspace } from '../components/ThemeEditorWorkspace.js';
import { HistoryWorkspace } from '../components/HistoryWorkspace.js';
import { TranslationDownloaderModal } from '../components/TranslationDownloaderModal.js';
import PreviewPane from '../components/PreviewPane.js';
import TransportBar from '../components/TransportBar.js';

type SidebarTab = 'bible' | 'search' | 'programs' | 'themes' | 'history';

export default function ControlStudioLayout(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<SidebarTab>('bible');
  const [state, setState] = useState<PresentationStateDto | null>(null);
  const [themes, setThemes] = useState<ThemeDto[]>([]);
  const [activeTheme, setActiveTheme] = useState<ThemeDto | null>(null);
  const [projectorStatus, setProjectorStatus] = useState<string>('Detecting Displays...');
  const [isOutputOpen, setIsOutputOpen] = useState<boolean>(false);
  const [isDownloaderOpen, setIsDownloaderOpen] = useState<boolean>(false);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [displays, setDisplays] = useState<DisplayDto[]>([]);
  const [selectedAudienceDisplayId, setSelectedAudienceDisplayId] = useState<string>('');
  const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('scripture_studio_nav_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleNavCollapse = () => {
    setIsNavCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('scripture_studio_nav_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const handleSelectMonitor = async (displayId: string) => {
    setSelectedAudienceDisplayId(displayId);
    if (window.scriptureStudioApi) {
      await window.scriptureStudioApi.display.assignRole({
        displayId,
        role: 'AUDIENCE',
      });
      const res = await window.scriptureStudioApi.display.getDisplays();
      setDisplays(res.displays);
      const isExt = res.displays.length > 1;
      const target = res.displays.find((d) => d.id === displayId);
      if (isExt && target && !target.isPrimary) {
        setProjectorStatus(`Projecting on ${target.name} (Extended Mode)`);
      } else {
        setProjectorStatus(`Windowed Preview (${target?.name || 'Primary'})`);
      }
    }
  };

  const handleReload = async () => {
    setIsReloading(true);
    setRefreshCounter((prev) => prev + 1);

    if (window.scriptureStudioApi) {
      try {
        const themeRes = await window.scriptureStudioApi.themes.list();
        if (themeRes.themes) setThemes(themeRes.themes);
        const dispRes = await window.scriptureStudioApi.display.getOutputStatus();
        setIsOutputOpen(dispRes.isOpen);
      } catch (err) {
        console.error('Reload error:', err);
      }
    }
    setTimeout(() => setIsReloading(false), 500);
  };

  // Initialize and subscribe to state changes
  useEffect(() => {
    if (window.scriptureStudioApi) {
      window.scriptureStudioApi.presentation.getState().then(setState);
      const unsubscribe = window.scriptureStudioApi.presentation.onStateChanged((newState) => {
        setState(newState);
      });

      // Load themes
      window.scriptureStudioApi.themes.list().then((res) => {
        setThemes(res.themes);
        if (res.themes.length > 0 && res.themes[0]) {
          setActiveTheme(res.themes[0]);
        }
      });

      // Check connected displays
      window.scriptureStudioApi.display.getDisplays().then((res) => {
        setDisplays(res.displays);
        const aud = res.displays.find((d) => d.role === 'AUDIENCE') || res.displays.find((d) => !d.isPrimary) || res.displays[0];
        if (aud) {
          setSelectedAudienceDisplayId(aud.id);
        }
        if (res.displays.length > 1) {
          setProjectorStatus(`Projector Ready (${res.displays.length} Displays - Extended Mode)`);
        } else {
          setProjectorStatus('Single Screen (Windowed Preview Mode)');
        }
      });

      // Listen for topology changes
      let unsubTopology: (() => void) | undefined;
      if (window.scriptureStudioApi.display.onTopologyChanged) {
        unsubTopology = window.scriptureStudioApi.display.onTopologyChanged((evt) => {
          setDisplays(evt.displays);
          const aud = evt.displays.find((d) => d.role === 'AUDIENCE') || evt.displays.find((d) => !d.isPrimary) || evt.displays[0];
          if (aud) setSelectedAudienceDisplayId(aud.id);
        });
      }

      // Check if output window is already open
      if (window.scriptureStudioApi.display.getOutputStatus) {
        window.scriptureStudioApi.display.getOutputStatus().then((res) => {
          setIsOutputOpen(res.isOpen);
        });
      }

      // Listen for output status changes
      let unsubOutput: (() => void) | undefined;
      if (window.scriptureStudioApi.display.onOutputStatusChanged) {
        unsubOutput = window.scriptureStudioApi.display.onOutputStatusChanged((res) => {
          setIsOutputOpen(res.isOpen);
        });
      }

      return () => {
        unsubscribe();
        unsubOutput?.();
        unsubTopology?.();
      };
    }
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);

      if (e.key === 'Escape') {
        e.preventDefault();
        if (isInput) {
          (e.target as HTMLElement).blur();
        }
        handleCloseOutput();
        return;
      }

      if (isInput) {
        if (e.key === 'Enter') return;
        return; // Don't intercept arrow keys when operator is typing into an input field!
      }

      if (e.key === 'F12') {
        e.preventDefault();
        handleTakeLive();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ' || e.key === 'Spacebar') {
        if (state?.previewSlide || state?.liveSlide) {
          e.preventDefault();
          handleNextVerse();
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        if (state?.previewSlide || state?.liveSlide) {
          e.preventDefault();
          handlePrevVerse();
        }
      } else if (e.key === 'F5') {
        e.preventDefault();
        setActiveTab('bible');
      } else if (e.key === 'F6') {
        e.preventDefault();
        setActiveTab('search');
      } else if (e.key === 'F9') {
        e.preventDefault();
        handleFreezeToggle();
      } else if (e.key === 'F10') {
        e.preventDefault();
        handleHideToggle();
      } else if (e.key === 'F11') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, isOutputOpen]);

  const handleSelectVerse = (
    versionId: string,
    bookId: string,
    chapterNumber: number,
    verseNumber: number,
    secondaryVersionId?: string
  ) => {
    if (window.scriptureStudioApi) {
      window.scriptureStudioApi.presentation.previewReference({
        versionId,
        secondaryVersionId,
        bookId,
        chapterNumber,
        startVerse: verseNumber,
        themeId: activeTheme?.id,
      });
    }
  };

  const handleDoubleSelectVerse = async (
    versionId: string,
    bookId: string,
    chapterNumber: number,
    verseNumber: number,
    secondaryVersionId?: string
  ) => {
    if (window.scriptureStudioApi) {
      await window.scriptureStudioApi.presentation.previewReference({
        versionId,
        secondaryVersionId,
        bookId,
        chapterNumber,
        startVerse: verseNumber,
        themeId: activeTheme?.id,
      });
      await window.scriptureStudioApi.display.openOutputs();
      await window.scriptureStudioApi.presentation.takeLive();
      setIsOutputOpen(true);
    }
  };

  const handleStageSearchResult = (item: SearchFullTextResultItem) => {
    if (window.scriptureStudioApi) {
      window.scriptureStudioApi.presentation.previewReference({
        versionId: item.versionId,
        bookId: item.bookId,
        chapterNumber: item.chapterNumber,
        startVerse: item.verseNumber,
        themeId: activeTheme?.id,
      });
    }
  };

  const handleTakeLiveSearchResult = async (item: SearchFullTextResultItem) => {
    if (window.scriptureStudioApi) {
      await window.scriptureStudioApi.presentation.previewReference({
        versionId: item.versionId,
        bookId: item.bookId,
        chapterNumber: item.chapterNumber,
        startVerse: item.verseNumber,
        themeId: activeTheme?.id,
      });
      await window.scriptureStudioApi.display.openOutputs();
      await window.scriptureStudioApi.presentation.takeLive();
      setIsOutputOpen(true);
    }
  };

  const handleStageProgramItem = (item: ProgramItemDto) => {
    if (item.reference && window.scriptureStudioApi) {
      window.scriptureStudioApi.presentation.previewReference({
        versionId: item.reference.versionId || 'kjv',
        bookId: item.reference.bookId,
        chapterNumber: item.reference.chapterNumber,
        startVerse: item.reference.startVerse,
        endVerse: item.reference.endVerse,
        themeId: activeTheme?.id,
      });
    }
  };

  const handleTakeLiveProgramItem = async (item: ProgramItemDto) => {
    if (item.reference && window.scriptureStudioApi) {
      await window.scriptureStudioApi.presentation.previewReference({
        versionId: item.reference.versionId || 'kjv',
        bookId: item.reference.bookId,
        chapterNumber: item.reference.chapterNumber,
        startVerse: item.reference.startVerse,
        endVerse: item.reference.endVerse,
        themeId: activeTheme?.id,
      });
      await window.scriptureStudioApi.display.openOutputs();
      await window.scriptureStudioApi.presentation.takeLive();
      setIsOutputOpen(true);
    }
  };

  const handleRecallPreview = (entry: PresentationHistoryEntryDto) => {
    if (window.scriptureStudioApi) {
      window.scriptureStudioApi.presentation.previewReference({
        versionId: entry.translationId || entry.reference.versionId || 'kjv',
        secondaryVersionId: entry.reference.secondaryVersionId,
        bookId: entry.reference.bookId,
        chapterNumber: entry.reference.chapterNumber,
        startVerse: entry.reference.startVerse,
        endVerse: entry.reference.endVerse,
        themeId: activeTheme?.id,
      });
    }
  };

  const handleRecallLive = async (entry: PresentationHistoryEntryDto) => {
    if (window.scriptureStudioApi) {
      await window.scriptureStudioApi.presentation.previewReference({
        versionId: entry.translationId || entry.reference.versionId || 'kjv',
        secondaryVersionId: entry.reference.secondaryVersionId,
        bookId: entry.reference.bookId,
        chapterNumber: entry.reference.chapterNumber,
        startVerse: entry.reference.startVerse,
        endVerse: entry.reference.endVerse,
        themeId: activeTheme?.id,
      });
      await window.scriptureStudioApi.display.openOutputs();
      await window.scriptureStudioApi.presentation.takeLive();
      setIsOutputOpen(true);
    }
  };

  const handleTakeLive = async () => {
    if (window.scriptureStudioApi) {
      await window.scriptureStudioApi.display.openOutputs();
      await window.scriptureStudioApi.presentation.takeLive();
      setIsOutputOpen(true);
    }
  };

  const handleNextVerse = async () => {
    if (!state?.previewSlide && !state?.liveSlide) return;
    if (window.scriptureStudioApi) {
      await window.scriptureStudioApi.presentation.next();
      if (!isOutputOpen && state?.mode === 'LIVE') {
        setIsOutputOpen(true);
      }
    }
  };

  const handlePrevVerse = async () => {
    if (!state?.previewSlide && !state?.liveSlide) return;
    if (window.scriptureStudioApi) {
      await window.scriptureStudioApi.presentation.prev();
      if (!isOutputOpen && state?.mode === 'LIVE') {
        setIsOutputOpen(true);
      }
    }
  };

  const handleCloseOutput = async () => {
    if (window.scriptureStudioApi) {
      if (window.scriptureStudioApi.presentation.stopLive) {
        await window.scriptureStudioApi.presentation.stopLive();
      }
      await window.scriptureStudioApi.display.closeOutputs();
      setIsOutputOpen(false);
    }
  };

  const handleToggleOutput = async () => {
    if (!window.scriptureStudioApi) return;
    if (isOutputOpen) {
      await handleCloseOutput();
    } else {
      // If a preview slide is staged, take it live upon launching output
      if (state?.previewSlide && !state.liveSlide) {
        await window.scriptureStudioApi.presentation.takeLive();
      }
      await window.scriptureStudioApi.display.openOutputs();
      setIsOutputOpen(true);
    }
  };

  const handleFreezeToggle = () => {
    if (!window.scriptureStudioApi || !state) return;
    if (state.isFrozen) {
      window.scriptureStudioApi.presentation.unfreeze();
    } else {
      window.scriptureStudioApi.presentation.freeze();
    }
  };

  const handleHideToggle = () => {
    if (!window.scriptureStudioApi || !state) return;
    if (state.isVisible) {
      window.scriptureStudioApi.presentation.hide();
    } else {
      window.scriptureStudioApi.presentation.unhide();
    }
  };

  const handleClear = async () => {
    if (window.scriptureStudioApi) {
      await window.scriptureStudioApi.presentation.clear();
      await window.scriptureStudioApi.display.closeOutputs();
      setIsOutputOpen(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: 'var(--bg-app)',
      }}
    >
      {/* Top Header */}
      <header
        style={{
          height: '52px',
          backgroundColor: 'var(--bg-panel)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F1F5F9' }}>
            📖 SCRIPTURE STUDIO
          </div>
          <span className="badge badge-idle" style={{ fontSize: '0.7rem' }}>
            OFFLINE READY
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>|</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            🖥️ {projectorStatus}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className="btn-secondary"
            onClick={handleReload}
            disabled={isReloading}
            title="Reload and update Bible translations list and studio state"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
          >
            <span
              style={{
                display: 'inline-block',
                transform: isReloading ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.4s ease',
              }}
            >
              🔄
            </span>
            <span>{isReloading ? 'Reloading...' : 'Reload'}</span>
          </button>

          <button
            className="btn-secondary"
            onClick={() => setIsDownloaderOpen(true)}
            title="Download new Bible translations for offline use"
          >
            <span>⬇ Download Bibles</span>
          </button>

          <button
            className={isOutputOpen ? 'btn-primary' : 'btn-secondary'}
            onClick={handleToggleOutput}
            title={
              isOutputOpen
                ? 'Audience Output Window is Active (Click to Close)'
                : 'Launch Output Window (Full Screen on Projector, or Windowed Preview on Single Display)'
            }
            style={{
              backgroundColor: isOutputOpen ? '#059669' : undefined,
              borderColor: isOutputOpen ? '#10B981' : undefined,
              fontWeight: 600,
            }}
          >
            <span>{isOutputOpen ? '🟢 Output Active' : '📽️ Open Output'}</span>
          </button>

          {/* Screen / Projector Target Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>Screen:</span>
            <select
              value={selectedAudienceDisplayId}
              onChange={(e) => handleSelectMonitor(e.target.value)}
              title="Select which monitor or projector will display the live scripture presentation"
              style={{
                fontSize: '0.82rem',
                padding: '0.35rem 0.5rem',
                backgroundColor: 'var(--bg-card)',
                color: '#F1F5F9',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
              }}
            >
              {displays.length === 0 ? (
                <option value="">Primary Display</option>
              ) : (
                displays.map((d, idx) => (
                  <option key={d.id} value={d.id}>
                    {d.isPrimary ? 'Primary Display' : `Display ${idx + 1}`} ({d.bounds.width}x{d.bounds.height})
                    {d.id === selectedAudienceDisplayId ? ' 📽️' : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Theme:</span>
            <select
              value={activeTheme?.id || ''}
              onChange={(e) => {
                const t = themes.find((x) => x.id === e.target.value);
                if (t) {
                  setActiveTheme(t);
                  if (window.scriptureStudioApi?.presentation?.setTheme) {
                    window.scriptureStudioApi.presentation.setTheme(t.id);
                  }
                }
              }}
            >
              {themes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar Navigation Rail (Collapsible / Expandable) */}
        <aside
          style={{
            width: isNavCollapsed ? '64px' : '200px',
            transition: 'width 0.22s ease-in-out',
            backgroundColor: 'var(--bg-panel)',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isNavCollapsed ? 'center' : 'stretch',
            padding: isNavCollapsed ? '0.75rem 0' : '0.75rem 0.6rem',
            gap: '0.4rem',
            flexShrink: 0,
            overflow: 'hidden',
            userSelect: 'none',
          }}
        >
          {/* Collapse / Expand Toggle Button */}
          {isNavCollapsed ? (
            <button
              type="button"
              onClick={toggleNavCollapse}
              title="Expand Navigation (Show Labels)"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '1.25rem',
                padding: '0.4rem',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '38px',
                marginBottom: '0.75rem',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              ☰
            </button>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.2rem 0.4rem 0.5rem 0.5rem',
                borderBottom: '1px solid var(--border-color)',
                marginBottom: '0.5rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                }}
              >
                Navigation
              </span>
              <button
                type="button"
                onClick={toggleNavCollapse}
                title="Collapse Sidebar to Icons"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.45rem',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-dim)';
                }}
              >
                ◀ Collapse
              </button>
            </div>
          )}

          {/* Nav Items */}
          {[
            { id: 'bible', label: 'Bible Reader', icon: '📖', hotkey: 'F5' },
            { id: 'search', label: 'Search Bible', icon: '🔍', hotkey: 'F6' },
            { id: 'programs', label: 'Programs', icon: '📋' },
            { id: 'themes', label: 'Theme Styler', icon: '🎨' },
            { id: 'history', label: 'History Log', icon: '🕒' },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                title={isNavCollapsed ? `${item.label}${item.hotkey ? ` (${item.hotkey})` : ''}` : undefined}
                onClick={() => setActiveTab(item.id as SidebarTab)}
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: isNavCollapsed ? '42px' : '100%',
                  height: '42px',
                  padding: isNavCollapsed ? '0' : '0 0.75rem',
                  justifyContent: isNavCollapsed ? 'center' : 'flex-start',
                  borderRadius: '6px',
                  backgroundColor: isActive ? 'rgba(16, 185, 129, 0.16)' : 'transparent',
                  borderLeft: isNavCollapsed
                    ? isActive
                      ? '3px solid var(--primary)'
                      : '3px solid transparent'
                    : isActive
                    ? '3px solid var(--primary)'
                    : '3px solid transparent',
                  color: isActive ? '#FFFFFF' : 'var(--text-dim)',
                  transition: 'all 0.15s ease',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{item.icon}</span>
                {!isNavCollapsed && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flex: 1,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                      }}
                    >
                      {item.label}
                    </span>
                    {item.hotkey && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          color: 'var(--text-dim)',
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        {item.hotkey}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </aside>

        {/* Central Content Area Switching based on activeTab */}
        <main style={{ flex: 1, padding: '1rem', overflow: 'hidden' }}>
          {activeTab === 'bible' && (
            <BibleReaderWorkspace
              refreshKey={refreshCounter}
              onSelectVerse={handleSelectVerse}
              onDoubleSelectVerse={handleDoubleSelectVerse}
              activeReference={state?.liveSlide?.reference || state?.previewSlide?.reference}
              activeVerseNumber={
                state?.liveSlide
                  ? state.liveSlide.verses[0]?.verseNumber
                  : state?.previewSlide
                  ? state.previewSlide.verses[0]?.verseNumber
                  : null
              }
            />
          )}

          {activeTab === 'search' && (
            <SearchWorkspace
              onStageResult={handleStageSearchResult}
              onTakeLiveResult={handleTakeLiveSearchResult}
            />
          )}

          {activeTab === 'programs' && (
            <ProgramEditorWorkspace
              onStageItem={handleStageProgramItem}
              onTakeLiveItem={handleTakeLiveProgramItem}
            />
          )}

          {activeTab === 'themes' && (
            <ThemeEditorWorkspace
              onThemeUpdated={(t) => {
                setActiveTheme(t);
              }}
            />
          )}

          {activeTab === 'history' && (
            <HistoryWorkspace
              onRecallLive={handleRecallLive}
              onRecallPreview={handleRecallPreview}
              lastUpdatedTimestamp={state?.lastUpdatedTimestamp}
            />
          )}
        </main>

        {/* Right Panel: Preview & Control */}
        <section
          style={{
            width: '420px',
            backgroundColor: 'var(--bg-panel)',
            borderLeft: '1px solid var(--border-color)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <PreviewPane
            state={state}
            activeTheme={activeTheme}
            onTakeLive={handleTakeLive}
            onNextVerse={handleNextVerse}
            onPrevVerse={handlePrevVerse}
          />
        </section>
      </div>

      {/* Bottom Transport Bar */}
      <TransportBar
        state={state}
        onFreezeToggle={handleFreezeToggle}
        onHideToggle={handleHideToggle}
      />

      {/* In-App Translation Downloader Modal */}
      <TranslationDownloaderModal
        isOpen={isDownloaderOpen}
        onClose={() => setIsDownloaderOpen(false)}
        onDownloaded={handleReload}
      />
    </div>
  );
}
