import { ParsedReferenceResult, ScriptureReference } from '@scripture-studio/shared-types';
import { CANONICAL_BOOKS, CanonicalBookDefinition } from './canonical-books.js';

export function findCanonicalBook(inputName: string): CanonicalBookDefinition | null {
  if (!inputName || typeof inputName !== 'string') return null;
  let clean = inputName.trim().toLowerCase().replace(/\./g, '');

  // Strip version prefixes if present (e.g. 'kjv_jhn' -> 'jhn', 'niv_psa' -> 'psa')
  if (clean.includes('_')) {
    clean = clean.split('_').slice(1).join('_').toLowerCase();
  }

  for (const book of CANONICAL_BOOKS) {
    if (book.name.toLowerCase() === clean) return book;
    if (book.abbreviation.toLowerCase() === clean) return book;
    for (const alias of book.aliases) {
      if (alias.toLowerCase() === clean) return book;
    }
  }

  // Prefix match (e.g. 'rom' -> 'Romans', 'gen' -> 'Genesis')
  for (const book of CANONICAL_BOOKS) {
    if (book.name.toLowerCase().startsWith(clean)) return book;
  }

  return null;
}

export function parseScriptureReference(rawQuery: string): ParsedReferenceResult {
  if (!rawQuery || typeof rawQuery !== 'string') {
    return { isValid: false, error: 'Empty query' };
  }

  const trimmed = rawQuery.trim();

  // Pattern: Optional book prefix number (1, 2, 3), Book name, Chapter, separator (: or . or space), Verse, optional range (-Verse)
  // Examples: "1 Cor 13:4-8", "Romans 8:28", "John 3 16", "Gen 1.1", "Psalm 23"
  const regex = /^([1-3]?\s?[A-Za-z]+(?:\s+[A-Za-z]+)?)\s*(\d+)(?:[:.\s](\d+)(?:-(\d+))?)?$/;
  const match = trimmed.match(regex);

  if (!match) {
    return {
      isValid: false,
      error: `Could not parse "${rawQuery}". Supported formats: "John 3:16", "Rom 8:28-30", "1 Cor 13:4".`,
    };
  }

  const rawBookName = match[1]!.trim();
  const chapter = parseInt(match[2]!, 10);
  const startVerse = match[3] ? parseInt(match[3], 10) : 1;
  const endVerse = match[4] ? parseInt(match[4], 10) : (match[3] ? undefined : 999);

  const book = findCanonicalBook(rawBookName);
  if (!book) {
    return {
      isValid: false,
      error: `Book "${rawBookName}" not recognized in canonical Bible.`,
    };
  }

  if (chapter <= 0 || chapter > book.chapterCount) {
    return {
      isValid: false,
      error: `Chapter ${chapter} is out of range for ${book.name} (1 to ${book.chapterCount}).`,
    };
  }

  const reference: ScriptureReference = {
    bookId: `kjv_${book.abbreviation.toLowerCase()}`,
    bookName: book.name,
    chapterNumber: chapter,
    startVerse,
    endVerse,
  };

  const formattedDisplay = `${book.name} ${chapter}:${startVerse}${endVerse ? `-${endVerse}` : ''}`;

  return {
    isValid: true,
    reference,
    formattedDisplay,
  };
}

