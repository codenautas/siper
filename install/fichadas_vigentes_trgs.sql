-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

/* ATENCIÓN:
 * Estos son todos los triggers (sobre fechas y personas y annios) que van a rellenar fichadas_vigentes
 * y actualizar los datos correspondientes
 */
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
      SET fichadas = multirango_fichadas(fv.idper, fv.fecha)
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
      SET fichadas = multirango_fichadas(fv.idper, fv.fecha)
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
    SET fichadas = multirango_fichadas(idper, fecha)
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
$BODY$;

CREATE OR REPLACE FUNCTION fichadas_vigentes_a_novedades_trg()
  RETURNS TRIGGER
  SECURITY DEFINER
  LANGUAGE plpgsql
AS
$BODY$
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
$BODY$;

CREATE OR REPLACE FUNCTION siper.multirango_fichadas(p_idper text, p_fecha date) 
  RETURNS time_multirange 
  STABLE LANGUAGE SQL
AS
$sql$
  WITH eventos_raw(hora, tipo_fichada) AS (
    SELECT hora, tipo_fichada,
        ROW_NUMBER() OVER (ORDER BY hora, tipo_fichada desc) AS orden,
        COUNT(*) OVER () AS cantidad,
        hora - MIN(hora) OVER () AS elapsed
      FROM fichadas f 
      WHERE f.fecha = p_fecha AND f.idper = p_idper AND tipo_fichada in ('E', 'S')
  ),
  eventos_imp AS (
    SELECT
      hora,
      -- CASE
      --  WHEN cantidad > 1 AND orden = 1        AND tipo_fichada = 'S' THEN 'E'
      --  WHEN cantidad > 1 AND orden = cantidad AND tipo_fichada = 'E' AND elapsed >= '5 hours'::interval THEN 'S'
      --  ELSE tipo_fichada
      -- END AS 
      tipo_fichada
    FROM eventos_raw
  ),
  primeros AS (
    SELECT hora, tipo_fichada
    FROM (
        SELECT hora, tipo_fichada, LAG(tipo_fichada) OVER (ORDER BY hora, tipo_fichada desc) AS tipo_anterior
        FROM eventos_imp
    ) t
    WHERE tipo_fichada IS DISTINCT FROM tipo_anterior
  ),
  eventos AS (
    SELECT
      hora,
      tipo_fichada,
      SUM(CASE WHEN tipo_fichada = 'E' THEN 1 ELSE 0 END) OVER (ORDER BY hora, tipo_fichada desc ROWS UNBOUNDED PRECEDING) AS grupo
    FROM primeros
  ),
  rangos AS (
    SELECT
      grupo,
      MIN(CASE WHEN tipo_fichada = 'E' THEN greatest(bh.hora_desde, least(bh.hora_hasta, hora)) END) AS entrada,
      MAX(CASE WHEN tipo_fichada = 'S' THEN greatest(bh.hora_desde, least(bh.hora_hasta, hora)) END) AS salida
    FROM eventos,
        personas p INNER JOIN bandas_horarias bh USING (banda_horaria)
      WHERE p.idper = p_idper
    GROUP BY grupo, bh.hora_desde, bh.hora_hasta
  )
  SELECT coalesce(range_agg(time_range(entrada, salida,'()')), time_multirange()) AS presencia
    FROM rangos;
$sql$;

