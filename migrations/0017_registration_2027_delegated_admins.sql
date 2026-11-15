-- Delegated administrators are limited to the 2027 registration system.
-- MaPeM admin privileges are not modified by granting registration access.
CREATE TABLE IF NOT EXISTS registration_2027_admins (
 email TEXT PRIMARY KEY COLLATE NOCASE,
 granted_by TEXT NOT NULL,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS registration_2027_admin_audit (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 actor_email TEXT NOT NULL,
 target_email TEXT NOT NULL,
 action TEXT NOT NULL CHECK(action IN ('grant','revoke')),
 at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_registration_2027_admin_audit_at ON registration_2027_admin_audit(at);
