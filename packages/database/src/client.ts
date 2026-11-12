import Database from 'better-sqlite3';
import { createLogger } from '@scripture-studio/logger';
import { initialSchemaSql } from './migrations/index.js';

const logger = createLogger('DatabaseClient');

export class DatabaseClient {
  private db: Database.Database;

  constructor(dbPath: string) {
    logger.info(`Initializing SQLite database at: ${dbPath}`);
    this.db = new Database(dbPath);
    this.applyPragmas();
    this.runMigrations();
    this.seedDefaultData();
  }

  private applyPragmas(): void {
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('encoding = "UTF-8"');
    this.db.pragma('mmap_size = 268435456'); // 256MB memory mapped I/O
    this.db.pragma('cache_size = -64000');   // 64MB cache
    logger.debug('WAL pragmas and performance settings applied successfully');
  }

  private runMigrations(): void {
    const checkTable = this.db.prepare(`
      SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='schema_migrations'
    `).get() as { count: number };

    if (checkTable.count === 0) {
      logger.info('Executing initial schema migration (001)...');
      this.db.exec(initialSchemaSql);
      this.db.prepare('INSERT INTO schema_migrations (version) VALUES (1)').run();
      logger.info('Initial schema migration completed.');
    }
  }

  private seedDefaultData(): void {
    const themeCount = this.db.prepare('SELECT count(*) as count FROM themes').get() as { count: number };
    if (themeCount.count < 8) {
      logger.info('Seeding full suite of church presentation themes...');
      const insertTheme = this.db.prepare(`
        INSERT OR REPLACE INTO themes (id, name, is_default, is_system, configuration_json)
        VALUES (?, ?, ?, 1, ?)
      `);

      // 1. Sanctuary Navy & Gold (Default)
      insertTheme.run(
        'theme-sanctuary-gold',
        'Sanctuary Navy & Gold',
        1,
        JSON.stringify({
          typography: {
            fontFamily: 'Segoe UI, Arial, sans-serif',
            fontSizeRem: 3.5,
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacingPx: 0.5,
            color: '#FFFFFF',
            alignment: 'center',
            transform: 'none',
          },
          shadow: {
            enabled: true,
            color: 'rgba(0, 0, 0, 0.9)',
            blurPx: 10,
            offsetX: 2,
            offsetY: 4,
          },
          outline: {
            enabled: true,
            color: '#0A192F',
            widthPx: 2,
          },
          background: {
            type: 'gradient',
            gradient: {
              type: 'linear',
              directionDeg: 135,
              stops: [
                { color: '#09172C', offset: 0 },
                { color: '#0F2B48', offset: 100 },
              ],
            },
          },
          margins: {
            topPercent: 8,
            bottomPercent: 8,
            leftPercent: 10,
            rightPercent: 10,
          },
          placement: {
            mode: '16:9',
            verticalAlign: 'center',
          },
        })
      );

      // 2. Cathedral Stained Glass / Warm Ember
      insertTheme.run(
        'theme-cathedral-amber',
        'Cathedral Warm Ember & Gold',
        0,
        JSON.stringify({
          typography: {
            fontFamily: 'Georgia, serif',
            fontSizeRem: 3.6,
            fontWeight: 700,
            lineHeight: 1.35,
            letterSpacingPx: 0.3,
            color: '#FFF8E7',
            alignment: 'center',
            transform: 'none',
          },
          shadow: {
            enabled: true,
            color: 'rgba(0, 0, 0, 0.95)',
            blurPx: 12,
            offsetX: 2,
            offsetY: 4,
          },
          outline: {
            enabled: true,
            color: '#2A0E04',
            widthPx: 2,
          },
          background: {
            type: 'gradient',
            gradient: {
              type: 'linear',
              directionDeg: 140,
              stops: [
                { color: '#2B0E05', offset: 0 },
                { color: '#5C1D06', offset: 100 },
              ],
            },
          },
          margins: {
            topPercent: 8,
            bottomPercent: 8,
            leftPercent: 10,
            rightPercent: 10,
          },
          placement: {
            mode: '16:9',
            verticalAlign: 'center',
          },
        })
      );

      // 3. Sunset Praise (Indigo to Magenta)
      insertTheme.run(
        'theme-sunset-praise',
        'Sunset Praise (Indigo / Violet)',
        0,
        JSON.stringify({
          typography: {
            fontFamily: 'Segoe UI, sans-serif',
            fontSizeRem: 3.5,
            fontWeight: 800,
            lineHeight: 1.3,
            letterSpacingPx: 0.5,
            color: '#FFFFFF',
            alignment: 'center',
            transform: 'none',
          },
          shadow: {
            enabled: true,
            color: 'rgba(0, 0, 0, 0.85)',
            blurPx: 12,
            offsetX: 2,
            offsetY: 3,
          },
          outline: {
            enabled: true,
            color: '#1A0033',
            widthPx: 2,
          },
          background: {
            type: 'gradient',
            gradient: {
              type: 'linear',
              directionDeg: 135,
              stops: [
                { color: '#1A0B2E', offset: 0 },
                { color: '#4A154B', offset: 100 },
              ],
            },
          },
          margins: {
            topPercent: 8,
            bottomPercent: 8,
            leftPercent: 10,
            rightPercent: 10,
          },
          placement: {
            mode: '16:9',
            verticalAlign: 'center',
          },
        })
      );

      // 4. Emerald Majesty (Deep Worship Forest)
      insertTheme.run(
        'theme-emerald-majesty',
        'Emerald Majesty (Deep Forest)',
        0,
        JSON.stringify({
          typography: {
            fontFamily: 'Segoe UI, Arial, sans-serif',
            fontSizeRem: 3.5,
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacingPx: 0.5,
            color: '#FFFFFF',
            alignment: 'center',
            transform: 'none',
          },
          shadow: {
            enabled: true,
            color: 'rgba(0, 0, 0, 0.9)',
            blurPx: 10,
            offsetX: 2,
            offsetY: 4,
          },
          outline: {
            enabled: true,
            color: '#03170E',
            widthPx: 2,
          },
          background: {
            type: 'gradient',
            gradient: {
              type: 'linear',
              directionDeg: 135,
              stops: [
                { color: '#041B12', offset: 0 },
                { color: '#0B422B', offset: 100 },
              ],
            },
          },
          margins: {
            topPercent: 8,
            bottomPercent: 8,
            leftPercent: 10,
            rightPercent: 10,
          },
          placement: {
            mode: '16:9',
            verticalAlign: 'center',
          },
        })
      );

      // 5. Midnight Blackout (High-Contrast for Projectors/OLED)
      insertTheme.run(
        'theme-midnight-blackout',
        'Midnight Blackout (High-Contrast)',
        0,
        JSON.stringify({
          typography: {
            fontFamily: 'Arial, sans-serif',
            fontSizeRem: 3.8,
            fontWeight: 800,
            lineHeight: 1.3,
            letterSpacingPx: 0.8,
            color: '#FFFFFF',
            alignment: 'center',
            transform: 'none',
          },
          shadow: {
            enabled: false,
            color: '#000000',
            blurPx: 0,
            offsetX: 0,
            offsetY: 0,
          },
          outline: {
            enabled: false,
            color: '#000000',
            widthPx: 0,
          },
          background: {
            type: 'solid',
            color: '#000000',
          },
          margins: {
            topPercent: 8,
            bottomPercent: 8,
            leftPercent: 10,
            rightPercent: 10,
          },
          placement: {
            mode: '16:9',
            verticalAlign: 'center',
          },
        })
      );

      // 6. Charcoal Contemporary (Modern Slate)
      insertTheme.run(
        'theme-charcoal-modern',
        'Charcoal Contemporary (Slate)',
        0,
        JSON.stringify({
          typography: {
            fontFamily: 'Segoe UI, sans-serif',
            fontSizeRem: 3.4,
            fontWeight: 600,
            lineHeight: 1.35,
            letterSpacingPx: 0.4,
            color: '#F1F5F9',
            alignment: 'center',
            transform: 'none',
          },
          shadow: {
            enabled: true,
            color: 'rgba(0, 0, 0, 0.85)',
            blurPx: 8,
            offsetX: 1,
            offsetY: 3,
          },
          outline: {
            enabled: true,
            color: '#111215',
            widthPx: 1,
          },
          background: {
            type: 'gradient',
            gradient: {
              type: 'linear',
              directionDeg: 150,
              stops: [
                { color: '#16181D', offset: 0 },
                { color: '#252932', offset: 100 },
              ],
            },
          },
          margins: {
            topPercent: 8,
            bottomPercent: 8,
            leftPercent: 10,
            rightPercent: 10,
          },
          placement: {
            mode: '16:9',
            verticalAlign: 'center',
          },
        })
      );

      // 7. Royal Purple & White
      insertTheme.run(
        'theme-royal-purple',
        'Royal Purple & White',
        0,
        JSON.stringify({
          typography: {
            fontFamily: 'Georgia, serif',
            fontSizeRem: 3.6,
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacingPx: 0.3,
            color: '#FFFFFF',
            alignment: 'center',
            transform: 'none',
          },
          shadow: {
            enabled: true,
            color: 'rgba(0, 0, 0, 0.9)',
            blurPx: 10,
            offsetX: 2,
            offsetY: 3,
          },
          outline: {
            enabled: true,
            color: '#1C062E',
            widthPx: 2,
          },
          background: {
            type: 'gradient',
            gradient: {
              type: 'linear',
              directionDeg: 135,
              stops: [
                { color: '#1E0531', offset: 0 },
                { color: '#3E0D65', offset: 100 },
              ],
            },
          },
          margins: {
            topPercent: 8,
            bottomPercent: 8,
            leftPercent: 10,
            rightPercent: 10,
          },
          placement: {
            mode: '16:9',
            verticalAlign: 'center',
          },
        })
      );

      // 8. Broadcast Lower Third (OBS / vMix Transparent)
      insertTheme.run(
        'theme-broadcast-lower-third',
        'Broadcast Lower Third (OBS / vMix)',
        0,
        JSON.stringify({
          typography: {
            fontFamily: 'Segoe UI, sans-serif',
            fontSizeRem: 2.2,
            fontWeight: 600,
            lineHeight: 1.25,
            letterSpacingPx: 0,
            color: '#FFFFFF',
            alignment: 'left',
            transform: 'none',
          },
          shadow: {
            enabled: true,
            color: 'rgba(0, 0, 0, 0.8)',
            blurPx: 6,
            offsetX: 1,
            offsetY: 2,
          },
          outline: {
            enabled: false,
            color: '#000000',
            widthPx: 0,
          },
          background: {
            type: 'solid',
            color: 'rgba(10, 25, 47, 0.88)',
          },
          margins: {
            topPercent: 2,
            bottomPercent: 4,
            leftPercent: 6,
            rightPercent: 6,
          },
          placement: {
            mode: 'lower-third',
            verticalAlign: 'bottom',
            lowerThirdHeightPercent: 26,
          },
        })
      );

      logger.info('Full church presentation theme library seeded successfully.');
    }
  }

  get rawDb(): Database.Database {
    return this.db;
  }

  close(): void {
    logger.info('Closing SQLite database connection.');
    this.db.close();
  }
}

