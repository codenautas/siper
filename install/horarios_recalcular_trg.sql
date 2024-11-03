-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION horarios_recalcular_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
DECLARE
  vcon_horario boolean; 
BEGIN
  IF tg_op <> 'INSERT' THEN
    PERFORM calcular_novedades_vigentes_idper(old.desde, old.hasta, old.idper);
  END IF;
  IF tg_op <> 'DELETE' THEN
    PERFORM calcular_novedades_vigentes_idper(new.desde, new.hasta, new.idper);
  END IF;
  RETURN null;
END;
$BODY$;

DROP TRIGGER IF EXISTS horarios_recalcular_trg on horarios;
CREATE TRIGGER horarios_recalcular_trg
  AFTER DELETE OR INSERT OR UPDATE
  ON horarios
  FOR EACH ROW
  EXECUTE PROCEDURE horarios_recalcular_trg();
