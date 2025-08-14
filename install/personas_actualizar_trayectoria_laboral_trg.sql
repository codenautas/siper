-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION personas_actualizar_trayectoria_laboral_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  IF tg_op = 'DELETE' OR tg_op = 'UPDATE' AND (old.sector, old.idper) is distinct from (new.sector, new.idper) THEN
    CALL actualizar_sector_idper(old.sector, old.idper);
  END IF;
  IF tg_op <> 'DELETE' THEN
    CALL actualizar_sector_idper(new.sector, new.idper);
  END IF;
  IF tg_op = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$BODY$;

DROP TRIGGER IF EXISTS personas_actualizar_trayectoria_laboral_trg on personas;
CREATE TRIGGER personas_actualizar_trayectoria_laboral_trg
  AFTER INSERT OR UPDATE OR DELETE
  ON personas
  FOR EACH ROW
  EXECUTE PROCEDURE personas_actualizar_trayectoria_laboral_trg();

