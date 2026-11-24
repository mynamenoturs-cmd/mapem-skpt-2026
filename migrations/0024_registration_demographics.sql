ALTER TABLE registration_2027_students ADD COLUMN jantina TEXT NOT NULL DEFAULT '';
ALTER TABLE registration_2027_students ADD COLUMN agama TEXT NOT NULL DEFAULT '';
ALTER TABLE registration_2027_students ADD COLUMN warga TEXT NOT NULL DEFAULT '';
ALTER TABLE registration_2027_students ADD COLUMN bangsa TEXT NOT NULL DEFAULT '';
ALTER TABLE registration_2027_audit ADD COLUMN student_name TEXT;
CREATE INDEX registration_2027_deleted_by_class ON registration_2027_audit(action,class_name,id);
