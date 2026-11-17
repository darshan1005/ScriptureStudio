import React, { useEffect, useState } from 'react';
import { BibleVersionDto, SlideContentDto, ThemeDto } from '@scripture-studio/shared-types';
import { MaterialIcon } from './MaterialIcon.js';
import { ScriptureSlideCanvas } from './ScriptureSlideCanvas.js';

function cleanScriptureText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, '')
    .replace(/<f\b[^>]*>[\s\S]*?<\/f>/gi, '')
    .replace(/<note\b[^>]*>[\s\S]*?<\/note>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface ThemeEditorWorkspaceProps {
  onThemeUpdated: (theme: ThemeDto) => void;
  primaryVersionId?: string;
  secondaryVersionId?: string;
  versions?: BibleVersionDto[];
}

const PRESET_GRADIENTS = [
  { name: 'Navy Sanctuary', start: '#09172C', end: '#0F2B48', angle: 135 },
  { name: 'Cathedral Amber', start: '#2B0E05', end: '#5C1D06', angle: 140 },
  { name: 'Sunset Praise', start: '#1A0B2E', end: '#4A154B', angle: 135 },
  { name: 'Emerald Majesty', start: '#041B12', end: '#0B422B', angle: 135 },
  { name: 'Obsidian Blackout', start: '#000000', end: '#000000', angle: 0 },
  { name: 'Slate Modern', start: '#16181D', end: '#252932', angle: 150 },
  { name: 'Royal Velvet', start: '#1E0531', end: '#3E0D65', angle: 135 },
];

const WORSHIP_BG_PRESETS = [
  {
    name: 'Stained Glass Cathedral',
    url: 'https://images.unsplash.com/photo-1548625361-195fd250567e?auto=format&fit=crop&w=1920&q=80',
  },
  {
    name: 'Celestial Night Sky',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80',
  },
  {
    name: 'Misty Mountain Dawn',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80',
  },
  {
    name: 'Golden Ambient Lights',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
  },
  {
    name: 'Deep Oceanic Sanctuary',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
  },
  {
    name: 'Subtle Slate Texture',
    url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1920&q=80',
  },
];

export const ThemeEditorWorkspace: React.FC<ThemeEditorWorkspaceProps> = ({
  onThemeUpdated,
  primaryVersionId = 'kjv',
  secondaryVersionId,
  versions = [],
}) => {
  const [themes, setThemes] = useState<ThemeDto[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<ThemeDto | null>(null);
  const [activeTab, setActiveTab] = useState<'typography' | 'background' | 'effects' | 'layout'>('typography');
  const [typoSubTab, setTypoSubTab] = useState<'verse' | 'reference' | 'version'>('verse');

  // Dual translation preview toggle state
  const [isDualPreview, setIsDualPreview] = useState<boolean>(() => !!secondaryVersionId);

  useEffect(() => {
    if (secondaryVersionId) {
      setIsDualPreview(true);
    }
  }, [secondaryVersionId]);

  const [primaryText, setPrimaryText] = useState<string>(
    'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'
  );
  const [secondaryText, setSecondaryText] = useState<string>(
    'దేవుడు లోకమును ఎంతో ప్రేమించెను. కాగా ఆయన తన అద్వితీయకుమారునిగా పుట్టిన వానియందు విశ్వాసముంచు ప్రతివాడును నశింపక నిత్యజీవము పొందునట్లు ఆయనను అనుగ్రహించెను.'
  );


  useEffect(() => {
    if (window.scriptureStudioApi?.bible?.getVerseRange) {
      const primId = primaryVersionId || 'kjv';
      window.scriptureStudioApi.bible
        .getVerseRange({
          versionId: primId,
          bookId: 'JHN',
          chapterNumber: 3,
          startVerse: 16,
          endVerse: 16,
        })
        .then((res) => {
          if (res?.verses && res.verses.length > 0 && res.verses[0]?.verseText) {
            setPrimaryText(cleanScriptureText(res.verses[0].verseText));
          }
        })
        .catch(() => { });

      if (secondaryVersionId) {
        window.scriptureStudioApi.bible
          .getVerseRange({
            versionId: secondaryVersionId,
            bookId: 'JHN',
            chapterNumber: 3,
            startVerse: 16,
            endVerse: 16,
          })
          .then((res) => {
            if (res?.verses && res.verses.length > 0 && res.verses[0]?.verseText) {
              setSecondaryText(cleanScriptureText(res.verses[0].verseText));
            } else if (secondaryVersionId === 'tel') {
              setSecondaryText(
                'దేవుడు లోకమును ఎంతో ప్రేమించెను. కాగా ఆయన తన అద్వితీయకుమారునిగా పుట్టిన వానియందు విశ్వాసముంచు ప్రతివాడును నశింపక నిత్యజీవము పొందునట్లు ఆయనను అనుగ్రహించెను.'
              );
            }
          })
          .catch(() => {
            if (secondaryVersionId === 'tel') {
              setSecondaryText(
                'దేవుడు లోకమును ఎంతో ప్రేమించెను. కాగా ఆయన తన అద్వితీయకుమారునిగా పుట్టిన వానియందు విశ్వాసముంచు ప్రతివాడును నశింపక నిత్యజీవము పొందునట్లు ఆయనను అనుగ్రహించెను.'
              );
            }
          });
      }
    }
  }, [primaryVersionId, secondaryVersionId]);

  const primaryVersionObj = versions.find((v) => v.id === (primaryVersionId || 'kjv'));
  const primaryAbbr =
    primaryVersionObj?.abbreviation || (primaryVersionId || 'kjv').toUpperCase();
  const primaryVersionName = primaryVersionObj?.name || (primaryAbbr === 'KJV' ? 'King James Version' : primaryAbbr);

  const secondaryVersionObj = secondaryVersionId
    ? versions.find((v) => v.id === secondaryVersionId)
    : versions.find((v) => v.id === 'tel');
  const secondaryAbbr =
    secondaryVersionObj?.abbreviation || (secondaryVersionId ? secondaryVersionId.toUpperCase() : 'TEL');
  const secondaryVersionName =
    secondaryVersionObj?.name || (secondaryAbbr === 'TEL' ? 'Telugu Bible (పరిశుద్ధ గ్రంథము)' : secondaryAbbr);

  const loadThemes = () => {
    if (window.scriptureStudioApi) {
      window.scriptureStudioApi.themes.list().then((res) => {
        setThemes(res.themes);
        if (res.themes.length > 0 && !selectedTheme) {
          setSelectedTheme(res.themes[0] || null);
        }
      });
    }
  };

  useEffect(() => {
    loadThemes();
  }, []);

  const handleSaveTheme = async () => {
    if (!selectedTheme || !window.scriptureStudioApi) return;
    await window.scriptureStudioApi.themes.save({ theme: selectedTheme });
    loadThemes();
    onThemeUpdated(selectedTheme);
  };

  const handleSetDefault = async () => {
    if (!selectedTheme || !window.scriptureStudioApi) return;
    await window.scriptureStudioApi.themes.setDefault(selectedTheme.id);
    loadThemes();
    onThemeUpdated({ ...selectedTheme, isDefault: true });
  };

  const handleCreateTheme = () => {
    const newTheme: ThemeDto = {
      id: `theme_${Date.now()}`,
      name: 'New Worship Theme',
      isDefault: false,
      isSystem: false,
      config: {
        typography: {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSizeRem: 3.5,
          fontWeight: 700,
          fontStyle: 'normal',
          textDecoration: 'none',
          lineHeight: 1.35,
          letterSpacingPx: 0.5,
          color: '#FFFFFF',
          alignment: 'center',
          transform: 'none',
          referenceFontFamily: 'Segoe UI, Arial, sans-serif',
          referenceFontSizeRem: 1.4,
          referenceColor: '#F59E0B',
          referenceWeight: 700,
          referenceStyle: 'normal',
          referenceDecoration: 'none',
          referencePosition: 'above',
        },
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.85)',
          blurPx: 10,
          offsetX: 2,
          offsetY: 4,
        },
        outline: {
          enabled: true,
          color: '#000000',
          widthPx: 2,
        },
        glow: {
          enabled: false,
          color: '#F59E0B',
          radiusPx: 12,
        },
        background: {
          type: 'gradient',
          gradient: {
            type: 'linear',
            directionDeg: 135,
            stops: [
              { color: '#09172C', offset: 0 },
              { color: '#1B3254', offset: 100 },
            ],
          },
        },
        margins: {
          topPercent: 8,
          bottomPercent: 8,
          leftPercent: 10,
          rightPercent: 10,
          paddingPercent: 3,
          containerMaxWidthPercent: 92,
          containerMaxHeightPercent: 88,
        },
        placement: {
          mode: '16:9',
          verticalAlign: 'center',
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSelectedTheme(newTheme);
  };

  // Helper to compile live background CSS for preview (matches AudienceDisplayLayout exactly)
  const getPreviewBackground = (t: ThemeDto): React.CSSProperties => {
    const bg = t.config.background;
    if (bg.type === 'gradient' && bg.gradient?.stops) {
      const stops = bg.gradient.stops.map((s) => `${s.color} ${s.offset}%`).join(', ');
      return { background: `linear-gradient(${bg.gradient.directionDeg || 135}deg, ${stops})` };
    }
    if (bg.type === 'solid') {
      return { backgroundColor: bg.color || '#000000' };
    }
    if (bg.type === 'image' && bg.imageUrl) {
      const dimming = (bg.dimmingPercent ?? 45) / 100;
      return {
        backgroundImage: `linear-gradient(rgba(0,0,0,${dimming}), rgba(0,0,0,${dimming})), url("${bg.imageUrl}")`,
        backgroundSize: bg.objectFit || 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
    return { backgroundColor: '#09172C' };
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
      {/* Theme List Sidebar */}
      <div
        style={{
          width: 'clamp(220px, 18vw, 280px)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
          <button
            className="btn-primary"
            style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
            onClick={handleCreateTheme}
          >
            + Create New Theme
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {themes.map((t) => {
            const isSelected = selectedTheme?.id === t.id;
            const bgStyle = getPreviewBackground(t);
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTheme(t)}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'var(--bg-hover)' : 'transparent',
                  borderLeft: isSelected ? '4px solid var(--primary)' : '4px solid transparent',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                {/* Visual miniature swatch */}
                <div
                  style={{
                    width: '32px',
                    height: '24px',
                    borderRadius: '4px',
                    ...bgStyle,
                    border: '1px solid var(--border-color)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: '#F1F5F9',
                      fontSize: '0.85rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {t.name}
                  </div>
                  {t.isDefault && (
                    <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>
                      DEFAULT
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Theme Studio Editor & Live Screen Preview */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedTheme ? (
          <>
            {/* Top Editor Header */}
            <div
              style={{
                padding: '0.75rem 1.25rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--bg-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <input
                  type="text"
                  value={selectedTheme.name}
                  onChange={(e) => setSelectedTheme({ ...selectedTheme, name: e.target.value })}
                  style={{ fontSize: '1rem', fontWeight: 700, padding: '0.35rem 0.6rem', width: '280px' }}
                />
                {selectedTheme.isDefault ? (
                  <span className="badge badge-live">DEFAULT THEME</span>
                ) : (
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    onClick={handleSetDefault}
                  >
                    <MaterialIcon name="star" size={15} color="#F59E0B" />
                    <span>Set as Default</span>
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-primary"
                  onClick={handleSaveTheme}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <MaterialIcon name="save" size={16} />
                  <span>Save Theme</span>
                </button>
              </div>
            </div>

            {/* Split View: Live Preview + Controls */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Left Side: Live 16:9 Screen Canvas Preview */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '1.25rem',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#050B14',
                  overflow: 'auto',
                  minWidth: 0,
                }}
              >
                <div style={{ width: '100%', maxWidth: 'min(100%, 1100px)' }}>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-dim)',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <MaterialIcon name="live_tv" size={16} />
                      <span>Live Theme Screen Preview</span>
                    </span>

                    {/* Mode Toggle: Single vs Dual Translation Preview */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setIsDualPreview(!isDualPreview)}
                        style={{
                          fontSize: '0.74rem',
                          padding: '2px 8px',
                          backgroundColor: isDualPreview ? '#1E293B' : 'rgba(255, 255, 255, 0.05)',
                          color: isDualPreview ? '#E2E8F0' : '#94A3B8',
                          border: isDualPreview ? '1px solid #475569' : '1px solid #334155',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontWeight: isDualPreview ? 600 : 500,
                          transition: 'all 0.15s ease',
                        }}
                        title="Toggle single vs dual translation in theme preview"
                      >
                        <MaterialIcon name="translate" size={14} color={isDualPreview ? '#38BDF8' : '#94A3B8'} />
                        <span>{isDualPreview ? `Dual: ${primaryAbbr} + ${secondaryAbbr}` : `Single: ${primaryAbbr}`}</span>
                      </button>

                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>16:9 HD</span>
                    </div>
                  </div>

                  {/* 16:9 Scaled Preview Canvas (Rendered via Unified ScriptureSlideCanvas) */}
                  {(() => {
                    const themeEditorPreviewSlide: SlideContentDto = {
                      id: 'theme_editor_preview',
                      referenceDisplay: 'John 3:16',
                      versionAbbreviation: primaryAbbr,
                      verses: [{ verseNumber: 16, text: cleanScriptureText(primaryText) }],
                      multiVersionSlots: isDualPreview
                        ? [
                            {
                              versionAbbreviation: primaryAbbr,
                              versionName: primaryVersionName,
                              text: cleanScriptureText(primaryText),
                            },
                            {
                              versionAbbreviation: secondaryAbbr,
                              versionName: secondaryVersionName,
                              text: cleanScriptureText(secondaryText),
                            },
                          ]
                        : undefined,
                    };

                    return (
                      <div
                        style={{
                          aspectRatio: '16/9',
                          width: '100%',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '2px solid var(--border-color)',
                          boxShadow: '0 12px 36px rgba(0,0,0,0.8)',
                          position: 'relative',
                        }}
                      >
                        <ScriptureSlideCanvas
                          slide={themeEditorPreviewSlide}
                          theme={selectedTheme}
                          showBoundingBox={activeTab === 'layout'}
                        />
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Right Side: Granular Control Tabs */}
              <div
                style={{
                  width: 'clamp(340px, 26vw, 420px)',
                  borderLeft: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'var(--bg-card)',
                  overflowY: 'auto',
                }}
              >
                {/* Tab Navigation */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
                  {(['typography', 'background', 'effects', 'layout'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        flex: 1,
                        padding: '0.65rem 0.25rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        backgroundColor: activeTab === tab ? 'var(--bg-panel)' : 'transparent',
                        color: activeTab === tab ? '#F1F5F9' : 'var(--text-dim)',
                        border: 'none',
                        borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* TAB 1: TYPOGRAPHY (VERSE & REFERENCE) */}
                  {activeTab === 'typography' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {/* Subtab Switcher: Verse Text vs Reference Title vs Version Tag */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 1fr',
                          gap: '0.4rem',
                          padding: '0.2rem',
                          backgroundColor: 'var(--bg-panel)',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        {[
                          { id: 'verse', label: 'Verse', icon: 'menu_book' },
                          { id: 'reference', label: 'Reference', icon: 'bookmark' },
                          { id: 'version', label: 'Version Tag', icon: 'translate' },
                        ].map((st) => {
                          const isSubActive = typoSubTab === st.id;
                          return (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => setTypoSubTab(st.id as any)}
                              style={{
                                padding: '0.45rem 0.25rem',
                                fontSize: '0.78rem',
                                fontWeight: isSubActive ? 700 : 500,
                                backgroundColor: isSubActive ? 'var(--primary)' : 'transparent',
                                color: isSubActive ? '#FFFFFF' : 'var(--text-dim)',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              <MaterialIcon name={st.icon} size={15} />
                              <span>{st.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* --- SUBTAB A: VERSE TEXT CONTROLS --- */}
                      {typoSubTab === 'verse' && (
                        <>
                          {/* 1. Font Size Slider & Quick Presets */}
                          <div style={{ backgroundColor: 'var(--bg-panel)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F1F5F9' }}>
                                Scripture Font Size
                              </label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <input
                                  type="number"
                                  min={1.0}
                                  max={12.0}
                                  step={0.1}
                                  value={selectedTheme.config.typography.fontSizeRem ?? 3.5}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val) && val > 0) {
                                      setSelectedTheme({
                                        ...selectedTheme,
                                        config: {
                                          ...selectedTheme.config,
                                          typography: { ...selectedTheme.config.typography, fontSizeRem: val },
                                        },
                                      });
                                    }
                                  }}
                                  style={{
                                    width: '58px',
                                    padding: '0.15rem 0.35rem',
                                    fontSize: '0.8rem',
                                    textAlign: 'right',
                                    backgroundColor: 'var(--bg-card)',
                                    color: '#60A5FA',
                                    fontWeight: 700,
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                  }}
                                />
                                <span style={{ fontSize: '0.8rem', color: '#60A5FA', fontWeight: 700 }}>rem</span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                                  ({Math.round((selectedTheme.config.typography.fontSizeRem ?? 3.5) * 16)}px)
                                </span>
                              </div>
                            </div>
                            <input
                              type="range"
                              min={1.0}
                              max={10.0}
                              step={0.1}
                              value={selectedTheme.config.typography.fontSizeRem ?? 3.5}
                              onChange={(e) =>
                                setSelectedTheme({
                                  ...selectedTheme,
                                  config: {
                                    ...selectedTheme.config,
                                    typography: { ...selectedTheme.config.typography, fontSizeRem: parseFloat(e.target.value) },
                                  },
                                })
                              }
                              style={{ width: '100%', marginBottom: '0.5rem' }}
                            />
                            {/* Quick Presets */}
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              {[
                                { label: 'Small', rem: 2.5 },
                                { label: 'Standard', rem: 3.5 },
                                { label: 'Large', rem: 4.5 },
                                { label: 'Huge', rem: 5.5 },
                                { label: 'Giant', rem: 7.0 },
                                { label: 'Massive', rem: 8.5 },
                                { label: 'Ultra', rem: 10.0 },
                              ].map((sz) => (
                                <button
                                  key={sz.label}
                                  type="button"
                                  onClick={() =>
                                    setSelectedTheme({
                                      ...selectedTheme,
                                      config: {
                                        ...selectedTheme.config,
                                        typography: { ...selectedTheme.config.typography, fontSizeRem: sz.rem },
                                      },
                                    })
                                  }
                                  style={{
                                    flex: 1,
                                    fontSize: '0.68rem',
                                    padding: '0.2rem 0',
                                    backgroundColor: (selectedTheme.config.typography.fontSizeRem ?? 3.5) === sz.rem ? 'var(--primary)' : 'var(--bg-card)',
                                    color: (selectedTheme.config.typography.fontSizeRem ?? 3.5) === sz.rem ? '#FFFFFF' : 'var(--text-dim)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {sz.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 2. Font Family */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                              Font Family
                            </label>
                            <select
                              value={selectedTheme.config.typography.fontFamily}
                              onChange={(e) =>
                                setSelectedTheme({
                                  ...selectedTheme,
                                  config: {
                                    ...selectedTheme.config,
                                    typography: { ...selectedTheme.config.typography, fontFamily: e.target.value },
                                  },
                                })
                              }
                              style={{ width: '100%' }}
                            >
                              <option value="Segoe UI, Arial, sans-serif">Segoe UI (Modern Sans)</option>
                              <option value="Georgia, serif">Georgia (Elegance Serif)</option>
                              <option value="'Times New Roman', serif">Times New Roman</option>
                              <option value="Arial, sans-serif">Arial Bold</option>
                              <option value="Impact, sans-serif">Impact (Ultra-Bold)</option>
                              <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                              <option value="Garamond, serif">Garamond Classic</option>
                              <option value="'Montserrat', sans-serif">Montserrat</option>
                              <option value="'Roboto', sans-serif">Roboto</option>
                              <option value="'Cinzel', serif">Cinzel (Church Traditional)</option>
                            </select>
                          </div>

                          {/* 3. Font Style (Italic) & Text Decoration (Underline) */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                                Font Style (Italic)
                              </label>
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                {[
                                  { id: 'normal', label: 'Normal' },
                                  { id: 'italic', label: 'Italic' },
                                ].map((st) => {
                                  const isActive = (selectedTheme.config.typography.fontStyle || 'normal') === st.id;
                                  return (
                                    <button
                                      key={st.id}
                                      type="button"
                                      onClick={() =>
                                        setSelectedTheme({
                                          ...selectedTheme,
                                          config: {
                                            ...selectedTheme.config,
                                            typography: { ...selectedTheme.config.typography, fontStyle: st.id as any },
                                          },
                                        })
                                      }
                                      style={{
                                        flex: 1,
                                        padding: '0.35rem 0',
                                        fontSize: '0.78rem',
                                        fontWeight: isActive ? 700 : 500,
                                        fontStyle: st.id === 'italic' ? 'italic' : 'normal',
                                        backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-panel)',
                                        color: isActive ? '#FFFFFF' : 'var(--text-dim)',
                                        border: isActive ? '1px solid #3B82F6' : '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {st.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                                Decoration (Underline)
                              </label>
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                {[
                                  { id: 'none', label: 'None' },
                                  { id: 'underline', label: 'Underline' },
                                ].map((dec) => {
                                  const isActive = (selectedTheme.config.typography.textDecoration || 'none') === dec.id;
                                  return (
                                    <button
                                      key={dec.id}
                                      type="button"
                                      onClick={() =>
                                        setSelectedTheme({
                                          ...selectedTheme,
                                          config: {
                                            ...selectedTheme.config,
                                            typography: { ...selectedTheme.config.typography, textDecoration: dec.id as any },
                                          },
                                        })
                                      }
                                      style={{
                                        flex: 1,
                                        padding: '0.35rem 0',
                                        fontSize: '0.78rem',
                                        fontWeight: isActive ? 700 : 500,
                                        textDecoration: dec.id === 'underline' ? 'underline' : 'none',
                                        backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-panel)',
                                        color: isActive ? '#FFFFFF' : 'var(--text-dim)',
                                        border: isActive ? '1px solid #3B82F6' : '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {dec.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* 4. Font Weight & Alignment */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                                Font Weight
                              </label>
                              <select
                                value={selectedTheme.config.typography.fontWeight}
                                onChange={(e) =>
                                  setSelectedTheme({
                                    ...selectedTheme,
                                    config: {
                                      ...selectedTheme.config,
                                      typography: { ...selectedTheme.config.typography, fontWeight: Number(e.target.value) },
                                    },
                                  })
                                }
                                style={{ width: '100%' }}
                              >
                                <option value={400}>Regular (400)</option>
                                <option value={600}>Semi-Bold (600)</option>
                                <option value={700}>Bold (700)</option>
                                <option value={800}>Extra Bold (800)</option>
                                <option value={900}>Black (900)</option>
                              </select>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                                Horizontal Alignment
                              </label>
                              <div style={{ display: 'flex', gap: '0.2rem' }}>
                                {[
                                  { id: 'left', icon: 'format_align_left' },
                                  { id: 'center', icon: 'format_align_center' },
                                  { id: 'right', icon: 'format_align_right' },
                                  { id: 'justify', icon: 'format_align_justify' },
                                ].map((al) => {
                                  const isActive = selectedTheme.config.typography.alignment === al.id;
                                  return (
                                    <button
                                      key={al.id}
                                      type="button"
                                      title={`Align ${al.id}`}
                                      onClick={() =>
                                        setSelectedTheme({
                                          ...selectedTheme,
                                          config: {
                                            ...selectedTheme.config,
                                            typography: { ...selectedTheme.config.typography, alignment: al.id as any },
                                          },
                                        })
                                      }
                                      style={{
                                        flex: 1,
                                        padding: '0.35rem 0',
                                        fontSize: '0.9rem',
                                        fontWeight: isActive ? 800 : 500,
                                        backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-panel)',
                                        color: isActive ? '#FFFFFF' : 'var(--text-dim)',
                                        border: isActive ? '1px solid #3B82F6' : '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      <MaterialIcon name={al.icon} size={16} />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* 5. Scripture Text Color */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                              Scripture Text Color
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <input
                                type="color"
                                value={selectedTheme.config.typography.color}
                                onChange={(e) =>
                                  setSelectedTheme({
                                    ...selectedTheme,
                                    config: {
                                      ...selectedTheme.config,
                                      typography: { ...selectedTheme.config.typography, color: e.target.value },
                                    },
                                  })
                                }
                                style={{ width: '36px', height: '36px', padding: 0, border: 'none', cursor: 'pointer' }}
                              />
                              <input
                                type="text"
                                value={selectedTheme.config.typography.color}
                                onChange={(e) =>
                                  setSelectedTheme({
                                    ...selectedTheme,
                                    config: {
                                      ...selectedTheme.config,
                                      typography: { ...selectedTheme.config.typography, color: e.target.value },
                                    },
                                  })
                                }
                                style={{ flex: 1 }}
                              />
                            </div>
                          </div>

                          {/* 6. Line Height (Height) & Letter Spacing (Width) */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                  Line Height
                                </label>
                                <span style={{ fontSize: '0.75rem', color: '#60A5FA', fontWeight: 600 }}>
                                  {selectedTheme.config.typography.lineHeight || 1.35}x
                                </span>
                              </div>
                              <input
                                type="range"
                                min={1.0}
                                max={2.4}
                                step={0.05}
                                value={selectedTheme.config.typography.lineHeight || 1.35}
                                onChange={(e) =>
                                  setSelectedTheme({
                                    ...selectedTheme,
                                    config: {
                                      ...selectedTheme.config,
                                      typography: { ...selectedTheme.config.typography, lineHeight: parseFloat(e.target.value) },
                                    },
                                  })
                                }
                                style={{ width: '100%', marginBottom: '0.35rem' }}
                              />
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                {[
                                  { label: 'Tight', val: 1.15 },
                                  { label: 'Normal', val: 1.35 },
                                  { label: 'Relaxed', val: 1.55 },
                                  { label: 'Spacious', val: 1.85 },
                                ].map((lh) => (
                                  <button
                                    key={lh.label}
                                    type="button"
                                    onClick={() =>
                                      setSelectedTheme({
                                        ...selectedTheme,
                                        config: {
                                          ...selectedTheme.config,
                                          typography: { ...selectedTheme.config.typography, lineHeight: lh.val },
                                        },
                                      })
                                    }
                                    style={{
                                      flex: 1,
                                      fontSize: '0.65rem',
                                      padding: '0.15rem 0',
                                      backgroundColor: Math.abs((selectedTheme.config.typography.lineHeight || 1.35) - lh.val) < 0.05 ? 'var(--primary)' : 'var(--bg-card)',
                                      color: Math.abs((selectedTheme.config.typography.lineHeight || 1.35) - lh.val) < 0.05 ? '#FFFFFF' : 'var(--text-dim)',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '3px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {lh.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                  Letter Spacing
                                </label>
                                <span style={{ fontSize: '0.75rem', color: '#60A5FA', fontWeight: 600 }}>
                                  {selectedTheme.config.typography.letterSpacingPx ?? 0.5}px
                                </span>
                              </div>
                              <input
                                type="range"
                                min={-2}
                                max={8}
                                step={0.5}
                                value={selectedTheme.config.typography.letterSpacingPx ?? 0.5}
                                onChange={(e) =>
                                  setSelectedTheme({
                                    ...selectedTheme,
                                    config: {
                                      ...selectedTheme.config,
                                      typography: { ...selectedTheme.config.typography, letterSpacingPx: parseFloat(e.target.value) },
                                    },
                                  })
                                }
                                style={{ width: '100%' }}
                              />
                            </div>
                          </div>

                          {/* 7. Text Transform */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                              Text Transform
                            </label>
                            <select
                              value={selectedTheme.config.typography.transform || 'none'}
                              onChange={(e) =>
                                setSelectedTheme({
                                  ...selectedTheme,
                                  config: {
                                    ...selectedTheme.config,
                                    typography: { ...selectedTheme.config.typography, transform: e.target.value as any },
                                  },
                                })
                              }
                              style={{ width: '100%' }}
                            >
                              <option value="none">Standard Sentence Case</option>
                              <option value="uppercase">UPPERCASE (All Caps)</option>
                              <option value="capitalize">Capitalize Each Word</option>
                            </select>
                          </div>
                        </>
                      )}

                      {/* --- SUBTAB B: SCRIPTURE REFERENCE TITLE CONTROLS --- */}
                      {typoSubTab === 'reference' && (
                        <>
                          {/* Reference Title Position */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                              Reference Position
                            </label>
                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                              {[
                                { id: 'above', label: 'Above Verse', icon: 'arrow_upward' },
                                { id: 'below', label: 'Below Verse', icon: 'arrow_downward' },
                                { id: 'hidden', label: 'Hidden', icon: 'visibility_off' },
                              ].map((pos) => {
                                const isActive = (selectedTheme.config.typography.referencePosition || 'above') === pos.id;
                                return (
                                  <button
                                    key={pos.id}
                                    type="button"
                                    onClick={() =>
                                      setSelectedTheme({
                                        ...selectedTheme,
                                        config: {
                                          ...selectedTheme.config,
                                          typography: { ...selectedTheme.config.typography, referencePosition: pos.id as any },
                                        },
                                      })
                                    }
                                    style={{
                                      flex: 1,
                                      padding: '0.45rem 0.2rem',
                                      fontSize: '0.78rem',
                                      fontWeight: isActive ? 700 : 500,
                                      backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-panel)',
                                      color: isActive ? '#FFFFFF' : 'var(--text-dim)',
                                      border: isActive ? '1px solid #3B82F6' : '1px solid var(--border-color)',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '0.3rem',
                                    }}
                                  >
                                    <MaterialIcon name={pos.icon} size={15} />
                                    <span>{pos.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Reference Font Size */}
                          <div style={{ backgroundColor: 'var(--bg-panel)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F1F5F9' }}>
                                Reference Font Size
                              </label>
                              <span style={{ fontSize: '0.82rem', color: '#F59E0B', fontWeight: 700 }}>
                                {selectedTheme.config.typography.referenceFontSizeRem ?? 1.4} rem ({Math.round((selectedTheme.config.typography.referenceFontSizeRem ?? 1.4) * 16)}px)
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0.8}
                              max={3.5}
                              step={0.1}
                              value={selectedTheme.config.typography.referenceFontSizeRem ?? 1.4}
                              onChange={(e) =>
                                setSelectedTheme({
                                  ...selectedTheme,
                                  config: {
                                    ...selectedTheme.config,
                                    typography: { ...selectedTheme.config.typography, referenceFontSizeRem: parseFloat(e.target.value) },
                                  },
                                })
                              }
                              style={{ width: '100%' }}
                            />
                          </div>

                          {/* Reference Font Family */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                              Reference Font Family
                            </label>
                            <select
                              value={selectedTheme.config.typography.referenceFontFamily || selectedTheme.config.typography.fontFamily}
                              onChange={(e) =>
                                setSelectedTheme({
                                  ...selectedTheme,
                                  config: {
                                    ...selectedTheme.config,
                                    typography: { ...selectedTheme.config.typography, referenceFontFamily: e.target.value },
                                  },
                                })
                              }
                              style={{ width: '100%' }}
                            >
                              <option value="Segoe UI, Arial, sans-serif">Segoe UI (Modern Sans)</option>
                              <option value="Georgia, serif">Georgia (Elegance Serif)</option>
                              <option value="'Times New Roman', serif">Times New Roman</option>
                              <option value="Arial, sans-serif">Arial Bold</option>
                              <option value="Impact, sans-serif">Impact (Ultra-Bold)</option>
                              <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                              <option value="Garamond, serif">Garamond Classic</option>
                              <option value="'Montserrat', sans-serif">Montserrat</option>
                              <option value="'Roboto', sans-serif">Roboto</option>
                              <option value="'Cinzel', serif">Cinzel (Church Traditional)</option>
                            </select>
                          </div>

                          {/* Reference Style (Italic) & Underline */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                                Reference Style (Italic)
                              </label>
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                {[
                                  { id: 'normal', label: 'Normal' },
                                  { id: 'italic', label: 'Italic' },
                                ].map((st) => {
                                  const isActive = (selectedTheme.config.typography.referenceStyle || 'normal') === st.id;
                                  return (
                                    <button
                                      key={st.id}
                                      type="button"
                                      onClick={() =>
                                        setSelectedTheme({
                                          ...selectedTheme,
                                          config: {
                                            ...selectedTheme.config,
                                            typography: { ...selectedTheme.config.typography, referenceStyle: st.id as any },
                                          },
                                        })
                                      }
                                      style={{
                                        flex: 1,
                                        padding: '0.35rem 0',
                                        fontSize: '0.78rem',
                                        fontWeight: isActive ? 700 : 500,
                                        fontStyle: st.id === 'italic' ? 'italic' : 'normal',
                                        backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-panel)',
                                        color: isActive ? '#FFFFFF' : 'var(--text-dim)',
                                        border: isActive ? '1px solid #3B82F6' : '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {st.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                                Reference Underline
                              </label>
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                {[
                                  { id: 'none', label: 'None' },
                                  { id: 'underline', label: 'Underline' },
                                ].map((dec) => {
                                  const isActive = (selectedTheme.config.typography.referenceDecoration || 'none') === dec.id;
                                  return (
                                    <button
                                      key={dec.id}
                                      type="button"
                                      onClick={() =>
                                        setSelectedTheme({
                                          ...selectedTheme,
                                          config: {
                                            ...selectedTheme.config,
                                            typography: { ...selectedTheme.config.typography, referenceDecoration: dec.id as any },
                                          },
                                        })
                                      }
                                      style={{
                                        flex: 1,
                                        padding: '0.35rem 0',
                                        fontSize: '0.78rem',
                                        fontWeight: isActive ? 700 : 500,
                                        textDecoration: dec.id === 'underline' ? 'underline' : 'none',
                                        backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-panel)',
                                        color: isActive ? '#FFFFFF' : 'var(--text-dim)',
                                        border: isActive ? '1px solid #3B82F6' : '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {dec.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Reference Weight & Color */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                                Reference Weight
                              </label>
                              <select
                                value={selectedTheme.config.typography.referenceWeight ?? 700}
                                onChange={(e) =>
                                  setSelectedTheme({
                                    ...selectedTheme,
                                    config: {
                                      ...selectedTheme.config,
                                      typography: { ...selectedTheme.config.typography, referenceWeight: Number(e.target.value) },
                                    },
                                  })
                                }
                                style={{ width: '100%' }}
                              >
                                <option value={400}>Regular (400)</option>
                                <option value={600}>Semi-Bold (600)</option>
                                <option value={700}>Bold (700)</option>
                                <option value={800}>Extra Bold (800)</option>
                              </select>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                                Reference Color
                              </label>
                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                <input
                                  type="color"
                                  value={selectedTheme.config.typography.referenceColor || '#F59E0B'}
                                  onChange={(e) =>
                                    setSelectedTheme({
                                      ...selectedTheme,
                                      config: {
                                        ...selectedTheme.config,
                                        typography: { ...selectedTheme.config.typography, referenceColor: e.target.value },
                                      },
                                    })
                                  }
                                  style={{ width: '32px', height: '32px', padding: 0, border: 'none', cursor: 'pointer' }}
                                />
                                <input
                                  type="text"
                                  value={selectedTheme.config.typography.referenceColor || '#F59E0B'}
                                  onChange={(e) =>
                                    setSelectedTheme({
                                      ...selectedTheme,
                                      config: {
                                        ...selectedTheme.config,
                                        typography: { ...selectedTheme.config.typography, referenceColor: e.target.value },
                                      },
                                    })
                                  }
                                  style={{ flex: 1, fontSize: '0.78rem' }}
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* --- SUBTAB C: VERSION / TRANSLATION TAG CONTROLS --- */}
                      {typoSubTab === 'version' && (
                        <>
                          {/* 1. Show / Hide Translation Version Tag */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                              Translation Version Visibility
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedTheme({
                                    ...selectedTheme,
                                    config: {
                                      ...selectedTheme.config,
                                      typography: { ...selectedTheme.config.typography, showVersion: true },
                                    },
                                  })
                                }
                                style={{
                                  padding: '0.5rem 0.4rem',
                                  fontSize: '0.78rem',
                                  fontWeight: selectedTheme.config.typography.showVersion !== false ? 700 : 500,
                                  backgroundColor: selectedTheme.config.typography.showVersion !== false ? 'var(--primary)' : 'var(--bg-panel)',
                                  color: selectedTheme.config.typography.showVersion !== false ? '#FFFFFF' : 'var(--text-dim)',
                                  border: selectedTheme.config.typography.showVersion !== false ? '1px solid #10B981' : '1px solid var(--border-color)',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.35rem',
                                }}
                              >
                                <MaterialIcon name="visibility" size={15} />
                                <span>Show Version</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedTheme({
                                    ...selectedTheme,
                                    config: {
                                      ...selectedTheme.config,
                                      typography: { ...selectedTheme.config.typography, showVersion: false },
                                    },
                                  })
                                }
                                style={{
                                  padding: '0.5rem 0.4rem',
                                  fontSize: '0.78rem',
                                  fontWeight: selectedTheme.config.typography.showVersion === false ? 700 : 500,
                                  backgroundColor: selectedTheme.config.typography.showVersion === false ? '#EF4444' : 'var(--bg-panel)',
                                  color: selectedTheme.config.typography.showVersion === false ? '#FFFFFF' : 'var(--text-dim)',
                                  border: selectedTheme.config.typography.showVersion === false ? '1px solid #EF4444' : '1px solid var(--border-color)',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.35rem',
                                }}
                              >
                                <MaterialIcon name="visibility_off" size={15} />
                                <span>Hide Version</span>
                              </button>
                            </div>
                          </div>

                          {/* 2. Version Font Size */}
                          <div style={{ backgroundColor: 'var(--bg-panel)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F1F5F9' }}>
                                Version Tag Size
                              </label>
                              <span style={{ fontSize: '0.82rem', color: '#60A5FA', fontWeight: 700 }}>
                                {selectedTheme.config.typography.versionFontSizeRem ?? 1.1} rem ({Math.round((selectedTheme.config.typography.versionFontSizeRem ?? 1.1) * 16)}px)
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0.6}
                              max={2.5}
                              step={0.05}
                              value={selectedTheme.config.typography.versionFontSizeRem ?? 1.1}
                              onChange={(e) =>
                                setSelectedTheme({
                                  ...selectedTheme,
                                  config: {
                                    ...selectedTheme.config,
                                    typography: { ...selectedTheme.config.typography, versionFontSizeRem: parseFloat(e.target.value) },
                                  },
                                })
                              }
                              style={{ width: '100%', marginBottom: '0.5rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              {[
                                { label: 'Compact', rem: 0.85 },
                                { label: 'Normal', rem: 1.1 },
                                { label: 'Prominent', rem: 1.4 },
                                { label: 'Large', rem: 1.8 },
                              ].map((sz) => (
                                <button
                                  key={sz.label}
                                  type="button"
                                  onClick={() =>
                                    setSelectedTheme({
                                      ...selectedTheme,
                                      config: {
                                        ...selectedTheme.config,
                                        typography: { ...selectedTheme.config.typography, versionFontSizeRem: sz.rem },
                                      },
                                    })
                                  }
                                  style={{
                                    flex: 1,
                                    fontSize: '0.7rem',
                                    padding: '0.2rem 0',
                                    backgroundColor: (selectedTheme.config.typography.versionFontSizeRem ?? 1.1) === sz.rem ? 'var(--primary)' : 'var(--bg-card)',
                                    color: (selectedTheme.config.typography.versionFontSizeRem ?? 1.1) === sz.rem ? '#FFFFFF' : 'var(--text-dim)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {sz.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 3. Primary Version Name Styling */}
                          <div style={{ backgroundColor: 'var(--bg-panel)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: selectedTheme.config.typography.versionColor || '#94A3B8' }} />
                                <span>Primary Version Name</span>
                              </label>
                              <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.08)', color: '#94A3B8' }}>
                                Primary / Single
                              </span>
                            </div>

                            {/* Color Picker & Swatches */}
                            <div>
                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                                <input
                                  type="color"
                                  value={selectedTheme.config.typography.versionColor || '#94A3B8'}
                                  onChange={(e) =>
                                    setSelectedTheme({
                                      ...selectedTheme,
                                      config: {
                                        ...selectedTheme.config,
                                        typography: { ...selectedTheme.config.typography, versionColor: e.target.value },
                                      },
                                    })
                                  }
                                  style={{ width: '32px', height: '32px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                                />
                                <input
                                  type="text"
                                  value={selectedTheme.config.typography.versionColor || '#94A3B8'}
                                  onChange={(e) =>
                                    setSelectedTheme({
                                      ...selectedTheme,
                                      config: {
                                        ...selectedTheme.config,
                                        typography: { ...selectedTheme.config.typography, versionColor: e.target.value },
                                      },
                                    })
                                  }
                                  style={{ flex: 1, fontSize: '0.78rem' }}
                                />
                              </div>
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                {[
                                  { name: 'Slate', hex: '#94A3B8' },
                                  { name: 'White', hex: '#FFFFFF' },
                                  { name: 'Sky', hex: '#60A5FA' },
                                  { name: 'Gold', hex: '#F59E0B' },
                                  { name: 'Emerald', hex: '#10B981' },
                                ].map((sw) => (
                                  <button
                                    key={sw.hex}
                                    type="button"
                                    onClick={() =>
                                      setSelectedTheme({
                                        ...selectedTheme,
                                        config: {
                                          ...selectedTheme.config,
                                          typography: { ...selectedTheme.config.typography, versionColor: sw.hex },
                                        },
                                      })
                                    }
                                    style={{
                                      flex: 1,
                                      fontSize: '0.68rem',
                                      padding: '0.2rem 0',
                                      backgroundColor: sw.hex === (selectedTheme.config.typography.versionColor || '#94A3B8') ? 'rgba(255,255,255,0.2)' : 'var(--bg-card)',
                                      color: sw.hex,
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {sw.name}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Style & Weight */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '3px' }}>
                                  Style
                                </label>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                  {[
                                    { id: 'normal', label: 'Normal' },
                                    { id: 'italic', label: 'Italic' },
                                  ].map((st) => {
                                    const isActive = (selectedTheme.config.typography.versionStyle || 'normal') === st.id;
                                    return (
                                      <button
                                        key={st.id}
                                        type="button"
                                        onClick={() =>
                                          setSelectedTheme({
                                            ...selectedTheme,
                                            config: {
                                              ...selectedTheme.config,
                                              typography: { ...selectedTheme.config.typography, versionStyle: st.id as any },
                                            },
                                          })
                                        }
                                        style={{
                                          flex: 1,
                                          padding: '0.3rem 0',
                                          fontSize: '0.74rem',
                                          fontWeight: isActive ? 700 : 500,
                                          fontStyle: st.id === 'italic' ? 'italic' : 'normal',
                                          backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-card)',
                                          color: isActive ? '#FFFFFF' : 'var(--text-dim)',
                                          border: isActive ? '1px solid #3B82F6' : '1px solid var(--border-color)',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        {st.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '3px' }}>
                                  Weight
                                </label>
                                <select
                                  value={selectedTheme.config.typography.versionWeight ?? 600}
                                  onChange={(e) =>
                                    setSelectedTheme({
                                      ...selectedTheme,
                                      config: {
                                        ...selectedTheme.config,
                                        typography: { ...selectedTheme.config.typography, versionWeight: Number(e.target.value) },
                                      },
                                    })
                                  }
                                  style={{ width: '100%', fontSize: '0.76rem', padding: '0.28rem 0.4rem' }}
                                >
                                  <option value={400}>Regular (400)</option>
                                  <option value={600}>Semi-Bold (600)</option>
                                  <option value={700}>Bold (700)</option>
                                  <option value={800}>Extra Bold (800)</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* 4. Secondary Version Name Styling (Dual Translation) */}
                          <div style={{ backgroundColor: 'var(--bg-panel)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.35)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: selectedTheme.config.typography.secondaryVersionColor || '#F59E0B' }} />
                                <span>Secondary Version Name</span>
                              </label>
                              <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', fontWeight: 600 }}>
                                Dual Mode
                              </span>
                            </div>

                            {/* Color Picker & Swatches */}
                            <div>
                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                                <input
                                  type="color"
                                  value={selectedTheme.config.typography.secondaryVersionColor || '#F59E0B'}
                                  onChange={(e) =>
                                    setSelectedTheme({
                                      ...selectedTheme,
                                      config: {
                                        ...selectedTheme.config,
                                        typography: { ...selectedTheme.config.typography, secondaryVersionColor: e.target.value },
                                      },
                                    })
                                  }
                                  style={{ width: '32px', height: '32px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                                />
                                <input
                                  type="text"
                                  value={selectedTheme.config.typography.secondaryVersionColor || '#F59E0B'}
                                  onChange={(e) =>
                                    setSelectedTheme({
                                      ...selectedTheme,
                                      config: {
                                        ...selectedTheme.config,
                                        typography: { ...selectedTheme.config.typography, secondaryVersionColor: e.target.value },
                                      },
                                    })
                                  }
                                  style={{ flex: 1, fontSize: '0.78rem' }}
                                />
                              </div>
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                {[
                                  { name: 'Gold', hex: '#F59E0B' },
                                  { name: 'Amber', hex: '#D97706' },
                                  { name: 'Coral', hex: '#F87171' },
                                  { name: 'Sky', hex: '#60A5FA' },
                                  { name: 'White', hex: '#FFFFFF' },
                                ].map((sw) => (
                                  <button
                                    key={sw.hex}
                                    type="button"
                                    onClick={() =>
                                      setSelectedTheme({
                                        ...selectedTheme,
                                        config: {
                                          ...selectedTheme.config,
                                          typography: { ...selectedTheme.config.typography, secondaryVersionColor: sw.hex },
                                        },
                                      })
                                    }
                                    style={{
                                      flex: 1,
                                      fontSize: '0.68rem',
                                      padding: '0.2rem 0',
                                      backgroundColor: sw.hex === (selectedTheme.config.typography.secondaryVersionColor || '#F59E0B') ? 'rgba(245, 158, 11, 0.25)' : 'var(--bg-card)',
                                      color: sw.hex,
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {sw.name}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Style & Weight */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '3px' }}>
                                  Style
                                </label>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                  {[
                                    { id: 'normal', label: 'Normal' },
                                    { id: 'italic', label: 'Italic' },
                                  ].map((st) => {
                                    const isActive = (selectedTheme.config.typography.secondaryVersionStyle || 'normal') === st.id;
                                    return (
                                      <button
                                        key={st.id}
                                        type="button"
                                        onClick={() =>
                                          setSelectedTheme({
                                            ...selectedTheme,
                                            config: {
                                              ...selectedTheme.config,
                                              typography: { ...selectedTheme.config.typography, secondaryVersionStyle: st.id as any },
                                            },
                                          })
                                        }
                                        style={{
                                          flex: 1,
                                          padding: '0.3rem 0',
                                          fontSize: '0.74rem',
                                          fontWeight: isActive ? 700 : 500,
                                          fontStyle: st.id === 'italic' ? 'italic' : 'normal',
                                          backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-card)',
                                          color: isActive ? '#FFFFFF' : 'var(--text-dim)',
                                          border: isActive ? '1px solid #3B82F6' : '1px solid var(--border-color)',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        {st.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '3px' }}>
                                  Weight
                                </label>
                                <select
                                  value={selectedTheme.config.typography.secondaryVersionWeight ?? 600}
                                  onChange={(e) =>
                                    setSelectedTheme({
                                      ...selectedTheme,
                                      config: {
                                        ...selectedTheme.config,
                                        typography: { ...selectedTheme.config.typography, secondaryVersionWeight: Number(e.target.value) },
                                      },
                                    })
                                  }
                                  style={{ width: '100%', fontSize: '0.76rem', padding: '0.28rem 0.4rem' }}
                                >
                                  <option value={400}>Regular (400)</option>
                                  <option value={600}>Semi-Bold (600)</option>
                                  <option value={700}>Bold (700)</option>
                                  <option value={800}>Extra Bold (800)</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* TAB 2: BACKGROUND */}
                  {activeTab === 'background' && (
                    <>
                      {/* Prominent Visual Mode Selector Tabs */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                          Background Mode
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', marginBottom: '1rem' }}>
                          {[
                            { id: 'gradient', label: 'Color Gradient', icon: 'palette' },
                            { id: 'image', label: 'Custom Image', icon: 'image' },
                            { id: 'solid', label: 'Solid Color', icon: 'square' },
                            { id: 'transparent', label: 'Transparent (OBS)', icon: 'layers' },
                          ].map((m) => {
                            const isActive = selectedTheme.config.background.type === m.id;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setSelectedTheme({
                                    ...selectedTheme,
                                    config: {
                                      ...selectedTheme.config,
                                      background: {
                                        ...selectedTheme.config.background,
                                        type: m.id as any,
                                      },
                                    },
                                  });
                                }}
                                style={{
                                  padding: '0.65rem 0.5rem',
                                  fontSize: '0.82rem',
                                  fontWeight: isActive ? 700 : 500,
                                  backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-panel)',
                                  color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                                  border: isActive ? '2px solid #3B82F6' : '1px solid var(--border-color)',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.4rem',
                                  boxShadow: isActive ? '0 0 10px rgba(59, 130, 246, 0.35)' : 'none',
                                }}
                              >
                                <MaterialIcon name={m.icon} size={17} />
                                <span>{m.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* --- MODE 1: CUSTOM BACKGROUND IMAGE --- */}
                      {selectedTheme.config.background.type === 'image' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {/* File Uploader Card */}
                          <div style={{ backgroundColor: 'var(--bg-panel)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '0.5rem' }}>
                              Upload Image from Computer
                            </div>

                            <label
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '1.25rem 1rem',
                                border: '2px dashed var(--primary)',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'background 0.15s ease',
                              }}
                            >
                              <div style={{ marginBottom: '0.25rem', color: '#60A5FA' }}>
                                <MaterialIcon name="folder_open" size={32} />
                              </div>
                              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#60A5FA' }}>
                                Click to Browse Image File
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '3px' }}>
                                Supports JPG, PNG, WEBP (Saved locally, works 100% offline)
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (evt) => {
                                      const dataUrl = evt.target?.result as string;
                                      setSelectedTheme({
                                        ...selectedTheme,
                                        config: {
                                          ...selectedTheme.config,
                                          background: {
                                            ...selectedTheme.config.background,
                                            imageUrl: dataUrl,
                                            type: 'image',
                                          },
                                        },
                                      });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>

                            {/* Active Image Status / Preview Thumbnail */}
                            {selectedTheme.config.background.imageUrl && (
                              <div
                                style={{
                                  marginTop: '0.75rem',
                                  padding: '0.5rem 0.75rem',
                                  backgroundColor: 'var(--bg-card)',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '0.75rem',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                  <div
                                    style={{
                                      width: '42px',
                                      height: '28px',
                                      borderRadius: '4px',
                                      backgroundImage: `url("${selectedTheme.config.background.imageUrl}")`,
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center',
                                      border: '1px solid #10B981',
                                    }}
                                  />
                                  <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <MaterialIcon name="check_circle" size={15} color="#10B981" />
                                    <span>Image Applied</span>
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedTheme({
                                      ...selectedTheme,
                                      config: {
                                        ...selectedTheme.config,
                                        background: {
                                          ...selectedTheme.config.background,
                                          imageUrl: '',
                                        },
                                      },
                                    })
                                  }
                                  style={{
                                    fontSize: '0.75rem',
                                    padding: '0.2rem 0.6rem',
                                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                    color: '#EF4444',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                  }}
                                >
                                  <MaterialIcon name="delete" size={14} />
                                  <span>Remove</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Direct URL / Path Option */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                              Or Direct Image URL / Local File Path
                            </label>
                            <input
                              type="text"
                              placeholder="https://... or C:\worship\background.jpg"
                              value={selectedTheme.config.background.imageUrl || ''}
                              onChange={(e) =>
                                setSelectedTheme({
                                  ...selectedTheme,
                                  config: {
                                    ...selectedTheme.config,
                                    background: {
                                      ...selectedTheme.config.background,
                                      imageUrl: e.target.value,
                                      type: 'image',
                                    },
                                  },
                                })
                              }
                              style={{ width: '100%', fontSize: '0.8rem' }}
                            />
                          </div>

                          {/* Darkening / Dimming Slider */}
                          <div style={{ backgroundColor: 'var(--bg-panel)', padding: '0.75rem', borderRadius: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <label style={{ fontSize: '0.8rem', color: '#F1F5F9', fontWeight: 600 }}>
                                Darkening Overlay (Text Readability)
                              </label>
                              <span style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: 700 }}>
                                {selectedTheme.config.background.dimmingPercent ?? 45}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={90}
                              value={selectedTheme.config.background.dimmingPercent ?? 45}
                              onChange={(e) =>
                                setSelectedTheme({
                                  ...selectedTheme,
                                  config: {
                                    ...selectedTheme.config,
                                    background: {
                                      ...selectedTheme.config.background,
                                      dimmingPercent: Number(e.target.value),
                                    },
                                  },
                                })
                              }
                              style={{ width: '100%' }}
                            />
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                              Dims the photo so white and gold scripture verses stay easily readable.
                            </span>
                          </div>

                          {/* Scaling Mode */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                              Image Scaling
                            </label>
                            <select
                              value={selectedTheme.config.background.objectFit || 'cover'}
                              onChange={(e) =>
                                setSelectedTheme({
                                  ...selectedTheme,
                                  config: {
                                    ...selectedTheme.config,
                                    background: {
                                      ...selectedTheme.config.background,
                                      objectFit: e.target.value as any,
                                    },
                                  },
                                })
                              }
                              style={{ width: '100%' }}
                            >
                              <option value="cover">Fill Screen (Cover 16:9)</option>
                              <option value="contain">Fit Entire Image (Contain)</option>
                            </select>
                          </div>

                          {/* 1-Click Worship Background Presets */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                              Built-in Worship Wallpaper Presets
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
                              {WORSHIP_BG_PRESETS.map((p) => (
                                <button
                                  key={p.name}
                                  type="button"
                                  onClick={() =>
                                    setSelectedTheme({
                                      ...selectedTheme,
                                      config: {
                                        ...selectedTheme.config,
                                        background: {
                                          ...selectedTheme.config.background,
                                          type: 'image',
                                          imageUrl: p.url,
                                          dimmingPercent: 45,
                                        },
                                      },
                                    })
                                  }
                                  style={{
                                    padding: '0.4rem 0.5rem',
                                    fontSize: '0.75rem',
                                    backgroundColor: 'var(--bg-panel)',
                                    border: selectedTheme.config.background.imageUrl === p.url ? '1px solid #10B981' : '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    color: selectedTheme.config.background.imageUrl === p.url ? '#10B981' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                  }}
                                >
                                  {p.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* --- MODE 2: LINEAR GRADIENT --- */}
                      {selectedTheme.config.background.type === 'gradient' && (
                        <>
                          <div style={{ marginBottom: '0.85rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                              One-Click Color Presets
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
                              {PRESET_GRADIENTS.map((p) => (
                                <button
                                  key={p.name}
                                  type="button"
                                  onClick={() => {
                                    setSelectedTheme({
                                      ...selectedTheme,
                                      config: {
                                        ...selectedTheme.config,
                                        background: {
                                          type: p.start === p.end ? 'solid' : 'gradient',
                                          color: p.start,
                                          gradient: {
                                            type: 'linear',
                                            directionDeg: p.angle,
                                            stops: [
                                              { color: p.start, offset: 0 },
                                              { color: p.end, offset: 100 },
                                            ],
                                          },
                                        },
                                      },
                                    });
                                  }}
                                  style={{
                                    padding: '0.4rem 0.5rem',
                                    fontSize: '0.75rem',
                                    backgroundColor: 'var(--bg-panel)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                  }}
                                >
                                  {p.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '2px' }}>
                                Color 1
                              </label>
                              <input
                                type="color"
                                value={selectedTheme.config.background.gradient?.stops?.[0]?.color || '#09172C'}
                                onChange={(e) => {
                                  const stops = [...(selectedTheme.config.background.gradient?.stops || [])];
                                  if (stops[0]) stops[0].color = e.target.value;
                                  setSelectedTheme({
                                    ...selectedTheme,
                                    config: {
                                      ...selectedTheme.config,
                                      background: {
                                        ...selectedTheme.config.background,
                                        gradient: {
                                          ...selectedTheme.config.background.gradient!,
                                          stops,
                                        },
                                      },
                                    },
                                  });
                                }}
                                style={{ width: '100%', height: '36px', cursor: 'pointer' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '2px' }}>
                                Color 2
                              </label>
                              <input
                                type="color"
                                value={selectedTheme.config.background.gradient?.stops?.[1]?.color || '#0F2B48'}
                                onChange={(e) => {
                                  const stops = [...(selectedTheme.config.background.gradient?.stops || [])];
                                  if (stops[1]) stops[1].color = e.target.value;
                                  setSelectedTheme({
                                    ...selectedTheme,
                                    config: {
                                      ...selectedTheme.config,
                                      background: {
                                        ...selectedTheme.config.background,
                                        gradient: {
                                          ...selectedTheme.config.background.gradient!,
                                          stops,
                                        },
                                      },
                                    },
                                  });
                                }}
                                style={{ width: '100%', height: '36px', cursor: 'pointer' }}
                              />
                            </div>
                          </div>

                          <div style={{ marginTop: '0.75rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                              Gradient Angle: {selectedTheme.config.background.gradient?.directionDeg || 135}°
                            </label>
                            <input
                              type="range"
                              min={0}
                              max={360}
                              value={selectedTheme.config.background.gradient?.directionDeg || 135}
                              onChange={(e) => {
                                setSelectedTheme({
                                  ...selectedTheme,
                                  config: {
                                    ...selectedTheme.config,
                                    background: {
                                      ...selectedTheme.config.background,
                                      gradient: {
                                        ...selectedTheme.config.background.gradient!,
                                        directionDeg: Number(e.target.value),
                                      },
                                    },
                                  },
                                });
                              }}
                              style={{ width: '100%' }}
                            />
                          </div>

                          {/* Quick Jump Callout to Image Mode */}
                          <div
                            style={{
                              marginTop: '1.25rem',
                              padding: '0.75rem',
                              backgroundColor: 'rgba(59, 130, 246, 0.08)',
                              border: '1px dashed rgba(59, 130, 246, 0.3)',
                              borderRadius: '6px',
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontSize: '0.8rem', color: '#93C5FD', marginBottom: '0.4rem', fontWeight: 600 }}>
                              Want to use a photo or wallpaper background?
                            </div>
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => {
                                setSelectedTheme({
                                  ...selectedTheme,
                                  config: {
                                    ...selectedTheme.config,
                                    background: {
                                      ...selectedTheme.config.background,
                                      type: 'image',
                                    },
                                  },
                                });
                              }}
                              style={{
                                fontSize: '0.8rem',
                                padding: '0.35rem 0.85rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              <MaterialIcon name="image" size={16} />
                              <span>Switch to Custom Image Mode</span>
                            </button>
                          </div>
                        </>
                      )}

                      {/* --- MODE 3: SOLID COLOR --- */}
                      {selectedTheme.config.background.type === 'solid' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                            Solid Background Color
                          </label>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                              type="color"
                              value={selectedTheme.config.background.color || '#09172C'}
                              onChange={(e) =>
                                setSelectedTheme({
                                  ...selectedTheme,
                                  config: {
                                    ...selectedTheme.config,
                                    background: {
                                      ...selectedTheme.config.background,
                                      color: e.target.value,
                                    },
                                  },
                                })
                              }
                              style={{ width: '40px', height: '40px', cursor: 'pointer' }}
                            />
                            <input
                              type="text"
                              value={selectedTheme.config.background.color || '#09172C'}
                              onChange={(e) =>
                                setSelectedTheme({
                                  ...selectedTheme,
                                  config: {
                                    ...selectedTheme.config,
                                    background: {
                                      ...selectedTheme.config.background,
                                      color: e.target.value,
                                    },
                                  },
                                })
                              }
                              style={{ flex: 1 }}
                            />
                          </div>

                          <div
                            style={{
                              marginTop: '1.25rem',
                              padding: '0.75rem',
                              backgroundColor: 'rgba(59, 130, 246, 0.08)',
                              border: '1px dashed rgba(59, 130, 246, 0.3)',
                              borderRadius: '6px',
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontSize: '0.8rem', color: '#93C5FD', marginBottom: '0.4rem', fontWeight: 600 }}>
                              Want to use a photo or wallpaper background?
                            </div>
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => {
                                setSelectedTheme({
                                  ...selectedTheme,
                                  config: {
                                    ...selectedTheme.config,
                                    background: {
                                      ...selectedTheme.config.background,
                                      type: 'image',
                                    },
                                  },
                                });
                              }}
                              style={{
                                fontSize: '0.8rem',
                                padding: '0.35rem 0.85rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              <MaterialIcon name="image" size={16} />
                              <span>Switch to Custom Image Mode</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* TAB 3: TEXT EFFECTS (SHADOW, OUTLINE, GLOW) */}
                  {activeTab === 'effects' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {/* 1. Text Shadow */}
                      <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-panel)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F1F5F9' }}>Text Shadow</span>
                          <input
                            type="checkbox"
                            checked={selectedTheme.config.shadow.enabled}
                            onChange={(e) =>
                              setSelectedTheme({
                                ...selectedTheme,
                                config: {
                                  ...selectedTheme.config,
                                  shadow: { ...selectedTheme.config.shadow, enabled: e.target.checked },
                                },
                              })
                            }
                          />
                        </div>

                        {selectedTheme.config.shadow.enabled && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                  Blur Radius
                                </label>
                                <span style={{ fontSize: '0.75rem', color: '#60A5FA', fontWeight: 600 }}>
                                  {selectedTheme.config.shadow.blurPx}px
                                </span>
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={30}
                                value={selectedTheme.config.shadow.blurPx}
                                onChange={(e) =>
                                  setSelectedTheme({
                                    ...selectedTheme,
                                    config: {
                                      ...selectedTheme.config,
                                      shadow: { ...selectedTheme.config.shadow, blurPx: Number(e.target.value) },
                                    },
                                  })
                                }
                                style={{ width: '100%' }}
                              />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                              <div>
                                <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>
                                  Offset X ({selectedTheme.config.shadow.offsetX ?? 2}px)
                                </label>
                                <input
                                  type="range"
                                  min={-15}
                                  max={15}
                                  value={selectedTheme.config.shadow.offsetX ?? 2}
                                  onChange={(e) =>
                                    setSelectedTheme({
                                      ...selectedTheme,
                                      config: {
                                        ...selectedTheme.config,
                                        shadow: { ...selectedTheme.config.shadow, offsetX: Number(e.target.value) },
                                      },
                                    })
                                  }
                                  style={{ width: '100%' }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>
                                  Offset Y ({selectedTheme.config.shadow.offsetY ?? 4}px)
                                </label>
                                <input
                                  type="range"
                                  min={-15}
                                  max={15}
                                  value={selectedTheme.config.shadow.offsetY ?? 4}
                                  onChange={(e) =>
                                    setSelectedTheme({
                                      ...selectedTheme,
                                      config: {
                                        ...selectedTheme.config,
                                        shadow: { ...selectedTheme.config.shadow, offsetY: Number(e.target.value) },
                                      },
                                    })
                                  }
                                  style={{ width: '100%' }}
                                />
                              </div>
                            </div>

                            <div>
                              <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>
                                Shadow Color
                              </label>
                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                <input
                                  type="color"
                                  value={selectedTheme.config.shadow.color.startsWith('#') ? selectedTheme.config.shadow.color : '#000000'}
                                  onChange={(e) =>
                                    setSelectedTheme({
                                      ...selectedTheme,
                                      config: {
                                        ...selectedTheme.config,
                                        shadow: { ...selectedTheme.config.shadow, color: e.target.value },
                                      },
                                    })
                                  }
                                  style={{ width: '32px', height: '32px', padding: 0, border: 'none', cursor: 'pointer' }}
                                />
                                <input
                                  type="text"
                                  value={selectedTheme.config.shadow.color}
                                  onChange={(e) =>
                                    setSelectedTheme({
                                      ...selectedTheme,
                                      config: {
                                        ...selectedTheme.config,
                                        shadow: { ...selectedTheme.config.shadow, color: e.target.value },
                                      },
                                    })
                                  }
                                  style={{ flex: 1, fontSize: '0.78rem' }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 2. Text Outline / Stroke */}
                      <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-panel)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F1F5F9' }}>Text Outline (Stroke)</span>
                          <input
                            type="checkbox"
                            checked={selectedTheme.config.outline.enabled}
                            onChange={(e) =>
                              setSelectedTheme({
                                ...selectedTheme,
                                config: {
                                  ...selectedTheme.config,
                                  outline: { ...selectedTheme.config.outline, enabled: e.target.checked },
                                },
                              })
                            }
                          />
                        </div>

                        {selectedTheme.config.outline.enabled && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                  Outline Width (Thickness)
                                </label>
                                <span style={{ fontSize: '0.75rem', color: '#60A5FA', fontWeight: 600 }}>
                                  {selectedTheme.config.outline.widthPx}px
                                </span>
                              </div>
                              <input
                                type="range"
                                min={1}
                                max={10}
                                value={selectedTheme.config.outline.widthPx}
                                onChange={(e) =>
                                  setSelectedTheme({
                                    ...selectedTheme,
                                    config: {
                                      ...selectedTheme.config,
                                      outline: { ...selectedTheme.config.outline, widthPx: Number(e.target.value) },
                                    },
                                  })
                                }
                                style={{ width: '100%' }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>
                                Outline Color
                              </label>
                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                <input
                                  type="color"
                                  value={selectedTheme.config.outline.color}
                                  onChange={(e) =>
                                    setSelectedTheme({
                                      ...selectedTheme,
                                      config: {
                                        ...selectedTheme.config,
                                        outline: { ...selectedTheme.config.outline, color: e.target.value },
                                      },
                                    })
                                  }
                                  style={{ width: '32px', height: '32px', padding: 0, border: 'none', cursor: 'pointer' }}
                                />
                                <input
                                  type="text"
                                  value={selectedTheme.config.outline.color}
                                  onChange={(e) =>
                                    setSelectedTheme({
                                      ...selectedTheme,
                                      config: {
                                        ...selectedTheme.config,
                                        outline: { ...selectedTheme.config.outline, color: e.target.value },
                                      },
                                    })
                                  }
                                  style={{ flex: 1, fontSize: '0.78rem' }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 3. Text Glow / Halo */}
                      <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-panel)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F1F5F9' }}>Text Glow (Halo)</span>
                          <input
                            type="checkbox"
                            checked={Boolean(selectedTheme.config.glow?.enabled)}
                            onChange={(e) =>
                              setSelectedTheme({
                                ...selectedTheme,
                                config: {
                                  ...selectedTheme.config,
                                  glow: {
                                    enabled: e.target.checked,
                                    color: selectedTheme.config.glow?.color || '#F59E0B',
                                    radiusPx: selectedTheme.config.glow?.radiusPx ?? 12,
                                  },
                                },
                              })
                            }
                          />
                        </div>

                        {selectedTheme.config.glow?.enabled && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                  Glow Radius
                                </label>
                                <span style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 600 }}>
                                  {selectedTheme.config.glow.radiusPx}px
                                </span>
                              </div>
                              <input
                                type="range"
                                min={2}
                                max={40}
                                value={selectedTheme.config.glow.radiusPx}
                                onChange={(e) =>
                                  setSelectedTheme({
                                    ...selectedTheme,
                                    config: {
                                      ...selectedTheme.config,
                                      glow: {
                                        ...selectedTheme.config.glow!,
                                        radiusPx: Number(e.target.value),
                                      },
                                    },
                                  })
                                }
                                style={{ width: '100%' }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>
                                Glow Color
                              </label>
                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                <input
                                  type="color"
                                  value={selectedTheme.config.glow.color}
                                  onChange={(e) =>
                                    setSelectedTheme({
                                      ...selectedTheme,
                                      config: {
                                        ...selectedTheme.config,
                                        glow: {
                                          ...selectedTheme.config.glow!,
                                          color: e.target.value,
                                        },
                                      },
                                    })
                                  }
                                  style={{ width: '32px', height: '32px', padding: 0, border: 'none', cursor: 'pointer' }}
                                />
                                <input
                                  type="text"
                                  value={selectedTheme.config.glow.color}
                                  onChange={(e) =>
                                    setSelectedTheme({
                                      ...selectedTheme,
                                      config: {
                                        ...selectedTheme.config,
                                        glow: {
                                          ...selectedTheme.config.glow!,
                                          color: e.target.value,
                                        },
                                      },
                                    })
                                  }
                                  style={{ flex: 1, fontSize: '0.78rem' }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: LAYOUT, DIMENSIONS (WIDTH, HEIGHT, PADDING) & MARGINS */}
                  {activeTab === 'layout' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {/* 1. Container Dimensions: Width, Height, Padding */}
                      <div style={{ backgroundColor: 'var(--bg-panel)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F1F5F9', display: 'block', marginBottom: '0.6rem' }}>
                          Container Width, Height & Padding
                        </span>

                        {/* Max Width */}
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                              Content Width (Box Width)
                            </label>
                            <span style={{ fontSize: '0.75rem', color: '#60A5FA', fontWeight: 700 }}>
                              {selectedTheme.config.margins.containerMaxWidthPercent ?? 92}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={40}
                            max={100}
                            step={1}
                            value={selectedTheme.config.margins.containerMaxWidthPercent ?? 92}
                            onChange={(e) =>
                              setSelectedTheme({
                                ...selectedTheme,
                                config: {
                                  ...selectedTheme.config,
                                  margins: {
                                    ...selectedTheme.config.margins,
                                    containerMaxWidthPercent: Number(e.target.value),
                                  },
                                },
                              })
                            }
                            style={{ width: '100%', marginBottom: '0.25rem' }}
                          />
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {[
                              { label: 'Compact', pct: 70 },
                              { label: 'Standard', pct: 92 },
                              { label: 'Wide', pct: 96 },
                              { label: 'Edge', pct: 100 },
                            ].map((wp) => (
                              <button
                                key={wp.label}
                                type="button"
                                onClick={() =>
                                  setSelectedTheme({
                                    ...selectedTheme,
                                    config: {
                                      ...selectedTheme.config,
                                      margins: {
                                        ...selectedTheme.config.margins,
                                        containerMaxWidthPercent: wp.pct,
                                      },
                                    },
                                  })
                                }
                                style={{
                                  flex: 1,
                                  fontSize: '0.65rem',
                                  padding: '0.15rem 0',
                                  backgroundColor: (selectedTheme.config.margins.containerMaxWidthPercent ?? 92) === wp.pct ? 'var(--primary)' : 'var(--bg-card)',
                                  color: (selectedTheme.config.margins.containerMaxWidthPercent ?? 92) === wp.pct ? '#FFFFFF' : 'var(--text-dim)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                }}
                              >
                                {wp.label} ({wp.pct}%)
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Content Height */}
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <div>
                              <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                Content Height (Box Height)
                              </label>
                              <span style={{ fontSize: '0.65rem', color: '#94A3B8', display: 'block' }}>
                                Maximum vertical boundary; auto-fits text without clipping
                              </span>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#60A5FA', fontWeight: 700 }}>
                              {selectedTheme.config.margins.containerMaxHeightPercent ?? 88}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={20}
                            max={100}
                            step={1}
                            value={selectedTheme.config.margins.containerMaxHeightPercent ?? 88}
                            onChange={(e) =>
                              setSelectedTheme({
                                ...selectedTheme,
                                config: {
                                  ...selectedTheme.config,
                                  margins: {
                                    ...selectedTheme.config.margins,
                                    containerMaxHeightPercent: Number(e.target.value),
                                  },
                                },
                              })
                            }
                            style={{ width: '100%', marginBottom: '0.25rem' }}
                          />
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {[
                              { label: 'Banner', pct: 35 },
                              { label: 'Compact', pct: 50 },
                              { label: 'Medium', pct: 70 },
                              { label: 'Standard', pct: 88 },
                              { label: 'Full', pct: 98 },
                            ].map((hp) => (
                              <button
                                key={hp.label}
                                type="button"
                                onClick={() =>
                                  setSelectedTheme({
                                    ...selectedTheme,
                                    config: {
                                      ...selectedTheme.config,
                                      margins: {
                                        ...selectedTheme.config.margins,
                                        containerMaxHeightPercent: hp.pct,
                                      },
                                    },
                                  })
                                }
                                style={{
                                  flex: 1,
                                  fontSize: '0.65rem',
                                  padding: '0.15rem 0',
                                  backgroundColor: (selectedTheme.config.margins.containerMaxHeightPercent ?? 88) === hp.pct ? 'var(--primary)' : 'var(--bg-card)',
                                  color: (selectedTheme.config.margins.containerMaxHeightPercent ?? 88) === hp.pct ? '#FFFFFF' : 'var(--text-dim)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                }}
                              >
                                {hp.label} ({hp.pct}%)
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Inner Padding */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                              Inner Box Padding
                            </label>
                            <span style={{ fontSize: '0.75rem', color: '#60A5FA', fontWeight: 700 }}>
                              {selectedTheme.config.margins.paddingPercent ?? 3}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={15}
                            step={0.5}
                            value={selectedTheme.config.margins.paddingPercent ?? 3}
                            onChange={(e) =>
                              setSelectedTheme({
                                ...selectedTheme,
                                config: {
                                  ...selectedTheme.config,
                                  margins: {
                                    ...selectedTheme.config.margins,
                                    paddingPercent: parseFloat(e.target.value),
                                  },
                                },
                              })
                            }
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>

                      {/* 2. Dual Translation Grid Layout (Stacked vs Side-by-Side) */}
                      <div style={{ backgroundColor: 'var(--bg-panel)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F1F5F9', display: 'block' }}>
                            Dual Translation Grid Layout
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                            Choose orientation when presenting multiple Bible versions
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                          {[
                            { id: 'stacked', label: 'Stacked (2 Rows)', icon: 'view_agenda' },
                            { id: 'side-by-side', label: 'Side-by-Side (2 Cols)', icon: 'view_column' },
                          ].map((lo) => {
                            const isCurrent = (selectedTheme.config.placement.translationLayout || 'stacked') === lo.id;
                            return (
                              <button
                                key={lo.id}
                                type="button"
                                onClick={() =>
                                  setSelectedTheme({
                                    ...selectedTheme,
                                    config: {
                                      ...selectedTheme.config,
                                      placement: {
                                        ...selectedTheme.config.placement,
                                        translationLayout: lo.id as any,
                                      },
                                    },
                                  })
                                }
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.35rem',
                                  padding: '0.45rem 0.2rem',
                                  fontSize: '0.74rem',
                                  fontWeight: isCurrent ? 700 : 500,
                                  backgroundColor: isCurrent ? 'var(--primary)' : 'var(--bg-card)',
                                  color: isCurrent ? '#FFFFFF' : 'var(--text-dim)',
                                  border: isCurrent ? '1px solid #3B82F6' : '1px solid var(--border-color)',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                }}
                              >
                                <MaterialIcon name={lo.icon} size={15} />
                                <span>{lo.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 3. Translation Card Style */}
                      <div style={{ backgroundColor: 'var(--bg-panel)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F1F5F9', display: 'block' }}>
                            Translation Card Style
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                            Backdrop and frame appearance for scripture boxes
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.3rem' }}>
                          {[
                            { id: 'glass', label: 'Glass' },
                            { id: 'solid', label: 'Solid' },
                            { id: 'bordered', label: 'Border' },
                            { id: 'none', label: 'Seamless' },
                          ].map((cs) => {
                            const isCurrent = (selectedTheme.config.placement.cardStyle || 'glass') === cs.id;
                            return (
                              <button
                                key={cs.id}
                                type="button"
                                onClick={() =>
                                  setSelectedTheme({
                                    ...selectedTheme,
                                    config: {
                                      ...selectedTheme.config,
                                      placement: {
                                        ...selectedTheme.config.placement,
                                        cardStyle: cs.id as any,
                                      },
                                    },
                                  })
                                }
                                style={{
                                  padding: '0.4rem 0.1rem',
                                  fontSize: '0.72rem',
                                  fontWeight: isCurrent ? 700 : 500,
                                  backgroundColor: isCurrent ? 'var(--primary)' : 'var(--bg-card)',
                                  color: isCurrent ? '#FFFFFF' : 'var(--text-dim)',
                                  border: isCurrent ? '1px solid #3B82F6' : '1px solid var(--border-color)',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                }}
                              >
                                {cs.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 4. Vertical Alignment */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                          Vertical Content Alignment
                        </label>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          {[
                            { id: 'top', label: '⬆ Top' },
                            { id: 'center', label: '⬍ Middle (Center)' },
                            { id: 'bottom', label: '⬇ Bottom' },
                          ].map((va) => {
                            const isActive = selectedTheme.config.placement.verticalAlign === va.id;
                            return (
                              <button
                                key={va.id}
                                type="button"
                                onClick={() =>
                                  setSelectedTheme({
                                    ...selectedTheme,
                                    config: {
                                      ...selectedTheme.config,
                                      placement: { ...selectedTheme.config.placement, verticalAlign: va.id as any },
                                    },
                                  })
                                }
                                style={{
                                  flex: 1,
                                  padding: '0.45rem 0.2rem',
                                  fontSize: '0.78rem',
                                  fontWeight: isActive ? 700 : 500,
                                  backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-panel)',
                                  color: isActive ? '#FFFFFF' : 'var(--text-dim)',
                                  border: isActive ? '1px solid #3B82F6' : '1px solid var(--border-color)',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                }}
                              >
                                {va.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 5. Screen Safe Margins */}
                      <div style={{ backgroundColor: 'var(--bg-panel)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F1F5F9', display: 'block', marginBottom: '0.5rem' }}>
                          Screen Safe Margins
                        </span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Top Margin</label>
                              <span style={{ fontSize: '0.72rem', color: '#60A5FA', fontWeight: 600 }}>{selectedTheme.config.margins.topPercent}%</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={25}
                              value={selectedTheme.config.margins.topPercent}
                              onChange={(e) =>
                                setSelectedTheme({
                                  ...selectedTheme,
                                  config: {
                                    ...selectedTheme.config,
                                    margins: { ...selectedTheme.config.margins, topPercent: Number(e.target.value) },
                                  },
                                })
                              }
                              style={{ width: '100%' }}
                            />
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Bottom Margin</label>
                              <span style={{ fontSize: '0.72rem', color: '#60A5FA', fontWeight: 600 }}>{selectedTheme.config.margins.bottomPercent}%</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={25}
                              value={selectedTheme.config.margins.bottomPercent}
                              onChange={(e) =>
                                setSelectedTheme({
                                  ...selectedTheme,
                                  config: {
                                    ...selectedTheme.config,
                                    margins: { ...selectedTheme.config.margins, bottomPercent: Number(e.target.value) },
                                  },
                                })
                              }
                              style={{ width: '100%' }}
                            />
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Left Margin</label>
                              <span style={{ fontSize: '0.72rem', color: '#60A5FA', fontWeight: 600 }}>{selectedTheme.config.margins.leftPercent}%</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={25}
                              value={selectedTheme.config.margins.leftPercent}
                              onChange={(e) =>
                                setSelectedTheme({
                                  ...selectedTheme,
                                  config: {
                                    ...selectedTheme.config,
                                    margins: { ...selectedTheme.config.margins, leftPercent: Number(e.target.value) },
                                  },
                                })
                              }
                              style={{ width: '100%' }}
                            />
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Right Margin</label>
                              <span style={{ fontSize: '0.72rem', color: '#60A5FA', fontWeight: 600 }}>{selectedTheme.config.margins.rightPercent}%</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={25}
                              value={selectedTheme.config.margins.rightPercent}
                              onChange={(e) =>
                                setSelectedTheme({
                                  ...selectedTheme,
                                  config: {
                                    ...selectedTheme.config,
                                    margins: { ...selectedTheme.config.margins, rightPercent: Number(e.target.value) },
                                  },
                                })
                              }
                              style={{ width: '100%' }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 4. Display Mode */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                          Display Mode
                        </label>
                        <select
                          value={selectedTheme.config.placement.mode}
                          onChange={(e) =>
                            setSelectedTheme({
                              ...selectedTheme,
                              config: {
                                ...selectedTheme.config,
                                placement: { ...selectedTheme.config.placement, mode: e.target.value as any },
                              },
                            })
                          }
                          style={{ width: '100%' }}
                        >
                          <option value="16:9">Fullscreen Sanctuary Projection (16:9)</option>
                          <option value="lower-third">Broadcast Lower-Third (Live Stream)</option>
                        </select>

                        {/* Lower-Third Bar Height (visible when lower-third is active) */}
                        {selectedTheme.config.placement.mode === 'lower-third' && (
                          <div style={{ marginTop: '0.6rem', padding: '0.5rem', backgroundColor: 'var(--bg-card)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <label style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 600 }}>
                                Lower-Third Bar Height
                              </label>
                              <span style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 700 }}>
                                {selectedTheme.config.placement.lowerThirdHeightPercent ?? 32}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min={15}
                              max={50}
                              step={1}
                              value={selectedTheme.config.placement.lowerThirdHeightPercent ?? 32}
                              onChange={(e) =>
                                setSelectedTheme({
                                  ...selectedTheme,
                                  config: {
                                    ...selectedTheme.config,
                                    placement: {
                                      ...selectedTheme.config.placement,
                                      lowerThirdHeightPercent: Number(e.target.value),
                                    },
                                  },
                                })
                              }
                              style={{ width: '100%', marginBottom: '0.25rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              {[
                                { label: 'Slim', pct: 22 },
                                { label: 'Standard', pct: 32 },
                                { label: 'Tall', pct: 42 },
                              ].map((lt) => (
                                <button
                                  key={lt.label}
                                  type="button"
                                  onClick={() =>
                                    setSelectedTheme({
                                      ...selectedTheme,
                                      config: {
                                        ...selectedTheme.config,
                                        placement: {
                                          ...selectedTheme.config.placement,
                                          lowerThirdHeightPercent: lt.pct,
                                        },
                                      },
                                    })
                                  }
                                  style={{
                                    flex: 1,
                                    fontSize: '0.65rem',
                                    padding: '0.15rem 0',
                                    backgroundColor: (selectedTheme.config.placement.lowerThirdHeightPercent ?? 32) === lt.pct ? 'var(--primary)' : 'var(--bg-panel)',
                                    color: (selectedTheme.config.placement.lowerThirdHeightPercent ?? 32) === lt.pct ? '#FFFFFF' : 'var(--text-dim)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {lt.label} ({lt.pct}%)
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
            Select a theme to edit.
          </div>
        )}
      </div>
    </div>
  );
};
