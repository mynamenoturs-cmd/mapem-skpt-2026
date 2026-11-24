-- One-time correction for the roster confirmed on 24 November. New registrations
-- still start with empty demographics. D1 applies the migration atomically.
CREATE TABLE registration_2027_confirmed_0026 (uid TEXT PRIMARY KEY);
INSERT INTO registration_2027_confirmed_0026(uid)
SELECT uid FROM registration_2027_students
WHERE agama='' AND (
  SELECT COUNT(*)=408 AND SUM(agama='')=379 AND SUM(agama='Bukan Muslim')=29
    AND SUM(agama='Bukan Muslim' AND class_name='Ruby')=14
    AND SUM(agama='Bukan Muslim' AND class_name='Sapphire')=15
    AND SUM(agama='' AND class_name IN ('Ruby','Sapphire'))=63
    AND MAX(created_at)<='2026-11-24 14:23:00'
  FROM registration_2027_students
);
INSERT INTO registration_2027_audit(actor_email,action,student_uid,class_name)
SELECT 'migration:0026','update',uid,class_name FROM registration_2027_students
WHERE uid IN (SELECT uid FROM registration_2027_confirmed_0026);
UPDATE registration_2027_students
SET agama='Muslim',version=version+1,updated_at=CURRENT_TIMESTAMP,updated_by='migration:0026'
WHERE uid IN (SELECT uid FROM registration_2027_confirmed_0026);
DROP TABLE registration_2027_confirmed_0026;
