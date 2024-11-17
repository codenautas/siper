-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION personas_actualizar_novedades_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
DECLARE
  v_rangos datemultirange := '{}';
  v_abiertos datemultirange := (select multirange(daterange(make_date(min(annio),1,1), make_date(max(annio),12,31))) from annios where abierto);
  v_idper text;
  v_rango daterange;
BEGIN
  IF tg_op <> 'INSERT' THEN
    v_idper := old.idper;
    v_rangos := v_rangos + multirange(daterange(old.registra_novedades_desde, old.fecha_egreso));
  END IF;
  IF tg_op <> 'DELETE' THEN
    v_idper := new.idper;
    v_rangos := v_rangos + multirange(daterange(new.registra_novedades_desde, new.fecha_egreso));
  END IF;
  RAISE NOTICE 'rango %', v_rangos;
  FOR v_rango IN SELECT * FROM UNNEST(v_rangos * v_abiertos) LOOP
    RAISE NOTICE 'caluclar % % %', lower(v_rango), upper(v_rango), v_idper;
    PERFORM calcular_novedades_vigentes_idper(lower(v_rango), upper(v_rango), v_idper);
  END LOOP;
  RETURN NEW;
END;
$BODY$;

DROP TRIGGER IF EXISTS personas_actualizar_novedades_trg on personas;
CREATE TRIGGER personas_actualizar_novedades_trg
  AFTER INSERT OR DELETE OR UPDATE OF activo, registra_novedades_desde
  ON personas
  FOR EACH ROW
  EXECUTE PROCEDURE personas_actualizar_novedades_trg();

/*
INSERT INTO personas (nombres, apellido) VALUES ('Albert', 'Einstein');
SELECT * FROM personas;
-- */
