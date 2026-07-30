-- Log CMS: one row per page. Draft and published block arrays are stored as
-- JSON text. Public reads `published_blocks`; the editor reads/writes
-- `draft_blocks`; publishing copies draft -> published.
CREATE TABLE IF NOT EXISTS pages (
	id TEXT PRIMARY KEY,
	slug TEXT NOT NULL UNIQUE,
	title TEXT NOT NULL DEFAULT '',
	date TEXT NOT NULL DEFAULT '',
	cover TEXT,
	status TEXT NOT NULL DEFAULT 'draft',
	draft_blocks TEXT NOT NULL DEFAULT '[]',
	published_blocks TEXT NOT NULL DEFAULT '[]',
	updated_at TEXT,
	published_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_pages_status_date ON pages (status, date);
