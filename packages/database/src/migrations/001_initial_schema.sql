-- Schema migrations tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Registered Bible translations
CREATE TABLE IF NOT EXISTS bible_versions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    language_code TEXT NOT NULL,
    direction TEXT NOT NULL DEFAULT 'ltr',
    license_type TEXT NOT NULL,
    copyright_notice TEXT,
    attribution_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    installed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Canonical books
CREATE TABLE IF NOT EXISTS bible_books (
    id TEXT PRIMARY KEY,
    version_id TEXT NOT NULL,
    book_order INTEGER NOT NULL,
    testament TEXT NOT NULL,
    name TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    chapter_count INTEGER NOT NULL,
    FOREIGN KEY (version_id) REFERENCES bible_versions(id) ON DELETE CASCADE
);

-- Chapters table
CREATE TABLE IF NOT EXISTS bible_chapters (
    id TEXT PRIMARY KEY,
    version_id TEXT NOT NULL,
    book_id TEXT NOT NULL,
    chapter_number INTEGER NOT NULL,
    verse_count INTEGER NOT NULL,
    FOREIGN KEY (version_id) REFERENCES bible_versions(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES bible_books(id) ON DELETE CASCADE,
    UNIQUE(version_id, book_id, chapter_number)
);

-- Verses table
CREATE TABLE IF NOT EXISTS bible_verses (
    id TEXT PRIMARY KEY,
    version_id TEXT NOT NULL,
    book_id TEXT NOT NULL,
    chapter_number INTEGER NOT NULL,
    verse_number INTEGER NOT NULL,
    verse_text TEXT NOT NULL,
    FOREIGN KEY (version_id) REFERENCES bible_versions(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES bible_books(id) ON DELETE CASCADE,
    UNIQUE(version_id, book_id, chapter_number, verse_number)
);

-- Indexes for instant lookup
CREATE INDEX IF NOT EXISTS idx_verses_lookup 
ON bible_verses(version_id, book_id, chapter_number, verse_number);

CREATE INDEX IF NOT EXISTS idx_books_order 
ON bible_books(version_id, book_order);

-- Themes
CREATE TABLE IF NOT EXISTS themes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0,
    is_system INTEGER NOT NULL DEFAULT 0,
    configuration_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Theme Assets
CREATE TABLE IF NOT EXISTS theme_assets (
    id TEXT PRIMARY KEY,
    theme_id TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE
);

-- Presentation Programs / Playlists
CREATE TABLE IF NOT EXISTS presentation_programs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Program items
CREATE TABLE IF NOT EXISTS program_items (
    id TEXT PRIMARY KEY,
    program_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    item_type TEXT NOT NULL,
    reference_json TEXT NOT NULL,
    custom_title TEXT,
    notes TEXT,
    FOREIGN KEY (program_id) REFERENCES presentation_programs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_program_items_pos 
ON program_items(program_id, position);

-- Speaker notes
CREATE TABLE IF NOT EXISTS speaker_notes (
    id TEXT PRIMARY KEY,
    program_item_id TEXT NOT NULL,
    note_text TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (program_item_id) REFERENCES program_items(id) ON DELETE CASCADE
);

-- Presentation History
CREATE TABLE IF NOT EXISTS presentation_history (
    id TEXT PRIMARY KEY,
    reference_json TEXT NOT NULL,
    translation_id TEXT NOT NULL,
    theme_id TEXT,
    presented_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Display Configurations
CREATE TABLE IF NOT EXISTS display_configurations (
    id TEXT PRIMARY KEY,
    display_id TEXT NOT NULL,
    display_name TEXT,
    role TEXT NOT NULL,
    bounds_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Settings
CREATE TABLE IF NOT EXISTS application_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value_json TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

