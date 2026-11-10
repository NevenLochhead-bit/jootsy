DO $jootsy_video$
BEGIN
ALTER TABLE cards ADD COLUMN video_url text;
ALTER TABLE cards ADD CONSTRAINT cards_one_visual CHECK(video_url IS NULL OR media_url IS NULL);
ALTER TABLE media_uploads DROP CONSTRAINT media_uploads_kind_check;
ALTER TABLE media_uploads ADD CONSTRAINT media_uploads_kind_check CHECK(kind IN ('image','audio','video'));
END
$jootsy_video$;
