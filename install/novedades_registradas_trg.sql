-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION novedades_registradas_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  IF tg_op = 'DELETE' OR tg_op = 'UPDATE' AND (old.desde, old.hasta, old.cuil) is distinct from (new.desde, new.hasta, new.cuil) THEN
    PERFORM calcular_novedades_vigentes(old.desde, old.hasta, old.cuil);
  END IF;
  IF tg_op <> 'DELETE' THEN
    PERFORM calcular_novedades_vigentes(new.desde, new.hasta, new.cuil);
  END IF;
  IF tg_op = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$BODY$;

DROP TRIGGER IF EXISTS novedades_registradas_trg on novedades_registradas;
CREATE TRIGGER novedades_registradas_trg
  AFTER INSERT OR UPDATE OR DELETE
  ON novedades_registradas
  FOR EACH ROW
  EXECUTE PROCEDURE novedades_registradas_trg();

