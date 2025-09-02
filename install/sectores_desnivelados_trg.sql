-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION sectores_desnivelados_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
DECLARE
  nivel_padre numeric; 
  nivel_nuevo numeric;
  min_nivel numeric;
BEGIN
  SELECT nivel INTO nivel_nuevo FROM sectores WHERE sector = new.sector;
  IF new.pertenece_a IS NOT NULL THEN
    SELECT nivel INTO nivel_padre FROM sectores WHERE sector = new.pertenece_a;
    IF (nivel_padre < nivel_nuevo) IS NOT TRUE THEN
      RAISE '% no tiene un nivel inferor a %; no puede depender de el', new.sector, new.pertenece_a USING ERRCODE = 'P1009';
    END IF;
  ELSE
    SELECT min(nivel) INTO min_nivel FROM sectores;
    IF (min_nivel IS NULL OR nivel_nuevo = min_nivel) IS NOT TRUE THEN
      RAISE '% (%-%) no tiene el nivel mas alto; tiene que depender de algun sector', new.sector, new.pertenece_a, new.subsector USING ERRCODE = 'P1010';
    END IF;
  END IF;
  RETURN NEW;
END;
$BODY$;

DROP TRIGGER IF EXISTS sectores_desnivelados_trg on sectores;
CREATE TRIGGER sectores_desnivelados_trg
  AFTER INSERT OR UPDATE
  ON sectores
  FOR EACH ROW
  EXECUTE PROCEDURE sectores_desnivelados_trg();

