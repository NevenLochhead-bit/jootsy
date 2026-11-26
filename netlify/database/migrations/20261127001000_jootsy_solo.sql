CREATE TABLE solo_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE solo_login_codes (
  email text PRIMARY KEY,
  challenge_id uuid NOT NULL,
  code_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE solo_auth_limits (
  bucket text PRIMARY KEY,
  requests integer NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE TABLE solo_auth_sessions (
  token_hash text PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES solo_accounts(id),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE solo_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES solo_accounts(id),
  title text NOT NULL CHECK(char_length(title) BETWEEN 1 AND 80),
  rev bigint NOT NULL DEFAULT 1,
  default_model_asset_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX solo_projects_owner_updated ON solo_projects(account_id, updated_at DESC);
CREATE TABLE solo_edit_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES solo_projects(id),
  anchor_card_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','committed','discarded')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX solo_one_open_session ON solo_edit_sessions(project_id) WHERE status='open';
CREATE TABLE solo_assets (
  id uuid PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES solo_projects(id),
  kind text NOT NULL CHECK(kind IN ('image','audio','video','model')),
  content_type text NOT NULL,
  byte_count integer NOT NULL CHECK(byte_count>0),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','ready','failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE solo_projects ADD CONSTRAINT solo_default_model_fk FOREIGN KEY(default_model_asset_id) REFERENCES solo_assets(id);
CREATE TABLE solo_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES solo_projects(id),
  type text NOT NULL CHECK(type IN ('scenario','open')),
  scenario_title text,
  body text NOT NULL CHECK(char_length(body)<=600 AND (draft OR char_length(body)>0)),
  parent_path_id uuid,
  depth integer NOT NULL DEFAULT 0 CHECK(depth>=0),
  draft boolean NOT NULL DEFAULT false,
  deleted boolean NOT NULL DEFAULT false,
  session_id uuid REFERENCES solo_edit_sessions(id),
  media_kind text CHECK(media_kind IN ('image','embed')),
  media_url text,
  image_asset_id uuid REFERENCES solo_assets(id),
  audio_asset_id uuid REFERENCES solo_assets(id),
  video_asset_id uuid REFERENCES solo_assets(id),
  model_asset_id uuid REFERENCES solo_assets(id),
  model_mode text NOT NULL DEFAULT 'inherit' CHECK(model_mode IN ('inherit','card','none')),
  seq bigint GENERATED ALWAYS AS IDENTITY,
  CHECK(video_asset_id IS NULL OR (image_asset_id IS NULL AND media_url IS NULL)),
  CHECK((model_mode='card')=(model_asset_id IS NOT NULL)),
  CHECK((type='scenario' AND parent_path_id IS NULL AND depth=0) OR (type='open' AND parent_path_id IS NOT NULL))
);
CREATE TABLE solo_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES solo_projects(id),
  from_card_id uuid NOT NULL REFERENCES solo_cards(id),
  to_card_id uuid REFERENCES solo_cards(id),
  kind text NOT NULL CHECK(kind IN ('destiny','fork','dream','wormhole','jootsy')),
  label text NOT NULL DEFAULT '' CHECK(char_length(label)<=60),
  position integer NOT NULL,
  draft boolean NOT NULL DEFAULT true,
  deleted boolean NOT NULL DEFAULT false,
  session_id uuid REFERENCES solo_edit_sessions(id),
  UNIQUE(from_card_id,position)
);
ALTER TABLE solo_cards ADD CONSTRAINT solo_card_parent_fk FOREIGN KEY(parent_path_id) REFERENCES solo_paths(id);
ALTER TABLE solo_edit_sessions ADD CONSTRAINT solo_session_anchor_fk FOREIGN KEY(anchor_card_id) REFERENCES solo_cards(id);
CREATE INDEX solo_cards_project ON solo_cards(project_id,seq);
CREATE INDEX solo_paths_project ON solo_paths(project_id,from_card_id);
