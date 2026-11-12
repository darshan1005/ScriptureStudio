export interface FontFitCalculation {
  fontSizeVw: number;
  lineHeight: number;
}

/**
 * Calculates optimal viewport font size based on verse text length.
 */
export function calculateOptimalFontSize(textLength: number, isLowerThird = false): FontFitCalculation {
  if (isLowerThird) {
    if (textLength < 80) return { fontSizeVw: 2.2, lineHeight: 1.25 };
    if (textLength < 160) return { fontSizeVw: 1.8, lineHeight: 1.25 };
    return { fontSizeVw: 1.5, lineHeight: 1.2 };
  }

  // Full Screen
  if (textLength < 70) {
    // Short verse (e.g. John 11:35 or 1 Thess 5:16)
    return { fontSizeVw: 4.8, lineHeight: 1.45 };
  } else if (textLength < 150) {
    // Medium verse (e.g. John 3:16)
    return { fontSizeVw: 3.8, lineHeight: 1.4 };
  } else if (textLength < 300) {
    // Long verse (e.g. Romans 8:28)
    return { fontSizeVw: 3.0, lineHeight: 1.35 };
  } else {
    // Multi-verse span or extra-long passage
    return { fontSizeVw: 2.4, lineHeight: 1.3 };
  }
}

