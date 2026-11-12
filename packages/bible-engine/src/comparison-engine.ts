import { MultiVersionSlot, SlideContentDto } from '@scripture-studio/shared-types';

export interface VersionVerseInput {
  versionId: string;
  versionAbbreviation: string;
  versionName: string;
  verseText: string;
}

export function buildMultiVersionSlide(
  referenceDisplay: string,
  inputs: VersionVerseInput[]
): SlideContentDto {
  const primary = inputs[0];
  const primaryAbbr = primary ? primary.versionAbbreviation : 'KJV';

  const multiVersionSlots: MultiVersionSlot[] = inputs.map((item) => ({
    versionAbbreviation: item.versionAbbreviation,
    versionName: item.versionName,
    text: item.verseText,
  }));

  return {
    id: `multislide_${Date.now()}`,
    referenceDisplay,
    versionAbbreviation: primaryAbbr,
    verses: [
      {
        verseNumber: 1,
        text: primary?.verseText || '',
      },
    ],
    multiVersionSlots,
  };
}

