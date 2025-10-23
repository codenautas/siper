set search_path = siper;

drop table horarios;

create table "horarios_cod" (
  "horario" text
, primary key ("horario")
);
grant select, insert, update, delete on "horarios_cod" to siper_admin;
grant all on "horarios_cod" to siper_owner;



create table "horarios_dds" (
  "horario" text, 
  "dds" integer, 
  "hora_desde" time, 
  "hora_hasta" time, 
  "trabaja" boolean
, primary key ("horario", "dds")
);
grant select, insert, update, delete on "horarios_dds" to siper_admin;
grant all on "horarios_dds" to siper_owner;



create table "horarios_per" (
  "idper" text, 
  "horario" text, 
  "annio" integer generated always as (extract(year from desde)) stored, 
  "desde" date, 
  "hasta" date, 
  "lapso_fechas" "daterange" generated always as (daterange(desde, coalesce(hasta, make_date(extract(year from desde)::integer, 12, 31)))) stored
, primary key ("idper", "annio", "desde")
);
grant select, insert, update, delete on "horarios_per" to siper_admin;
grant all on "horarios_per" to siper_owner;



create or replace view "horarios" (
  "idper", "dds", "annio", "desde", "hasta", "trabaja", "hora_desde", "hora_hasta", "lapso_fechas"
) as select hp.idper, hd.dds, hp.annio, hp.desde, hp.hasta, hd.dds between 1 and 5 as trabaja, hd.hora_desde, hd.hora_hasta, hp.lapso_fechas
                from horarios_per hp 
                    inner join horarios_dds hd using (horario)
            ;
grant select on "horarios" to siper_admin;

alter table "horarios_cod" add constraint "horario<>''" check ("horario"<>'');
alter table "horarios_dds" add constraint "horario<>''" check ("horario"<>'');
alter table "horarios_dds" alter column "hora_desde" set not null;
alter table "horarios_dds" alter column "hora_hasta" set not null;
alter table "horarios_dds" alter column "trabaja" set not null;
alter table "horarios_dds" add constraint "dia de la semana entre 0 y 6" check (dds between 0 and 6);
alter table "horarios_dds" add constraint "si trabaja tiene horario" check ((trabaja is true) = (hora_desde is not null and hora_hasta is not null));
alter table "horarios_per" add constraint "idper<>''" check ("idper"<>'');
alter table "horarios_per" add constraint "horario<>''" check ("horario"<>'');
alter table "horarios_per" alter column "desde" set not null;
alter table "horarios_per" alter column "hasta" set not null;
alter table "horarios_per" add constraint "desde y hasta deben ser del mismo annio" check (extract(year from desde) = extract(year from hasta));
alter table "horarios_per" add constraint "desde tiene que ser anterior a hasta" check (desde <= hasta);
alter table "horarios_per" add constraint "sin superponer fechas" exclude using GIST (idper WITH =, lapso_fechas WITH &&);


alter table "horarios_dds" add constraint "horarios_dds horarios_cod REL" foreign key ("horario") references "horarios_cod" ("horario")  on delete cascade on update cascade;
alter table "horarios_per" add constraint "horarios_per personas REL" foreign key ("idper") references "personas" ("idper")  on delete cascade on update cascade;
alter table "horarios_per" add constraint "horarios_per annios REL" foreign key ("annio") references "annios" ("annio")  on update no action;
alter table "horarios_per" add constraint "horarios_per desde REL" foreign key ("desde") references "fechas" ("fecha")  on delete cascade on update cascade;
alter table "horarios_per" add constraint "horarios_per hasta REL" foreign key ("hasta") references "fechas" ("fecha")  on delete cascade on update cascade;


create index "horario 4 horarios_dds IDX" ON "horarios_dds" ("horario");
create index "idper 4 horarios_per IDX" ON "horarios_per" ("idper");
create index "annio 4 horarios_per IDX" ON "horarios_per" ("annio");
create index "desde 4 horarios_per IDX" ON "horarios_per" ("desde");
create index "hasta 4 horarios_per IDX" ON "horarios_per" ("hasta");


/* parseo e interpetación de clave horarios */

/* para probar en forma independiente:
drop schema if exists parseo_horarios cascade;
create schema if not exists parseo_horarios;
set search_path = parseo_horarios;
--*/

create or replace function parsear_horario(p_cod_horario text) returns jsonb
  language sql
  immutable
