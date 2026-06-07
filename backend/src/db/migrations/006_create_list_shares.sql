CREATE TABLE list_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL,
  shared_with_user_id uuid NOT NULL,
  permission text NOT NULL CHECK (permission IN ('viewer', 'editor')),
  created_at timestamptz DEFAULT NOW(),
  CONSTRAINT fk_list_id FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
  CONSTRAINT fk_shared_with FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_list_share UNIQUE (list_id, shared_with_user_id)
);