-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION personas_horarios_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  INSERT INTO horarios (cuil, dds, hora_desde, hora_hasta, trabaja) 
    SELECT new.cuil, dds, '09:00', '16:00', dds between 1 and 5
      FROM generate_series(0,6) dds;
  RETURN NEW;
END;
$BODY$;

DROP TRIGGER IF EXISTS personas_horarios_trg on personal;
CREATE TRIGGER personas_horarios_trg
  AFTER INSERT
  ON personal
  FOR EACH ROW
  EXECUTE PROCEDURE personas_horarios_trg();

