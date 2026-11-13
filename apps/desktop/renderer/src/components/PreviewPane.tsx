import React, { useRef, useState } from 'react';
import { BibleVersionDto, PresentationStateDto, ThemeDto } from '@scripture-studio/shared-types';
import { MaterialIcon } from './MaterialIcon.js';

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

interface PreviewPaneProps {
  state: PresentationStateDto | null;
  activeTheme: ThemeDto | null;
  versions?: BibleVersionDto[];
  primaryVersionId?: string;
  secondaryVersionId?: string;
  onPrimaryVersionChange?: (versionId: string) => void;
  onSecondaryVersionChange?: (versionId: string) => void;
  onSwapTranslations?: () => void;
  onTakeLive: () => void;
  onNextVerse?: () => void;
  onPrevVerse?: () => void;
  onFreezeToggle?: () => void;
  onHideToggle?: () => void;
}

export default function PreviewPane({
  state,
  activeTheme,
  versions = [],
  primaryVersionId = 'kjv',
  secondaryVersionId = 'tel',
  onPrimaryVersionChange,
  onSecondaryVersionChange,
  onSwapTranslations,
  onTakeLive,
  onNextVerse,
  onPrevVerse,
  onFreezeToggle,
  onHideToggle,
}: PreviewPaneProps): React.JSX.Element {
  const slide = state?.previewSlide;
  const isFrozen = state?.isFrozen || false;
  const isVisible = state?.isVisible !== false;

  const previewCanvasRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [savedFilePath, setSavedFilePath] = useState<string | null>(null);

  const handleDownloadPreview = async () => {
    if (!slide || isDownloading) return;
    setIsDownloading(true);
    setDownloadSuccess(null);
    setSavedFilePath(null);

    const safeRef = slide.referenceDisplay.replace(/[\s:]+/g, '_').replace(/[/\\?%*:|"<>]+/g, '_');
    const safeVer = slide.versionAbbreviation.replace(/[\s/]+/g, '_').replace(/[/\\?%*:|"<>]+/g, '_');
    const filename = `Scripture_${safeRef}_${safeVer}.png`;

    try {
      let dataUrl: string | null = null;

      // 1. Capture high-definition Full HD 1080p slide via native offscreen engine
      if (window.scriptureStudioApi?.presentation?.capturePreview) {
        const capRes = await window.scriptureStudioApi.presentation.capturePreview({
          width: 1920,
          height: 1080,
        });
        if (capRes?.success && capRes.dataUrl) {
          dataUrl = capRes.dataUrl;
        }
      }

      // 2. Save image using native Electron dialog or direct download
      if (dataUrl && window.scriptureStudioApi?.presentation?.savePreviewImage) {
        const saveRes = await window.scriptureStudioApi.presentation.savePreviewImage({
          dataUrl,
          defaultFilename: filename,
        });

        if (saveRes?.success && saveRes.filePath) {
          setDownloadSuccess(saveRes.filename || filename);
          setSavedFilePath(saveRes.filePath);
          setTimeout(() => setDownloadSuccess(null), 6000);
          setIsDownloading(false);
          return;
        } else if (saveRes?.canceled) {
          setIsDownloading(false);
          return;
        }
      }

      // 3. Fallback: Browser direct download
      if (dataUrl) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setDownloadSuccess(filename);
        setTimeout(() => setDownloadSuccess(null), 5000);
      }
    } catch (err) {
      console.error('Download preview error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

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

  // Dynamic compact sizing for 16:9 monitor (matches Theme Styler 1:1, perfectly scaled to avoid overflow)
  const isDual = Boolean(slide?.multiVersionSlots && slide.multiVersionSlots.length > 1);
  const totalLength = isDual
    ? slide?.multiVersionSlots?.reduce((acc, slot) => acc + slot.text.length, 0) || 0
    : slide?.verses ? slide.verses.reduce((acc, v) => acc + v.text.length, 0) : 0;

  const userBaseRem = activeTheme?.config.typography.fontSizeRem ?? 3.5;
  const fontMultiplier = isDual
    ? Math.max(0.70, Math.min(1.18, userBaseRem / 3.5))
    : Math.max(0.65, Math.min(1.35, userBaseRem / 3.5));

  // Dual translation sizing for compact 16:9 preview monitor (~300-340px width x ~170-190px height)
  let dualBaseRem = 0.80;
  let previewPadding = '0.28rem 0.55rem';
  let previewGap = '0.35rem';
  let refBaseRem = 0.95;
  let slotVersionBaseRem = 0.65;
  let lineHeightVal = activeTheme?.config.typography.lineHeight || 1.35;

  if (totalLength > 450) {
    dualBaseRem = 0.50;
    previewPadding = '0.12rem 0.40rem';
    previewGap = '0.18rem';
    refBaseRem = 0.70;
    slotVersionBaseRem = 0.52;
    lineHeightVal = Math.min(lineHeightVal, 1.22);
  } else if (totalLength > 320) {
    dualBaseRem = 0.56;
    previewPadding = '0.15rem 0.45rem';
    previewGap = '0.22rem';
    refBaseRem = 0.75;
    slotVersionBaseRem = 0.55;
    lineHeightVal = Math.min(lineHeightVal, 1.25);
  } else if (totalLength > 220) {
    dualBaseRem = 0.64;
    previewPadding = '0.20rem 0.50rem';
    previewGap = '0.26rem';
    refBaseRem = 0.82;
    slotVersionBaseRem = 0.58;
    lineHeightVal = Math.min(lineHeightVal, 1.28);
  } else if (totalLength > 120) {
    dualBaseRem = 0.72;
    previewPadding = '0.24rem 0.52rem';
    previewGap = '0.30rem';
    refBaseRem = 0.88;
    slotVersionBaseRem = 0.62;
    lineHeightVal = Math.min(lineHeightVal, 1.32);
  }

  const previewFontSize = `${dualBaseRem * fontMultiplier}rem`;
  const refPosition = activeTheme?.config.typography.referencePosition || 'above';
  const refMultiplier = (activeTheme?.config.typography.referenceFontSizeRem ?? 1.4) / 1.4;
  const refFontSize = `${refBaseRem * refMultiplier}rem`;
  const versionMultiplier = (activeTheme?.config.typography.versionFontSizeRem ?? 1.1) / 1.1;
  const slotVersionFontSize = `${slotVersionBaseRem * versionMultiplier}rem`;

  // Single translation sizing
  let singleBaseRem = 1.05;
  if (totalLength > 360) {
    singleBaseRem = 0.75;
  } else if (totalLength > 240) {
    singleBaseRem = 0.85;
  } else if (totalLength > 140) {
    singleBaseRem = 0.95;
  }
  const singleFontSize = `${singleBaseRem * fontMultiplier}rem`;

  // Typography, shadows, stroke from active theme
  const shadows: string[] = [];
  if (activeTheme?.config.shadow.enabled) {
    shadows.push(
      `${activeTheme.config.shadow.offsetX}px ${activeTheme.config.shadow.offsetY}px ${activeTheme.config.shadow.blurPx}px ${activeTheme.config.shadow.color}`
    );
  }
  if (activeTheme?.config.glow?.enabled) {
    shadows.push(`0 0 ${activeTheme.config.glow.radiusPx}px ${activeTheme.config.glow.color}`);
  }
  const textShadowVal = shadows.length > 0 ? shadows.join(', ') : '0 1px 4px rgba(0,0,0,0.8)';
  const strokeVal = activeTheme?.config.outline.enabled
    ? `${activeTheme.config.outline.widthPx}px ${activeTheme.config.outline.color}`
    : undefined;
  const fontStyleVal = activeTheme?.config.typography.fontStyle || 'normal';
  const textDecVal = activeTheme?.config.typography.textDecoration || 'none';
  const letterSpacingVal = `${activeTheme?.config.typography.letterSpacingPx ?? 0.5}px`;
  const textTransformVal = (activeTheme?.config.typography.transform as any) || 'none';

  // Version Tag typography styling from active theme (customizable for both translations)
  const showVersion = activeTheme?.config.typography.showVersion !== false;
  const primaryVersionColor = activeTheme?.config.typography.versionColor || '#94A3B8';
  const secondaryVersionColor = activeTheme?.config.typography.secondaryVersionColor || '#F59E0B';
  const primaryVersionWeight = activeTheme?.config.typography.versionWeight ?? 600;
  const secondaryVersionWeight = activeTheme?.config.typography.secondaryVersionWeight ?? primaryVersionWeight;
  const primaryVersionStyle = activeTheme?.config.typography.versionStyle || 'normal';
  const secondaryVersionStyle = activeTheme?.config.typography.secondaryVersionStyle || primaryVersionStyle;

  // Reference typography styling from active theme
  const refFontFamily =
    activeTheme?.config.typography.referenceFontFamily ||
    activeTheme?.config.typography.fontFamily ||
    'Segoe UI, Arial, sans-serif';
  const refColor = activeTheme?.config.typography.referenceColor || '#F59E0B';
  const refWeight = activeTheme?.config.typography.referenceWeight ?? 800;
  const refStyle = activeTheme?.config.typography.referenceStyle || 'normal';
  const refDec = activeTheme?.config.typography.referenceDecoration || 'none';

  const renderReferenceTitle = () => {
    if (!slide || refPosition === 'hidden') return null;
    return (
      <div
        style={{
          fontSize: refFontSize,
          fontWeight: refWeight,
          color: refColor,
          fontStyle: refStyle,
          textDecoration: refDec,
          fontFamily: refFontFamily,
          marginBottom: refPosition === 'below' ? 0 : '1.5cqh',
          marginTop: refPosition === 'below' ? '1.5cqh' : 0,
          letterSpacing: '0.04em',
          textShadow: textShadowVal,
          textAlign: (activeTheme?.config.typography.alignment as any) || 'center',
          flexShrink: 0,
        }}
      >
        <span>{refPosition === 'below' ? `— ${slide.referenceDisplay}` : slide.referenceDisplay}</span>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          PREVIEW MONITOR
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {slide && (
            <button
              type="button"
              onClick={handleDownloadPreview}
              disabled={isDownloading}
              style={{
                fontSize: '0.74rem',
                padding: '3px 10px',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                color: '#38BDF8',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '4px',
                cursor: isDownloading ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
              title="Download slide as high-definition Full HD 1080p image (PNG)"
            >
              <MaterialIcon name={isDownloading ? 'hourglass_top' : 'download'} size={15} />
              <span>{isDownloading ? 'Rendering HD...' : 'Download HD'}</span>
            </button>
          )}

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
      </div>

      {/* 16:9 Scaled Preview Canvas */}
      <div
        ref={previewCanvasRef}
        style={{
          aspectRatio: '16/9',
          width: '100%',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '2px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent:
            activeTheme?.config.placement.verticalAlign === 'top'
              ? 'flex-start'
              : activeTheme?.config.placement.verticalAlign === 'bottom'
              ? 'flex-end'
              : 'center',
          alignItems: 'center',
          padding: `${activeTheme?.config.margins.topPercent ?? 4}% ${activeTheme?.config.margins.rightPercent ?? 6}% ${activeTheme?.config.margins.bottomPercent ?? 4}% ${activeTheme?.config.margins.leftPercent ?? 6}%`,
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
              maxHeight: '100%',
              width: '100%',
              padding: `${Math.min(activeTheme?.config.margins.paddingPercent ?? 2, 2)}%`,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent:
                activeTheme?.config.placement.verticalAlign === 'top'
                  ? 'flex-start'
                  : activeTheme?.config.placement.verticalAlign === 'bottom'
                  ? 'flex-end'
                  : 'center',
              overflow: 'hidden',
            }}
          >
            {/* Reference Title if Above */}
            {refPosition !== 'below' && renderReferenceTitle()}

            {isDual && slide.multiVersionSlots ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: previewGap,
                  width: '100%',
                  maxHeight: '100%',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                }}
              >
                {slide.multiVersionSlots.map((slot, idx) => (
                  <div
                    key={slot.versionAbbreviation}
                    style={{
                      padding: previewPadding,
                      borderRadius: '5px',
                      backgroundColor: idx === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(245, 158, 11, 0.08)',
                      border: idx === 0 ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(245, 158, 11, 0.28)',
                      textAlign: (activeTheme?.config.typography.alignment as any) || 'center',
                      boxSizing: 'border-box',
                      width: '100%',
                      overflow: 'hidden',
                    }}
                  >
                    {showVersion && (
                      <div
                        style={{
                          fontSize: slotVersionFontSize,
                          fontWeight: idx === 0 ? primaryVersionWeight : secondaryVersionWeight,
                          color: idx === 0 ? primaryVersionColor : secondaryVersionColor,
                          fontStyle: idx === 0 ? primaryVersionStyle : secondaryVersionStyle,
                          marginBottom: '0.3cqh',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {slot.versionName}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: previewFontSize,
                        lineHeight: lineHeightVal,
                        color: activeTheme?.config.typography.color || '#FFFFFF',
                        fontFamily: activeTheme?.config.typography.fontFamily || 'Segoe UI, Arial, sans-serif',
                        fontWeight: activeTheme?.config.typography.fontWeight || 600,
                        fontStyle: fontStyleVal,
                        textDecoration: textDecVal,
                        letterSpacing: letterSpacingVal,
                        textTransform: textTransformVal,
                        textShadow: textShadowVal,
                        WebkitTextStroke: strokeVal,
                        wordBreak: 'break-word',
                      }}
                    >
                      {cleanScriptureText(slot.text)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  fontSize: singleFontSize,
                  lineHeight: activeTheme?.config.typography.lineHeight || 1.45,
                  color: activeTheme?.config.typography.color || '#FFFFFF',
                  fontFamily: activeTheme?.config.typography.fontFamily || 'Segoe UI, Arial, sans-serif',
                  fontWeight: activeTheme?.config.typography.fontWeight || 600,
                  fontStyle: fontStyleVal,
                  textDecoration: textDecVal,
                  letterSpacing: letterSpacingVal,
                  textTransform: textTransformVal,
                  textShadow: textShadowVal,
                  WebkitTextStroke: strokeVal,
                  textAlign: (activeTheme?.config.typography.alignment as any) || 'center',
                  wordBreak: 'break-word',
                  maxHeight: '100%',
                  overflow: 'hidden',
                }}
              >
                {slide.verses.map((v) => (
                  <span key={v.verseNumber}>
                    {slide.verses.length > 1 && (
                      <sup style={{ color: '#94A3B8', marginRight: '4px' }}>{v.verseNumber}</sup>
                    )}
                    {cleanScriptureText(v.text)}{' '}
                  </span>
                ))}
              </div>
            )}

            {/* Reference Title if Below */}
            {refPosition === 'below' && renderReferenceTitle()}
          </div>
        ) : (
          <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No scripture staged. Select a verse from Bible reader.
          </div>
        )}
      </div>

      {/* Download Success Banner */}
      {downloadSuccess && (
        <div
          style={{
            padding: '0.45rem 0.65rem',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '6px',
            fontSize: '0.76rem',
            color: '#34D399',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden' }}>
            <MaterialIcon name="check_circle" size={16} color="#34D399" />
            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              Saved: {downloadSuccess}
            </span>
          </div>
          {savedFilePath && window.scriptureStudioApi?.presentation?.showItemInFolder && (
            <button
              type="button"
              onClick={() => window.scriptureStudioApi.presentation.showItemInFolder!(savedFilePath)}
              style={{
                background: 'none',
                border: 'none',
                color: '#6EE7B7',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '0.74rem',
                padding: 0,
                whiteSpace: 'nowrap',
                fontWeight: 600,
              }}
            >
              Open Folder
            </button>
          )}
        </div>
      )}

      {/* Global Translation Selector (Dedicated Section Below Preview Monitor) */}
      <div
        style={{
          padding: '0.65rem 0.75rem',
          backgroundColor: '#1E293B',
          borderRadius: '8px',
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#94A3B8',
              letterSpacing: '0.02em',
            }}
          >
            Translations
          </div>

          {secondaryVersionId && onSwapTranslations && (
            <button
              type="button"
              onClick={onSwapTranslations}
              style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#94A3B8',
                border: '1px solid #334155',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontWeight: 500,
                transition: 'all 0.15s ease',
              }}
              title="Swap primary and secondary translations"
            >
              <MaterialIcon name="swap_horiz" size={16} />
              <span>Swap</span>
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          {/* Primary Translation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 500, color: '#94A3B8' }}>
              Primary:
            </span>
            <select
              value={primaryVersionId}
              onChange={(e) => onPrimaryVersionChange?.(e.target.value)}
              style={{
                fontSize: '0.82rem',
                padding: '0.35rem 0.5rem',
                backgroundColor: '#0F172A',
                color: '#E2E8F0',
                fontWeight: 500,
                border: '1px solid #334155',
                borderRadius: '5px',
                width: '100%',
                cursor: 'pointer',
              }}
              title="Primary translation to project"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.abbreviation} — {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Secondary Translation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 500, color: '#94A3B8' }}>
              Secondary:
            </span>
            <select
              value={secondaryVersionId}
              onChange={(e) => onSecondaryVersionChange?.(e.target.value)}
              style={{
                fontSize: '0.82rem',
                padding: '0.35rem 0.5rem',
                backgroundColor: '#0F172A',
                color: '#E2E8F0',
                fontWeight: 500,
                border: '1px solid #334155',
                borderRadius: '5px',
                width: '100%',
                cursor: 'pointer',
              }}
              title="Secondary translation to project"
            >
              <option value="">None</option>
              {versions
                .filter((v) => v.id !== primaryVersionId)
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.abbreviation} — {v.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Verse Navigation, Broadcast Output Controls & Take Live */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {/* Row 1: Verse Navigation */}
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
            <MaterialIcon name="chevron_left" size={18} />
            <span>Prev Verse (←)</span>
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
            <span>Next Verse (→)</span>
            <MaterialIcon name="chevron_right" size={18} />
          </button>
        </div>

        {/* Row 2: Freeze & Hide Broadcast Output Modifiers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <button
            type="button"
            className={`btn-freeze ${isFrozen ? 'active' : ''}`}
            onClick={onFreezeToggle}
            style={{
              padding: '0.6rem 0.4rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              cursor: 'pointer',
              borderRadius: '6px',
            }}
            title="Freeze display on current frame (F9)"
          >
            <MaterialIcon name="ac_unit" size={17} />
            <span>{isFrozen ? 'UNFREEZE (F9)' : 'FREEZE (F9)'}</span>
          </button>

          <button
            type="button"
            className={!isVisible ? 'btn-primary' : 'btn-secondary'}
            onClick={onHideToggle}
            style={{
              padding: '0.6rem 0.4rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              backgroundColor: !isVisible ? '#D97706' : undefined,
              borderColor: !isVisible ? '#F59E0B' : undefined,
              color: !isVisible ? '#FFFFFF' : undefined,
              boxShadow: !isVisible ? '0 0 10px rgba(245, 158, 11, 0.4)' : undefined,
              cursor: 'pointer',
              borderRadius: '6px',
            }}
            title={isVisible ? 'Hide output screen to black (F10)' : 'Unhide output screen back to live (F10)'}
          >
            <MaterialIcon name={isVisible ? 'visibility_off' : 'visibility'} size={17} />
            <span>{isVisible ? 'HIDE (F10)' : 'UNHIDE (F10)'}</span>
          </button>
        </div>

        {/* Row 3: Take Live */}
        <button
          className="btn-primary"
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
          }}
          onClick={onTakeLive}
          disabled={!slide}
        >
          <MaterialIcon name="bolt" size={20} />
          <span>TAKE LIVE (F12)</span>
        </button>
      </div>
    </div>
  );
}
