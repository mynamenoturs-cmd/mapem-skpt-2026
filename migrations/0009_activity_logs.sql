-- Activity trail for MaPeM data corrections. Never touches existing draft values.
-- Actor is derived from authenticated Google session by the API (not client input).
ALTER TABLE drafts ADD COLUMN updated_by TEXT NOT NULL DEFAULT '';
ALTER TABLE drafts ADD COLUMN editor_role TEXT NOT NULL DEFAULT '';
ALTER TABLE drafts ADD COLUMN edit_note TEXT NOT NULL DEFAULT '';
ALTER TABLE nominations ADD COLUMN updated_by TEXT NOT NULL DEFAULT '';
ALTER TABLE nominations ADD COLUMN editor_role TEXT NOT NULL DEFAULT '';
ALTER TABLE nominations ADD COLUMN edit_note TEXT NOT NULL DEFAULT '';

-- Legacy category assignments apply to both stages until reassigned;
-- new delegated assignments can be restricted to Tahap 1 or 2.
ALTER TABLE category_assignments ADD COLUMN tahap INTEGER NOT NULL DEFAULT 0 CHECK(tahap IN (0,1,2));

CREATE TABLE IF NOT EXISTS activity_logs (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 actor_email TEXT NOT NULL,
 actor_role TEXT NOT NULL,
 action TEXT NOT NULL,
 class_id TEXT,
 category_id TEXT,
 before_json TEXT,
 after_json TEXT,
 note TEXT NOT NULL DEFAULT '',
 source_table TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_date ON activity_logs(id DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_class ON activity_logs(class_id,id DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor ON activity_logs(actor_email,id DESC);

-- SQL triggers ensure the audit entry is committed in the very same SQLite
-- transaction as the student-name edit, including removals and clears.
CREATE TRIGGER IF NOT EXISTS log_drafts_insert AFTER INSERT ON drafts
BEGIN
 INSERT INTO activity_logs(actor_email,actor_role,action,class_id,category_id,before_json,after_json,note,source_table)
 VALUES (COALESCE(NULLIF(NEW.updated_by,''),'legacy/system'),
 COALESCE(NULLIF(NEW.editor_role,''),'system'),'isi_nama',NEW.class_id,NEW.category_id,'[]',NEW.names_json,NEW.edit_note,'drafts');
END;
CREATE TRIGGER IF NOT EXISTS log_drafts_update AFTER UPDATE OF names_json ON drafts
WHEN OLD.names_json <> NEW.names_json
BEGIN
 INSERT INTO activity_logs(actor_email,actor_role,action,class_id,category_id,before_json,after_json,note,source_table)
 VALUES (COALESCE(NULLIF(NEW.updated_by,''),'legacy/system'),
 COALESCE(NULLIF(NEW.editor_role,''),'system'),
 CASE WHEN json_array_length(NEW.names_json)=0 THEN 'kosongkan_nama'
      WHEN json_array_length(NEW.names_json)<json_array_length(OLD.names_json) THEN 'padam_nama'
      ELSE 'kemas_kini_nama' END,
 NEW.class_id,NEW.category_id,OLD.names_json,NEW.names_json,NEW.edit_note,'drafts');
END;
CREATE TRIGGER IF NOT EXISTS log_nominations_insert AFTER INSERT ON nominations
BEGIN
 INSERT INTO activity_logs(actor_email,actor_role,action,class_id,category_id,before_json,after_json,note,source_table)
 VALUES (COALESCE(NULLIF(NEW.updated_by,''),'legacy/system'),
 COALESCE(NULLIF(NEW.editor_role,''),'system'),'isi_pencalonan',NEW.class_id,NEW.category_id,'[]',NEW.names_json,NEW.edit_note,'nominations');
END;
CREATE TRIGGER IF NOT EXISTS log_nominations_update AFTER UPDATE OF names_json ON nominations
WHEN OLD.names_json <> NEW.names_json
BEGIN
 INSERT INTO activity_logs(actor_email,actor_role,action,class_id,category_id,before_json,after_json,note,source_table)
 VALUES (COALESCE(NULLIF(NEW.updated_by,''),'legacy/system'),
 COALESCE(NULLIF(NEW.editor_role,''),'system'),
 CASE WHEN json_array_length(NEW.names_json)=0 THEN 'kosongkan_pencalonan'
      WHEN json_array_length(NEW.names_json)<json_array_length(OLD.names_json) THEN 'padam_pencalonan'
      ELSE 'kemas_kini_pencalonan' END,
 NEW.class_id,NEW.category_id,OLD.names_json,NEW.names_json,NEW.edit_note,'nominations');
END;
