-- Cerdas PLaN is ONE award, with TWO recipient groups:
-- 3 Murid PLaN + 3 Murid Pemulihan Khas, across BOTH stages together.
-- Historical wrong award entries were already moved to mawar-lonjakan by 0011.
-- This migration never moves student names or touches PBD/MAWAR records.
--
-- Preserve permissions for teachers already assigned to the original PLaN award.
-- Tahap constraints remain exactly as originally assigned; admin can grant
-- across both stages using the existing stage=0 assignment.
UPDATE category_assignments SET tahap=0 WHERE category_id IN ('plan','plan-pemulihan') AND tahap!=0;
INSERT OR IGNORE INTO category_assignments(email,category_id,assigned_by,tahap,updated_at)
SELECT email,'plan-pemulihan',assigned_by,0,updated_at
FROM category_assignments WHERE category_id='plan';
