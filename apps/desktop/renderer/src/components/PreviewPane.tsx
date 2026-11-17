import React, { useRef, useState } from 'react';
import { BibleVersionDto, PresentationStateDto, ThemeDto } from '@scripture-studio/shared-types';
import { MaterialIcon } from './MaterialIcon.js';
import { ScriptureSlideCanvas } from './ScriptureSlideCanvas.js';

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

      {/* 16:9 Scaled Preview Canvas (Rendered via Unified ScriptureSlideCanvas) */}
      <div
        style={{
          aspectRatio: '16/9',
          width: '100%',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '2px solid var(--border-color)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          position: 'relative',
        }}
      >
        <ScriptureSlideCanvas
          ref={previewCanvasRef}
          slide={slide || null}
          theme={activeTheme}
          emptyMessage="No scripture staged. Select a verse from Bible reader."
        />
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
