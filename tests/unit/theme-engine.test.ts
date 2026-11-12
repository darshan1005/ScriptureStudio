import { describe, it, expect } from 'vitest';
import { compileThemeStyles } from '../../packages/theme-engine/src/css-compiler.js';
import { calculateOptimalFontSize } from '../../packages/theme-engine/src/font-scaler.js';
import { ThemeConfiguration } from '../../packages/shared-types/src/index.js';

describe('Theme Engine Compiler and Font Sizing', () => {
  const sampleThemeConfig: ThemeConfiguration = {
    typography: {
      fontFamily: 'Segoe UI, sans-serif',
      fontSizeRem: 3.5,
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacingPx: 1,
      color: '#FFFFFF',
      alignment: 'center',
      transform: 'none',
    },
    shadow: {
      enabled: true,
      color: 'rgba(0,0,0,0.9)',
      blurPx: 10,
      offsetX: 2,
      offsetY: 4,
    },
    outline: {
      enabled: true,
      color: '#000000',
      widthPx: 2,
    },
    background: {
      type: 'gradient',
      gradient: {
        type: 'linear',
        directionDeg: 135,
        stops: [
          { color: '#09172C', offset: 0 },
          { color: '#0F2B48', offset: 100 },
        ],
      },
    },
    margins: {
      topPercent: 8,
      bottomPercent: 8,
      leftPercent: 10,
      rightPercent: 10,
    },
    placement: {
      mode: '16:9',
      verticalAlign: 'center',
    },
  };

  it('compiles container and typography styles accurately', () => {
    const compiled = compileThemeStyles(sampleThemeConfig);

    expect(compiled.containerStyle.background).toContain('linear-gradient(135deg');
    expect(compiled.containerStyle.paddingLeft).toBe('10vw');
    expect(compiled.titleStyle.color).toBe('#F59E0B');
    expect(compiled.bodyStyle.color).toBe('#FFFFFF');
    expect(compiled.bodyStyle.textShadow).toBe('2px 4px 10px rgba(0,0,0,0.9)');
    expect(compiled.bodyStyle.WebkitTextStroke).toBe('2px #000000');
  });

  it('calculates optimal font sizing for short vs long verses', () => {
    // Short verse (e.g. 30 chars)
    const shortFit = calculateOptimalFontSize(30);
    expect(shortFit.fontSizeVw).toBe(4.8);

    // Medium verse (e.g. 100 chars)
    const medFit = calculateOptimalFontSize(100);
    expect(medFit.fontSizeVw).toBe(3.8);

    // Long verse (e.g. 200 chars)
    const longFit = calculateOptimalFontSize(200);
    expect(longFit.fontSizeVw).toBe(3.0);
  });

  it('scales lower-third typography compactly', () => {
    const lowerThirdFit = calculateOptimalFontSize(120, true);
    expect(lowerThirdFit.fontSizeVw).toBe(1.8);
  });
});

