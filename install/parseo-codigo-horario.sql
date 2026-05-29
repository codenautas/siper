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
  with e as (
    select substring(p_cod_horario from '^(\d+)h')::integer as h,
      regexp_replace(p_cod_horario, '^\d+h\s*', '') as resto
  )
  select (case when e.h is null then '{}'::jsonb else jsonb_build_object('h', e.h) end)
      || jsonb_build_object('ds',jsonb_agg(x.*)) from e, lateral (
  select dias, desde, coalesce(hasta, to_char(desde::time + (coalesce(e.h, 7) || 'h')::interval, 'HH24:MI')) as hasta from (
  select case when t[1] is null then '[1,2,3,4,5]'::jsonb else
          (select jsonb_agg(d :: integer) from regexp_split_to_table(translate(t[1], 'DLMXJVS', '0123456'), '') as d)
        end as dias,
        (case when t[2] like '%:%' then t[2] else t[2] || ':00' end) as desde,
        (case when t[3] like '%:%' then t[3] else t[3] || ':00' end) as hasta
    from regexp_matches(
      e.resto,
      '([DLMXJVS]+)?\s*(\d+(?::\d+)?)(?:\s*[-aA]\s*(\d+(?::\d+)?))?',
      'g'
    ) t) y) x
  group by e.h
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
    from jsonb_array_elements(p_json_horarios -> 'ds') e,
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
        from jsonb_to_recordset(p_horario -> 'ds') as h(
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
  select horario_estandarizado(jsonb_build_object('ds', jsonb_agg(x.*)))
    from parseo_horario_tabla(parsear_horario(p_cod_horario)) x
$sql$;

-- Casos de prueba
select * from (
select horario, estandar, esperado, parsear_horario(horario) as obtenido, 
  horario_estandarizado(horario) as codigo_obtenido
from (
select parseado::jsonb as esperado, horario, estandar
  from (
    values ('9-16'  ,'9a16'           ,'{"ds": [{"dias":[1,2,3,4,5], "desde": "9:00", "hasta": "16:00"}]}'),
      ('10 a 17'    ,'10a17'          ,'{"ds": [{"dias":[1,2,3,4,5], "desde": "10:00", "hasta": "17:00"}]}'),
      ('8'          ,'8a15'           ,'{"ds": [{"dias":[1,2,3,4,5], "desde": "8:00", "hasta": "15:00"}]}'),
      ('8:30-15:30' ,'8:30a15:30'     ,'{"ds": [{"dias":[1,2,3,4,5], "desde": "8:30", "hasta": "15:30"}]}'),
      ('LMXJ 9 V 10','LMXJ9a16 V10a17','{"ds": [{"dias":[1,2,3,4], "desde": "9:00", "hasta": "16:00"}, {"dias":[5], "desde": "10:00", "hasta": "17:00"}]}'),
      ('LXV9a15 MJ8a16:30',null       ,'{"ds": [{"dias":[1,3,5], "desde": "9:00", "hasta": "15:00"}, {"dias":[2,4], "desde": "8:00", "hasta": "16:30"}]}'),
      ('5h 10 a 17' ,'5h 10a17'       ,'{"h": 5, "ds": [{"dias":[1,2,3,4,5], "desde": "10:00", "hasta": "17:00"}]}'),
      ('6h8'        ,'6h 8a14'        ,'{"h": 6, "ds": [{"dias":[1,2,3,4,5], "desde": "8:00", "hasta": "14:00"}]}')
  ) as test_case(horario, estandar, parseado)
))
where obtenido is distinct from esperado or codigo_obtenido is distinct from coalesce(estandar, horario);

/* TRIGGERS
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
    v_horario := horario_estandarizado(new.horario);
    if v_horario is distinct from new.horario then
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
-- */