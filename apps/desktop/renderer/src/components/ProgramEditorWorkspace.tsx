import React, { useEffect, useState } from 'react';
import { BibleVersionDto, PresentationStateDto, ProgramDto, ProgramItemDto, ScriptureReference } from '@scripture-studio/shared-types';
import { MaterialIcon } from './MaterialIcon.js';

interface ProgramEditorWorkspaceProps {
  onStageItem: (item: ProgramItemDto, secondaryVersionId?: string, verseNumber?: number) => void;
  onTakeLiveItem: (item: ProgramItemDto, secondaryVersionId?: string, verseNumber?: number) => void;
  onOpenInReader?: (reference: ScriptureReference) => void;
  primaryVersionId?: string;
  onPrimaryVersionChange?: (versionId: string) => void;
  secondaryVersionId?: string;
  onSecondaryVersionChange?: (versionId: string) => void;
  presentationState?: PresentationStateDto | null;
}

export const ProgramEditorWorkspace: React.FC<ProgramEditorWorkspaceProps> = ({
  onStageItem,
  onTakeLiveItem,
  onOpenInReader,
  primaryVersionId: propPrimaryVersionId,
  secondaryVersionId: propSecondaryVersionId,
  presentationState,
}) => {
  const [programs, setPrograms] = useState<ProgramDto[]>([]);
  const [activeProgram, setActiveProgram] = useState<ProgramDto | null>(null);
  const [newProgramName, setNewProgramName] = useState<string>('');
  const [newVerseRef, setNewVerseRef] = useState<string>('');
  const [newItemTitle, setNewItemTitle] = useState<string>('');
  const [newItemNotes, setNewItemNotes] = useState<string>('');
  const [versions, setVersions] = useState<BibleVersionDto[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>(propPrimaryVersionId || 'kjv');
  const [secondaryVersionId, setSecondaryVersionId] = useState<string>(propSecondaryVersionId ?? 'tel');
  const [inputError, setInputError] = useState<string>('');
  const [isAddingItem, setIsAddingItem] = useState<boolean>(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeVerseMap, setActiveVerseMap] = useState<Record<string, number>>({});
  const [chapterMaxVerseMap, setChapterMaxVerseMap] = useState<Record<string, number>>({});

  // Program Name editing state
  const [isEditingProgramName, setIsEditingProgramName] = useState<boolean>(false);
  const [editingProgramName, setEditingProgramName] = useState<string>('');

  // Item editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemTitle, setEditItemTitle] = useState<string>('');
  const [editItemRef, setEditItemRef] = useState<string>('');
  const [editItemNotes, setEditItemNotes] = useState<string>('');
  const [editPrimaryVer, setEditPrimaryVer] = useState<string>('kjv');
  const [editSecondaryVer, setEditSecondaryVer] = useState<string>('');
  const [editItemError, setEditItemError] = useState<string>('');
  const [isSavingEditItem, setIsSavingEditItem] = useState<boolean>(false);

  const getItemMaxVerse = (item: ProgramItemDto): number => {
    const rawEnd = item.reference?.endVerse || item.reference?.startVerse || 1;
    const key = `${item.reference?.bookId || item.reference?.bookName}_${item.reference?.chapterNumber}`;
    const maxKnown = chapterMaxVerseMap[key];
    if (maxKnown && maxKnown > 0) {
      return Math.min(rawEnd, maxKnown);
    }
    return rawEnd;
  };

  const getItemActiveVerse = (item: ProgramItemDto): number => {
    const maxV = getItemMaxVerse(item);
    // If presentation has live slide matching this item, reflect current live verse
    if (
      presentationState?.mode === 'LIVE' &&
      presentationState?.liveSlide?.reference &&
      item.reference &&
      presentationState.liveSlide.reference.chapterNumber === item.reference.chapterNumber &&
      (
        presentationState.liveSlide.reference.bookId?.toLowerCase().endsWith(item.reference.bookId?.toLowerCase() || '') ||
        presentationState.liveSlide.reference.bookName?.toLowerCase() === item.reference.bookName?.toLowerCase()
      )
    ) {
      const liveVerse = presentationState.liveSlide.verses[0]?.verseNumber || presentationState.liveSlide.reference.startVerse;
      if (liveVerse >= (item.reference.startVerse || 1) && liveVerse <= maxV) {
        return liveVerse;
      }
    }

    if (activeVerseMap[item.id] !== undefined) {
      return Math.min(activeVerseMap[item.id]!, maxV);
    }
    return item.reference?.startVerse || 1;
  };

  const handleStage = (item: ProgramItemDto, effectiveSec?: string, verseNum?: number) => {
    setSelectedItemId(item.id);
    const targetVerse = verseNum ?? getItemActiveVerse(item);
    setActiveVerseMap((prev) => ({ ...prev, [item.id]: targetVerse }));
    onStageItem(item, effectiveSec, targetVerse);
  };

  const handleTakeLive = (item: ProgramItemDto, effectiveSec?: string, verseNum?: number) => {
    setSelectedItemId(item.id);
    const targetVerse = verseNum ?? getItemActiveVerse(item);
    setActiveVerseMap((prev) => ({ ...prev, [item.id]: targetVerse }));
    onTakeLiveItem(item, effectiveSec, targetVerse);
  };

  const handleStepVerse = (item: ProgramItemDto, newVerse: number, effectiveSec?: string) => {
    const startV = item.reference?.startVerse || 1;
    const endV = getItemMaxVerse(item);
    const clamped = Math.max(startV, Math.min(endV, newVerse));

    setSelectedItemId(item.id);
    setActiveVerseMap((prev) => ({ ...prev, [item.id]: clamped }));

    // Check if this item is currently Live
    const isLive =
      presentationState?.mode === 'LIVE' &&
      presentationState?.liveSlide &&
      item.reference &&
      presentationState.liveSlide.reference?.chapterNumber === item.reference.chapterNumber &&
      (
        presentationState.liveSlide.reference.bookId?.toLowerCase().endsWith(item.reference.bookId?.toLowerCase() || '') ||
        presentationState.liveSlide.reference.bookName?.toLowerCase() === item.reference.bookName?.toLowerCase()
      );

    if (isLive) {
      onTakeLiveItem(item, effectiveSec, clamped);
    } else {
      onStageItem(item, effectiveSec, clamped);
    }
  };

  const handleSaveProgramName = async () => {
    if (!activeProgram || !window.scriptureStudioApi) return;
    const trimmed = editingProgramName.trim();
    if (!trimmed) {
      setIsEditingProgramName(false);
      return;
    }
    const updated: ProgramDto = {
      ...activeProgram,
      name: trimmed,
      updatedAt: new Date().toISOString(),
    };
    try {
      await window.scriptureStudioApi.programs.save({ program: updated });
      setActiveProgram(updated);
      setIsEditingProgramName(false);
      await loadPrograms();
    } catch (err) {
      console.error('Failed to update program name:', err);
      alert('Could not update playlist name: ' + String(err));
    }
  };

  const startEditingItem = (item: ProgramItemDto) => {
    setEditingItemId(item.id);
    setEditItemTitle(item.customTitle || '');
    const maxV = getItemMaxVerse(item);
    const refStr = item.reference
      ? `${item.reference.bookName || ''} ${item.reference.chapterNumber}:${item.reference.startVerse}${maxV > item.reference.startVerse ? `-${maxV}` : ''}`.trim()
      : '';
    setEditItemRef(refStr);
    const isOldGenerated = item.notes && /^[A-Za-z0-9\s+]+\s*•\s*[1-3]?\s*[A-Za-z]+/.test(item.notes);
    setEditItemNotes(isOldGenerated ? '' : item.notes || '');
    setEditPrimaryVer(item.reference?.versionId || selectedVersionId || 'kjv');
    setEditSecondaryVer(item.reference?.secondaryVersionId || secondaryVersionId || '');
    setEditItemError('');
  };

  const cancelEditingItem = () => {
    setEditingItemId(null);
    setEditItemError('');
  };

  const handleSaveEditedItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeProgram || !editingItemId || !window.scriptureStudioApi) return;

    const query = editItemRef.trim();
    if (!query) {
      setEditItemError('Please enter a scripture reference (e.g. John 3:16).');
      return;
    }

    setIsSavingEditItem(true);
    setEditItemError('');

    try {
      const parsed = await window.scriptureStudioApi.search.parseReference({ query });
      if (!parsed.isValid || !parsed.reference) {
        setEditItemError(parsed.error || `Could not parse "${query}". Try "John 3:16" or "Psalm 23:1-6".`);
        setIsSavingEditItem(false);
        return;
      }

      const refWithVer: ScriptureReference = {
        ...parsed.reference,
        versionId: editPrimaryVer,
        secondaryVersionId: editSecondaryVer || undefined,
      };

      const updatedItems = activeProgram.items.map((it) => {
        if (it.id !== editingItemId) return it;
        return {
          ...it,
          reference: refWithVer,
          customTitle: editItemTitle.trim() || parsed.formattedDisplay,
          notes: editItemNotes.trim(),
        };
      });

      const updatedProgram: ProgramDto = {
        ...activeProgram,
        items: updatedItems,
        updatedAt: new Date().toISOString(),
      };

      await window.scriptureStudioApi.programs.save({ program: updatedProgram });
      setActiveProgram(updatedProgram);
      setEditingItemId(null);
      await loadPrograms();
    } catch (err) {
      setEditItemError('Error saving item: ' + String(err));
    } finally {
      setIsSavingEditItem(false);
    }
  };

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

  // Dynamically resolve and cache max verses for all chapters in current playlist items
  useEffect(() => {
    if (!activeProgram || !window.scriptureStudioApi?.bible?.getChapter) return;
    activeProgram.items.forEach(async (item) => {
      if (!item.reference) return;
      const key = `${item.reference.bookId || item.reference.bookName}_${item.reference.chapterNumber}`;
      if (chapterMaxVerseMap[key]) return;
      try {
        const chData = await window.scriptureStudioApi.bible.getChapter({
          versionId: item.reference.versionId || selectedVersionId || 'kjv',
          bookId: item.reference.bookId || item.reference.bookName || '',
          chapterNumber: item.reference.chapterNumber,
        });
        if (chData?.verses?.length) {
          const maxV = Math.max(...chData.verses.map((v) => v.verseNumber));
          setChapterMaxVerseMap((prev) => ({ ...prev, [key]: maxV }));
        }
      } catch {
        // Fallback gracefully
      }
    });
  }, [activeProgram, selectedVersionId]);

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

      const newItem: ProgramItemDto = {
        id: `item_${Date.now()}`,
        programId: activeProgram.id,
        position: activeProgram.items.length,
        itemType: 'SCRIPTURE',
        reference: refWithVersion,
        customTitle: newItemTitle.trim() || parsed.formattedDisplay,
        notes: newItemNotes.trim(),
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
      setNewItemNotes('');
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
            bookId: 'kjv_ps',
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
            bookId: 'kjv_john',
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
            bookId: 'kjv_2cor',
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
                {isEditingProgramName ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                    <input
                      type="text"
                      value={editingProgramName}
                      onChange={(e) => setEditingProgramName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveProgramName();
                        if (e.key === 'Escape') setIsEditingProgramName(false);
                      }}
                      autoFocus
                      placeholder="Playlist Name..."
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.6rem',
                        borderRadius: '4px',
                        border: '1px solid var(--primary, #0D9488)',
                        backgroundColor: '#0F172A',
                        color: '#F8FAFC',
                        width: '260px',
                      }}
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleSaveProgramName}
                      style={{ padding: '0.25rem 0.55rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center' }}
                      title="Save Playlist Name"
                    >
                      <MaterialIcon name="check" size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setIsEditingProgramName(false)}
                      style={{ padding: '0.25rem 0.55rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center' }}
                      title="Cancel"
                    >
                      <MaterialIcon name="close" size={15} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F1F5F9', margin: 0 }}>
                      {activeProgram.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProgramName(activeProgram.name);
                        setIsEditingProgramName(true);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: '4px',
                        transition: 'color 0.15s',
                      }}
                      title="Rename Playlist"
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                    >
                      <MaterialIcon name="edit" size={15} />
                    </button>
                  </div>
                )}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  {activeProgram.items.length} items in service order • Click to preview, or click Live to present
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
                    style={{ width: '250px', fontSize: '0.85rem' }}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <input
                    type="text"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    placeholder="Custom Title (optional, e.g. Sermon Key Verse)..."
                    style={{ width: '210px', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <input
                    type="text"
                    value={newItemNotes}
                    onChange={(e) => setNewItemNotes(e.target.value)}
                    placeholder="Notes (optional, e.g. Congregational Reading)..."
                    style={{ width: '230px', fontSize: '0.85rem' }}
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
                  const isSelected = selectedItemId === item.id;

                  if (editingItemId === item.id) {
                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: '1rem',
                          borderRadius: '6px',
                          backgroundColor: '#1E293B',
                          border: '1px solid var(--primary, #0D9488)',
                          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <MaterialIcon name="edit_note" size={18} />
                            <span>Edit Program Item #{index + 1}</span>
                          </span>
                          <button
                            type="button"
                            onClick={cancelEditingItem}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94A3B8',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title="Cancel editing"
                          >
                            <MaterialIcon name="close" size={18} />
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '3px' }}>
                              Scripture Reference
                            </label>
                            <input
                              type="text"
                              value={editItemRef}
                              onChange={(e) => {
                                setEditItemRef(e.target.value);
                                if (editItemError) setEditItemError('');
                              }}
                              placeholder="e.g. John 3:16-17, Psalm 23"
                              style={{ width: '100%', fontSize: '0.85rem' }}
                              autoFocus
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '3px' }}>
                              Custom Display Title
                            </label>
                            <input
                              type="text"
                              value={editItemTitle}
                              onChange={(e) => setEditItemTitle(e.target.value)}
                              placeholder="e.g. Sermon Scripture"
                              style={{ width: '100%', fontSize: '0.85rem' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '3px' }}>
                              Primary Translation
                            </label>
                            <select
                              value={editPrimaryVer}
                              onChange={(e) => setEditPrimaryVer(e.target.value)}
                              style={{ width: '100%', fontSize: '0.85rem', backgroundColor: '#0F172A', color: '#E2E8F0', borderColor: 'var(--border-color)', borderRadius: '4px', padding: '0.4rem 0.5rem' }}
                            >
                              {versions.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.abbreviation} - {v.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '3px' }}>
                              Secondary Translation (Dual)
                            </label>
                            <select
                              value={editSecondaryVer}
                              onChange={(e) => setEditSecondaryVer(e.target.value)}
                              style={{ width: '100%', fontSize: '0.85rem', backgroundColor: '#0F172A', color: '#E2E8F0', borderColor: 'var(--border-color)', borderRadius: '4px', padding: '0.4rem 0.5rem' }}
                            >
                              <option value="">None (Single Translation)</option>
                              {versions.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.abbreviation} - {v.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '3px' }}>
                              Notes (Optional)
                            </label>
                            <input
                              type="text"
                              value={editItemNotes}
                              onChange={(e) => setEditItemNotes(e.target.value)}
                              placeholder="e.g. Congregational Reading"
                              style={{ width: '100%', fontSize: '0.85rem' }}
                            />
                          </div>
                        </div>

                        {editItemError && (
                          <div style={{ color: '#F87171', fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <MaterialIcon name="warning" size={15} color="#F87171" />
                            <span>{editItemError}</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={cancelEditingItem}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={isSavingEditItem || !editItemRef.trim()}
                            onClick={handleSaveEditedItem}
                            style={{
                              padding: '0.35rem 0.9rem',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <MaterialIcon name="check" size={15} />
                            <span>{isSavingEditItem ? 'Saving...' : 'Save Changes'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  const startV = item.reference?.startVerse || 1;
                  const endV = getItemMaxVerse(item);
                  const hasRange = endV > startV;
                  const currentV = getItemActiveVerse(item);

                  const isAutoGeneratedNote = Boolean(
                    item.notes && (
                      item.notes === `${primAbbr} • ${item.reference?.bookName} ${item.reference?.chapterNumber}:${item.reference?.startVerse}` ||
                      /^[A-Za-z0-9\s+]+\s*•\s*[1-3]?\s*[A-Za-z]+/.test(item.notes)
                    )
                  );
                  const displayNote = (item.notes && !isAutoGeneratedNote) ? item.notes.trim() : '';

                  const isItemLive = Boolean(
                    presentationState?.mode === 'LIVE' &&
                    presentationState?.liveSlide &&
                    item.reference &&
                    presentationState.liveSlide.reference?.chapterNumber === item.reference.chapterNumber &&
                    (
                      presentationState.liveSlide.reference?.bookId?.toLowerCase().endsWith(item.reference.bookId?.toLowerCase() || '') ||
                      presentationState.liveSlide.reference?.bookName?.toLowerCase() === item.reference.bookName?.toLowerCase()
                    )
                  );

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleStage(item, effectiveSec, currentV)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '6px',
                        backgroundColor: isSelected ? 'rgba(13, 148, 136, 0.15)' : 'var(--bg-card)',
                        border: isSelected ? '1px solid var(--primary, #0D9488)' : '1px solid var(--border-color)',
                        boxShadow: isSelected ? '0 0 10px rgba(13, 148, 136, 0.25)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s, background-color 0.15s, box-shadow 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: isSelected ? 'var(--primary, #0D9488)' : '#0F172A',
                            color: isSelected ? '#FFFFFF' : '#94A3B8',
                            border: isSelected ? '1px solid var(--primary, #0D9488)' : '1px solid #334155',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {index + 1}
                        </span>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#E2E8F0', fontSize: '0.92rem' }}>
                            {item.customTitle || 'Scripture'}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span>
                              {item.reference ? `${item.reference.bookName || ''} ${item.reference.chapterNumber}:${item.reference.startVerse}${endV > item.reference.startVerse ? `-${endV}` : ''}` : ''}
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
                            {isItemLive && (
                              <span
                                style={{
                                  backgroundColor: '#EF4444',
                                  color: '#FFFFFF',
                                  padding: '1px 6px',
                                  borderRadius: '3px',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  letterSpacing: '0.04em',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FFFFFF', display: 'inline-block' }}></span>
                                LIVE (v. {currentV})
                              </span>
                            )}
                          </div>

                          {/* Row for Notes Badge & Verse Stepper */}
                          {(Boolean(displayNote) || hasRange) && (
                            <div
                              style={{
                                marginTop: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                flexWrap: 'wrap',
                              }}
                            >
                              {/* Display Item Notes if present */}
                              {displayNote && (
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontSize: '0.76rem',
                                    color: '#38BDF8',
                                    backgroundColor: 'rgba(56, 189, 248, 0.08)',
                                    border: '1px solid rgba(56, 189, 248, 0.22)',
                                    borderRadius: '4px',
                                    padding: '2px 7px',
                                    maxWidth: '220px',
                                    overflow: 'hidden',
                                    boxSizing: 'border-box',
                                    flexShrink: 0,
                                  }}
                                  title={`Notes: ${displayNote}`}
                                >
                                  <MaterialIcon name="description" size={13} color="#38BDF8" style={{ flexShrink: 0 }} />
                                  <span
                                    style={{
                                      fontWeight: 500,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: 'inline-block',
                                      maxWidth: '190px',
                                    }}
                                  >
                                    {displayNote}
                                  </span>
                                </div>
                              )}

                              {/* Verse Stepper Bar for verse ranges */}
                              {hasRange && (
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid #334155',
                                    width: 'fit-content',
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Prev Verse Button */}
                                  <button
                                    type="button"
                                    disabled={currentV <= startV}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStepVerse(item, currentV - 1, effectiveSec);
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: currentV <= startV ? '#475569' : '#38BDF8',
                                      cursor: currentV <= startV ? 'not-allowed' : 'pointer',
                                      padding: '1px 3px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderRadius: '3px',
                                    }}
                                    title="Previous Verse (change one after the other)"
                                  >
                                    <MaterialIcon name="chevron_left" size={18} />
                                  </button>

                                  {/* Clickable Verse Chips or Label */}
                                  {endV - startV <= 12 ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                      {Array.from({ length: endV - startV + 1 }, (_, i) => startV + i).map((vNum) => {
                                        const isCurrent = vNum === currentV;
                                        return (
                                          <button
                                            key={vNum}
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleStepVerse(item, vNum, effectiveSec);
                                            }}
                                            style={{
                                              minWidth: '22px',
                                              height: '22px',
                                              padding: '0 4px',
                                              fontSize: '0.72rem',
                                              fontWeight: isCurrent ? 700 : 500,
                                              backgroundColor: isCurrent ? 'var(--primary, #0D9488)' : '#1E293B',
                                              color: isCurrent ? '#FFFFFF' : '#94A3B8',
                                              border: isCurrent ? '1px solid var(--primary, #0D9488)' : '1px solid #334155',
                                              borderRadius: '4px',
                                              cursor: 'pointer',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              boxShadow: isCurrent ? '0 0 6px rgba(13, 148, 136, 0.5)' : 'none',
                                              transition: 'all 0.15s ease',
                                            }}
                                            title={`Show Verse ${vNum}`}
                                          >
                                            {vNum}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#E2E8F0', padding: '0 4px' }}>
                                      Verse {currentV} of {endV}
                                    </span>
                                  )}

                                  {/* Next Verse Button */}
                                  <button
                                    type="button"
                                    disabled={currentV >= endV}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStepVerse(item, currentV + 1, effectiveSec);
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: currentV >= endV ? '#475569' : '#38BDF8',
                                      cursor: currentV >= endV ? 'not-allowed' : 'pointer',
                                      padding: '1px 3px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderRadius: '3px',
                                    }}
                                    title="Next Verse (change one after the other)"
                                  >
                                    <MaterialIcon name="chevron_right" size={18} />
                                  </button>

                                  <span style={{ fontSize: '0.7rem', color: '#64748B', marginLeft: '4px', whiteSpace: 'nowrap' }}>
                                    (v. {currentV} of {endV})
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
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

                        {/* Open in Reader Button (Option 3) */}
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.78rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.reference && onOpenInReader) {
                              onOpenInReader(item.reference);
                            }
                          }}
                          title="Open this scripture in Bible Reader"
                        >
                          <MaterialIcon name="menu_book" size={14} />
                          <span>Reader</span>
                        </button>

                        {/* Edit Item Button */}
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.78rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditingItem(item);
                          }}
                          title="Edit this scripture item"
                        >
                          <MaterialIcon name="edit" size={14} />
                          <span>Edit</span>
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
                            handleStage(item, effectiveSec, currentV);
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
                            handleTakeLive(item, effectiveSec, currentV);
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
