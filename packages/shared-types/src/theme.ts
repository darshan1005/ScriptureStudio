export type TextAlignment = 'left' | 'center' | 'right' | 'justify';
export type TextTransform = 'none' | 'uppercase' | 'capitalize' | 'lowercase';
export type FontStyleMode = 'normal' | 'italic' | 'oblique';
export type TextDecorationMode = 'none' | 'underline' | 'line-through';
export type BackgroundType = 'solid' | 'gradient' | 'image' | 'video';
export type AspectRatioMode = '16:9' | '4:3' | 'lower-third' | 'custom';

export interface ThemeTypography {
  fontFamily: string;
  fontSizeRem: number;           // Scale factor, default: 3.5rem (or 1.5 - 7.0)
  fontWeight: number;            // 400, 600, 700, 800, 900
  lineHeight: number;            // e.g., 1.3 (range 1.0 - 2.5)
  letterSpacingPx: number;       // e.g., 0px or 1px
  color: string;                 // Hex or RGBA, e.g., '#FFFFFF'
  alignment: TextAlignment;
  transform: TextTransform;
  fontStyle?: FontStyleMode;     // 'normal' | 'italic' | 'oblique'
  textDecoration?: TextDecorationMode; // 'none' | 'underline'

  // Dedicated Reference Title Styling
  referenceFontFamily?: string;
  referenceFontSizeRem?: number; // e.g. 1.4rem (range 0.8 - 4.0)
  referenceColor?: string;       // e.g. '#F59E0B'
  referenceWeight?: number;      // e.g. 700
  referenceStyle?: FontStyleMode; // 'normal' | 'italic'
  referenceDecoration?: TextDecorationMode;
  referencePosition?: 'above' | 'below' | 'hidden';

  // Version / Translation Tag Styling
  showVersion?: boolean;          // Whether to display the Bible translation/version tag (default true)
  versionFontSizeRem?: number;    // e.g. 1.1rem (range 0.6 - 2.5)
  versionColor?: string;          // Primary Translation Tag Color, e.g. '#94A3B8'
  secondaryVersionColor?: string; // Secondary Translation Tag Color, e.g. '#F59E0B'
  versionWeight?: number;         // Primary Version Weight, e.g. 600
  secondaryVersionWeight?: number;// Secondary Version Weight, e.g. 600
  versionStyle?: FontStyleMode;   // Primary Version Style ('normal' | 'italic')
  secondaryVersionStyle?: FontStyleMode; // Secondary Version Style ('normal' | 'italic')
  versionBadgeFormat?: 'parentheses' | 'pill' | 'plain' | 'brackets';

  // Footnotes & Translator HTML Tags Control
  stripFootnotes?: boolean;       // If true, strips translator marginal notes, <sup>, and Strong's tags (default true)
  footnoteMode?: 'strip' | 'badge' | 'inline'; // 'strip' (clean), 'badge' (small superscript), 'inline' (subtle note)
}

export interface ThemeShadow {
  enabled: boolean;
  color: string;                 // e.g., 'rgba(0, 0, 0, 0.85)'
  blurPx: number;                // e.g., 8
  offsetX: number;               // e.g., 2
  offsetY: number;               // e.g., 4
}

export interface ThemeOutline {
  enabled: boolean;
  color: string;                 // e.g., '#000000'
  widthPx: number;               // e.g., 2
}

export interface ThemeGlow {
  enabled: boolean;
  color: string;                 // e.g., '#F59E0B'
  radiusPx: number;              // e.g., 12
}

export interface ThemeBackground {
  type: BackgroundType;
  color?: string;                // e.g., '#0A192F'
  gradient?: {
    type: 'linear' | 'radial';
    directionDeg?: number;       // e.g., 180
    stops: { color: string; offset: number }[];
  };
  assetId?: string;              // Reference to theme_assets
  assetUrl?: string;             // Resolved asset:// URL or local path
  imageUrl?: string;             // Custom background image data URL or file path
  dimmingPercent?: number;       // 0 to 100% overlay darkness for scripture readability
  objectFit?: 'cover' | 'contain';
  blurPx?: number;
  videoLoop?: boolean;
  videoMuted?: boolean;
}

export interface ThemeSafeMargins {
  topPercent: number;            // e.g., 8
  bottomPercent: number;         // e.g., 8
  leftPercent: number;           // e.g., 10
  rightPercent: number;          // e.g., 10
  paddingPercent?: number;       // e.g., 4% (internal box padding)
  containerMaxWidthPercent?: number; // e.g. 90% (container width limit)
  containerMaxHeightPercent?: number; // e.g. 85% (container height limit)
}

export interface ThemePlacement {
  mode: AspectRatioMode;
  verticalAlign: 'top' | 'center' | 'bottom';
  lowerThirdHeightPercent?: number; // e.g. 28% for lower-third broadcast overlays
  translationLayout?: 'stacked' | 'side-by-side'; // 'stacked' (vertical 2 rows) or 'side-by-side' (horizontal 2 columns)
  cardStyle?: 'glass' | 'solid' | 'bordered' | 'none'; // Card styling mode
}

export interface ThemeConfiguration {
  typography: ThemeTypography;
  shadow: ThemeShadow;
  outline: ThemeOutline;
  glow?: ThemeGlow;
  background: ThemeBackground;
  margins: ThemeSafeMargins;
  placement: ThemePlacement;
}

export interface ThemeDto {
  id: string;
  name: string;
  isDefault: boolean;
  isSystem: boolean;
  config: ThemeConfiguration;
  createdAt: string;
  updatedAt: string;
}

