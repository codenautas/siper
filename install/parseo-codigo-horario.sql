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

CREATE OR REPLACE FUNCTION personas_horario_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
DECLARE
  v_existe boolean;
BEGIN
  if new.horario is not null then
    select true into v_existe
      from horarios where horario = new.horario;
    if v_existe is not true then
      insert into horarios (horario) values (new.horario);
      insert into horarios_dds (horario, dds, hora_desde, hora_hasta, trabaja)
        select new.horario, dds, hora_desde, hora_hasta, true as trabaja
          from parseo_horario_tabla(parsear_horario(new.horario)) h_dds;
    end if;
  end if;
  RETURN NEW;
END;
$BODY$;

CREATE TRIGGER personas_horario_trg
  BEFORE INSERT OR UPDATE OF horario
  ON personas
  FOR EACH ROW
  EXECUTE PROCEDURE personas_horario_trg();
