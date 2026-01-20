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
        AND p.activo
        AND a.abierto;
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
DECLARE
  v_idper  text;
  v_fecha  date;
BEGIN
  v_idper := COALESCE(NEW.idper, OLD.idper);
  v_fecha := COALESCE(NEW.fecha, OLD.fecha);

  INSERT INTO fichadas_vigentes (idper, fecha)
  VALUES (v_idper, v_fecha)
  ON CONFLICT DO NOTHING;
  UPDATE fichadas_vigentes
    SET fichadas = rango_simple_fichadas(v_idper, v_fecha)
    WHERE idper = v_idper
      AND fecha = v_fecha;
  RETURN NULL;
END;
$BODY$;

CREATE OR REPLACE FUNCTION fichadas_vigentes_cod_nov_trg()
  RETURNS TRIGGER
  SECURITY DEFINER
  LANGUAGE plpgsql
AS
$BODY$
DECLARE
  v_annio int;
BEGIN
  SELECT f.annio
    INTO v_annio
    FROM fechas f
    JOIN annios a ON a.annio = f.annio
   WHERE f.fecha = NEW.fecha
     --AND COALESCE(f.laborable, false)
     AND COALESCE(a.abierto, false)
   LIMIT 1;

  IF v_annio IS NOT NULL THEN
    NEW.cod_nov := cod_nov_por_fichadas(v_annio, NEW.fichadas);
  END IF;

  RETURN NEW;
END;
$BODY$;

CREATE OR REPLACE FUNCTION rango_simple_fichadas(p_idper text, p_fecha date) 
  RETURNS time_range 
  STABLE LANGUAGE SQL
AS
$sql$
  SELECT time_range(
        MIN(hora) FILTER (WHERE tipo_fichada = 'E'),
        MAX(hora) FILTER (WHERE tipo_fichada = 'S')
      )
    FROM fichadas
    WHERE fecha = p_fecha AND idper = p_idper;
$sql$;

CREATE OR REPLACE FUNCTION cod_nov_por_fichadas(p_annio int, p_fichadas time_range)
  RETURNS text
  STABLE LANGUAGE SQL
AS
$sql$
  WITH datos AS (
    SELECT
      lower(p_fichadas) AS ent,
      upper(p_fichadas) AS sal,
      CASE
        WHEN lower(p_fichadas) IS NOT NULL
         AND upper(p_fichadas) IS NOT NULL
        THEN EXTRACT(EPOCH FROM (upper(p_fichadas) - lower(p_fichadas))) / 3600.0
        ELSE 0
      END AS horas
  )
  SELECT CASE
    WHEN p_annio IS NULL THEN NULL
    WHEN r.annio IS NULL THEN NULL
    WHEN d.ent IS NULL AND d.sal IS NULL THEN r.codnov_sin_fichadas
    WHEN d.ent IS NULL OR  d.sal IS NULL THEN r.codnov_unica_fichada
    WHEN d.horas < r.umbral_horas_diarias THEN r.codnov_sin_fichadas
    ELSE NULL
  END
  FROM datos d
  LEFT JOIN reglas r ON r.annio = p_annio;
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

CREATE TRIGGER fichadas_fichadas_vigentes_trg
  AFTER INSERT OR UPDATE
  ON fichadas
  FOR EACH ROW
  EXECUTE PROCEDURE fichadas_fichadas_vigentes_trg();