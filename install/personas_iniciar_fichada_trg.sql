-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION personas_iniciar_fichada_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
DECLARE
  v_rol text := get_app_user('rol');
  v_puede_iniciar_fichada boolean;
  v_puede_corregir_el_pasado boolean;
BEGIN
  IF new.inicia_fichada IS DISTINCT FROM old.inicia_fichada THEN
    SELECT puede_iniciar_fichada, puede_corregir_el_pasado
      INTO v_puede_iniciar_fichada, v_puede_corregir_el_pasado
      FROM roles WHERE rol = v_rol;
    IF NOT COALESCE(v_puede_iniciar_fichada, false) THEN
      RAISE EXCEPTION 'no tiene permiso para modificar inicia_fichada' USING ERRCODE = '42501';
    END IF;
    IF NOT COALESCE(v_puede_corregir_el_pasado, false) THEN
      IF old.inicia_fichada IS NOT NULL AND old.inicia_fichada < fecha_actual() THEN
        RAISE EXCEPTION 'no tiene permiso para modificar inicia_fichada cuando la fecha actual ya pasó' USING ERRCODE = '42501';
      END IF;
      IF new.inicia_fichada IS NOT NULL AND new.inicia_fichada < fecha_actual() THEN
        RAISE EXCEPTION 'no tiene permiso para setear inicia_fichada en el pasado' USING ERRCODE = '42501';
      END IF;
      IF new.inicia_fichada IS NOT NULL AND old.inicia_fichada IS NOT NULL
         AND new.inicia_fichada < old.inicia_fichada THEN
        RAISE EXCEPTION 'no tiene permiso para adelantar inicia_fichada a una fecha anterior a la ya existente' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$BODY$;

DROP TRIGGER IF EXISTS personas_iniciar_fichada_trg on personas;
CREATE TRIGGER personas_iniciar_fichada_trg
  BEFORE UPDATE OF inicia_fichada
  ON personas
  FOR EACH ROW
  EXECUTE PROCEDURE personas_iniciar_fichada_trg();
