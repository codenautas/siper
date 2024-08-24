-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION fechas_nov_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  IF tg_op = 'DELETE' OR tg_op = 'UPDATE' AND old.fecha is distinct from new.fecha THEN
    PERFORM calcular_novedades_vigentes(old.fecha, old.fecha, null);
  END IF;
  IF tg_op <> 'DELETE' THEN
    PERFORM calcular_novedades_vigentes(new.fecha, new.fecha, null);
  END IF;
  IF tg_op = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$BODY$;

DROP TRIGGER IF EXISTS fechas_nov_trg on fechas;
CREATE TRIGGER fechas_nov_trg
  AFTER INSERT OR UPDATE OR DELETE
  ON fechas
  FOR EACH ROW
  EXECUTE PROCEDURE fechas_nov_trg();

