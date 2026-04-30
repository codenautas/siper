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
    IF lower(new.fichadas) IS NULL AND upper(new.fichadas) IS NULL THEN
      NEW.cod_nov := v_regla.codnov_sin_fichadas;
    ELSIF lower(new.fichadas) IS NULL OR upper(new.fichadas) IS NULL THEN
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

CREATE OR REPLACE FUNCTION multirango_fichadas(p_idper text, p_fecha date) 
  RETURNS time_multirange 
  STABLE LANGUAGE SQL
AS
$sql$
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
      MIN(CASE WHEN tipo_fichada = 'E' THEN hora END) AS entrada,
      MAX(CASE WHEN tipo_fichada = 'S' THEN hora END) AS salida
    FROM eventos
    GROUP BY grupo
  )
  SELECT coalesce(range_agg(time_range(entrada, salida)), time_multirange()) AS presencia
    FROM rangos;
$sql$;

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