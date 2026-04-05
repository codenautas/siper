set role to postgres;
ALTER SEQUENCE siper.id_fichada OWNER TO siper_muleto_owner;

set search_path = siper;
set role to siper_muleto_owner;

CREATE TYPE siper.novedades_calculadas_return AS (
	idper text,
	fecha date,
	cod_nov text,
	ficha text,
	fichadas siper.time_range,
	sector text,
	annio integer,
	trabajable boolean,
	detalles text,
	cod_nov_ini text
);

CREATE OR REPLACE FUNCTION personas_fichadas_vigentes_trg()
  RETURNS TRIGGER
  SECURITY DEFINER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  IF new.activo THEN
    INSERT INTO fichadas_vigentes (idper, fecha)
      SELECT new.idper, fecha
        FROM fechas f
          INNER JOIN annios a USING (annio)
        WHERE a.abierto
      ON CONFLICT DO NOTHING;
    UPDATE fichadas_vigentes fv
      SET fichadas = rango_simple_fichadas(fv.idper, fv.fecha)
      FROM annios a 
      WHERE fv.idper = new.idper
        AND fv.annio = a.annio
        AND a.abierto;
  END IF;
  RETURN NEW;
END;
$BODY$;

CREATE OR REPLACE FUNCTION annios_fichadas_vigentes_trg()
  RETURNS TRIGGER
  SECURITY DEFINER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  IF new.abierto THEN
    INSERT INTO fichadas_vigentes (idper, fecha)
      SELECT idper, fecha
        FROM fechas f, personas p
        WHERE f.annio = new.annio
          AND p.activo
      ON CONFLICT DO NOTHING;
    UPDATE fichadas_vigentes fv
      SET fichadas = rango_simple_fichadas(fv.idper, fv.fecha)
      FROM personas p
      WHERE fv.annio = new.annio
        AND fv.idper = p.idper
        AND p.activo;
  END IF;
  RETURN NEW;
END;
$BODY$;

CREATE OR REPLACE FUNCTION fechas_fichadas_vigentes_trg()
  RETURNS TRIGGER
  SECURITY DEFINER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  IF new.annio IS NOT NULL THEN
    INSERT INTO fichadas_vigentes (idper, fecha)
      SELECT idper, new.fecha
        FROM personas p
        WHERE p.activo
      ON CONFLICT DO NOTHING;
    UPDATE fichadas_vigentes fv
      SET fichadas = rango_simple_fichadas(fv.idper, fv.fecha)
      FROM personas p, annios a
      WHERE fv.fecha = new.fecha
        AND fv.annio = a.annio
        AND fv.idper = p.idper
        AND a.abierto
        AND p.activo;
  END IF;
  RETURN NEW;
END;
$BODY$;

CREATE OR REPLACE FUNCTION fichadas_fichadas_vigentes_trg()
  RETURNS TRIGGER
  SECURITY DEFINER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  INSERT INTO fichadas_vigentes (idper, fecha)
    VALUES (new.idper, new.fecha)
    ON CONFLICT DO NOTHING;
  UPDATE fichadas_vigentes
    SET fichadas = rango_simple_fichadas(idper, fecha)
    WHERE idper = new.idper
      AND fecha = new.fecha;
  RETURN new;
END;
$BODY$;

CREATE OR REPLACE FUNCTION fichadas_vigentes_cod_nov_trg()
  RETURNS TRIGGER
  SECURITY DEFINER
  LANGUAGE plpgsql
AS
$BODY$
DECLARE
  v_annio integer := EXTRACT(YEAR FROM new.fecha);
  v_annio_abierto boolean;
  v_regla RECORD;
BEGIN
  SELECT a.abierto
    INTO v_annio_abierto
    FROM annios a
   WHERE a.annio = v_annio;
  IF v_annio_abierto THEN
    SELECT *
      INTO v_regla
      FROM reglas
      WHERE annio = v_annio;
    IF lower(new.fichadas) IS NULL AND upper(new.fichadas) IS NULL THEN
      NEW.cod_nov := v_regla.codnov_sin_fichadas;
    ELSIF lower(new.fichadas) IS NULL OR upper(new.fichadas) IS NULL THEN
      NEW.cod_nov := v_regla.codnov_unica_fichada;
    ELSE
      NEW.cod_nov := NULL;
    END IF;
  END IF;
  IF tg_op = 'INSERT' THEN
    IF new.fichadas <> '(,)' THEN
      CALL actualizar_novedades_vigentes_idper(new.fecha, new.fecha, new.idper);
    END IF;
  ELSE
    IF new.fichadas IS DISTINCT FROM old.fichadas THEN
      CALL actualizar_novedades_vigentes_idper(new.fecha, new.fecha, new.idper);
    END IF;
  END IF;
  RETURN NEW;
END;
$BODY$;

CREATE OR REPLACE FUNCTION rango_simple_fichadas(p_idper text, p_fecha date) 
  RETURNS time_range 
  STABLE LANGUAGE SQL
AS
$sql$
  WITH horas_entrada_salida as (
    SELECT 
        MIN(hora) FILTER (WHERE tipo_fichada = 'E') as hora_entrada,
        MAX(hora) FILTER (WHERE tipo_fichada = 'S') as hora_salida
      FROM fichadas f 
      WHERE f.fecha = p_fecha AND f.idper = p_idper
  )
  SELECT time_range(
      CASE WHEN hora_entrada < bh.hora_desde THEN bh.hora_desde ELSE hora_entrada END,
      CASE WHEN hora_salida  > bh.hora_hasta THEN bh.hora_hasta ELSE hora_salida  END
    )
    FROM horas_entrada_salida, 
        personas p 
          INNER JOIN bandas_horarias bh USING (banda_horaria)
      WHERE p.idper = p_idper;
