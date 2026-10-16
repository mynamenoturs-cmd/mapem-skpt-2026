-- General event details only. Recipient access remains authenticated.
CREATE TABLE IF NOT EXISTS portal_event (
 id INTEGER PRIMARY KEY CHECK(id=1),
 content_json TEXT NOT NULL DEFAULT '{"title":"","date":"","time":"","venue":"","dresscode":"","schedule":"","guidance":""}',
 enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN(0,1)),
 version INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO portal_event(id) VALUES(1);
