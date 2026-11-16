-- Portal Pendaftaran Tahun 1 2027 — 9 guru kelas, foto pasport dan paparan ibu bapa.
-- Carian murid untuk ibu bapa DINYAHAKTIF secara lalai demi privasi murid.
CREATE TABLE IF NOT EXISTS registration_2027_teachers (
 class_name TEXT PRIMARY KEY CHECK(class_name IN ('Emerald','Ruby','Sapphire','Diamond','Jade','Crystal','Topaz','Amber','Pearl')),
 teacher_name TEXT NOT NULL,
 photo_data_url TEXT,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_by TEXT NOT NULL DEFAULT 'system'
);
INSERT OR IGNORE INTO registration_2027_teachers (class_name,teacher_name) VALUES
 ('Emerald','Kamelia Nur Binti Raisin'),
 ('Ruby','Airin Bin Alin'),
 ('Sapphire','Ahmad Rifa’I Bin Syamsuddin'),
 ('Topaz','Raisah Sandau'),
 ('Diamond','Hayati Binti Abdul Rahim'),
 ('Jade','Nur Ainun Arinah Binti Ramlee'),
 ('Pearl','Nurul Umaierah Binti Abdul Rapi'),
 ('Crystal','Nur Amalina Binti Mali'),
 ('Amber','Mazniza Binti Mahadzir');
CREATE TABLE IF NOT EXISTS registration_2027_public_settings (
 id INTEGER PRIMARY KEY CHECK(id=1),
 parent_lookup_enabled INTEGER NOT NULL DEFAULT 0 CHECK(parent_lookup_enabled IN (0,1)),
 admin_phone TEXT NOT NULL DEFAULT '',
 updated_by TEXT NOT NULL DEFAULT 'system',
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO registration_2027_public_settings(id,parent_lookup_enabled,admin_phone) VALUES(1,0,'');
CREATE TABLE IF NOT EXISTS registration_2027_parent_limits (
 token TEXT PRIMARY KEY,
 hits INTEGER NOT NULL DEFAULT 0 CHECK(hits>=0),
 expires_at INTEGER NOT NULL
);
