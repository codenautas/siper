-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION parametros_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  UPDATE fechas f
    SET cod_nov_pred_fecha = cod_nov_habitual
    FROM parametros, annios a
    WHERE cod_nov_pred_fecha is null
      AND fecha <= fecha_actual
      AND f.annio = a.annio
      AND a.abierto
  RETURN new;
END;
$BODY$;

DROP TRIGGER IF EXISTS parametros_trg on parametros;
CREATE TRIGGER parametros_trg
  AFTER UPDATE
  ON parametros
  FOR EACH ROW
  EXECUTE PROCEDURE parametros_trg();
