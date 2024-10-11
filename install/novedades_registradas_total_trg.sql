-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION total_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
DECLARE
  vtotal boolean; 
BEGIN
  SELECT total INTO vtotal
    FROM cod_novedades
    WHERE cod_nov = NEW.cod_nov;
  IF NOT COALESCE(vtotal, false) THEN
    RAISE 'Novedad codigo % indica novedad TOTAL', NEW.cod_nov USING ERRCODE = 'P1005';
  END IF;
  RETURN NEW;
END;
$BODY$;

DROP TRIGGER IF EXISTS total_trg on novedades_registradas;
CREATE TRIGGER total_trg
  BEFORE INSERT OR UPDATE OF cod_nov
  ON novedades_registradas
  FOR EACH ROW
  EXECUTE PROCEDURE total_trg();
