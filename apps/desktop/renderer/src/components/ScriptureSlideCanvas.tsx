import React, { forwardRef } from 'react';
import { SlideContentDto, ThemeDto } from '@scripture-studio/shared-types';

export function cleanScriptureText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, '')
    .replace(/<f\b[^>]*>[\s\S]*?<\/f>/gi, '')
    .replace(/<note\b[^>]*>[\s\S]*?<\/note>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getSlideBackgroundStyle(theme?: ThemeDto | null): React.CSSProperties {
  const bg = theme?.config.background;
  if (!bg) {
    return { backgroundColor: '#09172C' };
  }
  if (bg.type === 'gradient' && bg.gradient) {
    const dir = bg.gradient.directionDeg || 135;
    const stops = bg.gradient.stops.map((s) => `${s.color} ${s.offset}%`).join(', ');
    return { background: `linear-gradient(${dir}deg, ${stops})` };
  }
  if (bg.type === 'solid' && bg.color) {
    return { backgroundColor: bg.color };
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
}

export interface ScriptureSlideCanvasProps {
  slide?: SlideContentDto | null;
  theme?: ThemeDto | null;
  showBoundingBox?: boolean;
  style?: React.CSSProperties;
  className?: string;
  emptyMessage?: string;
}

export const ScriptureSlideCanvas = forwardRef<HTMLDivElement, ScriptureSlideCanvasProps>(
  (
    {
      slide,
      theme,
      showBoundingBox = false,
      style = {},
      className = '',
      emptyMessage = 'No scripture staged.',
    },
    ref
  ) => {
    const bgStyle = getSlideBackgroundStyle(theme);

    // Margins, Dimensions & Placement from theme
    const isLowerThird = theme?.config.placement.mode === 'lower-third';
    const effectiveVerticalAlign = isLowerThird
      ? 'bottom'
      : (theme?.config.placement.verticalAlign || 'center');
    const containerHeightPct = isLowerThird
      ? (theme?.config.placement.lowerThirdHeightPercent ?? 32)
      : (theme?.config.margins.containerMaxHeightPercent ?? 88);

    // Auto-fit height budgeting factor based on target container height
    const heightFactor = Math.min(1.0, Math.max(0.35, containerHeightPct / 88));
    const isDual = Boolean(slide?.multiVersionSlots && slide.multiVersionSlots.length > 1);
    const translationLayout = theme?.config.placement.translationLayout || 'stacked';
    const isSideBySide = isDual && translationLayout === 'side-by-side';
    const cardStyle = theme?.config.placement.cardStyle || 'glass';

    const topPad = isLowerThird ? 0 : (theme?.config.margins.topPercent ?? 4);
    const bottomPad = theme?.config.margins.bottomPercent ?? 4;
    const leftPad = theme?.config.margins.leftPercent ?? 6;
    const rightPad = theme?.config.margins.rightPercent ?? 6;
    const containerMaxWidth = `${theme?.config.margins.containerMaxWidthPercent ?? 92}%`;
    const containerHeight = `${containerHeightPct}%`;
    const containerPadding = `${theme?.config.margins.paddingPercent ?? 2}cqh ${theme?.config.margins.paddingPercent ?? 2}cqw`;

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
    const textShadowVal = shadows.length > 0 ? shadows.join(', ') : '0 0.3cqh 0.8cqh rgba(0,0,0,0.85)';

    const strokeVal = theme?.config.outline.enabled
      ? `${theme.config.outline.widthPx}px ${theme.config.outline.color}`
      : undefined;

    // Base user font size multiplier from theme (in cqw units for 100% resolution-independent scaling)
    const userBaseRem = theme?.config.typography.fontSizeRem ?? 3.5;
    const baseCqw = (userBaseRem / 3.5) * 2.6;

    const fontStyleVal = theme?.config.typography.fontStyle || 'normal';
    const textDecVal = theme?.config.typography.textDecoration || 'none';
    const letterSpacingVal = `${theme?.config.typography.letterSpacingPx ?? 0.5}px`;
    const textTransformVal = (theme?.config.typography.transform as any) || 'none';

    // Dynamic Auto-Scaling for Dual vs Single Translation (auto-fits to container height budget without trimming)
    const totalDualLength =
      slide?.multiVersionSlots?.reduce((acc, slot) => acc + slot.text.length, 0) || 0;

    const lengthScale =
      totalDualLength > 400
        ? 0.38
        : totalDualLength > 300
        ? 0.44
        : totalDualLength > 180
        ? 0.52
        : totalDualLength > 90
        ? 0.60
        : 0.68;

    const dualScale = (isSideBySide ? 0.85 : 1.0) * lengthScale;
    const dualFontSize = `calc(${baseCqw * dualScale * heightFactor}cqw)`;
    const slotPadding =
      totalDualLength > 200 || heightFactor < 0.85 ? '0.7cqh 1.4cqw' : '1.2cqh 2.0cqw';
    const slotGap = totalDualLength > 200 || heightFactor < 0.85 ? '0.8cqh' : '1.4cqh';

    const singleTotalLength = slide?.verses ? slide.verses.reduce((acc, v) => acc + v.text.length, 0) : 0;
    const singleScale =
      singleTotalLength > 350
        ? 0.55
        : singleTotalLength > 250
        ? 0.68
        : singleTotalLength > 150
        ? 0.82
        : singleTotalLength > 70
        ? 0.95
        : 1.08;
    const singleFontSize = `calc(${baseCqw * singleScale * heightFactor}cqw)`;

    // Scripture Reference styling
    const refPosition = theme?.config.typography.referencePosition || 'above';
    const refFontFamily =
      theme?.config.typography.referenceFontFamily ||
      theme?.config.typography.fontFamily ||
      'Segoe UI, Arial, sans-serif';
    const refFontSize = `calc(${(theme?.config.typography.referenceFontSizeRem ?? 1.4) * 1.5 * heightFactor}cqw)`;
    const refColor = theme?.config.typography.referenceColor || '#F59E0B';
    const refWeight = theme?.config.typography.referenceWeight ?? 800;
    const refStyle = theme?.config.typography.referenceStyle || 'normal';
    const refDec = theme?.config.typography.referenceDecoration || 'none';

    // Card appearance styling based on theme placement cardStyle
    const getCardStyle = (idx: number): React.CSSProperties => {
      switch (cardStyle) {
        case 'solid':
          return {
            backgroundColor: idx === 0 ? 'rgba(15, 23, 42, 0.85)' : 'rgba(30, 27, 75, 0.85)',
            border: idx === 0 ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid rgba(245, 158, 11, 0.4)',
          };
        case 'bordered':
          return {
            backgroundColor: 'transparent',
            border: idx === 0 ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(245, 158, 11, 0.45)',
          };
        case 'none':
          return {
            backgroundColor: 'transparent',
            border: 'none',
          };
        case 'glass':
        default:
          return {
            backgroundColor: idx === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(245, 158, 11, 0.08)',
            border: idx === 0 ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid rgba(245, 158, 11, 0.3)',
          };
      }
    };

    // Version Tag typography styling from theme (customizable for both translations)
    const showVersion = theme?.config.typography.showVersion !== false;
    const primaryVersionColor = theme?.config.typography.versionColor || '#94A3B8';
    const secondaryVersionColor = theme?.config.typography.secondaryVersionColor || '#F59E0B';
    const primaryVersionWeight = theme?.config.typography.versionWeight ?? 600;
    const secondaryVersionWeight = theme?.config.typography.secondaryVersionWeight ?? primaryVersionWeight;
    const primaryVersionStyle = theme?.config.typography.versionStyle || 'normal';
    const secondaryVersionStyle = theme?.config.typography.secondaryVersionStyle || primaryVersionStyle;
    const versionFontSize = `calc(${(theme?.config.typography.versionFontSizeRem ?? 1.1) * 0.95 * heightFactor}cqw)`;

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
            marginBottom: refPosition === 'below' ? 0 : '1.2cqh',
            marginTop: refPosition === 'below' ? '1.2cqh' : 0,
            letterSpacing: '0.04em',
            textShadow: textShadowVal,
            textAlign: (theme?.config.typography.alignment as any) || 'center',
            fontFamily: refFontFamily,
            flexShrink: 0,
            lineHeight: 1.2,
          }}
        >
          <span>{refPosition === 'below' ? `— ${slide.referenceDisplay}` : slide.referenceDisplay}</span>
        </div>
      );
    };

    return (
      <div
        ref={ref}
        className={className}
        style={{
          containerType: 'size' as any,
          aspectRatio: '16 / 9',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent:
            effectiveVerticalAlign === 'top'
              ? 'flex-start'
              : effectiveVerticalAlign === 'bottom'
              ? 'flex-end'
              : 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          userSelect: 'none',
          padding: `${topPad}cqh ${rightPad}cqw ${bottomPad}cqh ${leftPad}cqw`,
          boxSizing: 'border-box',
          ...bgStyle,
          ...style,
        }}
      >
        {slide ? (
          /* Content Container respecting Container Width, Height and Padding */
          <div
            style={{
              width: containerMaxWidth,
              height: containerHeight,
              maxHeight: containerHeight,
              padding: containerPadding,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent:
                effectiveVerticalAlign === 'top'
                  ? 'flex-start'
                  : effectiveVerticalAlign === 'bottom'
                  ? 'flex-end'
                  : 'center',
              alignItems: 'center',
              border: showBoundingBox ? '1.5px dashed rgba(96, 165, 250, 0.65)' : 'none',
              borderRadius: '6px',
              overflow: 'hidden',
              transition: 'border 0.15s ease',
            }}
          >
            {/* CSS Grid for Scripture Content & Anchored Reference */}
            <div
              style={{
                display: 'grid',
                gridTemplateRows: isSideBySide
                  ? (refPosition === 'hidden' ? '1fr' : refPosition === 'below' ? '1fr auto' : 'auto 1fr')
                  : (refPosition === 'hidden'
                      ? (isDual ? 'minmax(0, 1fr) minmax(0, 1fr)' : '1fr')
                      : refPosition === 'below'
                        ? (isDual ? 'minmax(0, 1fr) minmax(0, 1fr) auto' : '1fr auto')
                        : (isDual ? 'auto minmax(0, 1fr) minmax(0, 1fr)' : 'auto 1fr')),
                gridTemplateColumns: isSideBySide ? 'minmax(0, 1fr) minmax(0, 1fr)' : '1fr',
                gap: slotGap,
                width: '100%',
                height: '100%',
                alignContent: effectiveVerticalAlign === 'top' ? 'start' : effectiveVerticalAlign === 'bottom' ? 'end' : 'center',
                boxSizing: 'border-box',
              }}
            >
              {/* Render Title if Above */}
              {refPosition !== 'below' && refPosition !== 'hidden' && (
                <div style={{ gridColumn: isSideBySide ? '1 / -1' : '1', width: '100%' }}>
                  {renderReferenceTitle()}
                </div>
              )}

              {/* Scripture Content (Dual Translation or Single Version) */}
              {isDual && slide.multiVersionSlots ? (
                slide.multiVersionSlots.map((slot, idx) => {
                  const cardBgBorder = getCardStyle(idx);
                  return (
                    <div
                      key={slot.versionAbbreviation}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        padding: slotPadding,
                        borderRadius: '0.8cqw',
                        ...cardBgBorder,
                        boxShadow: cardStyle === 'none' ? 'none' : '0 0.3cqh 1.2cqh rgba(0, 0, 0, 0.35)',
                        boxSizing: 'border-box',
                        width: '100%',
                        height: '100%',
                        minHeight: 0,
                        overflow: 'hidden',
                      }}
                    >
                      {showVersion && (
                        <div
                          style={{
                            fontSize: versionFontSize,
                            fontWeight: idx === 0 ? primaryVersionWeight : secondaryVersionWeight,
                            color: idx === 0 ? primaryVersionColor : secondaryVersionColor,
                            fontStyle: idx === 0 ? primaryVersionStyle : secondaryVersionStyle,
                            marginBottom: '0.3cqh',
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            flexShrink: 0,
                            textAlign: (theme?.config.typography.alignment as any) || 'center',
                          }}
                        >
                          {slot.versionName}
                        </div>
                      )}
                      <div
                        style={{
                          flex: 1,
                          minHeight: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                        }}
                      >
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
                    </div>
                  );
                })
              ) : (
                /* Single Translation Verse */
                <div
                  style={{
                    fontSize: singleFontSize,
                    lineHeight: theme?.config.typography.lineHeight || 1.4,
                    color: theme?.config.typography.color || '#FFFFFF',
                    textAlign: (theme?.config.typography.alignment as any) || 'center',
                    maxWidth: '100%',
                    height: '100%',
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontWeight: theme?.config.typography.fontWeight || 600,
                    fontStyle: fontStyleVal,
                    textDecoration: textDecVal,
                    letterSpacing: letterSpacingVal,
                    textTransform: textTransformVal,
                    textShadow: textShadowVal,
                    WebkitTextStroke: strokeVal,
                    fontFamily: theme?.config.typography.fontFamily || 'Segoe UI, Arial, sans-serif',
                    wordBreak: 'break-word',
                    overflow: 'hidden',
                  }}
                >
                  {slide.verses.map((v) => (
                    <span key={v.verseNumber}>
                      {slide.verses.length > 1 && (
                        <sup
                          style={{
                            fontSize: '0.6em',
                            color: theme?.config.typography.referenceColor || '#94A3B8',
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
              {refPosition === 'below' && (
                <div style={{ gridColumn: isSideBySide ? '1 / -1' : '1', width: '100%' }}>
                  {renderReferenceTitle()}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            style={{
              color: 'var(--text-dim)',
              fontSize: '2.5cqw',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              userSelect: 'none',
            }}
          >
            {emptyMessage}
          </div>
        )}
      </div>
    );
  }
);

ScriptureSlideCanvas.displayName = 'ScriptureSlideCanvas';
