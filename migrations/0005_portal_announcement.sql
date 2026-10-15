-- Public text only; no student data or credentials. Existing records untouched.
CREATE TABLE IF NOT EXISTS portal_announcement (
 id INTEGER PRIMARY KEY CHECK(id=1),
 title TEXT NOT NULL DEFAULT '',
 body TEXT NOT NULL DEFAULT '',
 enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
 version INTEGER NOT NULL DEFAULT 0,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO portal_announcement(id) VALUES(1);
