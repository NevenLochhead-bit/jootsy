-- Designer: fictional demonstration players only. No class-world rows change.
DO $$
DECLARE demo_world uuid; next_rev bigint;
demo_names text[] := ARRAY[
'Avery Lane','Theo Reed','Mina Vale','Leo Hart','Nora Finch','Sam Rowan','Iris Cole','June Mercer',
'Rowan Ellis','Alex Bell','Zoe Arden','Jules Quinn','Remy Brooks','Maya Linden','Finn Marlow','Ada Wells',
'Robin Hale','Kai Bennett','Luca Ames','Rae Morgan','Eden Clarke','Noah Wren','Tess Avery','Milo Blake',
'Piper Shaw','Owen Dale','Skye Palmer','Emery West','Esme Rivers','Jamie North','Arlo Hayes','Hazel Page',
'Drew Foster','Sage Monroe','Ellis Gray','Cora Hartley','Micah Stone','Willa Fox','Rory Nolan','Bea Collins',
'Casey Price','Ivy Sawyer','Dylan Woods','Clara Moss','Kit Lawson','Lena Parker','Quinn Field','Isla Sutton',
'Jasper Vale','Sasha Brook','Nico Ash','Freya Bellamy','Elliot Reed','Mira Kent','Callum Lane','Sylvie Finch',
'Blair Rowan','Anya Ellis','Felix Shore','Jo Hart','Leah Mercer','Riley Cole','Oscar Linden','Talia Wells'];
BEGIN
 SELECT id INTO demo_world FROM worlds WHERE slug='sandbox' FOR UPDATE;
 IF demo_world IS NULL THEN RETURN; END IF;
 IF (SELECT count(*) FROM players WHERE world_id=demo_world AND NOT is_instructor)>array_length(demo_names,1) THEN
  RAISE EXCEPTION 'Demo name list is shorter than the Sandbox player list';
 END IF;
 UPDATE worlds SET rev=rev+1 WHERE id=demo_world RETURNING rev INTO next_rev;
 WITH ranked AS (
  SELECT id,row_number() OVER(ORDER BY name_key,id)::integer AS n
  FROM players WHERE world_id=demo_world AND NOT is_instructor
 )
 UPDATE players p SET name=demo_names[r.n],name_key=lower(demo_names[r.n]),rev=next_rev
 FROM ranked r WHERE p.id=r.id;
END $$;
