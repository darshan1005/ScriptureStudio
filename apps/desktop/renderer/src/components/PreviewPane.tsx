import React from 'react';
import { PresentationStateDto, ThemeDto } from '@scripture-studio/shared-types';

interface PreviewPaneProps {
  state: PresentationStateDto | null;
  activeTheme: ThemeDto | null;
  onTakeLive: () => void;
  onNextVerse?: () => void;
  onPrevVerse?: () => void;
}

export default function PreviewPane({
  state,
  activeTheme,
  onTakeLive,
  onNextVerse,
  onPrevVerse,
}: PreviewPaneProps): React.JSX.Element {
  const slide = state?.previewSlide;
  const isLive = state?.mode === 'LIVE';

  const bg = activeTheme?.config.background;
  let bgStyle: React.CSSProperties = {
    backgroundColor: '#09172C',
  };
  if (bg) {
    if (bg.type === 'gradient' && bg.gradient) {
      const dir = bg.gradient.directionDeg || 135;
      const stops = bg.gradient.stops.map((s) => `${s.color} ${s.offset}%`).join(', ');
      bgStyle = { background: `linear-gradient(${dir}deg, ${stops})` };
    } else if (bg.type === 'solid' && bg.color) {
      bgStyle = { backgroundColor: bg.color };
    } else if (bg.type === 'image' && bg.imageUrl) {
      const dimming = (bg.dimmingPercent ?? 45) / 100;
      bgStyle = {
        backgroundImage: `linear-gradient(rgba(0,0,0,${dimming}), rgba(0,0,0,${dimming})), url("${bg.imageUrl}")`,
        backgroundSize: bg.objectFit || 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
  }

  // Dynamic compact sizing for 16:9 monitor
  const totalLength = slide?.multiVersionSlots?.reduce((acc, slot) => acc + slot.text.length, 0) || 0;
  const previewFontSize = totalLength > 300 ? '0.78rem' : totalLength > 180 ? '0.84rem' : '0.92rem';
  const previewPadding = totalLength > 250 ? '0.2rem 0.5rem' : '0.35rem 0.6rem';
  const previewGap = totalLength > 250 ? '0.25rem' : '0.4rem';

  // Version Tag typography styling from active theme
  const showVersion = activeTheme?.config.typography.showVersion !== false;
  const versionFormat = activeTheme?.config.typography.versionBadgeFormat || 'parentheses';
  const versionColor = activeTheme?.config.typography.versionColor || '#94A3B8';
  const versionFontSize = `${(activeTheme?.config.typography.versionFontSizeRem ?? 1.1) * 0.72}rem`;
  const versionWeight = activeTheme?.config.typography.versionWeight ?? 600;
  const versionStyle = activeTheme?.config.typography.versionStyle || 'normal';

  const formatVersionTag = (abbr: string) => {
    if (versionFormat === 'brackets') return `[${abbr}]`;
    if (versionFormat === 'pill' || versionFormat === 'plain') return abbr;
    return `(${abbr})`;
  };

  const renderVersionBadge = (abbr: string) => {
    if (!showVersion) return null;
    return (
      <span
        style={{
          marginLeft: '0.35rem',
          fontSize: versionFontSize,
          color: versionColor,
          fontWeight: versionWeight,
          fontStyle: versionStyle,
          display: 'inline-block',
          verticalAlign: 'middle',
          letterSpacing: '0.02em',
          ...(versionFormat === 'pill'
            ? {
                backgroundColor: 'rgba(255, 255, 255, 0.14)',
                padding: '1px 6px',
                borderRadius: '999px',
                border: '1px solid rgba(255, 255, 255, 0.22)',
              }
            : {}),
        }}
      >
        {formatVersionTag(abbr)}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          PREVIEW MONITOR
        </h3>
        {state && (
          <span
            className={`badge ${
              state.mode === 'LIVE'
                ? 'badge-live'
                : state.mode === 'FROZEN'
                ? 'badge-frozen'
                : 'badge-idle'
            }`}
          >
            {state.mode}
          </span>
        )}
      </div>

      {/* 16:9 Scaled Preview Canvas */}
      <div
        style={{
          aspectRatio: '16/9',
          width: '100%',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '2px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0.85rem 1rem',
          textAlign: (activeTheme?.config.typography.alignment as any) || 'center',
          position: 'relative',
          boxSizing: 'border-box',
          ...bgStyle,
        }}
      >
        {slide ? (
          <div
            style={{
              maxWidth: `${activeTheme?.config.margins.containerMaxWidthPercent ?? 94}%`,
              width: '100%',
              padding: `${activeTheme?.config.margins.paddingPercent ?? 2}%`,
              boxSizing: 'border-box',
            }}
          >
            {/* Reference Title if Above */}
            {activeTheme?.config.typography.referencePosition !== 'hidden' &&
              activeTheme?.config.typography.referencePosition !== 'below' && (
                <div
                  style={{
                    fontSize: totalLength > 250 ? '0.95rem' : '1.15rem',
                    fontWeight: activeTheme?.config.typography.referenceWeight ?? 700,
                    color: activeTheme?.config.typography.referenceColor || '#F59E0B',
                    fontStyle: activeTheme?.config.typography.referenceStyle || 'normal',
                    textDecoration: activeTheme?.config.typography.referenceDecoration || 'none',
                    fontFamily: activeTheme?.config.typography.referenceFontFamily || activeTheme?.config.typography.fontFamily || 'Segoe UI, Arial, sans-serif',
                    marginBottom: '0.35rem',
                    letterSpacing: '0.03em',
                  }}
                >
                  <span>{slide.referenceDisplay}</span>
                  {renderVersionBadge(slide.versionAbbreviation)}
                </div>
              )}

            {slide.multiVersionSlots && slide.multiVersionSlots.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: previewGap }}>
                {slide.multiVersionSlots.map((slot, idx) => (
                  <div
                    key={slot.versionAbbreviation}
                    style={{
                      padding: previewPadding,
                      borderRadius: '5px',
                      backgroundColor: idx === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(245, 158, 11, 0.08)',
                      border: idx === 0 ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(245, 158, 11, 0.28)',
                    }}
                  >
                    {showVersion && (
                      <div
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: versionWeight,
                          color: versionColor || (idx === 0 ? '#94A3B8' : '#F59E0B'),
                          fontStyle: versionStyle,
                          marginBottom: '1px',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          ...(versionFormat === 'pill'
                            ? {
                                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                display: 'inline-block',
                              }
                            : {}),
                        }}
                      >
                        {formatVersionTag(slot.versionAbbreviation)}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: previewFontSize,
                        lineHeight: activeTheme?.config.typography.lineHeight || 1.35,
                        color: activeTheme?.config.typography.color || '#FFFFFF',
                        fontFamily: activeTheme?.config.typography.fontFamily || 'Segoe UI, Arial, sans-serif',
                        fontStyle: activeTheme?.config.typography.fontStyle || 'normal',
                        textDecoration: activeTheme?.config.typography.textDecoration || 'none',
                        letterSpacing: `${activeTheme?.config.typography.letterSpacingPx ?? 0.5}px`,
                        textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                      }}
                    >
                      {slot.text}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  fontSize: '1.05rem',
                  lineHeight: activeTheme?.config.typography.lineHeight || 1.45,
                  color: activeTheme?.config.typography.color || '#FFFFFF',
                  fontFamily: activeTheme?.config.typography.fontFamily || 'Segoe UI, Arial, sans-serif',
                  fontStyle: activeTheme?.config.typography.fontStyle || 'normal',
                  textDecoration: activeTheme?.config.typography.textDecoration || 'none',
                  letterSpacing: `${activeTheme?.config.typography.letterSpacingPx ?? 0.5}px`,
                  textShadow: '0 2px 6px rgba(0,0,0,0.8)',
                }}
              >
                {slide.verses.map((v) => (
                  <span key={v.verseNumber}>
                    {slide.verses.length > 1 && (
                      <sup style={{ color: '#94A3B8', marginRight: '4px' }}>{v.verseNumber}</sup>
                    )}
                    {v.text}{' '}
                  </span>
                ))}
              </div>
            )}

            {/* Reference Title if Below */}
            {activeTheme?.config.typography.referencePosition === 'below' && (
              <div
                style={{
                  fontSize: totalLength > 250 ? '0.95rem' : '1.15rem',
                  fontWeight: activeTheme?.config.typography.referenceWeight ?? 700,
                  color: activeTheme?.config.typography.referenceColor || '#F59E0B',
                  fontStyle: activeTheme?.config.typography.referenceStyle || 'normal',
                  textDecoration: activeTheme?.config.typography.referenceDecoration || 'none',
                  fontFamily: activeTheme?.config.typography.referenceFontFamily || activeTheme?.config.typography.fontFamily || 'Segoe UI, Arial, sans-serif',
                  marginTop: '0.4rem',
                  letterSpacing: '0.03em',
                }}
              >
                <span>— {slide.referenceDisplay}</span>
                {renderVersionBadge(slide.versionAbbreviation)}
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No scripture staged. Select a verse from Bible reader.
          </div>
        )}
      </div>

      {/* Quick Verse Navigation & Take Live */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <button
            className="btn-secondary"
            style={{
              padding: '0.65rem 0.4rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              opacity: !slide ? 0.45 : 1,
              cursor: !slide ? 'not-allowed' : 'pointer',
            }}
            onClick={onPrevVerse}
            disabled={!slide}
            title={slide ? 'Previous Verse (Arrow Left / Arrow Up / PageUp)' : 'No scripture staged'}
          >
            <span>◀ Prev Verse (←)</span>
          </button>

          <button
            className="btn-secondary"
            style={{
              padding: '0.65rem 0.4rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              opacity: !slide ? 0.45 : 1,
              cursor: !slide ? 'not-allowed' : 'pointer',
            }}
            onClick={onNextVerse}
            disabled={!slide}
            title={slide ? 'Next Verse (Arrow Right / Arrow Down / PageDown / Space)' : 'No scripture staged'}
          >
            <span>Next Verse (→) ▶</span>
          </button>
        </div>

        <button
          className="btn-primary"
          style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', fontWeight: 800 }}
          onClick={onTakeLive}
          disabled={!slide}
        >
          <span>⚡ TAKE LIVE (F12)</span>
        </button>
      </div>
    </div>
  );
}
