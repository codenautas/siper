-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION con_horario_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
DECLARE
  vcon_horario boolean; 
BEGIN
IF NEW.cod_nov IS NOT NULL THEN
  SELECT con_horario INTO vcon_horario
    FROM cod_novedades
    WHERE cod_nov = NEW.cod_nov;
  IF NOT COALESCE(vcon_horario, false) THEN
    RAISE 'Novedad codigo % NO indica novedad CON HORARIO', NEW.cod_nov USING ERRCODE = 'P1007';
  END IF;
END IF;
RETURN NEW;
END;
$BODY$;

DROP TRIGGER IF EXISTS con_horario_trg on horarios;
CREATE TRIGGER con_horario_trg
  BEFORE INSERT OR UPDATE OF cod_nov
  ON horarios
  FOR EACH ROW
  EXECUTE PROCEDURE con_horario_trg();
