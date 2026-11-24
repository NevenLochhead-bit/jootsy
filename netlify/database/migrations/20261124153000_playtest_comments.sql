CREATE TABLE playtest_comments (
  id uuid PRIMARY KEY,
  seq bigint GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
  world_id uuid NOT NULL REFERENCES worlds(id),
  card_id uuid NOT NULL REFERENCES cards(id),
  player_id uuid NOT NULL REFERENCES players(id),
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 40),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX playtest_comments_world_sequence ON playtest_comments(world_id, seq DESC);
CREATE INDEX playtest_comments_card_sequence ON playtest_comments(world_id, card_id, seq DESC);
CREATE INDEX playtest_comments_player_time ON playtest_comments(player_id, created_at DESC);
