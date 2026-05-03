-- Cambios desde la versión 0.7.1
set search_path = siper;

set role to siper_muleto_owner;

DROP FUNCTION novedades_calculadas(date, date);
DROP FUNCTION novedades_calculadas_idper(date, date, text);

DROP TYPE siper.novedades_calculadas_return;

DROP TRIGGER fichadas_vigentes_a_novedades_trg ON fichadas_vigentes;
DROP TRIGGER fichadas_vigentes_cod_nov_trg ON fichadas_vigentes;

/*
CREATE OR REPLACE FUNCTION siper.fichadas_vigentes_a_novedades_trg() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN NEW;
END;
$$;
*/

CREATE TYPE siper.novedades_calculadas_return AS (
	idper text,
	fecha date,
	cod_nov text,
	ficha text,
	fichadas siper.time_multirange,
	sector text,
	annio integer,
	trabajable boolean,
	detalles text,
	cod_nov_ini text,
    horas interval
);

ALTER TABLE cod_novedades RENAME COLUMN pierde_presentismo TO injustificado;
ALTER TABLE siper.cod_novedades ADD COLUMN sr_grupo text;
ALTER TABLE siper.cod_novedades ADD CONSTRAINT "sr_grupo<>''" CHECK ((sr_grupo <> ''::text));

ALTER TABLE siper.fichadas_vigentes ALTER COLUMN "fichadas" DROP DEFAULT;
ALTER TABLE siper.fichadas_vigentes ALTER COLUMN "fichadas" TYPE siper.time_multirange USING CASE
    WHEN fichadas IS NULL THEN NULL
    ELSE siper.time_multirange(fichadas)
  END;
ALTER TABLE siper.fichadas_vigentes ALTER COLUMN "fichadas" SET DEFAULT '{}'::siper.time_multirange;
ALTER TABLE siper.fichadas_vigentes ALTER COLUMN "fichadas" SET NOT NULL;

ALTER TABLE siper.novedades_vigentes ALTER COLUMN "fichadas" TYPE siper.time_multirange USING CASE
    WHEN fichadas IS NULL THEN NULL
    ELSE siper.time_multirange(fichadas)
  END;

ALTER TABLE siper.novedades_vigentes ADD COLUMN horas interval;

ALTER TABLE siper.situacion_revista ADD COLUMN nov_grupo text;
ALTER TABLE siper.situacion_revista DROP COLUMN "con_novedad";
ALTER TABLE siper.situacion_revista ADD CONSTRAINT "nov_grupo<>''" CHECK ((nov_grupo <> ''::text));

DROP TRIGGER IF EXISTS changes_trg ON siper.novedades_registradas;

GRANT DELETE ON TABLE siper.fichadas_recibidas TO siper_modulo_fichador;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE siper.fichadas_recibidas TO siper_admin;

CREATE FUNCTION siper.cardinality(mr siper.time_multirange) RETURNS integer
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT COUNT(*)::integer FROM unnest(mr);
$$;

CREATE FUNCTION siper.duration(mr siper.time_multirange) RETURNS interval
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT SUM(upper(r) - lower(r))
  FROM unnest(mr) AS r;
$$;

