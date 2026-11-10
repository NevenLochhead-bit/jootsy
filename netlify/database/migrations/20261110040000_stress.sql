DO $$
DECLARE
 w uuid; actor uuid; parent cards%ROWTYPE; p paths%ROWTYPE; newcard uuid; target uuid;
 authors uuid[] := '{}'; previous uuid; kind text; i integer; j integer; offered integer; root cards%ROWTYPE;
BEGIN
 SELECT id INTO w FROM worlds WHERE slug='stress';
 FOR i IN 1..33 LOOP
  INSERT INTO players(world_id,name,name_key,pass_hash,rev) VALUES(w,'Player '||lpad(i::text,2,'0'),'player '||lpad(i::text,2,'0'),'!stress-fixture-no-login',2) RETURNING id INTO actor;
  authors:=array_append(authors,actor);
 END LOOP;
 FOR root IN SELECT * FROM cards WHERE world_id=w AND type='scenario' ORDER BY seq LOOP
  FOR j IN 0..6 LOOP
   INSERT INTO paths(world_id,from_card_id,label,position,rev) VALUES(w,root.id,'Follow the '||(ARRAY['echo','light','footsteps','rain','shadow','signal','wind'])[j+1],j,2);
  END LOOP;
 END LOOP;
 FOR i IN 1..300 LOOP
  actor:=authors[((i-1)%33)+1];
  IF i>1 AND i<=12 THEN
   SELECT * INTO p FROM paths WHERE from_card_id=previous AND to_card_id IS NULL ORDER BY position LIMIT 1;
  ELSE
   SELECT path.* INTO p FROM paths path JOIN cards card ON card.id=path.from_card_id WHERE path.world_id=w AND path.to_card_id IS NULL AND NOT path.deleted AND card.depth<11 ORDER BY card.depth,card.seq,path.position LIMIT 1;
  END IF;
  SELECT * INTO parent FROM cards WHERE id=p.from_card_id;
  kind:=CASE WHEN i<12 THEN 'destiny' WHEN i=12 OR i<=112 THEN 'fork' WHEN i<=172 THEN 'destiny' WHEN i<=236 THEN 'dream' WHEN i<=260 THEN 'dead_end' ELSE 'wormhole' END;
  target:=NULL;
  IF kind='wormhole' THEN SELECT id INTO target FROM cards WHERE world_id=w AND author_id=actor AND NOT deleted ORDER BY seq LIMIT 1; END IF;
  INSERT INTO cards(world_id,type,author_id,body,parent_path_id,depth,door_label,target_card_id,rev)
   VALUES(w,kind,actor,(ARRAY[
   'I hear the room before I see it. A thin note hangs in the air, and the walls seem to move closer every time I breathe. I reach toward the sound.',
   'I follow a ribbon of yellow light across the floor. It disappears beneath a door with no handle. From the other side, someone is humming a tune I know.',
   'I turn and find the window filled with water. A bus floats past, silent and empty. My reflection is waving from one of its seats.',
   'I stop on the landing. The footsteps below have stopped too. I tap the railing twice and wait. Three taps come back, very slowly.',
   'I put my ear against the screen. The static sounds like rain falling on leaves. I close my eyes and feel the grass beneath my feet.'
   ])[((i-1)%5)+1],p.id,parent.depth+1,CASE WHEN kind='wormhole' THEN 'Return through the echo' END,target,2) RETURNING id INTO newcard;
  UPDATE paths SET to_card_id=newcard,taken_at=now(),rev=2 WHERE id=p.id;
  offered:=CASE WHEN kind IN ('fork','dream') THEN 2 WHEN kind='destiny' THEN 1 ELSE 0 END;
  FOR j IN 1..offered LOOP
   INSERT INTO paths(world_id,from_card_id,label,created_by,position,rev) VALUES(w,newcard,(ARRAY['Follow the echo','Turn toward the light'])[j],actor,j-1,2);
  END LOOP;
  previous:=newcard;
 END LOOP;
 UPDATE worlds SET rev=2 WHERE id=w;
END $$;
