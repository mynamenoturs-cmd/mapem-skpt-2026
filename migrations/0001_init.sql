-- Jalankan di Cloudflare D1 Console sebelum portal digunakan.
CREATE TABLE IF NOT EXISTS classes (
 id TEXT PRIMARY KEY, year INTEGER NOT NULL CHECK(year IN (1,2,3)), name TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted')),
 token_version INTEGER NOT NULL DEFAULT 1,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, submitted_at TEXT,
 UNIQUE(year,name)
);
CREATE TABLE IF NOT EXISTS drafts (
 class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
 category_id TEXT NOT NULL, names_json TEXT NOT NULL DEFAULT '[]',
 version INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(class_id,category_id)
);
CREATE INDEX IF NOT EXISTS idx_drafts_category ON drafts(category_id);
INSERT OR IGNORE INTO classes(id,year,name) VALUES('1-amber',1,'Amber');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('1-crystal',1,'Crystal');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('1-diamond',1,'Diamond');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('1-emerald',1,'Emerald');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('1-jade',1,'Jade');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('1-pearl',1,'Pearl');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('1-ruby',1,'Ruby');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('1-sapphire',1,'Sapphire');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('1-topaz',1,'Topaz');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('2-amber',2,'Amber');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('2-crystal',2,'Crystal');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('2-diamond',2,'Diamond');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('2-emerald',2,'Emerald');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('2-jade',2,'Jade');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('2-pearl',2,'Pearl');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('2-ruby',2,'Ruby');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('2-sapphire',2,'Sapphire');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('2-topaz',2,'Topaz');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('3-crystal',3,'Crystal');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('3-diamond',3,'Diamond');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('3-emerald',3,'Emerald');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('3-jade',3,'Jade');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('3-pearl',3,'Pearl');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('3-ruby',3,'Ruby');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('3-sapphire',3,'Sapphire');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('3-topaz',3,'Topaz');