CREATE FUNCTION siper.multirango_fichadas(p_idper text, p_fecha date) RETURNS siper.time_multirange
    LANGUAGE sql STABLE
    AS $$
  WITH eventos_raw(hora, tipo_fichada) AS (
    SELECT hora, tipo_fichada
      FROM fichadas f 
      WHERE f.fecha = p_fecha AND f.idper = p_idper AND tipo_fichada in ('E', 'S')
  ),
  primeros AS (
    SELECT hora, tipo_fichada
    FROM (
        SELECT hora, tipo_fichada, LAG(tipo_fichada) OVER (ORDER BY hora) AS tipo_anterior
        FROM eventos_raw
    ) t
    WHERE tipo_fichada IS DISTINCT FROM tipo_anterior
  ),
  eventos AS (
    SELECT
      hora,
      tipo_fichada,
      SUM(CASE WHEN tipo_fichada = 'E' THEN 1 ELSE 0 END) OVER (ORDER BY hora ROWS UNBOUNDED PRECEDING) AS grupo
    FROM primeros
  ),
  rangos AS (
    SELECT
      grupo,
      MIN(CASE WHEN tipo_fichada = 'E' THEN CASE WHEN hora < bh.hora_desde THEN bh.hora_desde ELSE hora END END) AS entrada,
      MAX(CASE WHEN tipo_fichada = 'S' THEN CASE WHEN hora > bh.hora_hasta THEN bh.hora_hasta ELSE hora END END) AS salida
    FROM eventos,
        personas p INNER JOIN bandas_horarias bh USING (banda_horaria)
      WHERE p.idper = p_idper
    GROUP BY grupo
  )
  SELECT coalesce(range_agg(time_range(entrada, salida)), time_multirange()) AS presencia
    FROM rangos;
$$;

CREATE OR REPLACE FUNCTION siper.annios_fichadas_vigentes_trg() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF new.abierto THEN
    INSERT INTO fichadas_vigentes (idper, fecha)
      SELECT idper, fecha
        FROM fechas f, personas p
        WHERE f.annio = new.annio
          AND p.activo
      ON CONFLICT DO NOTHING;
    UPDATE fichadas_vigentes fv
      SET fichadas = multirango_fichadas(fv.idper, fv.fecha)
      FROM personas p
      WHERE fv.annio = new.annio
        AND fv.idper = p.idper
        AND p.activo;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION siper.fechas_fichadas_vigentes_trg() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF new.annio IS NOT NULL THEN
    INSERT INTO fichadas_vigentes (idper, fecha)
      SELECT idper, new.fecha
        FROM personas p
        WHERE p.activo
      ON CONFLICT DO NOTHING;
    UPDATE fichadas_vigentes fv
      SET fichadas = multirango_fichadas(fv.idper, fv.fecha)
      FROM personas p, annios a
      WHERE fv.fecha = new.fecha
        AND fv.annio = a.annio
        AND fv.idper = p.idper
        AND a.abierto
        AND p.activo;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION siper.fichadas_fichadas_vigentes_trg() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO fichadas_vigentes (idper, fecha)
    VALUES (new.idper, new.fecha)
    ON CONFLICT DO NOTHING;
  UPDATE fichadas_vigentes
    SET fichadas = multirango_fichadas(idper, fecha)
    WHERE idper = new.idper
      AND fecha = new.fecha;
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION siper.fichadas_vigentes_a_novedades_trg() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF tg_op = 'INSERT' THEN
    IF new.fichadas <> time_multirange() THEN
      CALL actualizar_novedades_vigentes_idper(new.fecha, new.fecha, new.idper);
    END IF;
  ELSE
    IF new.fichadas IS DISTINCT FROM old.fichadas THEN
      CALL actualizar_novedades_vigentes_idper(new.fecha, new.fecha, new.idper);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION siper.fichadas_vigentes_cod_nov_trg() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
    IF cardinality(new.fichadas) <= 1 AND lower(new.fichadas) IS NULL AND upper(new.fichadas) IS NULL THEN
      NEW.cod_nov := v_regla.codnov_sin_fichadas;
    ELSIF cardinality(new.fichadas) <= 1 AND (lower(new.fichadas) IS NULL OR upper(new.fichadas) IS NULL) THEN
      NEW.cod_nov := v_regla.codnov_unica_fichada;
    ELSE
      NEW.cod_nov := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION siper.personas_fichadas_vigentes_trg() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF new.activo THEN
    INSERT INTO fichadas_vigentes (idper, fecha)
      SELECT new.idper, fecha
        FROM fechas f
          INNER JOIN annios a USING (annio)
        WHERE a.abierto
      ON CONFLICT DO NOTHING;
    UPDATE fichadas_vigentes fv
      SET fichadas = multirango_fichadas(fv.idper, fv.fecha)
      FROM annios a 
      WHERE fv.idper = new.idper
        AND fv.annio = a.annio
        AND a.abierto;
  END IF;
  RETURN NEW;