as
$sql$
  select jsonb_agg(x.*) from (
  select dias, desde, coalesce(hasta, to_char(desde::time + '7h'::interval, 'HH24:MI')) as hasta from (
  select case when t[1] is null then '[1,2,3,4,5]'::jsonb else 
          (select jsonb_agg(d :: integer) from regexp_split_to_table(translate(t[1], 'DLMXJVS', '0123456'), '') as d)
        end as dias,
        (case when t[2] like '%:%' then t[2] else t[2] || ':00' end) as desde,
        (case when t[3] like '%:%' then t[3] else t[3] || ':00' end) as hasta
    from regexp_matches(
      p_cod_horario, 
      '([DLMXJVS]+)?\s*(\d+(?::\d+)?)(?:\s*[-aA]\s*(\d+(?::\d+)?))?', 
      'g'
    ) t)) x
$sql$;

drop function if exists parseo_horario_tabla(jsonb);
create or replace function parseo_horario_tabla(p_json_horarios jsonb) returns table (
  dds integer,
  hora_desde time,
  hora_hasta time
)
  language sql
  immutable
as
$sql$
  select dds.* 
    from jsonb_array_elements(p_json_horarios) e,
      lateral (
	    select dds::integer as dds, (e->>'desde')::time as hora_desde, (e->>'hasta')::time as hora_hasta
	      from jsonb_array_elements_text(e->'dias') dds
	  ) dds
$sql$;

create or replace function horario_estandarizado(p_horario jsonb) returns text
  language sql
  immutable
as
$sql$
  select string_agg(case when dds = '12345' then '' else translate(dds, '01234567', 'DLMXJVSD') end
      || regexp_replace(to_char(hora_desde,'FMHH24:MI'), '(:00)?:00$', '')
      || 'a'
      || regexp_replace(to_char(hora_hasta,'FMHH24:MI'), '(:00)?:00$', '') , ' ' order by min_dds)
    from (
      select hora_desde, hora_hasta, 
          string_agg(dds::text, '' order by dds) as dds, 
	      min(dds) as min_dds
        from jsonb_to_recordset(p_horario) as h(
          dds integer,
          hora_desde time,
          hora_hasta time
        )
	    group by hora_desde, hora_hasta
    ) x
$sql$;

create or replace function horario_estandarizado(p_cod_horario text) returns text
  language sql
  immutable
as
$sql$
  select horario_estandarizado(jsonb_agg(x.*))
    from parseo_horario_tabla(parsear_horario(p_cod_horario)) x
$sql$;

-- Casos de prueba
select * from (
select horario, estandar, esperado, parsear_horario(horario) as obtenido, 
  horario_estandarizado(horario) as codigo_obtenido
from (
select parseado::jsonb as esperado, horario, estandar
  from (
    values ('9-16'  ,'9a16'           ,'[{"dias":[1,2,3,4,5], "desde": "9:00", "hasta": "16:00"}]'),
      ('10 a 17'    ,'10a17'          ,'[{"dias":[1,2,3,4,5], "desde": "10:00", "hasta": "17:00"}]'),
      ('8'          ,'8a15'           ,'[{"dias":[1,2,3,4,5], "desde": "8:00", "hasta": "15:00"}]'),
      ('8:30-15:30' ,'8:30a15:30'     ,'[{"dias":[1,2,3,4,5], "desde": "8:30", "hasta": "15:30"}]'),
      ('LMXJ 9 V 10','LMXJ9a16 V10a17','[{"dias":[1,2,3,4], "desde": "9:00", "hasta": "16:00"}, {"dias":[5], "desde": "10:00", "hasta": "17:00"}]'),
      ('LXV9a15 MJ8a16:30',null       ,'[{"dias":[1,3,5], "desde": "9:00", "hasta": "15:00"}, {"dias":[2,4], "desde": "8:00", "hasta": "16:30"}]')
  ) as test_case(horario, estandar, parseado)
))
where obtenido is distinct from esperado or codigo_obtenido is distinct from coalesce(estandar, horario);

CREATE OR REPLACE FUNCTION horarios_per_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
DECLARE
  v_existe boolean;
  v_horario text;
BEGIN
  if new.horario is not null then
    -- raice notice 'nuevo horario %', new.horario;
    v_horario := horario_estandarizado(new.horario);
    if v_horario is distinct from new.horario then
      -- raice notice 'pero el estandarizado es distinto %', v_horario;
      new.horario := v_horario;
    end if;
    select true into v_existe
      from horarios_cod where horario = v_horario;
    if v_existe is not true then
      insert into horarios_cod (horario) values (v_horario);
      insert into horarios_dds (horario, dds, hora_desde, hora_hasta, trabaja)
        select v_horario, dds, hora_desde, hora_hasta, true as trabaja
          from parseo_horario_tabla(parsear_horario(v_horario)) h_dds;
    end if;
  end if;
  RETURN NEW;
END;
$BODY$;

CREATE TRIGGER horarios_per_trg
  BEFORE INSERT OR UPDATE OF horario
  ON horarios_per
  FOR EACH ROW
  EXECUTE PROCEDURE horarios_per_trg();

select enance_table('horarios_per','idper,annio,desde');
