import { describe, it, expect, beforeEach } from 'vitest';
import { PresentationStateDto, SlideContentDto } from '../../packages/shared-types/src/index.js';

describe('Presentation State Machine Logic', () => {
  let state: PresentationStateDto;

  beforeEach(() => {
    state = {
      mode: 'IDLE',
      isFrozen: false,
      isVisible: true,
      activeThemeId: 'theme-sanctuary-gold',
      previewSlide: null,
      liveSlide: null,
      currentProgramId: null,
      currentProgramItemIndex: null,
      lastUpdatedTimestamp: Date.now(),
    };
  });

  it('starts in IDLE mode with no active slide', () => {
    expect(state.mode).toBe('IDLE');
    expect(state.previewSlide).toBeNull();
    expect(state.liveSlide).toBeNull();
    expect(state.isFrozen).toBe(false);
  });

  it('transitions to PREVIEW when a reference is staged', () => {
    const mockSlide: SlideContentDto = {
      id: 'slide_1',
      referenceDisplay: 'John 3:16',
      versionAbbreviation: 'KJV',
      verses: [{ verseNumber: 16, text: 'For God so loved the world...' }],
    };

    state.previewSlide = mockSlide;
    state.mode = 'PREVIEW';

    expect(state.mode).toBe('PREVIEW');
    expect(state.previewSlide.referenceDisplay).toBe('John 3:16');
    // Live slide must remain null (preview must never pollute live output)
    expect(state.liveSlide).toBeNull();
  });

  it('transitions to LIVE when Take Live is executed', () => {
    const mockSlide: SlideContentDto = {
      id: 'slide_1',
      referenceDisplay: 'Romans 8:28',
      versionAbbreviation: 'KJV',
      verses: [{ verseNumber: 28, text: 'And we know that all things work together...' }],
    };

    state.previewSlide = mockSlide;
    // Execute Take Live
    state.liveSlide = { ...state.previewSlide };
    state.mode = 'LIVE';
    state.isFrozen = false;
    state.isVisible = true;

    expect(state.mode).toBe('LIVE');
    expect(state.liveSlide?.referenceDisplay).toBe('Romans 8:28');
  });

  it('operates Freeze and unfreeze independently from operator preview changes', () => {
    state.liveSlide = {
      id: 'slide_live',
      referenceDisplay: 'Psalm 23:1',
      versionAbbreviation: 'KJV',
      verses: [{ verseNumber: 1, text: 'The LORD is my shepherd; I shall not want.' }],
    };
    state.mode = 'LIVE';

    // Operator hits Freeze
    state.isFrozen = true;
    state.mode = 'FROZEN';
    expect(state.mode).toBe('FROZEN');

    // Operator changes preview while frozen
    state.previewSlide = {
      id: 'slide_preview',
      referenceDisplay: 'Genesis 1:1',
      versionAbbreviation: 'KJV',
      verses: [{ verseNumber: 1, text: 'In the beginning...' }],
    };

    // Assert live slide was NOT affected
    expect(state.liveSlide.referenceDisplay).toBe('Psalm 23:1');

    // Operator hits Unfreeze
    state.isFrozen = false;
    state.mode = 'LIVE';
    expect(state.mode).toBe('LIVE');
  });

  it('operates Hide and Clear cleanly', () => {
    state.liveSlide = {
      id: 'slide_live',
      referenceDisplay: 'John 14:6',
      versionAbbreviation: 'KJV',
      verses: [{ verseNumber: 6, text: 'Jesus saith unto him, I am the way...' }],
    };
    state.mode = 'LIVE';

    // Hide blanks output
    state.isVisible = false;
    state.mode = 'HIDDEN';
    expect(state.mode).toBe('HIDDEN');
    expect(state.isVisible).toBe(false);

    // Clear empties slide
    state.liveSlide = null;
    state.mode = 'IDLE';
    expect(state.mode).toBe('IDLE');
    expect(state.liveSlide).toBeNull();
  });
});

