-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION con_novedad_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
DECLARE
  vcon_novedad boolean; 
BEGIN
IF NEW.cod_nov IS NOT NULL THEN
  SELECT con_novedad INTO vcon_novedad
    FROM cod_novedades
    WHERE cod_nov = NEW.cod_nov;
  IF NOT COALESCE(vcon_novedad, false) THEN
    RAISE 'Novedad codigo % NO indica novedad CON NOVEDAD', NEW.cod_nov USING ERRCODE = 'P1008';
  END IF;
END IF;
RETURN NEW;
END;
$BODY$;

DROP TRIGGER IF EXISTS con_novedad_trg on novedades_registradas;
CREATE TRIGGER con_novedad_trg
  BEFORE INSERT OR UPDATE OF cod_nov
  ON novedades_registradas
  FOR EACH ROW
  EXECUTE PROCEDURE con_novedad_trg();
