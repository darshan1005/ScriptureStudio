import { ScriptureReference } from './bible.js';

export type PresentationMode = 'IDLE' | 'PREVIEW' | 'LIVE' | 'FROZEN' | 'HIDDEN';

export type TransitionType = 'CUT' | 'FADE' | 'SLIDE';

export interface SlideVerseItem {
  verseNumber: number;
  text: string;
}

export interface MultiVersionSlot {
  versionAbbreviation: string;
  versionName: string;
  text: string;
}

export interface SlideContentDto {
  id: string;
  referenceDisplay: string;         // e.g., "Romans 8:28"
  versionAbbreviation: string;      // e.g., "KJV"
  verses: SlideVerseItem[];
  multiVersionSlots?: MultiVersionSlot[];
  customTitle?: string;
  notes?: string;
  reference?: ScriptureReference;
}

export interface PresentationStateDto {
  mode: PresentationMode;
  isFrozen: boolean;
  isVisible: boolean;
  activeThemeId: string;
  previewSlide: SlideContentDto | null;
  liveSlide: SlideContentDto | null;
  currentProgramId: string | null;
  currentProgramItemIndex: number | null;
  lastUpdatedTimestamp: number;
}

