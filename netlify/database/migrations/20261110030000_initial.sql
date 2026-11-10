CREATE TABLE worlds (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text UNIQUE NOT NULL, name text NOT NULL,
 jootsy_ring integer NOT NULL DEFAULT 7, jootsy_min_cards integer NOT NULL DEFAULT 7,
 end_ring integer NOT NULL DEFAULT 11, jootsy_enabled boolean NOT NULL DEFAULT false,
 rev bigint NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE players (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), world_id uuid NOT NULL REFERENCES worlds(id),
 name text NOT NULL, name_key text NOT NULL, pass_hash text NOT NULL,
 is_instructor boolean NOT NULL DEFAULT false, token_version integer NOT NULL DEFAULT 0,
 rev bigint NOT NULL DEFAULT 0, last_seen_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(world_id,name_key)
);
CREATE TABLE cards (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), world_id uuid NOT NULL REFERENCES worlds(id),
 type text NOT NULL CHECK(type IN ('scenario','fork','destiny','dream','wormhole','dead_end','jootsy')),
 author_id uuid REFERENCES players(id), scenario_title text, body text NOT NULL CHECK(char_length(body) BETWEEN 1 AND 600),
 media_kind text CHECK(media_kind IN ('image','embed')), media_url text,
 parent_path_id uuid, depth integer NOT NULL CHECK(depth>=0), door_label text, target_card_id uuid REFERENCES cards(id),
 hidden boolean NOT NULL DEFAULT false, deleted boolean NOT NULL DEFAULT false,
 seq bigint GENERATED ALWAYS AS IDENTITY, rev bigint NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((type='scenario' AND parent_path_id IS NULL AND author_id IS NULL AND depth=0) OR (type<>'scenario' AND parent_path_id IS NOT NULL AND author_id IS NOT NULL))
);
CREATE TABLE paths (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), world_id uuid NOT NULL REFERENCES worlds(id),
 from_card_id uuid NOT NULL REFERENCES cards(id), label text NOT NULL CHECK(char_length(label) BETWEEN 1 AND 60),
 to_card_id uuid REFERENCES cards(id), created_by uuid REFERENCES players(id), position integer NOT NULL,
 claimed_by uuid REFERENCES players(id), claimed_until timestamptz, deleted boolean NOT NULL DEFAULT false,
 rev bigint NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), taken_at timestamptz,
 UNIQUE(from_card_id,position)
);
ALTER TABLE cards ADD CONSTRAINT cards_parent_path_fk FOREIGN KEY(parent_path_id) REFERENCES paths(id);
CREATE TABLE events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), world_id uuid NOT NULL REFERENCES worlds(id), type text NOT NULL,
 actor_id uuid REFERENCES players(id), target_player_id uuid REFERENCES players(id), card_id uuid REFERENCES cards(id),
 path_id uuid REFERENCES paths(id), rev bigint NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cards_world_rev ON cards(world_id,rev);
CREATE UNIQUE INDEX one_live_card_per_path ON cards(parent_path_id) WHERE NOT deleted;
CREATE INDEX paths_world_rev ON paths(world_id,rev);
CREATE INDEX events_target_rev ON events(world_id,target_player_id,rev);
INSERT INTO worlds(slug,name) VALUES ('mdst1050','Jootsy! · MDST 1050'),('sandbox','Jootsy! · Sandbox'),('stress','Jootsy! · Stress');
INSERT INTO cards(world_id,type,scenario_title,body,depth,rev)
SELECT w.id,'scenario',s.title,s.body,0,1 FROM worlds w CROSS JOIN (VALUES
 ('Window','I turn to the window. Following the sound with my eyes I see…'),
 ('Alarm','An alarm is going off somewhere. It isn''t mine. I get up and…'),
 ('Stairwell','I''m on a staircase I don''t remember climbing. Below me I hear…'),
 ('Screen','The screen lights up by itself. On it I see…'),
 ('Bus','I wake up on a bus. Everyone else is asleep. Outside the window…'),
 ('Kitchen','It''s the middle of the night. The kitchen light is on. I walk in and…'),
 ('Field','I''m standing in a field at dusk. Something is humming. I walk toward…')
) AS s(title,body);
UPDATE worlds SET rev=1;
