-- Add durable append-only server-side audit activity for all award corrections.
-- Audit content may contain student names and must be accessible ONLY to authenticated admins.
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  class_id TEXT,
  category_id TEXT,
  details_json TEXT NOT NULL DEFAULT '{}',
  before_json TEXT,
  after_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_date ON activity_logs(id DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_class ON activity_logs(class_id,id DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor ON activity_logs(actor_email,id DESC);

-- Copy historical Tahap 2 specialist values to newly separated category IDs.
-- Keep original rows unchanged for archival/reconciliation. Do not overwrite
-- any existing newer categories or published snapshots.
INSERT OR IGNORE INTO drafts(class_id,category_id,names_json,version,updated_at)
SELECT class_id,'uasa-t2',names_json,version,updated_at FROM drafts
WHERE category_id='uasa' AND substr(class_id,1,1) IN ('4','5');
INSERT OR IGNORE INTO drafts(class_id,category_id,names_json,version,updated_at)
SELECT class_id,'matapelajaran-t2',names_json,version,updated_at FROM drafts
WHERE category_id='matapelajaran' AND substr(class_id,1,1) IN ('4','5');
INSERT OR IGNORE INTO drafts(class_id,category_id,names_json,version,updated_at)
SELECT class_id,'delima-tokoh-t2',names_json,version,updated_at FROM drafts
WHERE category_id='delima' AND substr(class_id,1,1) IN ('4','5');

INSERT OR IGNORE INTO final_reviews(class_id,category_id,version,confirmed_by,confirmed_at)
SELECT class_id,'uasa-t2',version,confirmed_by,confirmed_at FROM final_reviews
WHERE category_id='uasa' AND substr(class_id,1,1) IN ('4','5');
INSERT OR IGNORE INTO final_reviews(class_id,category_id,version,confirmed_by,confirmed_at)
SELECT class_id,'matapelajaran-t2',version,confirmed_by,confirmed_at FROM final_reviews
WHERE category_id='matapelajaran' AND substr(class_id,1,1) IN ('4','5');
INSERT OR IGNORE INTO final_reviews(class_id,category_id,version,confirmed_by,confirmed_at)
SELECT class_id,'delima-tokoh-t2',version,confirmed_by,confirmed_at FROM final_reviews
WHERE category_id='delima' AND substr(class_id,1,1) IN ('4','5');

-- Preserve snapshots for already published classes when awards change IDs.
UPDATE publications SET snapshot_json=json_remove(
  json_set(snapshot_json,'$."uasa-t2"',json_extract(snapshot_json,'$.uasa')),
  '$.uasa'
) WHERE substr(class_id,1,1) IN ('4','5')
  AND json_type(snapshot_json,'$.uasa') IS NOT NULL
  AND json_type(snapshot_json,'$."uasa-t2"') IS NULL;

UPDATE publications SET snapshot_json=json_remove(
  json_set(snapshot_json,'$."matapelajaran-t2"',json_extract(snapshot_json,'$.matapelajaran')),
  '$.matapelajaran'
) WHERE substr(class_id,1,1) IN ('4','5')
  AND json_type(snapshot_json,'$.matapelajaran') IS NOT NULL
  AND json_type(snapshot_json,'$."matapelajaran-t2"') IS NULL;

UPDATE publications SET snapshot_json=json_remove(
  json_set(snapshot_json,'$."delima-tokoh-t2"',json_extract(snapshot_json,'$.delima')),
  '$.delima'
) WHERE substr(class_id,1,1) IN ('4','5')
  AND json_type(snapshot_json,'$.delima') IS NOT NULL
  AND json_type(snapshot_json,'$."delima-tokoh-t2"') IS NULL;

-- Existing Tahap 1 PLAN/M.A.W.A.R rows stay untouched; unmatched historical
-- categories remain archived, because there is no reliable category mapping.
