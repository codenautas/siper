-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION parcial_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
DECLARE
  vparcial boolean; 
BEGIN
  SELECT parcial INTO vparcial
    FROM cod_novedades
    WHERE cod_nov = NEW.cod_nov;
  IF NOT COALESCE(vparcial, false) THEN
    RAISE 'Novedad codigo % NO indica novedad PARCIAL', NEW.cod_nov USING ERRCODE = 'P1006';
  END IF;
  RETURN NEW;
END;
$BODY$;

DROP TRIGGER IF EXISTS parcial_trg on novedades_horarias;
CREATE TRIGGER parcial_trg
  BEFORE INSERT OR UPDATE OF cod_nov
  ON novedades_horarias
  FOR EACH ROW
  EXECUTE PROCEDURE parcial_trg();
