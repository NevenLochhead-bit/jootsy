DO $jootsy_v4$
BEGIN
LOCK TABLE worlds,players,cards,paths,events IN ACCESS EXCLUSIVE MODE;
CREATE TABLE edit_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), world_id uuid NOT NULL REFERENCES worlds(id),
 player_id uuid NOT NULL REFERENCES players(id), anchor_card_id uuid NOT NULL REFERENCES cards(id),
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','committed','discarded')),
 rev bigint NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX one_open_session ON edit_sessions(world_id,player_id) WHERE status='open';
ALTER TABLE cards ADD COLUMN draft boolean NOT NULL DEFAULT false;
ALTER TABLE paths ADD COLUMN draft boolean NOT NULL DEFAULT false;
ALTER TABLE cards ADD COLUMN session_id uuid REFERENCES edit_sessions(id);
ALTER TABLE paths ADD COLUMN session_id uuid REFERENCES edit_sessions(id);
-- Committed fragments retain the v3 constraint; a cleared draft may be temporarily empty.
ALTER TABLE cards DROP CONSTRAINT cards_body_check;
ALTER TABLE cards ADD CONSTRAINT cards_body_check CHECK(char_length(body)<=600 AND (draft OR char_length(body)>=1));
CREATE INDEX draft_cards_by_session ON cards(session_id) WHERE draft AND NOT deleted;
CREATE INDEX draft_paths_by_session ON paths(session_id) WHERE draft AND NOT deleted;
UPDATE worlds SET rev=rev+1,jootsy_enabled=true,jootsy_min_cards=5;
UPDATE cards c SET type='open',rev=w.rev FROM worlds w WHERE c.world_id=w.id AND c.type='dead_end';
UPDATE paths p SET deleted=true,claimed_by=NULL,claimed_until=NULL,rev=w.rev FROM worlds w
 WHERE p.world_id=w.id AND p.to_card_id IS NULL AND NOT p.deleted;
END
$jootsy_v4$;