/*

SET search_path = siper; SET ROLE siper_muleto_owner;
drop schema if exists casos_prueba_multirango_fichadas cascade;
create schema casos_prueba_multirango_fichadas;
create table casos_prueba_multirango_fichadas.fichadas(
    idper text, 
    fecha date,
    hora time, 
    tipo_fichada text
);

create table casos_prueba_multirango_fichadas.bandas_horarias(
    banda_horaria text,
    hora_desde time default '08:00',
    hora_hasta time default '20:00'
);

create table casos_prueba_multirango_fichadas.personas(
    idper text,
    banda_horaria text
);

insert into casos_prueba_multirango_fichadas.bandas_horarias (banda_horaria) values ('N');
insert into casos_prueba_multirango_fichadas.personas values ('A1', 'N');

insert into casos_prueba_multirango_fichadas.fichadas(idper, fecha, hora, tipo_fichada)
values
    ('A1', '2026-05-05', '08:00', 'E'),
    ('A1', '2026-05-05', '16:00', 'S'),
    
    ('A1', '2026-05-06', '08:00', 'E'),
    ('A1', '2026-05-06', '10:00', 'S'),
    ('A1', '2026-05-06', '11:00', 'E'),
    ('A1', '2026-05-06', '17:00', 'S'),
    
    ('A1', '2026-05-07', '09:00', 'E'),
    ('A1', '2026-05-07', '11:00', 'S'),
    ('A1', '2026-05-07', '11:00', 'E'),
    ('A1', '2026-05-07', '17:00', 'S'),

    ('A1', '2026-05-08', '08:00', 'S'),
    ('A1', '2026-05-08', '16:00', 'S'),

    ('A1', '2026-05-09', '08:00', 'E'),
    ('A1', '2026-05-09', '16:00', 'E'),

    ('A1', '2026-05-12', '08:00', 'E'),
    ('A1', '2026-05-12', '12:00', 'E'),

    ('A1', '2026-05-13', '08:00', 'E'),
    ('A1', '2026-05-13', '12:00', 'E'),
    ('A1', '2026-05-13', '13:00', 'S'),
    ('A1', '2026-05-13', '14:00', 'E'),

    ('A1', '2026-05-14', '08:00', 'E'),
    ('A1', '2026-05-14', '12:00', 'S'),
    ('A1', '2026-05-14', '13:00', 'E'),
    ('A1', '2026-05-14', '13:00', 'S'),
    ('A1', '2026-05-14', '14:00', 'S'),

    ('A1', '2026-05-15', '08:00', 'E'),
    ('A1', '2026-05-15', '12:00', 'S'),
    ('A1', '2026-05-15', '12:00', 'E'),
    ('A1', '2026-05-15', '13:00', 'E'),
    ('A1', '2026-05-15', '13:00', 'S'),
    ('A1', '2026-05-15', '14:00', 'S')
;
set search_path = casos_prueba_multirango_fichadas, siper;

select * from fichadas;

select *, case when obtenido = esperado then 'ok' else 'error' end as ok from (
select fecha, multirango_fichadas(idper, fecha) as obtenido, esperado
  from (
    values 
        ('A1', '2026-05-05'::date, '{(08:00:00,16:00:00)}'::time_multirange),
        ('A1', '2026-05-06'::date, '{(08:00:00,10:00:00),(11:00:00,17:00:00)}'::time_multirange),
        ('A1', '2026-05-07'::date, '{(09:00:00,11:00:00),(11:00:00,17:00:00)}'::time_multirange),
        ('A1', '2026-05-08'::date, '{(,08:00:00)}'::time_multirange),
        ('A1', '2026-05-09'::date, '{(08:00:00,)}'::time_multirange),
        ('A1', '2026-05-12'::date, '{(08:00:00,)}'::time_multirange),
        ('A1', '2026-05-13'::date, '{(08:00:00,13:00:00),(14:00:00,)}'::time_multirange),
        ('A1', '2026-05-14'::date, '{(08:00:00,12:00:00),(13:00:00,14:00:00)}'::time_multirange),
        ('A1', '2026-05-15'::date, '{(08:00:00,12:00:00),(12:00:00,13:00:00),(13:00:00,14:00:00)}'::time_multirange)
        
        -- ('A1', '2026-05-08'::date, '{(08:00:00,16:00:00)}'::time_multirange),
        -- ('A1', '2026-05-09'::date, '{(08:00:00,16:00:00)}'::time_multirange),
        -- ('A1', '2026-05-12'::date, '{(08:00:00,)}'::time_multirange),
        -- ('A1', '2026-05-13'::date, '{(08:00:00,13:00:00)}'::time_multirange),
        -- ('A1', '2026-05-14'::date, '{(08:00:00,12:00:00),(13:00:00,14:00:00)}'::time_multirange),
  ) as x (idper, fecha, esperado)
) tests
order by fecha;


*/

CREATE TRIGGER personas_fichadas_vigentes_trg 
  AFTER INSERT OR UPDATE OF activo
  ON personas 
  FOR EACH ROW 
  EXECUTE PROCEDURE personas_fichadas_vigentes_trg();

CREATE TRIGGER annios_fichadas_vigentes_trg 
  AFTER INSERT OR UPDATE OF abierto
  ON annios 
  FOR EACH ROW 
  EXECUTE PROCEDURE annios_fichadas_vigentes_trg();

CREATE TRIGGER fechas_fichadas_vigentes_trg 
  AFTER INSERT OR UPDATE OF laborable
  ON fechas 
  FOR EACH ROW 
  EXECUTE PROCEDURE fechas_fichadas_vigentes_trg();

CREATE TRIGGER fichadas_vigentes_cod_nov_trg
  BEFORE INSERT OR UPDATE OF fichadas
  ON fichadas_vigentes
  FOR EACH ROW
  EXECUTE PROCEDURE fichadas_vigentes_cod_nov_trg();

CREATE TRIGGER fichadas_vigentes_a_novedades_trg
  AFTER INSERT OR UPDATE OF fichadas
  ON fichadas_vigentes
  FOR EACH ROW
  EXECUTE PROCEDURE fichadas_vigentes_a_novedades_trg();

CREATE TRIGGER fichadas_fichadas_vigentes_trg 
  AFTER INSERT OR UPDATE
  ON fichadas 
  FOR EACH ROW 
  EXECUTE PROCEDURE fichadas_fichadas_vigentes_trg();

/*
CREATE OR REPLACE FUNCTION fichadas_vigentes_novedades_vigentes_trg()
  RETURNS TRIGGER
  SECURITY DEFINER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  IF tg_op = 'INSERT' THEN
    IF new.fichadas <> time_multirange() THEN
      CALL actualizar_novedades_vigentes_idper(new.fecha, new.fecha, new.idper);
    END IF;
  ELSE
    IF new.fichadas IS DISTINCT FROM old.fichadas END THEN
      CALL actualizar_novedades_vigentes_idper(new.fecha, new.fecha, new.idper);
    END IF;
  END IF;
  RETURN NEW;
END;
$BODY$;

CREATE TRIGGER fichadas_vigentes_novedades_vigentes_trg 
  AFTER INSERT OR UPDATE
  ON fichadas_vigentes
  FOR EACH ROW 
  EXECUTE PROCEDURE fichadas_vigentes_novedades_vigentes_trg();

*/