-- Additional Google administrators; existing configured admins remain recovery owners.
-- This migration adds a table only and does not modify student data.
CREATE TABLE IF NOT EXISTS admin_grants (
  email TEXT PRIMARY KEY CHECK(email = lower(email)),
  granted_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
