ALTER TABLE list_shares RENAME COLUMN permission TO role;
ALTER TABLE list_shares DROP CONSTRAINT IF EXISTS list_shares_permission_check;
ALTER TABLE list_shares
ADD CONSTRAINT list_shares_role_check CHECK (role IN ('viewer', 'editor'));