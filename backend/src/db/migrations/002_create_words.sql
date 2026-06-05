CREATE TABLE words(
  id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  word text NOT NULL UNIQUE,
  def text NOT NULL,
  example text NOT NULL,
  pronunciation_url text
);