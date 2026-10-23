-- MaPeM 2026: extend original 26 Tahap 1 classes to 50 classes (Tahap 2 has no Amber).
-- The original classes.year CHECK only allowed (1,2,3), so a safe schema rebuild is needed.
-- All dependent records are copied into temporary staging tables before replacing the parent
-- and restored with original values/versions; never discard existing student data.
-- This migration must run as one atomic D1 migration (Wrangler).
PRAGMA defer_foreign_keys = ON;
CREATE TABLE __mapem_stage_drafts AS SELECT * FROM drafts;
CREATE TABLE __mapem_stage_assignments AS SELECT * FROM teacher_assignments;
CREATE TABLE __mapem_stage_nominations AS SELECT * FROM nominations;
CREATE TABLE __mapem_stage_reviews AS SELECT * FROM final_reviews;
CREATE TABLE __mapem_stage_publications AS SELECT * FROM publications;

-- Remove referencing tables before replacing parent to avoid ON DELETE CASCADE losses.
DROP TABLE drafts;
DROP TABLE teacher_assignments;
DROP TABLE nominations;
DROP TABLE final_reviews;
DROP TABLE publications;

CREATE TABLE __mapem_classes_v2 (
 id TEXT PRIMARY KEY,
 year INTEGER NOT NULL CHECK(year BETWEEN 1 AND 6),
 name TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted')),
 token_version INTEGER NOT NULL DEFAULT 1,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 submitted_at TEXT,
 UNIQUE(year,name)
);
INSERT INTO __mapem_classes_v2 (id,year,name,status,token_version,updated_at,submitted_at)
SELECT id,year,name,status,token_version,updated_at,submitted_at FROM classes;
DROP TABLE classes;
ALTER TABLE __mapem_classes_v2 RENAME TO classes;

CREATE TABLE drafts (
 class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
 category_id TEXT NOT NULL, names_json TEXT NOT NULL DEFAULT '[]',
 version INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(class_id,category_id)
);
INSERT INTO drafts SELECT * FROM __mapem_stage_drafts;
CREATE INDEX idx_drafts_category ON drafts(category_id);

CREATE TABLE teacher_assignments (
 email TEXT PRIMARY KEY,
 class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO teacher_assignments SELECT * FROM __mapem_stage_assignments;
CREATE INDEX idx_assignments_class ON teacher_assignments(class_id);

CREATE TABLE nominations (
 class_id TEXT NOT NULL REFERENCES classes(id),
 category_id TEXT NOT NULL,
 names_json TEXT NOT NULL DEFAULT '[]',
 version INTEGER NOT NULL DEFAULT 1,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(class_id,category_id)
);
INSERT INTO nominations SELECT * FROM __mapem_stage_nominations;

CREATE TABLE final_reviews (
 class_id TEXT NOT NULL REFERENCES classes(id),
 category_id TEXT NOT NULL,
 version INTEGER NOT NULL,
 confirmed_by TEXT NOT NULL,
 confirmed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(class_id,category_id)
);
INSERT INTO final_reviews SELECT * FROM __mapem_stage_reviews;

CREATE TABLE publications (
 class_id TEXT PRIMARY KEY REFERENCES classes(id) ON DELETE CASCADE,
 snapshot_json TEXT NOT NULL DEFAULT '{}',
 published_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 published_by TEXT NOT NULL
);
INSERT INTO publications SELECT * FROM __mapem_stage_publications;

DROP TABLE __mapem_stage_drafts;
DROP TABLE __mapem_stage_assignments;
DROP TABLE __mapem_stage_nominations;
DROP TABLE __mapem_stage_reviews;
DROP TABLE __mapem_stage_publications;

INSERT OR IGNORE INTO classes(id,year,name) VALUES('4-crystal',4,'Crystal');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('4-diamond',4,'Diamond');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('4-emerald',4,'Emerald');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('4-jade',4,'Jade');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('4-pearl',4,'Pearl');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('4-ruby',4,'Ruby');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('4-sapphire',4,'Sapphire');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('4-topaz',4,'Topaz');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('5-crystal',5,'Crystal');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('5-diamond',5,'Diamond');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('5-emerald',5,'Emerald');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('5-jade',5,'Jade');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('5-pearl',5,'Pearl');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('5-ruby',5,'Ruby');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('5-sapphire',5,'Sapphire');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('5-topaz',5,'Topaz');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('6-crystal',6,'Crystal');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('6-diamond',6,'Diamond');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('6-emerald',6,'Emerald');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('6-jade',6,'Jade');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('6-pearl',6,'Pearl');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('6-ruby',6,'Ruby');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('6-sapphire',6,'Sapphire');
INSERT OR IGNORE INTO classes(id,year,name) VALUES('6-topaz',6,'Topaz');
-- Expected verification: 50 total; each Tahap 2 year has exactly 8 classes.
