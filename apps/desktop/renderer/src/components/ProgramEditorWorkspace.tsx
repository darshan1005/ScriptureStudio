import React, { useEffect, useState } from 'react';
import { BibleVersionDto, ProgramDto, ProgramItemDto } from '@scripture-studio/shared-types';
import { MaterialIcon } from './MaterialIcon.js';

interface ProgramEditorWorkspaceProps {
  onStageItem: (item: ProgramItemDto, secondaryVersionId?: string) => void;
  onTakeLiveItem: (item: ProgramItemDto, secondaryVersionId?: string) => void;
  primaryVersionId?: string;
  onPrimaryVersionChange?: (versionId: string) => void;
  secondaryVersionId?: string;
  onSecondaryVersionChange?: (versionId: string) => void;
}

export const ProgramEditorWorkspace: React.FC<ProgramEditorWorkspaceProps> = ({
  onStageItem,
  onTakeLiveItem,
  primaryVersionId: propPrimaryVersionId,
  secondaryVersionId: propSecondaryVersionId,
}) => {
  const [programs, setPrograms] = useState<ProgramDto[]>([]);
  const [activeProgram, setActiveProgram] = useState<ProgramDto | null>(null);
  const [newProgramName, setNewProgramName] = useState<string>('');
  const [newVerseRef, setNewVerseRef] = useState<string>('');
  const [newItemTitle, setNewItemTitle] = useState<string>('');
  const [versions, setVersions] = useState<BibleVersionDto[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>(propPrimaryVersionId || 'kjv');
  const [secondaryVersionId, setSecondaryVersionId] = useState<string>(propSecondaryVersionId ?? 'tel');
  const [inputError, setInputError] = useState<string>('');
  const [isAddingItem, setIsAddingItem] = useState<boolean>(false);

  // Keep primaryVersionId in sync with global parent
  useEffect(() => {
    if (propPrimaryVersionId && propPrimaryVersionId !== selectedVersionId) {
      setSelectedVersionId(propPrimaryVersionId);
    }
  }, [propPrimaryVersionId]);

  useEffect(() => {
    if (propSecondaryVersionId !== undefined && propSecondaryVersionId !== secondaryVersionId) {
      setSecondaryVersionId(propSecondaryVersionId);
    }
  }, [propSecondaryVersionId]);

  const loadPrograms = async () => {
    if (window.scriptureStudioApi) {
      try {
        const res = await window.scriptureStudioApi.programs.list();
        setPrograms(res.programs || []);
        if (res.programs && res.programs.length > 0) {
          setActiveProgram((prev) => {
            if (prev) {
              const matched = res.programs.find((p) => p.id === prev.id);
              if (matched) return matched;
            }
            return res.programs[0] || null;
          });
        } else {
          setActiveProgram(null);
        }
      } catch (err) {
        console.error('Error loading programs:', err);
      }
    }
  };

  useEffect(() => {
    loadPrograms();

    if (window.scriptureStudioApi) {
      window.scriptureStudioApi.bible.getVersions().then((res) => {
        setVersions(res.versions || []);
        if (res.versions && res.versions.length > 0) {
          const defaultVer = res.versions.find((v) => v.id === 'kjv') || res.versions[0];
          if (defaultVer) setSelectedVersionId(defaultVer.id);
        }
      });
    }
  }, []);

  const handleCreateProgram = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = newProgramName.trim();
    if (!name || !window.scriptureStudioApi) return;

    const newProg: ProgramDto = {
      id: `prog_${Date.now()}`,
      name,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await window.scriptureStudioApi.programs.save({ program: newProg });
      setNewProgramName('');
      await loadPrograms();
      setActiveProgram(newProg);
    } catch (err) {
      console.error('Failed to create program:', err);
      alert('Could not save program: ' + String(err));
    }
  };

  const handleDeleteProgram = async (progId: string, progName: string) => {
    if (!window.confirm(`Are you sure you want to delete the playlist "${progName}"?`)) {
      return;
    }
    if (!window.scriptureStudioApi) return;

    try {
      await window.scriptureStudioApi.programs.delete(progId);
      await loadPrograms();
    } catch (err) {
      console.error('Failed to delete program:', err);
    }
  };

  const handleAddVerseToProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError('');
    const refQuery = newVerseRef.trim();
    if (!activeProgram || !refQuery || !window.scriptureStudioApi) return;

    setIsAddingItem(true);
    try {
      const parsed = await window.scriptureStudioApi.search.parseReference({ query: refQuery });
      if (!parsed.isValid || !parsed.reference) {
        setInputError(parsed.error || `Could not parse "${refQuery}". Try "John 3:16" or "Romans 8:28".`);
        return;
      }

      // Assign chosen primary and secondary translations
      const refWithVersion = {
        ...parsed.reference,
        versionId: selectedVersionId,
        secondaryVersionId: secondaryVersionId || undefined,
      };

      const primaryAbbr = versions.find((v) => v.id === selectedVersionId)?.abbreviation || selectedVersionId.toUpperCase();
      const secAbbr = secondaryVersionId ? versions.find((v) => v.id === secondaryVersionId)?.abbreviation || secondaryVersionId.toUpperCase() : null;

      const newItem: ProgramItemDto = {
        id: `item_${Date.now()}`,
        programId: activeProgram.id,
        position: activeProgram.items.length,
        itemType: 'SCRIPTURE',
        reference: refWithVersion,
        customTitle: newItemTitle.trim() || parsed.formattedDisplay,
        notes: `${primaryAbbr}${secAbbr ? ` + ${secAbbr}` : ''} • ${parsed.formattedDisplay}`,
      };

      const updatedProgram: ProgramDto = {
        ...activeProgram,
        items: [...activeProgram.items, newItem],
        updatedAt: new Date().toISOString(),
      };

      await window.scriptureStudioApi.programs.save({ program: updatedProgram });
      setActiveProgram(updatedProgram);
      setNewVerseRef('');
      setNewItemTitle('');
      await loadPrograms();
    } catch (err) {
      setInputError('Error adding item: ' + String(err));
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleDeleteItem = async (index: number) => {
    if (!activeProgram || !window.scriptureStudioApi) return;
    const updatedItems = activeProgram.items
      .filter((_, i) => i !== index)
      .map((it, idx) => ({ ...it, position: idx }));

    const updatedProgram: ProgramDto = {
      ...activeProgram,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };

    await window.scriptureStudioApi.programs.save({ program: updatedProgram });
    setActiveProgram(updatedProgram);
    await loadPrograms();
  };

  const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
    if (!activeProgram || !window.scriptureStudioApi) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeProgram.items.length) return;

    const items = [...activeProgram.items];
    const [moved] = items.splice(index, 1);
    items.splice(targetIndex, 0, moved!);

    const updatedProgram: ProgramDto = {
      ...activeProgram,
      items: items.map((it, idx) => ({ ...it, position: idx })),
      updatedAt: new Date().toISOString(),
    };

    await window.scriptureStudioApi.programs.save({ program: updatedProgram });
    setActiveProgram(updatedProgram);
    await loadPrograms();
  };

  const handleCreateSampleService = async () => {
    if (!window.scriptureStudioApi) return;

    const sampleProg: ProgramDto = {
      id: `prog_${Date.now()}`,
      name: 'Sunday Worship Service',
      description: 'Standard Order of Service with Scriptures',
      items: [
        {
          id: `item_${Date.now()}_1`,
          programId: `prog_${Date.now()}`,
          position: 0,
          itemType: 'SCRIPTURE',
          reference: {
            bookId: 'kjv_psa',
            bookName: 'Psalms',
            chapterNumber: 100,
            startVerse: 1,
            endVerse: 5,
            versionId: selectedVersionId,
          },
          customTitle: 'Call to Worship: Psalm 100',
          notes: 'Congregational Reading',
        },
        {
          id: `item_${Date.now()}_2`,
          programId: `prog_${Date.now()}`,
          position: 1,
          itemType: 'SCRIPTURE',
          reference: {
            bookId: 'kjv_jhn',
            bookName: 'John',
            chapterNumber: 3,
            startVerse: 16,
            endVerse: 17,
            versionId: selectedVersionId,
          },
          customTitle: 'Sermon Scripture: John 3:16-17',
          notes: 'Main Sermon Text',
        },
        {
          id: `item_${Date.now()}_3`,
          programId: `prog_${Date.now()}`,
          position: 2,
          itemType: 'SCRIPTURE',
          reference: {
            bookId: 'kjv_2co',
            bookName: '2 Corinthians',
            chapterNumber: 13,
            startVerse: 14,
            versionId: selectedVersionId,
          },
          customTitle: 'Benediction: 2 Corinthians 13:14',
          notes: 'Closing Blessing',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await window.scriptureStudioApi.programs.save({ program: sampleProg });
    await loadPrograms();
    setActiveProgram(sampleProg);
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        backgroundColor: 'var(--bg-panel)',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
      }}
    >
      {/* Left Sidebar: Playlists & Programs List */}
      <div
        style={{
          width: '290px',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <div
          style={{
            padding: '0.85rem 1rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MaterialIcon name="playlist_play" size={19} />
            <span>Service Playlists</span>
          </div>

          <form onSubmit={handleCreateProgram} style={{ display: 'flex', gap: '0.4rem' }}>
            <input
              type="text"
              value={newProgramName}
              onChange={(e) => setNewProgramName(e.target.value)}
              placeholder="New Playlist Name..."
              style={{ flex: 1, fontSize: '0.82rem', padding: '0.35rem 0.5rem' }}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.82rem', fontWeight: 600 }}
              title="Create new service playlist"
            >
              + Create
            </button>
          </form>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {programs.length === 0 ? (
            <div style={{ padding: '1.5rem 0.75rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
              <p style={{ margin: '0 0 0.75rem 0' }}>No playlists saved yet.</p>
              <button
                type="button"
                onClick={handleCreateSampleService}
                style={{
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.78rem',
                  backgroundColor: '#1E293B',
                  color: '#CBD5E1',
                  border: '1px dashed #475569',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <MaterialIcon name="auto_awesome" size={15} />
                <span>Add Sample Sunday Service</span>
              </button>
            </div>
          ) : (
            programs.map((p) => {
              const isSelected = activeProgram?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setActiveProgram(p)}
                  style={{
                    padding: '0.65rem 0.8rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--bg-hover)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                    marginBottom: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background-color 0.15s',
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div
                      style={{
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? '#FFFFFF' : '#CBD5E1',
                        fontSize: '0.88rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                      {p.items?.length || 0} scripture items
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProgram(p.id, p.name);
                    }}
                    title={`Delete playlist "${p.name}"`}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      opacity: isSelected ? 0.8 : 0.4,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#EF4444';
                      e.currentTarget.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-dim)';
                      e.currentTarget.style.opacity = isSelected ? '0.8' : '0.4';
                    }}
                  >
                    <MaterialIcon name="delete" size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Area: Items in Selected Playlist */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)' }}>
        {activeProgram ? (
          <>
            {/* Playlist Header */}
            <div
              style={{
                padding: '0.75rem 1.25rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--bg-panel)',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F1F5F9', margin: 0 }}>
                  {activeProgram.name}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  {activeProgram.items.length} items in service order • Double-click any item to take live
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-secondary"
                  onClick={handleCreateSampleService}
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.35rem 0.65rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                  title="Add a sample service playlist"
                >
                  <MaterialIcon name="auto_awesome" size={15} />
                  <span>Template</span>
                </button>
              </div>
            </div>

            {/* Quick Add Scripture Form */}
            <div
              style={{
                padding: '0.75rem 1.25rem',
                backgroundColor: 'var(--bg-card)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              <form onSubmit={handleAddVerseToProgram} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <input
                    type="text"
                    value={newVerseRef}
                    onChange={(e) => {
                      setNewVerseRef(e.target.value);
                      if (inputError) setInputError('');
                    }}
                    placeholder="Scripture Reference (e.g. John 3:16, Rom 8:28)..."
                    style={{ width: '260px', fontSize: '0.85rem' }}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <input
                    type="text"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    placeholder="Custom Title (optional, e.g. Sermon Key Verse)..."
                    style={{ width: '220px', fontSize: '0.85rem' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isAddingItem || !newVerseRef.trim()}
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  {isAddingItem ? 'Adding...' : '+ Add to Playlist'}
                </button>
              </form>

              {inputError && (
                <div style={{ color: '#F87171', fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MaterialIcon name="warning" size={15} color="#F87171" />
                  <span>{inputError}</span>
                </div>
              )}
            </div>

            {/* Program Items List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {activeProgram.items.length === 0 ? (
                <div
                  style={{
                    padding: '3rem 1rem',
                    textAlign: 'center',
                    color: 'var(--text-dim)',
                    backgroundColor: 'rgba(15, 23, 42, 0.4)',
                    borderRadius: '8px',
                    border: '1px dashed var(--border-color)',
                  }}
                >
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#94A3B8' }}>
                    No scriptures added to this playlist yet.
                  </p>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>
                    Type a reference above (like <code>John 3:16</code> or <code>Psalm 23</code>) and click "+ Add to Playlist".
                  </p>
                </div>
              ) : (
                activeProgram.items.map((item, index) => {
                  const effectiveSec = item.reference?.secondaryVersionId || (secondaryVersionId ? secondaryVersionId : undefined);
                  const primAbbr = item.reference?.versionId?.toUpperCase() || 'KJV';
                  const secAbbr = effectiveSec?.toUpperCase();

                  return (
                    <div
                      key={item.id}
                      onClick={() => onStageItem(item, effectiveSec)}
                      onDoubleClick={() => onTakeLiveItem(item, effectiveSec)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s, background-color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: '#0F172A',
                            color: '#94A3B8',
                            border: '1px solid #334155',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                          }}
                        >
                          {index + 1}
                        </span>

                        <div>
                          <div style={{ fontWeight: 600, color: '#E2E8F0', fontSize: '0.92rem' }}>
                            {item.customTitle || 'Scripture'}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span>
                              {item.reference ? `${item.reference.bookName || ''} ${item.reference.chapterNumber}:${item.reference.startVerse}${item.reference.endVerse ? `-${item.reference.endVerse}` : ''}` : ''}
                            </span>
                            <span
                              style={{
                                backgroundColor: '#334155',
                                color: '#CBD5E1',
                                padding: '1px 5px',
                                borderRadius: '3px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                              }}
                            >
                              {primAbbr}
                            </span>
                            {effectiveSec && (
                              <span
                                style={{
                                  backgroundColor: '#1E293B',
                                  border: '1px solid #475569',
                                  color: '#94A3B8',
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                }}
                              >
                                + {secAbbr}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {/* Reorder Buttons */}
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveItem(index, 'up');
                          }}
                          style={{
                            padding: '0.25rem 0.45rem',
                            fontSize: '0.75rem',
                            backgroundColor: 'transparent',
                            color: index === 0 ? '#475569' : '#94A3B8',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            cursor: index === 0 ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Move Up"
                        >
                          <MaterialIcon name="arrow_drop_up" size={16} />
                        </button>

                        <button
                          type="button"
                          disabled={index === activeProgram.items.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveItem(index, 'down');
                          }}
                          style={{
                            padding: '0.25rem 0.45rem',
                            fontSize: '0.75rem',
                            backgroundColor: 'transparent',
                            color: index === activeProgram.items.length - 1 ? '#475569' : '#94A3B8',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            cursor: index === activeProgram.items.length - 1 ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Move Down"
                        >
                          <MaterialIcon name="arrow_drop_down" size={16} />
                        </button>

                        {/* Preview Button */}
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{
                            padding: '0.3rem 0.65rem',
                            fontSize: '0.78rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onStageItem(item, effectiveSec);
                          }}
                          title="Stage in preview monitor"
                        >
                          <MaterialIcon name="visibility" size={14} />
                          <span>Preview</span>
                        </button>

                        {/* Live Button */}
                        <button
                          type="button"
                          className="btn-primary"
                          style={{
                            padding: '0.3rem 0.75rem',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTakeLiveItem(item, effectiveSec);
                          }}
                          title="Take live immediately on audience display"
                        >
                          <MaterialIcon name="bolt" size={15} />
                          <span>Live</span>
                        </button>

                        {/* Delete Item Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(index);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.2rem 0.4rem',
                          marginLeft: '0.2rem',
                        }}
                        title="Remove item from playlist"
                      >
                        <MaterialIcon name="close" size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-dim)' }}>
            <div style={{ opacity: 0.4, color: '#64748B' }}>
              <MaterialIcon name="playlist_play" size={64} />
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#94A3B8' }}>
              Select or create a service playlist to begin.
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={handleCreateSampleService}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <MaterialIcon name="auto_awesome" size={16} />
              <span>Create Sample Sunday Service Playlist</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