END;
$$;

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
        coalesce(CASE WHEN fichadas_consolidadas AND nr_requiere_fichadas AND fecha >= fecha_inicio_fichada THEN fv_cod_nov ELSE null END, nr_cod_nov, cod_nov_pred_fecha) 
      ELSE null END as cod_nov, 
      ficha, fichadas, sector, annio,
      trabajable, detalles, cod_nov_ini,
      CASE WHEN fichadas_consolidadas AND nr_cuenta_horas THEN duration(fichadas) ELSE null END as horas
    FROM (
      SELECT p.idper, p.ficha, f.fecha, f.fichadas_consolidadas,
          (f.dds BETWEEN 1 AND 5) AND (laborable is not false OR inamovible is not true AND f.dds NOT BETWEEN 1 AND 5) as trabajable,
          p.sector, f.annio, nr.detalles,
          CASE WHEN (nr.c_dds IS NOT TRUE -- FILTRO PARA DIAGRAMADO POR DIA DE SEMANA:
            OR CASE extract(DOW from f.fecha) WHEN 0 THEN nr.dds0 WHEN 1 THEN nr.dds1 WHEN 2 THEN nr.dds2 WHEN 3 THEN nr.dds3 WHEN 4 THEN nr.dds4 WHEN 5 THEN nr.dds5 WHEN 6 THEN nr.dds6 END
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


DO 
$CREATOR$
DECLARE
  v_sql text := $SQL_CON_TAG$

CREATE OR REPLACE PROCEDURE actualizar_novedades_vigentes/*idper**_idper**idper*/(p_desde date, p_hasta date/*idper**, p_idper text**idper*/)
  SECURITY DEFINER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
MERGE INTO novedades_vigentes nv 
  USING novedades_calculadas/*idper**_idper**idper*/(p_desde, p_hasta/*idper**, p_idper**idper*/) q
    ON nv.idper = q.idper AND nv.fecha = q.fecha
  WHEN MATCHED AND 
      (nv.ficha IS DISTINCT FROM q.ficha 
      OR nv.cod_nov IS DISTINCT FROM q.cod_nov 
      OR nv.fichadas IS DISTINCT FROM q.fichadas
      OR nv.sector IS DISTINCT FROM q.sector
      OR nv.detalles IS DISTINCT FROM q.detalles
      OR nv.trabajable IS DISTINCT FROM q.trabajable
      OR nv.cod_nov_ini IS DISTINCT FROM q.cod_nov_ini
      OR nv.horas IS DISTINCT FROM q.horas
      ) THEN
    UPDATE SET ficha = q.ficha, cod_nov = q.cod_nov, fichadas = q.fichadas, sector = q.sector, detalles = q.detalles,
      trabajable = q.trabajable, cod_nov_ini = q.cod_nov_ini, horas = q.horas
  WHEN NOT MATCHED THEN
    INSERT   (  idper,   ficha,   fecha,   cod_nov,   fichadas,   sector,   detalles,   trabajable,   cod_nov_ini,   horas)
      VALUES (q.idper, q.ficha, q.fecha, q.cod_nov, q.fichadas, q.sector, q.detalles, q.trabajable, q.cod_nov_ini, q.horas)
  WHEN NOT MATCHED BY SOURCE AND nv.fecha BETWEEN p_desde AND p_hasta/*idper** AND nv.idper = p_idper**idper*/ THEN DELETE;
END;
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

CREATE TRIGGER fichadas_vigentes_a_novedades_trg
  AFTER INSERT OR UPDATE OF fichadas
  ON fichadas_vigentes
  FOR EACH ROW
  EXECUTE PROCEDURE fichadas_vigentes_a_novedades_trg();

CREATE TRIGGER fichadas_vigentes_cod_nov_trg
  BEFORE INSERT OR UPDATE OF fichadas
  ON fichadas_vigentes
  FOR EACH ROW
  EXECUTE PROCEDURE fichadas_vigentes_cod_nov_trg();
