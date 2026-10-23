-- MaPeM Tahap 2 is YEAR 4 AND YEAR 5 only.
-- Remove unused Year 6 placeholder classes, without deleting or overwriting
-- any Year 6 class that already has drafts, nomination, teacher assignment,
-- final review or published student details. Referenced classes remain archived
-- in the database but are excluded from every live API/UI/export.
DELETE FROM classes
WHERE year=6
  AND NOT EXISTS (SELECT 1 FROM drafts d WHERE d.class_id=classes.id)
  AND NOT EXISTS (SELECT 1 FROM teacher_assignments t WHERE t.class_id=classes.id)
  AND NOT EXISTS (SELECT 1 FROM nominations n WHERE n.class_id=classes.id)
  AND NOT EXISTS (SELECT 1 FROM final_reviews r WHERE r.class_id=classes.id)
  AND NOT EXISTS (SELECT 1 FROM publications p WHERE p.class_id=classes.id);
