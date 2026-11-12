import Database from 'better-sqlite3';
import { ThemeDto } from '@scripture-studio/shared-types';

export class ThemeRepository {
  constructor(private db: Database.Database) {}

  getThemes(): ThemeDto[] {
    const rows = this.db.prepare(`
      SELECT id, name, is_default, is_system, configuration_json, created_at, updated_at
      FROM themes
      ORDER BY is_default DESC, name ASC
    `).all() as any[];

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      isDefault: Boolean(r.is_default),
      isSystem: Boolean(r.is_system),
      config: JSON.parse(r.configuration_json),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  getThemeById(id: string): ThemeDto | null {
    const r = this.db.prepare(`
      SELECT id, name, is_default, is_system, configuration_json, created_at, updated_at
      FROM themes
      WHERE id = ?
    `).get(id) as any;

    if (!r) return null;

    return {
      id: r.id,
      name: r.name,
      isDefault: Boolean(r.is_default),
      isSystem: Boolean(r.is_system),
      config: JSON.parse(r.configuration_json),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  getDefaultTheme(): ThemeDto | null {
    const r = this.db.prepare(`
      SELECT id, name, is_default, is_system, configuration_json, created_at, updated_at
      FROM themes
      WHERE is_default = 1
      LIMIT 1
    `).get() as any;

    if (!r) {
      // Fallback to first theme
      const fallback = this.db.prepare(`
        SELECT id, name, is_default, is_system, configuration_json, created_at, updated_at
        FROM themes
        LIMIT 1
      `).get() as any;
      if (!fallback) return null;
      return {
        id: fallback.id,
        name: fallback.name,
        isDefault: Boolean(fallback.is_default),
        isSystem: Boolean(fallback.is_system),
        config: JSON.parse(fallback.configuration_json),
        createdAt: fallback.created_at,
        updatedAt: fallback.updated_at,
      };
    }

    return {
      id: r.id,
      name: r.name,
      isDefault: Boolean(r.is_default),
      isSystem: Boolean(r.is_system),
      config: JSON.parse(r.configuration_json),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  saveTheme(theme: ThemeDto): void {
    const exists = this.db.prepare('SELECT count(*) as count FROM themes WHERE id = ?').get(theme.id) as { count: number };
    const now = new Date().toISOString();

    if (exists.count > 0) {
      this.db.prepare(`
        UPDATE themes
        SET name = ?, configuration_json = ?, is_default = ?, updated_at = ?
        WHERE id = ?
      `).run(theme.name, JSON.stringify(theme.config), theme.isDefault ? 1 : 0, now, theme.id);
    } else {
      this.db.prepare(`
        INSERT INTO themes (id, name, is_default, is_system, configuration_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        theme.id,
        theme.name,
        theme.isDefault ? 1 : 0,
        theme.isSystem ? 1 : 0,
        JSON.stringify(theme.config),
        now,
        now
      );
    }

    if (theme.isDefault) {
      this.db.prepare('UPDATE themes SET is_default = 0 WHERE id != ?').run(theme.id);
    }
  }

  deleteTheme(id: string): boolean {
    const res = this.db.prepare('DELETE FROM themes WHERE id = ? AND is_system = 0').run(id);
    return res.changes > 0;
  }
}

