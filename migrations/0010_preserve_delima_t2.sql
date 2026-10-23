-- Preserve legacy Year 4/5 Navigator DELIMa records after splitting stage-specific categories.
-- Never overwrite an already populated Tahap 2 category. Legacy source remains archived.
INSERT INTO drafts(class_id,category_id,names_json,version,updated_at,updated_by,editor_role,edit_note)
SELECT d.class_id,'delima-tokoh-t2',d.names_json,d.version,d.updated_at,
'legacy/system','system','Migrasi rekod DELIMa daripada kategori lama'
FROM drafts d JOIN classes c ON c.id=d.class_id
WHERE d.category_id='delima' AND c.year IN (4,5)
AND NOT EXISTS (SELECT 1 FROM drafts x WHERE x.class_id=d.class_id AND x.category_id='delima-tokoh-t2');
