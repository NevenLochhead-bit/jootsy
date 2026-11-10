DO $jootsy_audio$
BEGIN
ALTER TABLE cards ADD COLUMN audio_url text;
CREATE TABLE media_uploads (
 key text PRIMARY KEY, world_id uuid NOT NULL REFERENCES worlds(id), player_id uuid NOT NULL REFERENCES players(id),
 kind text NOT NULL CHECK(kind IN ('image','audio')), status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','ready','failed')), byte_count integer NOT NULL CHECK(byte_count>=0), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX media_uploads_player_world ON media_uploads(world_id,player_id);
-- Preserve and count image objects already referenced by legacy authored cards.
INSERT INTO media_uploads(key,world_id,player_id,kind,byte_count,status)
SELECT DISTINCT ON (substring(media_url from '/media/(.*)$')) substring(media_url from '/media/(.*)$'),world_id,author_id,'image',0,'ready'
FROM cards WHERE author_id IS NOT NULL AND media_kind='image'
AND media_url ~ ('/media/'||world_id::text||'/[a-f0-9-]+[.]jpg$')
ON CONFLICT DO NOTHING;
END
$jootsy_audio$;
