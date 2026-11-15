-- Pendaftaran Tahun 1 sesi 2027: jadual berasingan daripada data MaPeM 2026.
-- Data murid/penjaga hanya boleh dibaca melalui API selepas Google login dan kebenaran kelas.
CREATE TABLE IF NOT EXISTS registration_2027_access (
 email TEXT PRIMARY KEY COLLATE NOCASE,
 class_name TEXT NOT NULL CHECK(class_name IN ('Emerald','Ruby','Sapphire','Diamond','Jade','Crystal','Topaz','Amber','Pearl')),
 granted_by TEXT NOT NULL,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS registration_2027_students (
 uid TEXT PRIMARY KEY,
 student_id TEXT NOT NULL COLLATE NOCASE UNIQUE,
 class_name TEXT NOT NULL CHECK(class_name IN ('Emerald','Ruby','Sapphire','Diamond','Jade','Crystal','Topaz','Amber','Pearl')),
 name TEXT NOT NULL,
 pra TEXT NOT NULL CHECK(pra IN ('Ya','Tidak','Belum Pasti')),
 guardian_name TEXT NOT NULL,
 guardian_ic TEXT NOT NULL,
 guardian_phone TEXT NOT NULL,
 address TEXT NOT NULL,
 version INTEGER NOT NULL DEFAULT 1 CHECK(version>=1),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_by TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_registration_2027_class ON registration_2027_students(class_name,name);
CREATE TABLE IF NOT EXISTS registration_2027_audit (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 actor_email TEXT NOT NULL,
 action TEXT NOT NULL CHECK(action IN ('create','update','delete','grant','revoke')),
 student_uid TEXT,
 class_name TEXT,
 at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_registration_2027_audit_time ON registration_2027_audit(at);
