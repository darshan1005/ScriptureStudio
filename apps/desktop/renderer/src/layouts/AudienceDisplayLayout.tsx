import React, { useEffect, useState } from 'react';
import { PresentationStateDto, ThemeDto } from '@scripture-studio/shared-types';

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

  // Active Presentation Slide with Real Theme Configuration
  const bg = theme?.config.background;
  let backgroundStyle: React.CSSProperties = {
    backgroundColor: '#09172C',
  };

  if (bg) {
    if (bg.type === 'gradient' && bg.gradient) {
      const dir = bg.gradient.directionDeg || 135;
      const stops = bg.gradient.stops.map((s) => `${s.color} ${s.offset}%`).join(', ');
      backgroundStyle = {
        background: `linear-gradient(${dir}deg, ${stops})`,
      };
    } else if (bg.type === 'solid' && bg.color) {
      backgroundStyle = {
        backgroundColor: bg.color,
      };
    } else if (bg.type === 'image' && bg.imageUrl) {
      const dimming = (bg.dimmingPercent ?? 45) / 100;
      backgroundStyle = {
        backgroundImage: `linear-gradient(rgba(0,0,0,${dimming}), rgba(0,0,0,${dimming})), url("${bg.imageUrl}")`,
        backgroundSize: bg.objectFit || 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
  }

  // Margins & Dimensions from theme
  const topPad = theme?.config.margins.topPercent ?? 4;
  const bottomPad = theme?.config.margins.bottomPercent ?? 4;
  const leftPad = theme?.config.margins.leftPercent ?? 6;
  const rightPad = theme?.config.margins.rightPercent ?? 6;
  const containerMaxWidth = `${theme?.config.margins.containerMaxWidthPercent ?? 92}%`;
  const containerMaxHeight = `${theme?.config.margins.containerMaxHeightPercent ?? 88}%`;
  const containerPadding = `${theme?.config.margins.paddingPercent ?? 2}vh ${theme?.config.margins.paddingPercent ?? 2}vw`;
  const verticalAlign = theme?.config.placement.verticalAlign || 'center';

  // Typography & shadow from theme (including glow)
  const shadows: string[] = [];
  if (theme?.config.shadow.enabled) {
    shadows.push(
      `${theme.config.shadow.offsetX}px ${theme.config.shadow.offsetY}px ${theme.config.shadow.blurPx}px ${theme.config.shadow.color}`
    );
  }
  if (theme?.config.glow?.enabled) {
    shadows.push(`0 0 ${theme.config.glow.radiusPx}px ${theme.config.glow.color}`);
  }
  const textShadowVal = shadows.length > 0 ? shadows.join(', ') : '0 4px 14px rgba(0,0,0,0.92)';

  const strokeVal = theme?.config.outline.enabled
    ? `${theme.config.outline.widthPx}px ${theme.config.outline.color}`
    : undefined;

  // Base user font size multiplier from theme
  const userBaseRem = theme?.config.typography.fontSizeRem ?? 3.5;
  const fontStyleVal = theme?.config.typography.fontStyle || 'normal';
  const textDecVal = theme?.config.typography.textDecoration || 'none';
  const letterSpacingVal = `${theme?.config.typography.letterSpacingPx ?? 0.5}px`;
  const textTransformVal = (theme?.config.typography.transform as any) || 'none';

  // Dynamic Auto-Scaling for Dual vs Single Translation with Overflow Protection
  const totalDualLength =
    slide.multiVersionSlots?.reduce((acc, slot) => acc + slot.text.length, 0) || 0;

  let dualScale = totalDualLength > 400 ? 0.36 : totalDualLength > 320 ? 0.42 : totalDualLength > 200 ? 0.5 : totalDualLength > 110 ? 0.58 : 0.65;
  if (userBaseRem > 4.5) {
    dualScale = dualScale * (4.5 / userBaseRem);
  }
  const dualFontSize = `calc(${userBaseRem * dualScale}vw)`;
  const slotPadding = totalDualLength > 200 ? '1.0vh 1.8vw' : '1.3vh 2.2vw';
  const slotGap = totalDualLength > 200 ? '1.0vh' : '1.4vh';

  const singleTotalLength = slide.verses.reduce((acc, v) => acc + v.text.length, 0);
  let singleScale = singleTotalLength > 350 ? 0.55 : singleTotalLength > 280 ? 0.65 : singleTotalLength > 160 ? 0.8 : singleTotalLength > 80 ? 0.92 : 1.05;
  if (userBaseRem > 5.5 && singleTotalLength > 200) {
    singleScale = singleScale * (5.5 / userBaseRem);
  }
  const singleFontSize = `calc(${userBaseRem * singleScale}vw)`;

  // Scripture Reference styling
  const refPosition = theme?.config.typography.referencePosition || 'above';
  const refFontFamily = theme?.config.typography.referenceFontFamily || theme?.config.typography.fontFamily || 'Segoe UI, Arial, sans-serif';
  const refFontSize = `calc(${(theme?.config.typography.referenceFontSizeRem ?? 1.4) * 1.75}vw)`;
  const refColor = theme?.config.typography.referenceColor || '#F59E0B';
  const refWeight = theme?.config.typography.referenceWeight ?? 800;
  const refStyle = theme?.config.typography.referenceStyle || 'normal';
  const refDec = theme?.config.typography.referenceDecoration || 'none';

  // Version Tag typography styling from theme (customizable for both translations)
  const showVersion = theme?.config.typography.showVersion !== false;
  const primaryVersionColor = theme?.config.typography.versionColor || '#94A3B8';
  const secondaryVersionColor = theme?.config.typography.secondaryVersionColor || '#F59E0B';
  const primaryVersionWeight = theme?.config.typography.versionWeight ?? 600;
  const secondaryVersionWeight = theme?.config.typography.secondaryVersionWeight ?? primaryVersionWeight;
  const primaryVersionStyle = theme?.config.typography.versionStyle || 'normal';
  const secondaryVersionStyle = theme?.config.typography.secondaryVersionStyle || primaryVersionStyle;

  const renderReferenceTitle = () => {
    if (refPosition === 'hidden') return null;
    return (
      <h1
        style={{
          fontSize: refFontSize,
          fontWeight: refWeight,
          color: refColor,
          fontStyle: refStyle,
          textDecoration: refDec,
          marginBottom: refPosition === 'below' ? 0 : '1.5vh',
          marginTop: refPosition === 'below' ? '1.5vh' : 0,
          letterSpacing: '0.04em',
          textShadow: textShadowVal,
          textAlign: (theme?.config.typography.alignment as any) || 'center',
          fontFamily: refFontFamily,
          flexShrink: 0,
        }}
      >
        <span>{slide.referenceDisplay}</span>
      </h1>
    );
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent:
          verticalAlign === 'top'
            ? 'flex-start'
            : verticalAlign === 'bottom'
            ? 'flex-end'
            : 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        padding: `${topPad}vh ${rightPad}vw ${bottomPad}vh ${leftPad}vw`,
        boxSizing: 'border-box',
        ...backgroundStyle,
      }}
    >
      {/* Content Container respecting Container Width, Height and Padding */}
      <div
        style={{
          width: containerMaxWidth,
          maxHeight: containerMaxHeight,
          padding: containerPadding,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent:
            verticalAlign === 'top'
              ? 'flex-start'
              : verticalAlign === 'bottom'
              ? 'flex-end'
              : 'center',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Render Title if Above */}
        {refPosition !== 'below' && renderReferenceTitle()}

        {/* Scripture Content (Dual Translation or Single Version) */}
        {slide.multiVersionSlots && slide.multiVersionSlots.length > 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: slotGap,
              width: '100%',
              maxHeight: '75vh',
              textAlign: (theme?.config.typography.alignment as any) || 'center',
              boxSizing: 'border-box',
            }}
          >
            {slide.multiVersionSlots.map((slot, idx) => (
              <div
                key={slot.versionAbbreviation}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems:
                    theme?.config.typography.alignment === 'left'
                      ? 'flex-start'
                      : theme?.config.typography.alignment === 'right'
                      ? 'flex-end'
                      : theme?.config.typography.alignment === 'justify'
                      ? 'stretch'
                      : 'center',
                  backgroundColor: idx === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(245, 158, 11, 0.08)',
                  padding: slotPadding,
                  borderRadius: '10px',
                  border: idx === 0 ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid rgba(245, 158, 11, 0.3)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
                  boxSizing: 'border-box',
                  width: '100%',
                }}
              >
                {showVersion && (
                  <div
                    style={{
                      fontSize: `calc(${(theme?.config.typography.versionFontSizeRem ?? 1.1) * 1.05}vw)`,
                      fontWeight: idx === 0 ? primaryVersionWeight : secondaryVersionWeight,
                      color: idx === 0 ? primaryVersionColor : secondaryVersionColor,
                      fontStyle: idx === 0 ? primaryVersionStyle : secondaryVersionStyle,
                      marginBottom: '0.3vh',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {slot.versionName}
                  </div>
                )}
                <div
                  style={{
                    fontSize: dualFontSize,
                    lineHeight: theme?.config.typography.lineHeight || 1.35,
                    color: theme?.config.typography.color || '#FFFFFF',
                    fontWeight: theme?.config.typography.fontWeight || 600,
                    fontStyle: fontStyleVal,
                    textDecoration: textDecVal,
                    letterSpacing: letterSpacingVal,
                    textTransform: textTransformVal,
                    textShadow: textShadowVal,
                    WebkitTextStroke: strokeVal,
                    fontFamily: theme?.config.typography.fontFamily || 'Segoe UI, Arial, sans-serif',
                    wordBreak: 'break-word',
                    textAlign: (theme?.config.typography.alignment as any) || 'center',
                    width: '100%',
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
              lineHeight: theme?.config.typography.lineHeight || 1.4,
              color: theme?.config.typography.color || '#FFFFFF',
              textAlign: (theme?.config.typography.alignment as any) || 'center',
              maxWidth: '100%',
              maxHeight: '76vh',
              fontWeight: theme?.config.typography.fontWeight || 600,
              fontStyle: fontStyleVal,
              textDecoration: textDecVal,
              letterSpacing: letterSpacingVal,
              textTransform: textTransformVal,
              textShadow: textShadowVal,
              WebkitTextStroke: strokeVal,
              fontFamily: theme?.config.typography.fontFamily || 'Segoe UI, Arial, sans-serif',
              wordBreak: 'break-word',
            }}
          >
            {slide.verses.map((v) => (
              <span key={v.verseNumber}>
                {slide.verses.length > 1 && (
                  <sup
                    style={{
                      fontSize: '0.6em',
                      color: '#94A3B8',
                      marginRight: '0.4em',
                      verticalAlign: 'super',
                    }}
                  >
                    {v.verseNumber}
                  </sup>
                )}
                {cleanScriptureText(v.text)}{' '}
              </span>
            ))}
          </div>
        )}

        {/* Render Title if Below */}
        {refPosition === 'below' && renderReferenceTitle()}
      </div>
    </div>
  );
}
