-- MaPeM subject award restructuring. Years 1–3: 6 subjects x 5 names.
-- Years 4–5: same 6 subjects plus Sejarah, 1 name per subject per year.
-- Do not guess each student's subject from generic legacy entries.
-- Precondition protects any data inserted since aggregate production audit.
CREATE TABLE IF NOT EXISTS subject_restructure_verified (
 id INTEGER PRIMARY KEY CHECK (id=1)
);
INSERT INTO subject_restructure_verified(id)
SELECT CASE WHEN
 NOT EXISTS (SELECT 1 FROM drafts WHERE category_id='matapelajaran' AND json_array_length(names_json)>0)
 AND NOT EXISTS (SELECT 1 FROM nominations WHERE category_id='matapelajaran' AND json_array_length(names_json)>0)
 AND NOT EXISTS (SELECT 1 FROM publications WHERE json_type(snapshot_json,'$.matapelajaran')='array' AND json_array_length(json_extract(snapshot_json,'$.matapelajaran'))>0)
 AND NOT EXISTS (SELECT 1 FROM drafts d JOIN classes c ON c.id=d.class_id WHERE d.category_id='uasa' AND c.year IN (1,2) AND json_array_length(d.names_json)>0)
 AND NOT EXISTS (SELECT 1 FROM publications p JOIN classes c ON c.id=p.class_id WHERE c.year IN (1,2) AND json_type(p.snapshot_json,'$.uasa')='array' AND json_array_length(json_extract(p.snapshot_json,'$.uasa'))>0)
 THEN 1 ELSE 0 END;

-- Preserve access for already assigned specialist users. The original
-- 'matapelajaran' assignment remains archived in the database.
INSERT OR IGNORE INTO category_assignments(email,category_id,assigned_by,tahap,updated_at)
SELECT old.email,s.id,old.assigned_by,old.tahap,old.updated_at
FROM category_assignments old
CROSS JOIN (
 SELECT 'subjek-bm' AS id UNION ALL
 SELECT 'subjek-bi' UNION ALL
 SELECT 'subjek-mt' UNION ALL
 SELECT 'subjek-sn' UNION ALL
 SELECT 'subjek-pai' UNION ALL
 SELECT 'subjek-pm' UNION ALL
 SELECT 'subjek-sej'
) s
WHERE old.category_id='matapelajaran' AND (s.id!='subjek-sej' OR old.tahap IN (0,2));
