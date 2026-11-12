import React from 'react';
import { ThemeConfiguration } from '@scripture-studio/shared-types';

export interface CompiledThemeStyles {
  containerStyle: React.CSSProperties;
  titleStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
}

export function compileThemeStyles(config: ThemeConfiguration): CompiledThemeStyles {
  const { typography, shadow, outline, background, margins, placement } = config;

  // Background
  let bgValue = '#09172C';
  if (background.type === 'gradient' && background.gradient) {
    const stops = background.gradient.stops.map((s) => `${s.color} ${s.offset}%`).join(', ');
    bgValue = `linear-gradient(${background.gradient.directionDeg || 135}deg, ${stops})`;
  } else if (background.type === 'solid' && background.color) {
    bgValue = background.color;
  }

  // Safe Margins
  const topPad = `${margins.topPercent}vh`;
  const bottomPad = `${margins.bottomPercent}vh`;
  const leftPad = `${margins.leftPercent}vw`;
  const rightPad = `${margins.rightPercent}vw`;

  // Text Shadow
  const textShadowValue = shadow.enabled
    ? `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blurPx}px ${shadow.color}`
    : 'none';

  // Text Outline
  const webkitTextStroke = outline.enabled
    ? `${outline.widthPx}px ${outline.color}`
    : 'none';

  // Container positioning (Full Screen vs Lower Third)
  const isLowerThird = placement.mode === 'lower-third';

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: isLowerThird ? `${100 - (placement.lowerThirdHeightPercent || 28)}%` : 0,
    paddingTop: topPad,
    paddingBottom: bottomPad,
    paddingLeft: leftPad,
    paddingRight: rightPad,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: placement.verticalAlign === 'top' ? 'flex-start' : placement.verticalAlign === 'bottom' ? 'flex-end' : 'center',
    alignItems: typography.alignment === 'left' ? 'flex-start' : typography.alignment === 'right' ? 'flex-end' : 'center',
    background: bgValue,
    boxSizing: 'border-box',
    overflow: 'hidden',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: typography.fontFamily,
    fontSize: isLowerThird ? '2.0vw' : '4.0vw',
    fontWeight: 800,
    color: '#F59E0B',
    marginBottom: '1.5vh',
    letterSpacing: `${typography.letterSpacingPx}px`,
    textShadow: textShadowValue,
    textTransform: typography.transform,
  };

  const bodyStyle: React.CSSProperties = {
    fontFamily: typography.fontFamily,
    fontSize: isLowerThird ? '2.2vw' : `${typography.fontSizeRem}rem`,
    fontWeight: typography.fontWeight,
    lineHeight: typography.lineHeight,
    color: typography.color,
    textAlign: typography.alignment,
    textShadow: textShadowValue,
    WebkitTextStroke: webkitTextStroke,
    letterSpacing: `${typography.letterSpacingPx}px`,
  };

  return { containerStyle, titleStyle, bodyStyle };
}

