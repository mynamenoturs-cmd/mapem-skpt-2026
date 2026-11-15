-- One-time, short-lived bridge tickets for a dedicated registration hostname.
-- Tickets never contain student data and are redeemed only once.
CREATE TABLE IF NOT EXISTS registration_2027_login_transfers (
 code_hash TEXT PRIMARY KEY,
 user_sub TEXT NOT NULL REFERENCES users(sub) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_registration_2027_login_transfers_expiry ON registration_2027_login_transfers(expires_at);
