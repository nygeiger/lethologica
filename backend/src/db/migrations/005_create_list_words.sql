CREATE TABLE list_words(
  list_id uuid NOT NULL,
  word_id int NOT NULL,
  PRIMARY KEY (list_id, word_id),
  CONSTRAINT fk_list_id FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
  CONSTRAINT fk_word_id FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);