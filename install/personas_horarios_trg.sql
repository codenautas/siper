-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION personas_horarios_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  INSERT INTO horarios (idper, dds, desde, hasta, cod_nov, hora_desde, hora_hasta, trabaja) 
    SELECT new.idper, dds, fecha_actual, (fecha_actual + interval '1 YEAR' - interval '1 DAY')::date, cod_nov_habitual, 
      horario_habitual_desde, horario_habitual_hasta, dds between 1 and 5
      FROM generate_series(0,6) dds join parametros on unico_registro;
  RETURN NEW;
END;
$BODY$;

DROP TRIGGER IF EXISTS personas_horarios_trg on personas;
CREATE TRIGGER personas_horarios_trg
  AFTER INSERT
  ON personas
  FOR EACH ROW
  EXECUTE PROCEDURE personas_horarios_trg();

