-- Editable award display names, without changing stable IDs or recipient data.
-- Never use the text title as an award foreign key.
CREATE TABLE IF NOT EXISTS award_title_overrides (
 category_id TEXT PRIMARY KEY,
 title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 3 AND 130),
 version INTEGER NOT NULL DEFAULT 1 CHECK(version > 0),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_by TEXT NOT NULL,
 reason TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_award_title_updated_at ON award_title_overrides(updated_at DESC);
-- A log row is inserted as part of exactly the same SQL transaction as the rename.
CREATE TRIGGER IF NOT EXISTS audit_award_title_created AFTER INSERT ON award_title_overrides
BEGIN
 INSERT INTO activity_logs(actor_email,actor_role,action,class_id,category_id,before_json,after_json,note,source_table)
 VALUES(NEW.updated_by,'admin','tukar_nama_anugerah',NULL,NEW.category_id,NULL,
        json_array(NEW.title),NEW.reason,'award_title_overrides');
END;
CREATE TRIGGER IF NOT EXISTS audit_award_title_changed AFTER UPDATE OF title ON award_title_overrides
WHEN OLD.title <> NEW.title
BEGIN
 INSERT INTO activity_logs(actor_email,actor_role,action,class_id,category_id,before_json,after_json,note,source_table)
 VALUES(NEW.updated_by,'admin','tukar_nama_anugerah',NULL,NEW.category_id,
        json_array(OLD.title),json_array(NEW.title),NEW.reason,'award_title_overrides');
END;
