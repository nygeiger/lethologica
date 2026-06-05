CREATE TABLE user_word_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  word_id int NOT NULL,
  ease_factor numeric(4,2) DEFAULT 2.5,
  interval_days int DEFAULT 1,
  next_review_at timestamptz DEFAULT NOW() + INTERVAL '1 day',
  last_reviewed_at timestamptz,
  times_reviewed int DEFAULT 0,
  times_correct int DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_word_id FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_word UNIQUE (user_id, word_id)
);