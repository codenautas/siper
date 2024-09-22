-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION novedades_registradas_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  IF tg_op = 'DELETE' OR tg_op = 'UPDATE' AND (old.desde, old.hasta, old.idper) is distinct from (new.desde, new.hasta, new.idper) THEN
    PERFORM calcular_novedades_vigentes_idper(old.desde, old.hasta, old.idper);
  END IF;
  IF tg_op <> 'DELETE' THEN
    -- La siguiente línea está solamente para ver funcionar el caso de prueba que espera el error 42501
    -- IF new.idper = '10330010071' THEN RAISE EXCEPTION 'no tiene permiso' USING ERRCODE = '42501'; END IF;
    PERFORM calcular_novedades_vigentes_idper(new.desde, new.hasta, new.idper);
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

