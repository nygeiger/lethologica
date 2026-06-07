CREATE TABLE lists(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    list_name text NOT NULL,
    owner_id uuid NOT NULL,
    CONSTRAINT fk_owner_id FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_owner_listName UNIQUE (list_name, owner_id)
);