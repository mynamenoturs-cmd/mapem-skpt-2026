-- MaPeM: multiple independent public announcements instead of a single editable row.
-- Preserve the existing announcement as the first item (published or draft).
-- Never delete the legacy record or expose staff identity on the public endpoint.
CREATE TABLE IF NOT EXISTS portal_announcements (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 title TEXT NOT NULL CHECK(length(title)<=120),
 body TEXT NOT NULL CHECK(length(body)<=3000),
 enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
 pinned INTEGER NOT NULL DEFAULT 0 CHECK(pinned IN (0,1)),
 version INTEGER NOT NULL DEFAULT 1 CHECK(version>=1),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_by TEXT NOT NULL DEFAULT '',
 deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_portal_announcements_public ON portal_announcements(enabled,deleted_at,pinned,updated_at);
CREATE INDEX IF NOT EXISTS idx_portal_announcements_latest ON portal_announcements(deleted_at,updated_at DESC);
-- id=1 holds only the original notice, so the migration is idempotent.
INSERT OR IGNORE INTO portal_announcements(id,title,body,enabled,pinned,version,created_at,updated_at,updated_by)
SELECT 1,title,body,enabled,0,CASE WHEN version>0 THEN version ELSE 1 END,
 strftime('%Y-%m-%dT%H:%M:%fZ',updated_at),strftime('%Y-%m-%dT%H:%M:%fZ',updated_at),'system/legacy-migration'
FROM portal_announcement
WHERE id=1 AND (trim(title)<>'' OR trim(body)<>'');

-- Keep a durable before/after trail for every notice. Actor comes from Google session.
CREATE TRIGGER IF NOT EXISTS audit_public_announcement_created AFTER INSERT ON portal_announcements
WHEN NEW.updated_by <> 'system/legacy-migration'
BEGIN
 INSERT INTO activity_logs(actor_email,actor_role,action,class_id,category_id,before_json,after_json,note,source_table)
 VALUES(NEW.updated_by,'admin','pengumuman_dicipta',NULL,'announcement:'||NEW.id,NULL,
 json_array(NEW.title,NEW.body),
 CASE WHEN NEW.enabled=1 THEN 'Terbit' ELSE 'Draf' END,'portal_announcements');
END;
CREATE TRIGGER IF NOT EXISTS audit_public_announcement_updated AFTER UPDATE ON portal_announcements
WHEN OLD.title<>NEW.title OR OLD.body<>NEW.body OR OLD.enabled<>NEW.enabled
 OR OLD.pinned<>NEW.pinned OR (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
BEGIN
 INSERT INTO activity_logs(actor_email,actor_role,action,class_id,category_id,before_json,after_json,note,source_table)
 VALUES(NEW.updated_by,'admin',
 CASE WHEN NEW.deleted_at IS NOT NULL THEN 'pengumuman_dipadam'
      WHEN OLD.enabled<>NEW.enabled AND NEW.enabled=1 THEN 'pengumuman_diterbitkan'
      WHEN OLD.enabled<>NEW.enabled AND NEW.enabled=0 THEN 'pengumuman_disembunyikan'
      WHEN OLD.pinned<>NEW.pinned THEN 'pengumuman_pin_diubah'
      ELSE 'pengumuman_disunting' END,
 NULL,'announcement:'||NEW.id,json_array(OLD.title,OLD.body),
 json_array(NEW.title,NEW.body),NEW.updated_by,'portal_announcements');
END;
