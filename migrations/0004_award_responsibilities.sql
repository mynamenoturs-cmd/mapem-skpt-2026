-- Preserve existing recipients. Class nominations are stored separately from final awards.
CREATE TABLE IF NOT EXISTS nominations (
 class_id TEXT NOT NULL REFERENCES classes(id),
 category_id TEXT NOT NULL,
 names_json TEXT NOT NULL DEFAULT '[]',
 version INTEGER NOT NULL DEFAULT 1,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(class_id,category_id)
);
CREATE TABLE IF NOT EXISTS category_assignments (
 email TEXT NOT NULL,
 category_id TEXT NOT NULL,
 assigned_by TEXT NOT NULL,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(email,category_id)
);
CREATE TABLE IF NOT EXISTS final_reviews (
 class_id TEXT NOT NULL REFERENCES classes(id),
 category_id TEXT NOT NULL,
 version INTEGER NOT NULL,
 confirmed_by TEXT NOT NULL,
 confirmed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(class_id,category_id)
);
