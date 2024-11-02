-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION personas_horarios_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  INSERT INTO horarios (idper, dds, desde, hasta, cod_nov, hora_desde, hora_hasta, trabaja) 
    SELECT new.idper, dds, make_date(extract(year from fecha_actual)::integer,1,1), make_date(extract(year from fecha_actual)::integer,12,31), 
      case when dds between 1 and 5 then cod_nov_habitual else null end, 
      case when dds between 1 and 5 then horario_habitual_desde else null end, 
      case when dds between 1 and 5 then horario_habitual_hasta else null end, 
      dds between 1 and 5
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

