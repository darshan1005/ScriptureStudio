import { ScriptureReference } from './bible.js';

export type ProgramItemType = 'SCRIPTURE' | 'ANNOUNCEMENT' | 'TITLE';

export interface SpeakerNoteDto {
  id: string;
  programItemId: string;
  noteText: string;
  updatedAt: string;
}

export interface ProgramItemDto {
  id: string;
  programId: string;
  position: number;
  itemType: ProgramItemType;
  reference?: ScriptureReference;
  customTitle?: string;
  notes?: string;
  speakerNotes?: SpeakerNoteDto[];
}

export interface ProgramDto {
  id: string;
  name: string;
  description?: string;
  items: ProgramItemDto[];
  createdAt: string;
  updatedAt: string;
}

