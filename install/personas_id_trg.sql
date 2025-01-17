-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION personas_id_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
DECLARE
  v_idper text;
  v_letras text := translate(translate(upper(substr(new.apellido, 1, 2)),'ÄÜËÏÖÑ','AUEION'),'ÁÉÍÓÚ','AEIOU');
  v_numero integer;
BEGIN
  IF new.idper IS NULL OR substr(new.idper, 1, 2) IS DISTINCT FROM v_letras THEN
    SELECT max(CAST (translate(idper, translate(idper,'0123456789',''), '') AS INTEGER))
      INTO v_numero
      FROM personas
      WHERE substr(idper, 1, 2) = v_letras;
    new.idper := v_letras || (COALESCE(v_numero, 0) + 1);
  END IF;
  RETURN NEW;
END;
$BODY$;

DROP TRIGGER IF EXISTS personas_id_trg on personas;
CREATE TRIGGER personas_id_trg
  BEFORE INSERT OR UPDATE OF apellido, idper
  ON personas
  FOR EACH ROW
  EXECUTE PROCEDURE personas_id_trg();

/*
INSERT INTO personas (nombres, apellido) VALUES ('Albert', 'Einstein');
SELECT * FROM personas;
-- */
