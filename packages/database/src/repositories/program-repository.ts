import Database from 'better-sqlite3';
import { ProgramDto, ProgramItemDto } from '@scripture-studio/shared-types';

export class ProgramRepository {
  constructor(private db: Database.Database) {}

  getPrograms(): ProgramDto[] {
    const programRows = this.db.prepare(`
      SELECT id, name, description, created_at, updated_at
      FROM presentation_programs
      ORDER BY updated_at DESC
    `).all() as any[];

    return programRows.map((p) => {
      const items = this.getItemsForProgram(p.id);
      return {
        id: p.id,
        name: p.name,
        description: p.description || undefined,
        items,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      };
    });
  }

  getProgramById(id: string): ProgramDto | null {
    const p = this.db.prepare(`
      SELECT id, name, description, created_at, updated_at
      FROM presentation_programs
      WHERE id = ?
    `).get(id) as any;

    if (!p) return null;

    const items = this.getItemsForProgram(p.id);
    return {
      id: p.id,
      name: p.name,
      description: p.description || undefined,
      items,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    };
  }

  private getItemsForProgram(programId: string): ProgramItemDto[] {
    const rows = this.db.prepare(`
      SELECT id, program_id, position, item_type, reference_json, custom_title, notes
      FROM program_items
      WHERE program_id = ?
      ORDER BY position ASC
    `).all(programId) as any[];

    return rows.map((r) => ({
      id: r.id,
      programId: r.program_id,
      position: r.position,
      itemType: r.item_type,
      reference: r.reference_json ? JSON.parse(r.reference_json) : undefined,
      customTitle: r.custom_title || undefined,
      notes: r.notes || undefined,
    }));
  }

  saveProgram(program: ProgramDto): void {
    const now = new Date().toISOString();
    const saveTransaction = this.db.transaction(() => {
      const exists = this.db.prepare('SELECT count(*) as count FROM presentation_programs WHERE id = ?').get(program.id) as { count: number };

      if (exists.count > 0) {
        this.db.prepare(`
          UPDATE presentation_programs
          SET name = ?, description = ?, updated_at = ?
          WHERE id = ?
        `).run(program.name, program.description || null, now, program.id);
      } else {
        this.db.prepare(`
          INSERT INTO presentation_programs (id, name, description, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(program.id, program.name, program.description || null, now, now);
      }

      // Replace items
      this.db.prepare('DELETE FROM program_items WHERE program_id = ?').run(program.id);

      const insertItem = this.db.prepare(`
        INSERT INTO program_items (id, program_id, position, item_type, reference_json, custom_title, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (let i = 0; i < program.items.length; i++) {
        const item = program.items[i]!;
        insertItem.run(
          item.id,
          program.id,
          i,
          item.itemType || 'SCRIPTURE',
          item.reference ? JSON.stringify(item.reference) : '{}',
          item.customTitle || null,
          item.notes || null
        );
      }
    });

    saveTransaction();
  }

  deleteProgram(id: string): boolean {
    const delNotes = this.db.prepare(`
      DELETE FROM speaker_notes 
      WHERE program_item_id IN (SELECT id FROM program_items WHERE program_id = ?)
    `);
    const delItems = this.db.prepare('DELETE FROM program_items WHERE program_id = ?');
    const delProg = this.db.prepare('DELETE FROM presentation_programs WHERE id = ?');

    const txn = this.db.transaction(() => {
      delNotes.run(id);
      delItems.run(id);
      delProg.run(id);
    });
    txn();
    return true;
  }
}

