import { describe, it, expect } from 'vitest';
import { parseScriptureReference } from '../../packages/bible-engine/src/reference-parser.js';

describe('Canonical Scripture Reference Parser', () => {
  it('parses standard reference with colon separator', () => {
    const res = parseScriptureReference('John 3:16');
    expect(res.isValid).toBe(true);
    expect(res.reference?.bookName).toBe('John');
    expect(res.reference?.chapterNumber).toBe(3);
    expect(res.reference?.startVerse).toBe(16);
    expect(res.formattedDisplay).toBe('John 3:16');
  });

  it('parses multi-verse range with dash', () => {
    const res = parseScriptureReference('Romans 8:28-30');
    expect(res.isValid).toBe(true);
    expect(res.reference?.bookName).toBe('Romans');
    expect(res.reference?.chapterNumber).toBe(8);
    expect(res.reference?.startVerse).toBe(28);
    expect(res.reference?.endVerse).toBe(30);
    expect(res.formattedDisplay).toBe('Romans 8:28-30');
  });

  it('parses book name starting with a number (e.g. 1 Corinthians)', () => {
    const res = parseScriptureReference('1 Cor 13:4');
    expect(res.isValid).toBe(true);
    expect(res.reference?.bookName).toBe('1 Corinthians');
    expect(res.reference?.chapterNumber).toBe(13);
    expect(res.reference?.startVerse).toBe(4);
  });

  it('tolerates dot separator (e.g. Gen 1.1)', () => {
    const res = parseScriptureReference('Gen 1.1');
    expect(res.isValid).toBe(true);
    expect(res.reference?.bookName).toBe('Genesis');
    expect(res.reference?.chapterNumber).toBe(1);
    expect(res.reference?.startVerse).toBe(1);
  });

  it('tolerates space separator (e.g. Psalm 23 1)', () => {
    const res = parseScriptureReference('Ps 23 1');
    expect(res.isValid).toBe(true);
    expect(res.reference?.bookName).toBe('Psalms');
    expect(res.reference?.chapterNumber).toBe(23);
    expect(res.reference?.startVerse).toBe(1);
  });

  it('returns invalid result on unknown book name', () => {
    const res = parseScriptureReference('FakeBook 1:1');
    expect(res.isValid).toBe(false);
    expect(res.error).toBeDefined();
  });
});