$sql$;


DROP FUNCTION novedades_calculadas(date, date);
DROP FUNCTION novedades_calculadas_idper(date, date, text);


DO
$CREATOR$
DECLARE
  v_sql text := $SQL_CON_TAG$

CREATE OR REPLACE FUNCTION novedades_calculadas/*idper**_idper**idper*/(p_desde date, p_hasta date/*idper**, p_idper text**idper*/) RETURNS SETOF novedades_calculadas_return
  LANGUAGE SQL STABLE
AS
$BODY$
  SELECT
      idper, fecha, 
      CASE WHEN trabajable OR nr_corridos THEN 
        coalesce(CASE WHEN fichadas_consolidadas AND nr_requiere_fichadas THEN fv_cod_nov ELSE null END, nr_cod_nov, cod_nov_pred_fecha) 
      ELSE null END as cod_nov, 
      ficha, fichadas, sector, annio,
      trabajable, detalles, cod_nov_ini
    FROM (
      SELECT p.idper, p.ficha, f.fecha, f.fichadas_consolidadas,
          (f.dds BETWEEN 1 AND 5) AND (laborable is not false OR inamovible is not true AND f.dds NOT BETWEEN 1 AND 5) as trabajable,
          p.sector, f.annio, nr.detalles,
          CASE WHEN (nr.c_dds IS NOT TRUE -- FILTRO PARA DIAGRAMADO POR DIA DE SEMANA:
            OR CASE extract(DOW from f.fecha) WHEN 0 THEN nr.dds0 WHEN 1 THEN nr.dds1 WHEN 2 THEN nr.dds2 WHEN 3 THEN nr.dds3 WHEN 4 THEN nr.dds4 WHEN 5 THEN nr.dds5 WHEN 6 THEN nr.dds6 END
          ) THEN nr.cod_nov ELSE null END as nr_cod_nov,
          COALESCE(nr.requiere_fichadas, nr.cod_nov IS NULL) as nr_requiere_fichadas,
          nr.corridos as nr_corridos,
          cod_nov_pred_fecha, 
          ni.cod_nov as cod_nov_ini,
          fv.fichadas,
          fv.cod_nov as fv_cod_nov
        FROM fechas f INNER JOIN annios a USING (annio) CROSS JOIN personas p
          LEFT JOIN fichadas_vigentes fv USING (idper, fecha)
          LEFT JOIN LATERAL (
            SELECT nr.cod_nov, cn.corridos, nr.detalles, cn.requiere_fichadas, 
                dds0, dds1, dds2, dds3, dds4, dds5, dds6, cn.c_dds
              FROM novedades_registradas nr LEFT JOIN cod_novedades cn ON nr.cod_nov = cn.cod_nov
              LEFT JOIN tipos_novedad tn USING (tipo_novedad)
              WHERE f.fecha BETWEEN nr.desde AND nr.hasta
                AND p.idper = nr.idper                
              ORDER BY tn.orden, nr.idr DESC LIMIT 1
          ) nr ON true
          LEFT JOIN LATERAL (
            SELECT nr.cod_nov, cn.corridos, nr.detalles, 
                dds0, dds1, dds2, dds3, dds4, dds5, dds6, cn.c_dds
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
$BODY$;

$SQL_CON_TAG$;
BEGIN
  v_sql := replace(v_sql,
$$
$BODY$
  SELECT
$$, $$
$BODY$
  SELECT
-- ¡ATENCIÓN! NO MODIFICAR MANUALMENTE ESTA FUNCIÓN FUE GENERADA CON EL SCRIPT novedades_calculadas.sql
-- Otras funciones que comienzan con el nombre novedades_calculadas se generaron junto a esta!
$$);
  execute v_sql;
  execute replace(replace(v_sql,'/*idper**',''),'**idper*/','');
END;
$CREATOR$;


ALTER TABLE siper.fichadas_recibidas DROP CONSTRAINT IF EXISTS "ficha<>''";
ALTER TABLE siper.fichadas_recibidas DROP CONSTRAINT IF EXISTS "idper<>''";
ALTER TABLE siper.fichadas_recibidas DROP COLUMN IF EXISTS ficha;

ALTER TABLE siper.novedades_vigentes DROP CONSTRAINT "ent_fich<>''";
ALTER TABLE siper.novedades_vigentes DROP CONSTRAINT "sal_fich<>''";
ALTER TABLE siper.novedades_vigentes DROP COLUMN ent_fich;
ALTER TABLE siper.novedades_vigentes DROP COLUMN sal_fich;


ALTER TABLE ONLY siper.sinc_fichadores DROP CONSTRAINT cola_sincronizacion_usuarios_modulo_pkey;
ALTER TABLE ONLY siper.sinc_fichadores ADD CONSTRAINT sinc_fichadores_pkey PRIMARY KEY (num_sincro);

create or replace procedure avance_de_dia_proc()
  language sql
  security definer
begin atomic
  UPDATE fechas f
    SET cod_nov_pred_fecha = cod_nov_habitual
    FROM parametros, annios a
    WHERE cod_nov_pred_fecha is null
      AND fecha <= fecha_actual()
      AND f.annio = a.annio
      AND a.abierto;
end;

CREATE OR REPLACE FUNCTION parametros_avance_dia_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  CALL avance_de_dia_proc();
  RETURN new;
END;
$BODY$;

DROP TRIGGER IF EXISTS parametros_avance_dia_trg on parametros;
CREATE TRIGGER parametros_avance_dia_trg
  AFTER UPDATE OF fecha_hora_para_test
  ON parametros
  FOR EACH ROW
  EXECUTE PROCEDURE parametros_avance_dia_trg();

ALTER VIEW siper.personal_con_fichada OWNER TO siper_muleto_owner;
