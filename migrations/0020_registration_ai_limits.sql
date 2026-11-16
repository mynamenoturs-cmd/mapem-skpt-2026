-- Had penggunaan pembantu AI Tahun 1: tidak menyimpan soalan atau jawapan.
-- Permintaan AI dihadkan mengikut UTC untuk mengelakkan pembaziran kuota percuma.
CREATE TABLE IF NOT EXISTS registration_2027_ai_limits (
  counter_key TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK(request_count>=0),
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reg2027_ai_limits_expiry
 ON registration_2027_ai_limits(expires_at);
