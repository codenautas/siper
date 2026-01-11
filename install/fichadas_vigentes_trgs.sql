-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

/* ATENCIÓN:
 * Estos son todos los triggers (sobre fechas y personas y annios) que van a rellenar fichadas_vigentes
 * y actualizar los datos correspondientes
 */
CREATE OR REPLACE FUNCTION personas_fichadas_vigentes_ins_trg()
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
    RETURN NEW;
  END IF;
END;
$BODY$;

CREATE OR REPLACE FUNCTION annios_fichadas_vigentes_ins_trg()
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

CREATE OR REPLACE FUNCTION fechas_fichadas_vigentes_ins_trg()
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
      WHERE fv.annio = new.annio
        AND fv.idper = p.idper
        AND a.abierto
        AND p.activo;
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

CREATE TRIGGER personas_fichadas_vigentes_ins_trg 
  AFTER INSERT OR UPDATE OF activo
  ON personas 
  FOR EACH ROW 
  EXECUTE PROCEDURE personas_fichadas_vigentes_ins_trg();

CREATE TRIGGER annios_fichadas_vigentes_ins_trg 
  AFTER INSERT OR UPDATE OF abierto
  ON annios 
  FOR EACH ROW 
  EXECUTE PROCEDURE annios_fichadas_vigentes_ins_trg();

CREATE TRIGGER fechas_fichadas_vigentes_ins_trg 
  AFTER INSERT OR UPDATE OF laborable
  ON fechas 
  FOR EACH ROW 
  EXECUTE PROCEDURE fechas_fichadas_vigentes_ins_trg();
