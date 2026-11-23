ALTER TABLE registration_2027_students ADD COLUMN guardian_email TEXT NOT NULL DEFAULT '';
ALTER TABLE registration_2027_students ADD COLUMN preschool_agency TEXT NOT NULL DEFAULT '';
CREATE TABLE registration_2027_transfers (
 id INTEGER PRIMARY KEY, student_uid TEXT NOT NULL, student_name TEXT NOT NULL,
 from_class TEXT NOT NULL, to_class TEXT NOT NULL, actor_email TEXT NOT NULL,
 at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER registration_2027_log_transfer AFTER UPDATE OF class_name ON registration_2027_students
WHEN OLD.class_name <> NEW.class_name
BEGIN
 INSERT INTO registration_2027_transfers(student_uid,student_name,from_class,to_class,actor_email)
 VALUES(NEW.uid, NEW.name, OLD.class_name, NEW.class_name, NEW.updated_by);
END;
