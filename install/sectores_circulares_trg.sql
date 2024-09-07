-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION sectores_circulares_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
DECLARE
  perteneceria_a_si_mismo boolean; 
BEGIN
  SELECT sector_pertenece(new.pertenece_a, new.sector)
    INTO perteneceria_a_si_mismo;
  IF perteneceria_a_si_mismo THEN
    RAISE '% ya pertenece a %; no se puede hacer lo inverso a la vez.', new.pertenece_a, new.sector USING ERRCODE = 'P1001';
  END IF;
  RETURN NEW;
END;
$BODY$;

DROP TRIGGER IF EXISTS sectores_circulares_trg on sectores;
CREATE TRIGGER sectores_circulares_trg
  BEFORE INSERT OR UPDATE
  ON sectores
  FOR EACH ROW
  EXECUTE PROCEDURE sectores_circulares_trg();

