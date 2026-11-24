ALTER TABLE registration_2027_admins ADD COLUMN role TEXT NOT NULL DEFAULT 'admin'
 CHECK(role IN ('admin','viewer'));
