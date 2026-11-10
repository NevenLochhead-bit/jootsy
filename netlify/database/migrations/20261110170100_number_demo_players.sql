-- Designer follow-up: numbered demo players, all existing stories retained.
DO $$
DECLARE demo_world uuid; next_rev bigint;
BEGIN
 SELECT id INTO demo_world FROM worlds WHERE slug='sandbox' FOR UPDATE;
 IF demo_world IS NULL THEN RETURN; END IF;
 UPDATE worlds SET rev=rev+1 WHERE id=demo_world RETURNING rev INTO next_rev;
 WITH ranked AS (
  SELECT id,row_number() OVER(ORDER BY created_at,id) AS n
  FROM players WHERE world_id=demo_world AND NOT is_instructor
 )
 UPDATE players p SET name='Student '||r.n,name_key='student '||r.n,rev=next_rev
 FROM ranked r WHERE p.id=r.id;
END $$;
