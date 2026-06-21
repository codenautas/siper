ALTER TABLE siper.parametros ADD COLUMN cant_horas_diarias integer DEFAULT 8 NOT NULL;

ALTER TABLE siper.horarios_cod ADD COLUMN cant_horas integer;
ALTER TABLE siper.horarios_cod ADD COLUMN horas_promedio integer;


CREATE OR REPLACE FUNCTION siper.horario_estandarizado(p_horario jsonb) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $_$
  select case when (p_horario -> 'h') <> 'null'::jsonb then (p_horario ->> 'h') || 'h ' else '' end
      || string_agg(case when dds = '12345' then '' else translate(dds, '01234567', 'DLMXJVSD') end
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
$_$;

ALTER FUNCTION siper.horario_estandarizado(p_horario jsonb) OWNER TO siper_owner;

CREATE OR REPLACE FUNCTION siper.horario_estandarizado(p_cod_horario text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
  select horario_estandarizado(case when ph->'h' = 'null'::jsonb then '{}' else jsonb_build_object('h', ph->'h') end || jsonb_build_object('ds', z.t))
    from parsear_horario(p_cod_horario) ph,
         lateral (select jsonb_agg(x.*) as t from parseo_horario_tabla(ph) x ) z
$$;


ALTER FUNCTION siper.horario_estandarizado(p_cod_horario text) OWNER TO siper_owner;

-- CHANGED: siper.horarios_per_trg()

CREATE OR REPLACE FUNCTION siper.horarios_per_trg() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_existe boolean;
  v_horario text;
  v_cant_horas integer;
  v_parseado jsonb;
BEGIN
  if new.horario is not null then
    v_parseado := parsear_horario(new.horario);
    v_horario := horario_estandarizado(new.horario);
    v_cant_horas := case when v_parseado -> 'h' <> 'null'::jsonb then (v_parseado ->> 'h')::integer else null end;
    if v_horario is distinct from new.horario then
      new.horario := v_horario;
    end if;
    select true into v_existe
      from horarios_cod where horario = v_horario;
    if v_existe is not true then
      insert into horarios_cod (horario, cant_horas) values (v_horario, v_cant_horas);
      insert into horarios_dds (horario, dds, hora_desde, hora_hasta, trabaja)
        select v_horario, dds, hora_desde, hora_hasta, true as trabaja
          from parseo_horario_tabla(v_parseado) h_dds;
    end if;
  end if;
  RETURN NEW;
END;
$$;


ALTER FUNCTION siper.horarios_per_trg() OWNER TO siper_owner;

CREATE OR REPLACE FUNCTION siper.novedades_calculadas_idper(p_desde date, p_hasta date, p_idper text) RETURNS SETOF siper.novedades_calculadas_return
    LANGUAGE sql STABLE
    AS $$
  SELECT
-- ¡ATENCIÓN! NO MODIFICAR MANUALMENTE ESTA FUNCIÓN FUE GENERADA CON EL SCRIPT novedades_calculadas.sql
-- Otras funciones que comienzan con el nombre novedades_calculadas se generaron junto a esta!
      idper, fecha, 
      CASE WHEN trabajable OR nr_corridos THEN 
        coalesce(CASE WHEN fichadas_consolidadas AND nr_requiere_fichadas AND fecha >= fecha_inicio_fichada THEN fv_cod_nov ELSE null END, nr_cod_nov, cod_nov_pred_fecha) 
      ELSE null END as cod_nov, 
      ficha, fichadas, sector, annio,
      trabajable, detalles, cod_nov_ini,
      CASE WHEN fichadas_consolidadas AND nr_cuenta_horas AND trabajable AND fecha >= fecha_inicio_fichada THEN duration(fichadas) ELSE null END as horas
    FROM (
      SELECT p.idper, p.ficha, f.fecha, f.fichadas_consolidadas,
          (f.dds BETWEEN 1 AND 5) AND (laborable is not false OR inamovible is not true AND f.dds NOT BETWEEN 1 AND 5) as trabajable,
          p.sector, f.annio, nr.detalles,
          CASE WHEN (nr.c_dds IS NOT TRUE -- FILTRO PARA DIAGRAMADO POR DIA DE SEMANA:
            OR CASE f.dds WHEN 0 THEN nr.dds0 WHEN 1 THEN nr.dds1 WHEN 2 THEN nr.dds2 WHEN 3 THEN nr.dds3 WHEN 4 THEN nr.dds4 WHEN 5 THEN nr.dds5 WHEN 6 THEN nr.dds6 END
          ) THEN nr.cod_nov ELSE null END as nr_cod_nov,
          COALESCE(CASE WHEN nr.cod_nov IS NOT NULL THEN nr.requiere_fichadas ELSE ni.requiere_fichadas END, nr.cod_nov IS NULL) as nr_requiere_fichadas,
          nr.corridos as nr_corridos,
          cod_nov_pred_fecha, 
          ni.cod_nov as cod_nov_ini,
          fv.fichadas,
          fv.cod_nov as fv_cod_nov,
          COALESCE(p.inicia_fichada, p.registra_novedades_desde) as fecha_inicio_fichada,
          COALESCE(CASE WHEN nr.cod_nov IS NOT NULL THEN nr.cuenta_horas ELSE ni.cuenta_horas END, nr.cod_nov IS NULL) as nr_cuenta_horas
        FROM fechas f INNER JOIN annios a USING (annio) CROSS JOIN personas p
          LEFT JOIN fichadas_vigentes fv USING (idper, fecha)
          LEFT JOIN LATERAL (
            SELECT nr.cod_nov, cn.corridos, nr.detalles, cn.requiere_fichadas, 
                dds0, dds1, dds2, dds3, dds4, dds5, dds6, cn.c_dds, cn.cuenta_horas
              FROM novedades_registradas nr LEFT JOIN cod_novedades cn ON nr.cod_nov = cn.cod_nov
              LEFT JOIN tipos_novedad tn USING (tipo_novedad)
              WHERE f.fecha BETWEEN nr.desde AND nr.hasta
                AND p.idper = nr.idper                
              ORDER BY tn.orden, nr.idr DESC LIMIT 1
          ) nr ON true
          LEFT JOIN LATERAL (
            SELECT nr.cod_nov, cn.corridos, nr.detalles, cn.requiere_fichadas,  
                dds0, dds1, dds2, dds3, dds4, dds5, dds6, cn.c_dds, cn.cuenta_horas
              FROM novedades_registradas nr LEFT JOIN cod_novedades cn ON nr.cod_nov = cn.cod_nov
              WHERE f.fecha BETWEEN nr.desde AND nr.hasta
                AND p.idper = nr.idper
                AND nr.tipo_novedad = 'I'
              ORDER BY nr.idr DESC LIMIT 1
          ) ni ON true -- novedad inicial
        WHERE f.fecha BETWEEN p_desde AND p_hasta
          AND f.fecha <= COALESCE(p.fecha_egreso, '2999-12-31'::date)
          AND f.fecha >= p.registra_novedades_desde           
          AND p.idper = p_idper
      ) x
$$;


ALTER FUNCTION siper.novedades_calculadas_idper(p_desde date, p_hasta date, p_idper text) OWNER TO siper_owner;

-- CHANGED: siper.novedades_calculadas(date, date)

CREATE OR REPLACE FUNCTION siper.novedades_calculadas(p_desde date, p_hasta date) RETURNS SETOF siper.novedades_calculadas_return
    LANGUAGE sql STABLE
    AS $$
  SELECT
-- ¡ATENCIÓN! NO MODIFICAR MANUALMENTE ESTA FUNCIÓN FUE GENERADA CON EL SCRIPT novedades_calculadas.sql
-- Otras funciones que comienzan con el nombre novedades_calculadas se generaron junto a esta!
      idper, fecha, 
      CASE WHEN trabajable OR nr_corridos THEN 
        coalesce(CASE WHEN fichadas_consolidadas AND nr_requiere_fichadas AND fecha >= fecha_inicio_fichada THEN fv_cod_nov ELSE null END, nr_cod_nov, cod_nov_pred_fecha) 
      ELSE null END as cod_nov, 
      ficha, fichadas, sector, annio,
      trabajable, detalles, cod_nov_ini,
      CASE WHEN fichadas_consolidadas AND nr_cuenta_horas AND trabajable AND fecha >= fecha_inicio_fichada THEN duration(fichadas) ELSE null END as horas
    FROM (
      SELECT p.idper, p.ficha, f.fecha, f.fichadas_consolidadas,
          (f.dds BETWEEN 1 AND 5) AND (laborable is not false OR inamovible is not true AND f.dds NOT BETWEEN 1 AND 5) as trabajable,
          p.sector, f.annio, nr.detalles,
          CASE WHEN (nr.c_dds IS NOT TRUE -- FILTRO PARA DIAGRAMADO POR DIA DE SEMANA:
            OR CASE f.dds WHEN 0 THEN nr.dds0 WHEN 1 THEN nr.dds1 WHEN 2 THEN nr.dds2 WHEN 3 THEN nr.dds3 WHEN 4 THEN nr.dds4 WHEN 5 THEN nr.dds5 WHEN 6 THEN nr.dds6 END
          ) THEN nr.cod_nov ELSE null END as nr_cod_nov,
          COALESCE(CASE WHEN nr.cod_nov IS NOT NULL THEN nr.requiere_fichadas ELSE ni.requiere_fichadas END, nr.cod_nov IS NULL) as nr_requiere_fichadas,
          nr.corridos as nr_corridos,
          cod_nov_pred_fecha, 
          ni.cod_nov as cod_nov_ini,
          fv.fichadas,
          fv.cod_nov as fv_cod_nov,
          COALESCE(p.inicia_fichada, p.registra_novedades_desde) as fecha_inicio_fichada,
          COALESCE(CASE WHEN nr.cod_nov IS NOT NULL THEN nr.cuenta_horas ELSE ni.cuenta_horas END, nr.cod_nov IS NULL) as nr_cuenta_horas
        FROM fechas f INNER JOIN annios a USING (annio) CROSS JOIN personas p
          LEFT JOIN fichadas_vigentes fv USING (idper, fecha)
          LEFT JOIN LATERAL (
            SELECT nr.cod_nov, cn.corridos, nr.detalles, cn.requiere_fichadas, 
                dds0, dds1, dds2, dds3, dds4, dds5, dds6, cn.c_dds, cn.cuenta_horas
              FROM novedades_registradas nr LEFT JOIN cod_novedades cn ON nr.cod_nov = cn.cod_nov
              LEFT JOIN tipos_novedad tn USING (tipo_novedad)
              WHERE f.fecha BETWEEN nr.desde AND nr.hasta
                AND p.idper = nr.idper                
              ORDER BY tn.orden, nr.idr DESC LIMIT 1
          ) nr ON true
          LEFT JOIN LATERAL (
            SELECT nr.cod_nov, cn.corridos, nr.detalles, cn.requiere_fichadas,  
                dds0, dds1, dds2, dds3, dds4, dds5, dds6, cn.c_dds, cn.cuenta_horas
              FROM novedades_registradas nr LEFT JOIN cod_novedades cn ON nr.cod_nov = cn.cod_nov
              WHERE f.fecha BETWEEN nr.desde AND nr.hasta
                AND p.idper = nr.idper
                AND nr.tipo_novedad = 'I'
              ORDER BY nr.idr DESC LIMIT 1
          ) ni ON true -- novedad inicial
        WHERE f.fecha BETWEEN p_desde AND p_hasta
          AND f.fecha <= COALESCE(p.fecha_egreso, '2999-12-31'::date)
          AND f.fecha >= p.registra_novedades_desde           
          /*idper**AND p.idper = p_idper**idper*/
      ) x
$$;


ALTER FUNCTION siper.novedades_calculadas(p_desde date, p_hasta date) OWNER TO siper_owner;

CREATE OR REPLACE FUNCTION siper.parsear_horario(p_cod_horario text) RETURNS jsonb
    LANGUAGE sql IMMUTABLE
    AS $$
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
$$;


ALTER FUNCTION siper.parsear_horario(p_cod_horario text) OWNER TO siper_owner;
CREATE OR REPLACE FUNCTION siper.parseo_horario_tabla(p_json_horarios jsonb) RETURNS TABLE(dds integer, hora_desde time without time zone, hora_hasta time without time zone)
    LANGUAGE sql IMMUTABLE
    AS $$
  select dds.* 
    from jsonb_array_elements(p_json_horarios -> 'ds') e,
      lateral (
	    select dds::integer as dds, (e->>'desde')::time as hora_desde, (e->>'hasta')::time as hora_hasta
	      from jsonb_array_elements_text(e->'dias') dds
	  ) dds
$$;


ALTER FUNCTION siper.parseo_horario_tabla(p_json_horarios jsonb) OWNER TO siper_owner;

-- CHANGED: siper.personas_actualizar_novedades_trg()

CREATE OR REPLACE FUNCTION siper.personas_actualizar_novedades_trg() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_rangos datemultirange := '{}';
  v_abiertos datemultirange := (select multirange(daterange(make_date(min(annio),1,1), make_date(max(annio),12,31),'[]')) from annios where abierto);
  v_idper text;
  v_rango daterange;
BEGIN
  IF tg_op <> 'INSERT' THEN
    v_idper := old.idper;
    v_rangos := v_rangos + multirange(daterange(old.registra_novedades_desde, old.fecha_egreso, '[]'));
  END IF;
  IF tg_op <> 'DELETE' THEN
    v_idper := new.idper;
    v_rangos := v_rangos + multirange(daterange(new.registra_novedades_desde, new.fecha_egreso, '[]'));
  END IF;
  FOR v_rango IN SELECT * FROM UNNEST(v_rangos * v_abiertos) LOOP
    CALL actualizar_novedades_vigentes_idper(lower(v_rango), upper(v_rango), v_idper);
  END LOOP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION siper.personas_actualizar_novedades_trg() OWNER TO siper_owner;

-- EXTRA: siper.rango_simple_fichadas(text, date)
DROP FUNCTION IF EXISTS siper.rango_simple_fichadas(text, date);
