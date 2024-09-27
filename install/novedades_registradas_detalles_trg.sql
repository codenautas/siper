-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION detalles_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
DECLARE
  vcon_detalles boolean; 
BEGIN
  SELECT con_detalles INTO vcon_detalles
    FROM cod_novedades
    WHERE cod_nov = NEW.cod_nov;
  IF vcon_detalles AND NEW.detalles IS NULL THEN
    RAISE 'Novedad codigo % indica CON detalles', NEW.cod_nov USING ERRCODE = 'P1003';
  END IF;
  IF NOT vcon_detalles AND NEW.detalles IS NOT NULL THEN
    RAISE 'Novedad codigo % indica SIN detalles', NEW.cod_nov USING ERRCODE = 'P1004';
  END IF;
  RETURN NEW;
END;
$BODY$;

DROP TRIGGER IF EXISTS detalles_trg on novedades_registradas;
CREATE TRIGGER detalles_trg
  BEFORE INSERT OR UPDATE OF detalles, cod_nov
  ON novedades_registradas
  FOR EACH ROW
  EXECUTE PROCEDURE detalles_trg();
