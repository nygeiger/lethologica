ALTER TABLE lists
ADD COLUMN created_at timestamptz DEFAULT NOW();