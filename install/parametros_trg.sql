-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION parametros_avance_dia_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  CALL avance_de_dia_proc();
  RETURN new;
END;
$BODY$;

DROP TRIGGER IF EXISTS parametros_avance_dia_trg on parametros;
CREATE TRIGGER parametros_avance_dia_trg
  AFTER UPDATE OF fecha_hora_para_test
  ON parametros
  FOR EACH ROW
  EXECUTE PROCEDURE parametros_avance_dia_trg();
