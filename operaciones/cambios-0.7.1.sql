-- Cambios desde la versión 0.7.1
set search_path = siper;

set role to siper_muleto_owner;

DROP TYPE siper.novedades_calculadas_return;

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
	cod_nov_ini text
);

ALTER TABLE cod_novedades ALTER column pierde_persentismo RENAME TO injustificado;
ALTER TABLE siper.cod_novedades ADD COLUMN sr_grupo text;
ALTER TABLE siper.cod_novedades ADD CONSTRAINT "sr_grupo<>''" CHECK ((sr_grupo <> ''::text));

ALTER TABLE siper.fichadas_vigentes ALTER COLUMN "fichadas" TYPE siper.time_multirange USING clause
ALTER TABLE siper.fichadas_vigentes ALTER COLUMN "fichadas" SET DEFAULT '{}'::siper.time_multirange NOT NULL;

ALTER TABLE siper.novedades_vigentes ALTER COLUMN "fichadas" TYPE siper.time_multirange USING clause

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


ALTER FUNCTION siper.cardinality(mr siper.time_multirange) OWNER TO siper_owner;

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
    IF lower(new.fichadas) IS NULL AND upper(new.fichadas) IS NULL THEN
      NEW.cod_nov := v_regla.codnov_sin_fichadas;
    ELSIF lower(new.fichadas) IS NULL AND cardinality(new.fichadas) <= 1 OR upper(new.fichadas) IS NULL THEN
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
