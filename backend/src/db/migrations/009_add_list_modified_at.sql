ALTER TABLE lists
ADD COLUMN modified_at timestamptz NOT NULL DEFAULT NOW();

UPDATE lists
SET modified_at = created_at;

CREATE OR REPLACE FUNCTION touch_list_modified_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE lists
    SET modified_at = NOW()
  WHERE id = CASE
    WHEN TG_OP = 'DELETE' THEN OLD.list_id
    ELSE NEW.list_id
  END;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER list_words_touch_list_modified_at
AFTER INSERT OR DELETE ON list_words
FOR EACH ROW
EXECUTE FUNCTION touch_list_modified_at();

CREATE TRIGGER list_shares_touch_list_modified_at
AFTER INSERT OR UPDATE OR DELETE ON list_shares
FOR EACH ROW
EXECUTE FUNCTION touch_list_modified_at();

CREATE OR REPLACE FUNCTION update_modified_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.modified_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lists_modified_at
BEFORE UPDATE ON lists
FOR EACH ROW
EXECUTE FUNCTION update_modified_at();