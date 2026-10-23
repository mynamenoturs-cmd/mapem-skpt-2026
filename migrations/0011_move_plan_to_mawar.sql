-- Verified one-time correction: 30 existing PLaN recipients were recorded under
-- the wrong award category. Original class/year membership is preserved.
-- Expected by year: Year 2=10, Year 3=14, Year 4=2, Year 5=4.
-- Guard fails before changing any personal records if actual contents differ.
CREATE TABLE IF NOT EXISTS plan_mawar_migration_guard (
 id INTEGER PRIMARY KEY CHECK (id=1)
);
INSERT INTO plan_mawar_migration_guard(id)
SELECT CASE WHEN
  (SELECT COALESCE(SUM(json_array_length(d.names_json)),0)
    FROM drafts d WHERE d.category_id='plan')=30
  AND (SELECT COALESCE(SUM(json_array_length(d.names_json)),0)
    FROM drafts d JOIN classes c ON c.id=d.class_id
    WHERE d.category_id='plan' AND c.year=2)=10
  AND (SELECT COALESCE(SUM(json_array_length(d.names_json)),0)
    FROM drafts d JOIN classes c ON c.id=d.class_id
    WHERE d.category_id='plan' AND c.year=3)=14
  AND (SELECT COALESCE(SUM(json_array_length(d.names_json)),0)
    FROM drafts d JOIN classes c ON c.id=d.class_id
    WHERE d.category_id='plan' AND c.year=4)=2
  AND (SELECT COALESCE(SUM(json_array_length(d.names_json)),0)
    FROM drafts d JOIN classes c ON c.id=d.class_id
    WHERE d.category_id='plan' AND c.year=5)=4
  AND NOT EXISTS (SELECT 1 FROM drafts WHERE category_id='mawar-lonjakan')
  AND NOT EXISTS (
    SELECT 1 FROM publications p
    WHERE json_type(p.snapshot_json,'$.plan')='array'
      AND json_array_length(json_extract(p.snapshot_json,'$.plan'))>0
  )
  AND NOT EXISTS (
    SELECT 1 FROM nominations n WHERE n.category_id='plan' AND json_array_length(n.names_json)>0
  )
THEN 1 ELSE 0 END;

-- Confidential safety archive: kept only in Cloudflare D1, never in GitHub.
CREATE TABLE IF NOT EXISTS award_reassignment_archive (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 class_id TEXT NOT NULL,
 source_category TEXT NOT NULL,
 destination_category TEXT NOT NULL,
 names_json TEXT NOT NULL,
 source_version INTEGER NOT NULL,
 original_updated_at TEXT,
 original_updated_by TEXT,
 moved_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 reason TEXT NOT NULL,
 UNIQUE(class_id,source_category,destination_category)
);
INSERT INTO award_reassignment_archive
 (class_id,source_category,destination_category,names_json,source_version,original_updated_at,original_updated_by,reason)
SELECT d.class_id,'plan','mawar-lonjakan',d.names_json,d.version,d.updated_at,d.updated_by,
 'Arahan urus setia: pembetulan 30 penerima PLaN ke Anugerah Pencapaian Lonjakan Akademik M.A.W.A.R'
FROM drafts d JOIN classes c ON c.id=d.class_id
WHERE d.category_id='plan' AND c.year IN (2,3,4,5)
  AND json_array_length(d.names_json)>0;

-- Add the same names to their original class/year under the correct category.
INSERT INTO drafts
 (class_id,category_id,names_json,version,updated_at,updated_by,editor_role,edit_note)
SELECT class_id,'mawar-lonjakan',names_json,1,datetime('now'),'system/approved-migration',
 'system','Pemindahan PLaN ke Lonjakan Akademik M.A.W.A.R; salinan asal disimpan dalam arkib'
FROM award_reassignment_archive
WHERE source_category='plan' AND destination_category='mawar-lonjakan';

-- Clear the original PLaN records without deleting their audit history or row versions.
-- SQL triggers automatically log before/after and the system migration identity.
UPDATE drafts
SET names_json='[]',version=version+1,updated_at=datetime('now'),
 updated_by='system/approved-migration',editor_role='system',
 edit_note='30 nama PLaN dipindahkan ke M.A.W.A.R mengikut Tahun 2=10,3=14,4=2,5=4'
WHERE category_id='plan' AND json_array_length(names_json)>0
AND EXISTS (SELECT 1 FROM award_reassignment_archive a
 WHERE a.class_id=drafts.class_id
 AND a.source_category='plan' AND a.destination_category='mawar-lonjakan');

-- Post-condition: restored 30 names by original year and cleared all PLaN names.
CREATE TABLE IF NOT EXISTS plan_mawar_migration_verified (
 id INTEGER PRIMARY KEY CHECK (id=1)
);
INSERT INTO plan_mawar_migration_verified(id)
SELECT CASE WHEN
 (SELECT COALESCE(SUM(json_array_length(names_json)),0) FROM drafts WHERE category_id='plan')=0
 AND (SELECT COALESCE(SUM(json_array_length(names_json)),0) FROM drafts WHERE category_id='mawar-lonjakan')=30
 AND (SELECT COALESCE(SUM(json_array_length(d.names_json)),0) FROM drafts d JOIN classes c ON c.id=d.class_id WHERE d.category_id='mawar-lonjakan' AND c.year=2)=10
 AND (SELECT COALESCE(SUM(json_array_length(d.names_json)),0) FROM drafts d JOIN classes c ON c.id=d.class_id WHERE d.category_id='mawar-lonjakan' AND c.year=3)=14
 AND (SELECT COALESCE(SUM(json_array_length(d.names_json)),0) FROM drafts d JOIN classes c ON c.id=d.class_id WHERE d.category_id='mawar-lonjakan' AND c.year=4)=2
 AND (SELECT COALESCE(SUM(json_array_length(d.names_json)),0) FROM drafts d JOIN classes c ON c.id=d.class_id WHERE d.category_id='mawar-lonjakan' AND c.year=5)=4
 AND (SELECT COALESCE(SUM(json_array_length(names_json)),0) FROM award_reassignment_archive WHERE source_category='plan' AND destination_category='mawar-lonjakan')=30
THEN 1 ELSE 0 END;
