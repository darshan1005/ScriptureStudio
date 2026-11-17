import React, { useEffect, useState } from 'react';
import { PresentationStateDto, ThemeDto } from '@scripture-studio/shared-types';
import { ScriptureSlideCanvas } from '../components/ScriptureSlideCanvas.js';

export default function AudienceDisplayLayout(): React.JSX.Element {
  const [state, setState] = useState<PresentationStateDto | null>(null);
  const [themes, setThemes] = useState<ThemeDto[]>([]);
  const [theme, setTheme] = useState<ThemeDto | null>(null);

  useEffect(() => {
    // Hide mouse cursor on audience output window
    document.body.style.cursor = 'none';
    document.body.style.overflow = 'hidden';

    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (window.scriptureStudioApi) {
          if (window.scriptureStudioApi.presentation.stopLive) {
            await window.scriptureStudioApi.presentation.stopLive();
          }
          await window.scriptureStudioApi.display.closeOutputs();
        }
      } else if (e.key === 'F11') {
        e.preventDefault();
        if (window.scriptureStudioApi) {
          await window.scriptureStudioApi.presentation.clear();
          await window.scriptureStudioApi.display.closeOutputs();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    if (window.scriptureStudioApi) {
      window.scriptureStudioApi.presentation.getState().then(setState);
      const unsubscribe = window.scriptureStudioApi.presentation.onStateChanged((newState) => {
        setState(newState);
      });

      // Load themes list
      window.scriptureStudioApi.themes.list().then((res) => {
        setThemes(res.themes);
        if (res.themes.length > 0) {
          setTheme(res.themes[0] || null);
        }
      });

      return () => {
        unsubscribe();
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.cursor = 'default';
      };
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.cursor = 'default';
    };
  }, []);

  // Sync active theme whenever state.activeThemeId or themes change
  useEffect(() => {
    if (themes.length > 0 && state?.activeThemeId) {
      const active = themes.find((t) => t.id === state.activeThemeId) || themes[0] || null;
      setTheme(active);
    }
  }, [state?.activeThemeId, themes]);

  const isCapture = new URLSearchParams(window.location.search).get('capture') === '1';
  const slide = isCapture
    ? (state?.previewSlide || state?.liveSlide || null)
    : (state?.liveSlide || (state?.mode === 'PREVIEW' ? state?.previewSlide : null));
  const isHidden = !isCapture && state?.mode === 'HIDDEN';
  const isIdle = !slide || (!isCapture && state?.mode === 'IDLE');

  // Notify high-definition capture runner when fonts, images, and layout are painted
  useEffect(() => {
    if (isCapture && slide && theme) {
      document.fonts.ready.then(() => {
        const bg = theme.config.background;
        if (bg.type === 'image' && bg.imageUrl) {
          const img = new Image();
          img.src = bg.imageUrl;
          const markReady = () => {
            setTimeout(() => {
              (window as any).__CAPTURE_READY__ = true;
            }, 80);
          };
          img.onload = markReady;
          img.onerror = markReady;
        } else {
          setTimeout(() => {
            (window as any).__CAPTURE_READY__ = true;
          }, 80);
        }
      });
    }
  }, [isCapture, slide, theme]);

  // Standby / Idle / Hidden Blackout with Subtle Watermark
  if (isHidden || isIdle) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000000',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          userSelect: 'none',
        }}
      >
        <div style={{ opacity: 0.28 }}>
          <img src="./icon.png" alt="Scripture Studio" style={{ width: '84px', height: '84px', borderRadius: '16px', objectFit: 'contain' }} />
        </div>
        <div
          style={{
            color: '#1E293B',
            fontSize: '1.4rem',
            fontWeight: 800,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          SCRIPTURE STUDIO
        </div>
      </div>
    );
  }

  // Active Presentation Slide with Real Theme Configuration rendered via Unified Stage Canvas
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          aspectRatio: '16 / 9',
          width: '100%',
          height: '100%',
          maxWidth: 'calc(100vh * 16 / 9)',
          maxHeight: 'calc(100vw * 9 / 16)',
          display: 'flex',
        }}
      >
        <ScriptureSlideCanvas slide={slide} theme={theme} />
      </div>
    </div>
  );
}
