-- A transaction-consistent, server-only copy of every v2 game row before conversion.
LOCK TABLE worlds,players,cards,paths,events IN ACCESS EXCLUSIVE MODE;
CREATE SCHEMA jootsy_v2_snapshot;
CREATE TABLE jootsy_v2_snapshot.worlds AS TABLE worlds;
CREATE TABLE jootsy_v2_snapshot.players AS TABLE players;
CREATE TABLE jootsy_v2_snapshot.cards AS TABLE cards;
CREATE TABLE jootsy_v2_snapshot.paths AS TABLE paths;
CREATE TABLE jootsy_v2_snapshot.events AS TABLE events;
CREATE TABLE jootsy_v2_snapshot.metadata AS SELECT now() AS captured_at;
ALTER TABLE cards DROP CONSTRAINT cards_type_check;
ALTER TABLE cards ADD CONSTRAINT cards_type_check CHECK(type IN ('scenario','open','fork','destiny','dream','wormhole','dead_end','jootsy'));
ALTER TABLE paths DROP CONSTRAINT paths_label_check;
ALTER TABLE paths ADD CONSTRAINT paths_label_check CHECK(char_length(label) BETWEEN 0 AND 60);
ALTER TABLE paths ADD COLUMN kind text NOT NULL DEFAULT 'fork' CHECK(kind IN ('fork','destiny','dream','wormhole','jootsy'));
ALTER TABLE paths ADD COLUMN cut_id uuid NOT NULL DEFAULT gen_random_uuid();
UPDATE worlds SET rev=rev+1,jootsy_min_cards=5;
ALTER TABLE worlds ALTER COLUMN jootsy_min_cards SET DEFAULT 5;
UPDATE paths p SET kind=CASE WHEN c.type IN ('fork','destiny','dream') THEN c.type ELSE 'fork' END,
 claimed_by=NULL,claimed_until=NULL,rev=w.rev
 FROM cards c,worlds w WHERE c.id=p.from_card_id AND w.id=p.world_id;
-- Written v2 cards become the owners of their incoming slots on delete/replay.
UPDATE paths p SET created_by=c.author_id FROM cards c WHERE p.to_card_id=c.id AND NOT c.deleted;
-- Fork siblings from v2 share the same originating cut.
UPDATE paths p SET cut_id=c.id FROM cards c WHERE c.id=p.from_card_id;
INSERT INTO paths(world_id,from_card_id,label,created_by,position,rev,kind,to_card_id,taken_at)
 SELECT c.world_id,c.id,COALESCE(c.door_label,'Wormhole'),c.author_id,
 COALESCE((SELECT max(p.position)+1 FROM paths p WHERE p.from_card_id=c.id),0),w.rev,'wormhole',c.target_card_id,now()
 FROM cards c JOIN worlds w ON w.id=c.world_id WHERE c.type='wormhole' AND NOT c.deleted AND c.target_card_id IS NOT NULL;
UPDATE cards c SET type=CASE WHEN c.type='dead_end' THEN 'dead_end' ELSE 'open' END,
 door_label=NULL,target_card_id=NULL,rev=w.rev FROM worlds w WHERE c.world_id=w.id AND c.type<>'scenario';
CREATE INDEX blank_cards_by_dealer ON paths(world_id,created_by) WHERE NOT deleted AND to_card_id IS NULL;
