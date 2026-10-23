-- MaPeM subject award restructuring. Years 1–3: 6 subjects x 5 names.
-- Years 4–5: same 6 subjects plus Sejarah, 1 name per subject per year.
-- Do not guess each student's subject from generic legacy entries.
-- Precondition protects any data inserted since aggregate production audit.
CREATE TABLE IF NOT EXISTS subject_restructure_verified (
 id INTEGER PRIMARY KEY CHECK (id=1)
);
INSERT OR REPLACE INTO subject_restructure_verified(id)
SELECT CASE WHEN
 NOT EXISTS (SELECT 1 FROM drafts WHERE category_id='matapelajaran' AND json_array_length(names_json)>0)
 AND NOT EXISTS (SELECT 1 FROM nominations WHERE category_id='matapelajaran' AND json_array_length(names_json)>0)
 AND NOT EXISTS (SELECT 1 FROM publications WHERE json_type(snapshot_json,'$.matapelajaran')='array' AND json_array_length(json_extract(snapshot_json,'$.matapelajaran'))>0)
 AND NOT EXISTS (SELECT 1 FROM drafts d JOIN classes c ON c.id=d.class_id WHERE d.category_id='uasa' AND c.year IN (1,2) AND json_array_length(d.names_json)>0)
 AND NOT EXISTS (SELECT 1 FROM publications p JOIN classes c ON c.id=p.class_id WHERE c.year IN (1,2) AND json_type(p.snapshot_json,'$.uasa')='array' AND json_array_length(json_extract(p.snapshot_json,'$.uasa'))>0)
 THEN 1 ELSE 0 END;

-- Preserve access for already-assigned subject specialists. Avoid SQLite
-- compound SELECT (UNION) syntax because Cloudflare D1 migration runner may
-- exceed its compound SELECT term limit for prepared remote migrations.
-- Each simple statement is idempotent, and a Tahap 1 assignment must not
-- grant access to Sejarah (Tahap 2 only).
INSERT OR IGNORE INTO category_assignments(email,category_id,assigned_by,tahap,updated_at)
SELECT email,'subjek-bm',assigned_by,tahap,updated_at
FROM category_assignments
WHERE category_id='matapelajaran';

INSERT OR IGNORE INTO category_assignments(email,category_id,assigned_by,tahap,updated_at)
SELECT email,'subjek-bi',assigned_by,tahap,updated_at
FROM category_assignments
WHERE category_id='matapelajaran';

INSERT OR IGNORE INTO category_assignments(email,category_id,assigned_by,tahap,updated_at)
SELECT email,'subjek-mt',assigned_by,tahap,updated_at
FROM category_assignments
WHERE category_id='matapelajaran';

INSERT OR IGNORE INTO category_assignments(email,category_id,assigned_by,tahap,updated_at)
SELECT email,'subjek-sn',assigned_by,tahap,updated_at
FROM category_assignments
WHERE category_id='matapelajaran';

INSERT OR IGNORE INTO category_assignments(email,category_id,assigned_by,tahap,updated_at)
SELECT email,'subjek-pai',assigned_by,tahap,updated_at
FROM category_assignments
WHERE category_id='matapelajaran';

INSERT OR IGNORE INTO category_assignments(email,category_id,assigned_by,tahap,updated_at)
SELECT email,'subjek-pm',assigned_by,tahap,updated_at
FROM category_assignments
WHERE category_id='matapelajaran';

INSERT OR IGNORE INTO category_assignments(email,category_id,assigned_by,tahap,updated_at)
SELECT email,'subjek-sej',assigned_by,tahap,updated_at
FROM category_assignments
WHERE category_id='matapelajaran' AND tahap IN (0,2);
