SET LOCAL my_app.owner = 'siper_muleto_owner';
SET LOCAL my_app.admin = 'siper_muleto_admin';

set search_path = siper;

DO $$ BEGIN
EXECUTE 'set role to '|| current_setting('my_app.owner');
END $$;

do $SQL_ENANCE$
 begin
PERFORM enance_table('comunas_partidos','provincia,comuna_partido');
end
$SQL_ENANCE$;

alter table "comunas_partidos" add constraint "comuna_carto<>''" check ("comuna_carto"<>'');

alter table per_domicilios DISABLE trigger per_domicilios_idgeo_trg; --momentáneo , para que no blanquee coordenada_x, coordenada_y, obs_geo

--comuna_carto pasa a ser la comuna_partido actual
update "comunas_partidos" set comuna_carto = comuna_partido where provincia = '2';

update barrios_localidades bl set barrio_localidad = q.nuevo_barrio_localidad
from
      (
      select provincia, comuna_partido, barrio_localidad,
         substr(barrio_localidad,(length((comuna_partido::integer)::text)+1))::INTEGER::TEXT
         as nuevo_barrio_localidad,
      nombre
      from barrios_localidades
      where provincia = '2'
      ) q
where bl.provincia = q.provincia and bl.comuna_partido = q.comuna_partido and bl.barrio_localidad = q.barrio_localidad;

--la comuna_partido pasa a ser la comuna_partido actual / 7
--cambiará en per_domicilios y en barrios_localidades porque las FKs son on update cascade 
update comunas_partidos set provincia='2', comuna_partido = '1' where coalesce(provincia,'2') = '2' and comuna_partido = '7';
update comunas_partidos set provincia='2', comuna_partido = '2' where coalesce(provincia,'2') = '2' and comuna_partido = '14';
update comunas_partidos set provincia='2', comuna_partido = '3' where coalesce(provincia,'2') = '2' and comuna_partido = '21';
update comunas_partidos set provincia='2', comuna_partido = '4' where coalesce(provincia,'2') = '2' and comuna_partido = '28';
update comunas_partidos set provincia='2', comuna_partido = '5' where coalesce(provincia,'2') = '2' and comuna_partido = '35';
update comunas_partidos set provincia='2', comuna_partido = '6' where coalesce(provincia,'2') = '2' and comuna_partido = '42';
update comunas_partidos set provincia='2', comuna_partido = '7' where coalesce(provincia,'2') = '2' and comuna_partido = '49';
update comunas_partidos set provincia='2', comuna_partido = '8' where coalesce(provincia,'2') = '2' and comuna_partido = '56';
update comunas_partidos set provincia='2', comuna_partido = '9' where coalesce(provincia,'2') = '2' and comuna_partido = '63';
update comunas_partidos set provincia='2', comuna_partido = '10' where coalesce(provincia,'2') = '2' and comuna_partido = '70';
update comunas_partidos set provincia='2', comuna_partido = '11' where coalesce(provincia,'2') = '2' and comuna_partido = '77';
update comunas_partidos set provincia='2', comuna_partido = '12' where coalesce(provincia,'2') = '2' and comuna_partido = '84';
update comunas_partidos set provincia='2', comuna_partido = '13' where coalesce(provincia,'2') = '2' and comuna_partido = '91';
update comunas_partidos set provincia='2', comuna_partido = '14' where coalesce(provincia,'2') = '2' and comuna_partido = '98';
update comunas_partidos set provincia='2', comuna_partido = '15' where coalesce(provincia,'2') = '2' and comuna_partido = '105';

alter table per_domicilios ENABLE trigger per_domicilios_idgeo_trg; --momentáneo , para que no blanquee coordenada_x, coordenada_y, obs_geo
