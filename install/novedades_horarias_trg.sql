-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION novedades_horarias_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  NEW.lapso = tsrange(new.fecha + coalesce(new.desde_hora, '00:00'::time), new.fecha + coalesce(new.hasta_hora, '23:59'::time));
  RETURN NEW;
END;
$BODY$;

DROP TRIGGER IF EXISTS novedades_horarias_trg on novedades_horarias_trg;
CREATE TRIGGER novedades_horarias_trg
  BEFORE INSERT OR UPDATE OF desde_hora, hasta_hora, lapso
  ON novedades_horarias
  FOR EACH ROW
  EXECUTE PROCEDURE novedades_horarias_trg();

