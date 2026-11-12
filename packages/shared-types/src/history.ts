import { ScriptureReference } from './bible.js';

export interface PresentationHistoryEntryDto {
  id: string;
  reference: ScriptureReference;
  formattedDisplay: string;
  translationId: string;
  translationAbbr: string;
  themeId?: string;
  presentedAt: string;
}

