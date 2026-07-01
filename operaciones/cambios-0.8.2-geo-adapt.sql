SET LOCAL my_app.owner = 'siper_muleto_owner';
SET LOCAL my_app.admin = 'siper_muleto_admin';

DO $$
BEGIN

set search_path = siper;

EXECUTE 'set role to '|| current_setting('my_app.owner');

alter table "comunas_partidos" add column "comuna_carto" text;

do $SQL_ENANCE$
 begin
PERFORM enance_table('comunas_partidos','provincia,comuna_partido');
end
$SQL_ENANCE$;

alter table "comunas_partidos" add constraint "comuna_carto<>''" check ("comuna_carto"<>'');
alter table "comunas_partidos" add constraint "comuna_carto tres digitos" check (comuna_carto similar to '\d{3}');

alter table per_domicilios DISABLE trigger per_domicilios_idgeo_trg; --momentáneo , para que no blanquee coordenada_x, coordenada_y, obs_geo

--comuna_carto pasa a ser la comuna_partido actual
update "comunas_partidos" set comuna_carto = comuna_partido where provincia = '02';

--en CABA quito EL PREFIJO de barrio_localidad y lo estandarizo a 3 dígitos 
update barrios_localidades bl set barrio_localidad = q.nuevo_barrio_localidad
from
      (
      select provincia, comuna_partido, barrio_localidad,
         case when substr(barrio_localidad,(length((comuna_partido::integer)::text)+1))::integer < 99 then
         '0'||substr(barrio_localidad,(length((comuna_partido::integer)::text)+1))
         else
         substr(barrio_localidad,(length((comuna_partido::integer)::text)+1))
         end 
         as nuevo_barrio_localidad,
      nombre
      from barrios_localidades
      where provincia = '02'
      ) q
where bl.provincia = q.provincia and bl.comuna_partido = q.comuna_partido and bl.barrio_localidad = q.barrio_localidad;

--la comuna_partido pasa a ser la comuna_partido actual / 7
--cambiará en per_domicilios y en barrios_localidades porque las FKs son on update cascade 
update comunas_partidos set comuna_partido = '001' where provincia = '02' and comuna_partido = '007';
update comunas_partidos set comuna_partido = '002' where provincia = '02' and comuna_partido = '014';
update comunas_partidos set comuna_partido = '003' where provincia = '02' and comuna_partido = '021';
update comunas_partidos set comuna_partido = '004' where provincia = '02' and comuna_partido = '028';
update comunas_partidos set comuna_partido = '005' where provincia = '02' and comuna_partido = '035';
update comunas_partidos set comuna_partido = '006' where provincia = '02' and comuna_partido = '042';
update comunas_partidos set comuna_partido = '007' where provincia = '02' and comuna_partido = '049';
update comunas_partidos set comuna_partido = '008' where provincia = '02' and comuna_partido = '056';
update comunas_partidos set comuna_partido = '009' where provincia = '02' and comuna_partido = '063';
update comunas_partidos set comuna_partido = '010' where provincia = '02' and comuna_partido = '070';
update comunas_partidos set comuna_partido = '011' where provincia = '02' and comuna_partido = '077';
update comunas_partidos set comuna_partido = '012' where provincia = '02' and comuna_partido = '084';
update comunas_partidos set comuna_partido = '013' where provincia = '02' and comuna_partido = '091';
update comunas_partidos set comuna_partido = '014' where provincia = '02' and comuna_partido = '098';
update comunas_partidos set comuna_partido = '015' where provincia = '02' and comuna_partido = '105';

alter table per_domicilios ENABLE trigger per_domicilios_idgeo_trg; --momentáneo , para que no blanquee coordenada_x, coordenada_y, obs_geo

END $$;